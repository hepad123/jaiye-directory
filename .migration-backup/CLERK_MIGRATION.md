# Clerk Migration Plan — Jaiye Directory

> **Decisions locked in:**
> - Use Clerk's prebuilt components (`<SignIn />`, `<SignUp />`, `<UserButton />`, `<Show />`)
> - Fresh start — existing users re-sign-up (no ID migration)
> - Username kept in `profiles` table (not Clerk) — our rules allow underscores + min 3 chars
> - Users sign in with **email + password** or **Google OAuth** (not username login)
> - Post-signup onboarding page at `/onboarding` for profile type + display name + username
> - Supabase stays as the database only — all auth moves to Clerk
> - **Soft DB migration** — add new `text` columns alongside existing `uuid` ones, don't drop anything yet
> - Cleanup of old columns tracked separately in `CLERK_CLEANUP.md` (actioned once stable)

---

## 1. Known Bug — Modal freeze after onboarding (must fix in migration)

The current `AuthModal.tsx` has a bug where completing the final onboarding step (profile setup) freezes the modal. The user is fully authenticated with a complete profile, but the modal won't close — they have to refresh the page.

**Root cause:** `handleSaveProfile()` calls `handleClose()` on success (line 162), but `handleClose()` checks `if (isLocked) return` (line 167). `isLocked` is `step === 'type' || step === 'profile'` (line 68). Since `step` is still `'profile'` when the save succeeds, the close is silently blocked.

The `isLocked` guard was intended to prevent the user from *dismissing* the modal mid-onboarding (backdrop click / X button), but it accidentally blocks the *programmatic* close after successful save too.

**How the Clerk migration fixes this:** Onboarding moves to a dedicated `/onboarding` page. On completion, it calls `router.push('/')` — a standard Next.js navigation with no modal dismiss logic. No lock/unlock state, no race condition, no freeze.

---

## 2. Current Auth Architecture

### How it works today

| Layer | Implementation |
|-------|----------------|
| **Auth provider** | Supabase Auth (email/password + Google OAuth) |
| **Client library** | `@supabase/supabase-js` v2.99.1, `@supabase/ssr` v0.9.0 |
| **Session storage** | `localStorage` key `jaiye-auth` (Supabase manages this) |
| **Auth context** | Custom React context in `src/hooks/useAuth.tsx` |
| **Auth UI** | Custom 3-step bottom-sheet modal (`src/components/AuthModal.tsx`) |
| **Route protection** | Client-side only (no middleware, no server-side checks) |
| **User metadata** | Stored in both `auth.users.user_metadata` AND `profiles` table |
| **Middleware** | None — `src/proxy.ts` exists but is unused rate-limit code |
| **API routes** | None — all DB calls are direct from client components |

### Files that touch Supabase Auth

| File | What it does |
|------|-------------|
| `src/lib/supabase.ts` | Creates the Supabase client (auth config + DB) |
| `src/hooks/useAuth.tsx` | AuthProvider context: user state, signOut, modal open/close |
| `src/components/AuthModal.tsx` | Login, signup, Google OAuth, profile type selection, profile setup (3 steps) |
| `src/components/Navbar.tsx` | Reads `useAuth().user`, calls `supabase.auth.signOut()` directly |
| `src/app/layout.tsx` | Wraps app in `<AuthProvider>` |
| `src/app/auth/forgot-password/page.tsx` | `supabase.auth.resetPasswordForEmail()` |
| `src/app/auth/reset-password/page.tsx` | `supabase.auth.updateUser({ password })` |
| `src/app/page.tsx` | `useAuth().user` for save/unsave/review actions |
| `src/app/saved/page.tsx` | `useAuth().user` to show saved vendors |
| `src/app/profile/edit/page.tsx` | `useAuth().user`, redirects if not logged in |
| `src/app/profile/[username]/page.tsx` | `useAuth().user` for follow/unfollow |
| `src/app/vendor/claim/[id]/page.tsx` | `useAuth().user` for vendor claim flow |
| `src/app/vendor/dashboard/[id]/page.tsx` | Validates `user.id === vendor.claimed_by` |

### Database tables using `user.id` (all staying — Supabase PostgreSQL)

| Table | Auth-related columns |
|-------|---------------------|
| `profiles` | `id` (= auth user ID), `display_name`, `username`, `profile_type` |
| `reviews` | `user_id` |
| `saved_vendors` | `user_id` |
| `vendor_recommendations` | `user_id` |
| `vendor_used` | `user_id` |
| `vendor_claims` | `user_id` |
| `vendors` | `claimed_by` (= user ID) |
| `follows` | `follower_id`, `following_id` |

### Privacy practices (to maintain)

The current app is careful about what gets stored client-side:
- `jaiye_user` in localStorage stores **only** `{ name: displayName }` — never email
- `jaiye_theme` stores theme preference only
- `jaiye-auth` is Supabase's session token (will be removed — Clerk uses httpOnly cookies instead, which is more secure)
- No email, no user ID, no sensitive data in localStorage

**After migration:** Clerk uses httpOnly cookies for sessions (not localStorage), which is a privacy upgrade. We must ensure we don't introduce any new localStorage usage that stores email or PII. The `jaiye_theme` key stays. The `jaiye_user` and `jaiye-auth` keys get removed entirely.

---

## 3. Target Architecture

| Layer | After migration |
|-------|----------------|
| **Auth provider** | Clerk (`@clerk/nextjs`) |
| **Auth UI** | Clerk's `<SignIn />`, `<SignUp />`, `<UserButton />`, `<Show />` components |
| **Session** | Clerk httpOnly cookies (server-side, more secure than localStorage) |
| **Route protection** | Server-side via `clerkMiddleware()` + `createRouteMatcher()` |
| **Username** | Clerk handles username at sign-up (4-64 chars, Latin, no special chars) |
| **Onboarding** | `/onboarding` page for profile type + display name (post-signup) |
| **Database** | Supabase PostgreSQL stays — only auth moves to Clerk |
| **User ID format** | Changes from Supabase UUID to Clerk `user_xxx` string |

### What stays
- Supabase as the database (all tables, all queries)
- The `profiles` table (stores `profile_type`, `display_name`, `username`, `bio`)
- Theme system (`useTheme`, `jaiye_theme` localStorage key)
- Input sanitization (`src/lib/sanitize.ts`)
- All page layouts and styling
- Security headers in `next.config.ts` (updated for Clerk domains)

### What gets removed
- `@supabase/ssr` package
- `src/lib/supabase.ts` auth config (keep the DB client part)
- `src/hooks/useAuth.tsx` (replaced by Clerk hooks)
- `src/components/AuthModal.tsx` (replaced by Clerk components)
- `src/app/auth/forgot-password/page.tsx` (Clerk handles this)
- `src/app/auth/reset-password/page.tsx` (Clerk handles this)
- `src/proxy.ts` (unused rate limiter)
- `jaiye-auth` localStorage key (Clerk uses cookies)
- `jaiye_user` localStorage key (use `useUser()` from Clerk)

### What gets created
- `src/middleware.ts` — Clerk middleware with protected route matchers
- `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn />` page
- `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp />` page
- `src/app/onboarding/page.tsx` — Profile type + display name setup

---

## 4. Clerk Dashboard Setup Checklist

Complete these in the Clerk Dashboard (https://dashboard.clerk.com/) **before** writing code:

### Authentication settings
- [ ] **Email address** — Enable as identifier (primary)
- [ ] **Username** — Enable as identifier (Clerk supports 4-64 chars, Latin characters only, no special chars)
- [ ] **Password** — Enable password-based sign-in
- [ ] **Google OAuth** — Enable under Social connections (configure Google client ID + secret, migrate from Supabase OAuth config)

### Username configuration
- [ ] Enable username in User & Authentication > Email, Phone, Username
- [ ] Note: Clerk usernames are 4-64 chars, Latin-based, no special characters
- [ ] Our current validation allows 3-30 chars with underscores — Clerk is stricter (min 4, no underscores by default)
- [ ] **Decision needed:** Accept Clerk's constraints (min 4, no special chars) or keep username in `profiles` table only and disable Clerk username
- [ ] If keeping username in Clerk: update `sanitize.ts` to match Clerk's rules
- [ ] If keeping username in `profiles` only: disable username in Clerk dashboard, collect it in `/onboarding`

### Redirect URLs
- [ ] Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- [ ] Set `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- [ ] Set `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/` (or `/onboarding` if profile incomplete)
- [ ] Set `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

### Appearance / Theming
- [ ] Use Clerk's appearance prop to match Jaiye's design (colours, fonts, border radius)
- [ ] Clerk supports CSS variables and custom themes — map to our `--accent`, `--bg-card`, `--text` vars
- [ ] Test in both light and dark mode

### Environment variables (add to `.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## 5. Migration Steps (Ordered)

### Phase 1: Install + infrastructure (no UI changes yet)

**Step 1 — Install Clerk**
```bash
npm install @clerk/nextjs
```

**Step 2 — Add env vars** to `.env.local` (see Section 3 above)

**Step 3 — Create `src/middleware.ts`**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/saved(.*)',
  '/profile/edit(.*)',
  '/vendor/dashboard(.*)',
  '/vendor/claim(.*)',
  '/onboarding(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Step 4 — Update `next.config.ts` CSP**
Add Clerk domains to `connect-src` and `script-src`:
```
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://clerk.jaiye.com
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev
```

**Step 5 — Strip Supabase auth config** from `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Phase 2: Layout + auth pages

**Step 6 — Update `src/app/layout.tsx`**
- Replace `<AuthProvider>` with `<ClerkProvider>`
- Remove `AuthModal` import
- Keep `<ThemeProvider>` and `<Navbar>`

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/hooks/useTheme'
import Navbar from '@/components/Navbar'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${jost.variable}`} style={{ margin: 0, padding: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>
        <ClerkProvider>
          <ThemeProvider>
            <Navbar />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

**Step 7 — Create sign-in page** at `src/app/sign-in/[[...sign-in]]/page.tsx`
```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <SignIn />
    </div>
  )
}
```

**Step 8 — Create sign-up page** at `src/app/sign-up/[[...sign-up]]/page.tsx`
```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <SignUp />
    </div>
  )
}
```

**Step 9 — Create onboarding page** at `src/app/onboarding/page.tsx`

This replaces the old AuthModal steps 2-3 and **fixes the modal freeze bug** (see Section 1). Key design:
- Profile type selection (customer / vendor) — reuse current UI styling
- Display name input
- Username input with duplicate check against `profiles` table
- On submit: upsert to `profiles` table with `user.id` from Clerk
- **On success: `router.push('/')` immediately** — no modal state, no lock/unlock logic, just a clean redirect
- On page load: check if `profiles` row already exists for this Clerk user → if so, redirect to `/` (prevents re-onboarding)
- Loading state shown during the redirect so the user never sees a frozen screen

### Phase 3: Update Navbar

**Step 10 — Rewrite `src/components/Navbar.tsx`**
- Replace `useAuth()` with `useUser()` from `@clerk/nextjs`
- Replace custom avatar with `<UserButton />` from Clerk
- Replace sign-out button with Clerk's `<UserButton />` (has sign-out built in)
- Replace "sign in" button with `<SignInButton />` from `@clerk/nextjs`
- Use `<Show when="signed-in">` and `<Show when="signed-out">` for conditional rendering
- Keep `UserSearch` component (it queries `profiles` table, not auth)
- Keep `ThemeToggle` component (unchanged)

### Phase 4: Update all pages

**Step 11 — Update each page file:**

Every page that currently imports `useAuth` from `@/hooks/useAuth` needs updating:

| File | Current | After |
|------|---------|-------|
| `src/app/page.tsx` | `const { user, openAuthModal } = useAuth()` | `const { user } = useUser()` from `@clerk/nextjs` + `useClerk().openSignIn()` |
| `src/app/saved/page.tsx` | `const { user } = useAuth()` | `const { user } = useUser()` — middleware handles redirect |
| `src/app/profile/edit/page.tsx` | `useAuth().user` + client redirect | `useUser()` — middleware handles redirect |
| `src/app/profile/[username]/page.tsx` | `useAuth().user` for follow/unfollow | `useUser()` |
| `src/app/vendor/claim/[id]/page.tsx` | `useAuth().user` | `useUser()` — middleware handles redirect |
| `src/app/vendor/dashboard/[id]/page.tsx` | `useAuth().user` for ownership | `useUser()` — still need client-side `user.id === vendor.claimed_by` check |

**Key pattern change in every file:**
```typescript
// BEFORE
import { useAuth } from '@/hooks/useAuth'
const { user, openAuthModal } = useAuth()
const userId = user?.id  // Supabase UUID

// AFTER
import { useUser, useClerk } from '@clerk/nextjs'
const { user } = useUser()
const { openSignIn } = useClerk()
const userId = user?.id  // Clerk user_xxx string
```

**For actions that require auth (save vendor, review, follow, etc.):**
```typescript
// BEFORE
if (!user) { openAuthModal(); return }

// AFTER
if (!user) { openSignIn(); return }
```

### Phase 5: Database — soft migration (add new columns, don't drop old ones)

> **Principle:** We add new `text` columns for Clerk IDs alongside the existing `uuid` columns.
> All new code writes to the new columns. Old columns stay untouched until everything is stable.
> Dropping old columns is tracked in `CLERK_CLEANUP.md` — actioned later.

**Step 12 — Add `clerk_user_id` columns to all user-referencing tables**

Run in Supabase SQL editor:
```sql
-- profiles: add a new text column for Clerk ID (the old uuid `id` stays as PK for now)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_user_id text UNIQUE;

-- Every table that has a user_id (uuid) column gets a parallel text column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE saved_vendors ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE vendor_recommendations ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE vendor_used ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE vendor_claims ADD COLUMN IF NOT EXISTS clerk_user_id text;

-- vendors.claimed_by → add parallel column
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS clerk_claimed_by text;

-- follows: both columns need parallels
ALTER TABLE follows ADD COLUMN IF NOT EXISTS clerk_follower_id text;
ALTER TABLE follows ADD COLUMN IF NOT EXISTS clerk_following_id text;

-- Index the new columns for query performance
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_clerk_user_id ON reviews(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_vendors_clerk_user_id ON saved_vendors(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_clerk_follower ON follows(clerk_follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_clerk_following ON follows(clerk_following_id);
```

**Step 13 — Update application code to use the new columns**

All Supabase queries in the app that currently use `user_id` or `id` (for profiles) switch to the `clerk_user_id` / `clerk_claimed_by` / `clerk_follower_id` / `clerk_following_id` columns.

Pattern:
```typescript
// BEFORE (Supabase UUID)
.eq('user_id', user.id)
.eq('id', user.id)           // profiles table
.eq('claimed_by', user.id)   // vendors table
.eq('follower_id', user.id)  // follows table

// AFTER (Clerk text ID)
.eq('clerk_user_id', user.id)
.eq('clerk_user_id', user.id)       // profiles table
.eq('clerk_claimed_by', user.id)    // vendors table
.eq('clerk_follower_id', user.id)   // follows table
```

The insert/upsert calls also change:
```typescript
// BEFORE
await supabase.from('profiles').upsert({ id: user.id, ... })
await supabase.from('saved_vendors').insert({ user_id: user.id, vendor_id })

// AFTER
await supabase.from('profiles').upsert({ clerk_user_id: user.id, ... })
await supabase.from('saved_vendors').insert({ clerk_user_id: user.id, vendor_id })
```

**Step 14 — Clear old user data (optional, recommended for fresh start)**

Since users re-sign-up, the old `id`/`user_id` uuid data is orphaned. We can clear the user-generated rows but **keep the old columns in place**:
```sql
-- Clear user-generated data (vendors table rows stay — they're directory listings)
TRUNCATE profiles, reviews, saved_vendors, vendor_recommendations,
         vendor_used, vendor_claims, follows CASCADE;

-- Unclaim vendors
UPDATE vendors SET claimed_by = NULL, claim_status = 'unclaimed',
                   clerk_claimed_by = NULL;
```

**Step 15 — Audit and update RLS policies**
- If any RLS policies use `auth.uid()` (Supabase's auth function), they'll break
- Replace with either: no RLS (if using anon key client-side), or Clerk JWT-based RLS
- For simplicity: the app already enforces access in application code, so consider disabling auth-dependent RLS policies for now
- Track RLS cleanup in `CLERK_CLEANUP.md`

### Phase 6: Delete + cleanup

**Step 16 — Delete files:**
- `src/components/AuthModal.tsx`
- `src/hooks/useAuth.tsx`
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/page.tsx`
- `src/proxy.ts`

**Step 17 — Remove packages:**
```bash
npm uninstall @supabase/ssr
```

**Step 18 — Clean up localStorage references:**
- Remove `syncLegacyStorage` function (was in useAuth.tsx, now deleted)
- Remove any code that reads/writes `jaiye_user` or `jaiye-auth`
- `jaiye_theme` stays (theme preference, no PII)

**Step 19 — Verify build:**
```bash
npm run build
```
Fix any TypeScript errors from removed imports.

---

## 6. Username Decision (Decided: Profiles Table)

| | Clerk Username | Profiles Table Only (chosen) |
|---|---|---|
| **How it works** | Username collected at sign-up by Clerk | Username collected at `/onboarding` by us |
| **Validation** | 4-64 chars, Latin only, no special chars, no underscores | Our rules: 3-30 chars, lowercase alphanumeric + underscores |
| **Uniqueness** | Clerk enforces globally | We enforce via `profiles` table query |
| **Display** | Available on `user.username` | Available via `profiles` table lookup |
| **Flexibility** | Less (Clerk's constraints) | More (our own rules) |
| **Login** | Users could sign in with username | Users sign in with email (or Google) |

**Decision:** Username stays in the `profiles` table. Reasons:
1. Our current usernames allow underscores (common in social apps) — Clerk doesn't
2. Our minimum is 3 chars — Clerk requires 4
3. We already have the duplicate-check UI built
4. The `/onboarding` page needs to exist anyway for profile type selection
5. Disable username in Clerk dashboard — Clerk handles email/password/Google sign-in only

**What this means for users:** They sign in with email + password or Google. Their @username is their public identity in the app (profile URLs, search, follows) but is not a sign-in method. This is the same pattern as apps like Notion, Linear, etc.

---

## 7. Privacy Continuity Checklist

| Practice | Current | After Clerk | Status |
|----------|---------|-------------|--------|
| No email in localStorage | `jaiye_user` stores only `{ name }` | No localStorage for user data at all — Clerk uses cookies | Improved |
| Session storage | localStorage `jaiye-auth` (readable by JS) | httpOnly cookie (not readable by JS) | Improved |
| Theme preference | `jaiye_theme` in localStorage | Same — unchanged | Same |
| No PII in URL params | No sensitive data in URLs | Same — Clerk uses `/sign-in`, `/sign-up` paths only | Same |
| Display name source | `user.user_metadata.display_name` | `user.firstName`/`user.fullName` from Clerk or `profiles.display_name` | Same |
| Minimal data collection | Email + password + display name + username | Same — Clerk collects email + password; onboarding collects display name | Same |
| No tracking/fingerprinting | No analytics | Clerk adds its own session tracking via cookies (necessary for auth) | Acceptable |
| CSP headers | Strict CSP in next.config.ts | Updated to allow Clerk domains only | Same |

**New privacy considerations with Clerk:**
- Clerk stores user data on their servers (email, name, profile image if Google OAuth)
- Review Clerk's privacy policy and DPA if needed for compliance
- Clerk's `<UserButton />` may show email in its dropdown — acceptable for signed-in user viewing their own data
- No Clerk data should be persisted to localStorage by our code

---

## 8. Testing Checklist

### Clerk setup verification
- [ ] Clerk publishable key and secret key set in `.env.local`
- [ ] Clerk middleware active — check by visiting a protected route while signed out
- [ ] `<ClerkProvider>` wrapping the app in layout.tsx
- [ ] Sign-in page loads at `/sign-in`
- [ ] Sign-up page loads at `/sign-up`

### Auth flows
- [ ] Email/password sign up → redirected to `/onboarding`
- [ ] Complete onboarding (profile type + display name + username) → redirected to `/`
- [ ] Email/password sign in (existing user with profile) → goes straight to `/`
- [ ] Google OAuth sign up → redirected to `/onboarding`
- [ ] Google OAuth sign in (existing user) → goes to `/`
- [ ] Sign out via `<UserButton />` → session cleared, UI updates
- [ ] Password reset via Clerk's built-in flow → works

### Onboarding (fixes old modal freeze bug)
- [ ] `/onboarding` is protected (requires sign-in)
- [ ] Profile type selection works (customer / vendor)
- [ ] Display name input works with validation
- [ ] Username input works with duplicate check against `profiles` table
- [ ] Submitting creates a `profiles` row with Clerk `user.id`
- [ ] **After submitting, user is redirected to `/` immediately — no freeze, no blank screen**
- [ ] Loading indicator visible during redirect
- [ ] Returning to `/onboarding` when profile already exists → redirected to `/`
- [ ] Full flow: sign up → lands on `/onboarding` → complete form → arrive at homepage (no refresh needed)

### Protected routes (middleware)
- [ ] `/saved` → redirects to `/sign-in` when not authenticated
- [ ] `/profile/edit` → redirects to `/sign-in` when not authenticated
- [ ] `/vendor/dashboard/[id]` → redirects to `/sign-in` when not authenticated
- [ ] `/vendor/claim/[id]` → redirects to `/sign-in` when not authenticated
- [ ] `/onboarding` → redirects to `/sign-in` when not authenticated
- [ ] `/` (homepage) → accessible without sign-in
- [ ] `/profile/[username]` → accessible without sign-in (public profile)
- [ ] `/sign-in` and `/sign-up` → accessible without sign-in

### Core features with new user ID format
- [ ] Save/unsave a vendor → `saved_vendors.user_id` stores Clerk ID correctly
- [ ] Leave a review → `reviews.user_id` stores Clerk ID correctly
- [ ] Follow/unfollow a user → `follows.follower_id` stores Clerk ID correctly
- [ ] Mark "I've used this vendor" → `vendor_used.user_id` stores Clerk ID correctly
- [ ] Recommend a vendor → `vendor_recommendations.user_id` stores Clerk ID correctly
- [ ] Claim a vendor listing → `vendor_claims.user_id` stores Clerk ID correctly
- [ ] Edit profile → updates `profiles` row correctly
- [ ] Vendor dashboard → ownership check `user.id === vendor.claimed_by` works

### Navbar
- [ ] Signed out: shows sign-in button (no avatar)
- [ ] Signed in: shows `<UserButton />` with avatar
- [ ] Signed in: shows Saved link with count
- [ ] User search still works (queries `profiles` table)
- [ ] Theme toggle still works

### Privacy & security
- [ ] No email stored in localStorage (check Application > Local Storage in DevTools)
- [ ] No `jaiye-auth` key in localStorage (removed)
- [ ] No `jaiye_user` key in localStorage (removed)
- [ ] `jaiye_theme` key works correctly (unchanged)
- [ ] No CSP violations in browser console
- [ ] Clerk session uses httpOnly cookie (check Application > Cookies)
- [ ] Sign out clears Clerk cookies

### Edge cases
- [ ] Refresh page while signed in → session persists
- [ ] Open app in new tab → session shared via cookies
- [ ] Sign out in one tab → other tabs reflect signed-out state on next action
- [ ] User with no `profiles` row but signed in → redirected to `/onboarding`
- [ ] Dark mode: Clerk components respect theme
- [ ] Mobile: Clerk components responsive

---

## 9. File-by-File Change Summary

| File | Action | Details |
|------|--------|---------|
| `package.json` | Modify | `npm install @clerk/nextjs`, `npm uninstall @supabase/ssr` |
| `.env.local` | Modify | Add 6 Clerk env vars (see Section 3) |
| `next.config.ts` | Modify | Add Clerk domains to CSP `connect-src` and `script-src` |
| `src/middleware.ts` | **Create** | `clerkMiddleware()` + `createRouteMatcher()` for protected routes |
| `src/app/layout.tsx` | Modify | `<AuthProvider>` → `<ClerkProvider>`, remove AuthModal |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | **Create** | Clerk `<SignIn />` component |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | **Create** | Clerk `<SignUp />` component |
| `src/app/onboarding/page.tsx` | **Create** | Profile type + display name + username setup |
| `src/lib/supabase.ts` | Modify | Remove `auth: { ... }` block, keep DB client |
| `src/components/Navbar.tsx` | **Rewrite** | Clerk `<UserButton />`, `<SignInButton />`, `<Show />` |
| `src/app/page.tsx` | Modify | `useAuth()` → `useUser()` + `useClerk()` |
| `src/app/saved/page.tsx` | Modify | `useAuth()` → `useUser()` |
| `src/app/profile/edit/page.tsx` | Modify | `useAuth()` → `useUser()`, remove client redirect |
| `src/app/profile/[username]/page.tsx` | Modify | `useAuth()` → `useUser()` |
| `src/app/vendor/claim/[id]/page.tsx` | Modify | `useAuth()` → `useUser()` |
| `src/app/vendor/dashboard/[id]/page.tsx` | Modify | `useAuth()` → `useUser()` |
| `src/hooks/useAuth.tsx` | **Delete** | Replaced by Clerk hooks |
| `src/components/AuthModal.tsx` | **Delete** | Replaced by Clerk components |
| `src/app/auth/forgot-password/page.tsx` | **Delete** | Clerk handles password reset |
| `src/app/auth/reset-password/page.tsx` | **Delete** | Clerk handles password reset |
| `src/proxy.ts` | **Delete** | Unused rate limiter |

---

## 10. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Clerk username constraints don't match current rules | Medium | Keep username in `profiles` table, disable Clerk username |
| `profiles.id` column is UUID type, Clerk IDs are strings | High | Add parallel `clerk_user_id` text columns (soft migration) |
| RLS policies reference `auth.uid()` | Medium | Audit and update/disable before migration |
| CSP blocks Clerk | Low | Update CSP in Step 4 before testing |
| Users lose saved vendors / reviews | Expected | Fresh start — communicate to users if any exist |
| Onboarding redirect loop | Medium | Check for existing `profiles` row before showing onboarding |
| Clerk appearance doesn't match Jaiye theme | Low | Use appearance prop with CSS variables; test both themes |
| Google OAuth redirect misconfigured | Low | Test OAuth in dev with correct Clerk redirect URLs |

---

## 11. Implementation Order (for the developer)

```
 1. Clerk Dashboard setup (Section 3 checklist)
 2. npm install @clerk/nextjs
 3. Add .env.local vars
 4. Run Supabase SQL: add clerk_user_id columns + indexes (Step 12)
 5. Clear old user data in Supabase (Step 14) — optional, recommended
 6. Audit RLS policies (Step 15)
 7. Create src/middleware.ts
 8. Update next.config.ts CSP
 9. Update src/lib/supabase.ts (strip auth config)
10. Update src/app/layout.tsx (ClerkProvider)
11. Create /sign-in page
12. Create /sign-up page
13. Create /onboarding page
14. Rewrite Navbar.tsx
15. Update page.tsx (homepage) — switch queries to clerk_user_id columns
16. Update saved/page.tsx
17. Update profile/edit/page.tsx
18. Update profile/[username]/page.tsx
19. Update vendor/claim/[id]/page.tsx
20. Update vendor/dashboard/[id]/page.tsx
21. Delete: AuthModal.tsx, useAuth.tsx, forgot-password, reset-password, proxy.ts
22. npm uninstall @supabase/ssr
23. npm run build — fix any errors
24. Run through Testing Checklist (Section 7)
25. Once stable for a while → action CLERK_CLEANUP.md
```
