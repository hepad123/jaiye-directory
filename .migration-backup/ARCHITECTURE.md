# Jaiye Directory — Architecture Guide

> **Living document.** Update this when you change auth, database, API routes, or page structure.
> Last reviewed: 2026-04-10

---

## System Overview

Nigerian wedding & event vendor directory. Customers browse vendors, save favourites, leave reviews. Vendors claim listings and manage profiles.

```
Browser (React 19 / Next.js 16)
  |
  |-- Clerk (auth, sessions, user management)
  |-- Supabase (PostgreSQL via RLS + admin key)
  |
  +--> Client queries: useSupabase() hook (anon key + Clerk JWT)
  +--> Server mutations: API routes (supabaseAdmin, secret key)
```

---

## Auth: How Clerk + Supabase Connect

### The Chain

1. **Clerk** handles sign-up/sign-in and issues JWTs
2. **Native Supabase integration** (not JWT templates) — Clerk publishes a JWKS endpoint, Supabase verifies against it
3. Every Clerk JWT includes `"role": "authenticated"` and `"sub": "<clerk_user_id>"`
4. **Client-side**: `useSupabase()` hook passes the Clerk JWT to Supabase via the `accessToken` callback
5. **Supabase RLS** reads `auth.jwt()->>'sub'` to identify the user
6. **Server-side API routes** use `supabaseAdmin` (secret key) which bypasses RLS entirely

### Key Rule

- **Reads** go through the client (RLS enforced)
- **Writes** go through API routes (admin key, auth checked in code)
- Never import `supabase-admin.ts` in client components

### Files

| File | Purpose |
|------|---------|
| `src/hooks/useSupabase.ts` | Supabase client with Clerk JWT for client components |
| `src/lib/supabase.ts` | Anonymous Supabase client (server components doing public reads) |
| `src/lib/supabase-admin.ts` | Admin client (API routes only, bypasses RLS) |
| `middleware.ts` | Clerk route protection |
| `src/app/layout.tsx` | ClerkProvider wrapping the app |

### Protected Routes (middleware.ts)

`/saved`, `/profile/edit`, `/vendor/dashboard/*`, `/vendor/claim/*`, `/onboarding`

### Anonymous Access (no account needed)

Browse vendors, view profiles, see reviews, see follower counts, search users, view public shortlists.

---

## Database: Tables & Ownership

All user-owned data keys off `clerk_user_id` (a string like `user_2x...`), NOT a UUID.

| Table | Owner column | Public read? | Client writes? |
|-------|-------------|-------------|----------------|
| `profiles` | `clerk_user_id` | Yes | No (API route) |
| `vendors` | `clerk_claimed_by` | Yes | No (API route) |
| `saved_vendors` | `clerk_user_id` | Own only | No (API route) |
| `reviews` | `clerk_user_id` | Yes | No (API route) |
| `follows` | `clerk_follower_id` | Yes | No (API route) |
| `vendor_used` | `clerk_user_id` | Yes | No (API route) |
| `vendor_recommendations` | `clerk_user_id` | Yes | No (API route) |

### RLS Policy Pattern

All policies use `auth.jwt()->>'sub'` (NOT `auth.uid()`).

- **Public read**: `FOR SELECT USING (true)`
- **Own-data read** (saved_vendors): `FOR SELECT USING (auth.jwt()->>'sub' = clerk_user_id)`
- **Own write**: `FOR INSERT TO authenticated WITH CHECK (auth.jwt()->>'sub' = clerk_user_id)`
- **Vendors table**: explicit `WITH CHECK (false)` on insert/update/delete (locked down, API routes only)

### Column Naming Convention

All Clerk-related columns are prefixed with `clerk_`:
- `clerk_user_id` — on profiles, saved_vendors, reviews, vendor_used, vendor_recommendations
- `clerk_follower_id`, `clerk_following_id` — on follows
- `clerk_claimed_by` — on vendors

---

## API Routes

All routes: verify auth via `auth()` from `@clerk/nextjs/server`, return 401 if missing, use `supabaseAdmin` for DB operations.

| Route | Methods | Purpose | Auth | Tables |
|-------|---------|---------|------|--------|
| `/api/profile` | POST, PATCH | Create/update profile | Required | `profiles` |
| `/api/saved` | POST, DELETE, PATCH | Save/unsave vendor, update notes | Required | `saved_vendors` |
| `/api/reviews` | POST | Create review | Required | `reviews` |
| `/api/follows` | POST, DELETE | Follow/unfollow user | Required | `follows` |
| `/api/interactions` | POST, DELETE | Mark used/recommend | Required | `vendor_used`, `vendor_recommendations` |
| `/api/vendor` | PATCH, POST | Vendor dashboard operations | Required + ownership | `vendors`, `vendor_claims`, `vendor_photos`, `review_responses` |

### Vendor route actions (POST body `action` field)

- `claim` — submit ownership claim
- `photo` — add portfolio photo
- `delete_photo` — remove photo
- `respond` — respond to review
- `delete_response` — delete response

---

## Pages

| Route | Type | Auth | Key data |
|-------|------|------|----------|
| `/` | Client | Optional | vendors, reviews, saved_vendors, follows |
| `/onboarding` | Client | Required | profiles (check + create) |
| `/sign-in`, `/sign-up` | Client | Public | Clerk hosted UI |
| `/saved` | Client | Required | saved_vendors, vendors, reviews |
| `/profile/[username]` | Client | Optional | profiles, vendor_used, vendor_recommendations, follows |
| `/profile/edit` | Client | Required | profiles |
| `/vendor/dashboard/[id]` | Client | Required + owner | vendors, reviews, review_responses, vendor_photos |
| `/vendor/claim/[id]` | Client | Optional | vendors, vendor_claims |
| `/shortlist/[username]` | Server | Public | profiles, saved_vendors, vendors |

---

## Sanitisation

All user input is sanitised **twice**: client-side before sending, server-side before writing.

**File**: `src/lib/sanitize.ts`

| Function | Max length | Used for |
|----------|-----------|----------|
| `sanitizeDisplayName` | 60 | Profile display name |
| `sanitizeUsername` | 30 | Username (lowercase, alphanumeric + underscore) |
| `sanitizeText` | varies | Bio (200), services (500), phone (30) |
| `sanitizeReviewComment` | 1000 | Review comments |
| `sanitizeNote` | 2000 | Saved vendor notes |
| `sanitizeSearch` | 100 | Search queries |
| `safeVendorUrl` | - | URL validation (ensures https) |
| `isValidRating` | - | Integer 1-5 |
| `isValidUsername` | - | Regex: `^[a-z0-9_]{3,30}$` |

---

## Security Headers (next.config.ts)

- **CSP**: restricts scripts, styles, connections to self + Clerk + Supabase + Cloudflare
- **X-Frame-Options**: DENY (no iframing)
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: camera, mic, geolocation disabled

---

## User Journey: Sign-up to First Save

```
1. User clicks "Sign up" → Clerk modal
2. Account created → forced redirect to /onboarding
3. Choose customer or vendor → set username → POST /api/profile
4. Redirected to / → vendors load (client query, public RLS)
5. Click heart on vendor → POST /api/saved (requires auth)
6. Visit /saved → own saved_vendors load (RLS: own data only)
7. Share shortlist → /shortlist/[username] (server-rendered, public)
```

---

## Audit Checklist

Review this quarterly or before any major release. Check each item and update the date.

### Auth & Access Control

- [ ] Clerk integration active in Clerk Dashboard (not using deprecated JWT templates)
- [ ] Supabase third-party auth configured with correct Clerk domain
- [ ] middleware.ts protects all routes that require sign-in
- [ ] All API routes check `auth()` before mutations
- [ ] Vendor dashboard/claim routes verify ownership (not just auth)
- [ ] `supabase-admin.ts` is never imported in client components
- [ ] No API route exposes the admin key or Clerk secret key

### Database & RLS

- [ ] RLS enabled on all tables (run: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`)
- [ ] All policies use `auth.jwt()->>'sub'` (not `auth.uid()`)
- [ ] `saved_vendors` SELECT is own-data-only (not public)
- [ ] `vendors` has explicit deny policies for client-side writes
- [ ] No stale policies referencing old column names (`user_id`, `follower_id`, `id`)
- [ ] Run policy audit: `SELECT tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname = 'public'`

### Input Validation

- [ ] All API routes sanitise inputs server-side (don't trust client sanitisation alone)
- [ ] Username validation: `^[a-z0-9_]{3,30}$`
- [ ] Rating validation: integer 1-5
- [ ] URLs validated via `safeVendorUrl` (https only)
- [ ] No raw user input in SQL queries (Supabase client handles parameterisation)

### Frontend & UX

- [ ] Anonymous users can browse vendors, profiles, reviews without sign-in prompts
- [ ] Sign-in prompts only appear when user attempts a write action
- [ ] Onboarding flow completes before user can access protected features
- [ ] Theme toggle persists across sessions (localStorage)
- [ ] Search is debounced (250ms) to avoid excessive queries

### Dependencies & Config

- [ ] CSP headers in `next.config.ts` match current Clerk/Supabase domains
- [ ] `@clerk/nextjs` and `@supabase/supabase-js` are up to date
- [ ] Environment variables are set in production (check deployment dashboard)
- [ ] No secrets in client-side code (`NEXT_PUBLIC_` prefix only for public values)

---

## Environment Variables

| Variable | Public? | Used by |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Client Supabase (anon key) |
| `SUPABASE_SECRET_KEY` | **No** | `supabase-admin.ts` (API routes only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | ClerkProvider |
| `CLERK_SECRET_KEY` | **No** | Clerk server-side auth |

---

## When to Update This Document

- Adding a new table or column → update Tables section
- Adding a new API route → update API Routes section
- Adding a new page → update Pages section
- Changing auth provider or integration method → update Auth section
- Changing RLS policies → update Database section + run audit checklist
- Adding new environment variables → update Environment Variables section
- Major dependency upgrade → run audit checklist
