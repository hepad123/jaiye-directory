---
name: Supabase + Clerk JWT incompatibility
description: Why logged-in users get JWT errors from Supabase and how it was fixed
---

## Rule
**Never send a Clerk JWT to Supabase.** Use the anon key singleton only (no `accessToken` override).

## Why
Supabase returns `{"code":"PGRST301","message":"JWT cryptographic operation failed"}` whenever a Clerk JWT is sent as the Bearer token. The Supabase project is not configured to verify Clerk JWTs (different JWT secret). This silently broke ALL reads and writes for logged-in users — queries returned empty, inserts were rejected.

Logged-out users were fine because no JWT was sent.

## How to apply
- `src/hooks/useSupabase.ts` must import and return the shared singleton from `src/lib/supabase.ts` (plain anon client, no `accessToken` callback).
- User data isolation is maintained by explicit `.eq('clerk_user_id', user.id)` column filters in every query — RLS auth.uid() is not used.
- RLS on this Supabase project is permissive enough that the anon key can read and write all tables needed.
- If RLS is ever tightened, the solution is to configure Supabase third-party auth with Clerk's JWKS endpoint — NOT to pass the Clerk JWT via `accessToken` without that configuration in place.
