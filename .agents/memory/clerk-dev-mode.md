---
name: Clerk dev mode (no key)
description: Pattern to render the app gracefully when VITE_CLERK_PUBLISHABLE_KEY is absent
---

## The problem
ClerkProvider throws synchronously for any invalid/placeholder key. All Clerk hooks (`useSession`, `useUser`, `useClerk`) throw when called outside ClerkProvider.

## The solution
1. `main.tsx` conditionally renders `<ClerkProvider>` — only when the real key is present
2. `ClerkAvailableContext` (src/context/auth.tsx) signals whether Clerk is in the tree
3. Navbar splits auth UI into `NavbarAuth` (uses Clerk hooks) only rendered when `clerkAvailable=true`, and `NavbarNoAuth` otherwise
4. `useSupabase` uses `window.Clerk?.session?.getToken()` instead of `useSession()` — safe outside ClerkProvider

**Why:** No valid-format placeholder key exists for Clerk (all are validated against Clerk's API). The conditional approach is the only robust solution.

**How to apply:** Any component using Clerk hooks must be gated behind `useClerkAvailable()` check — either don't render it at all, or split into auth/no-auth variants.
