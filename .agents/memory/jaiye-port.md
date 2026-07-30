---
name: Jaiyé Directory port decisions
description: Key architectural decisions for the Next.js→Vite+React+Express port of Jaiye Directory
---

## Auth approach
Frontend sends Clerk JWT via `Authorization: Bearer` header. API server (`artifacts/api-server`) verifies with `@clerk/backend`. `useAuthFetch` hook wraps fetch to inject the header.

**Why:** Next.js API routes used `auth()` from `@clerk/nextjs/server` which doesn't exist in Vite. Bearer token is portable.

## useSupabase hook
Does NOT use `useSession()` from Clerk. Instead reads the token from `window.Clerk?.session?.getToken()` (async) to avoid requiring ClerkProvider in tree.

**Why:** Calling `useSession()` at hook level throws outside ClerkProvider, making dev without secrets impossible. The `window.Clerk` approach is safe and doesn't violate hooks rules.

## Design system
"Noir Heirloom" — dark near-black (#0D0A08), warm gold (#C9A84C), Bebas Neue for display caps, Newsreader italic for body, Manrope for UI. Added to index.html Google Fonts and src/index.css CSS vars.

## Secrets needed
Frontend: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
Backend: `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`

## Key file locations
- Frontend: `artifacts/jaiye-directory/` (react-vite, previewPath `/`)
- API server: `artifacts/api-server/` (express)
- Auth context: `src/context/auth.tsx` (ClerkAvailableContext)
- Routes: `src/App.tsx` (wouter Switch)
