# Clerk Migration — Post-Stabilisation Cleanup

> **When to action this:** Only after the Clerk migration has been live and stable for a reasonable period (e.g. 1-2 weeks with no auth issues). Every item here is safe to skip indefinitely — the app works fine with the old columns still in place.

---

## 1. Drop old UUID columns from Supabase

The soft migration added `clerk_user_id` (text) columns alongside the original `uuid` columns. Once all data is flowing through the new columns and no code references the old ones:

```sql
-- ============================================================
-- STEP 1: Verify no rows use the old columns exclusively
-- (all these should return 0 if migration is complete)
-- ============================================================

SELECT COUNT(*) FROM profiles WHERE clerk_user_id IS NULL AND id IS NOT NULL;
SELECT COUNT(*) FROM reviews WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
SELECT COUNT(*) FROM saved_vendors WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
SELECT COUNT(*) FROM vendor_recommendations WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
SELECT COUNT(*) FROM vendor_used WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
SELECT COUNT(*) FROM vendor_claims WHERE clerk_user_id IS NULL AND user_id IS NOT NULL;
SELECT COUNT(*) FROM vendors WHERE clerk_claimed_by IS NULL AND claimed_by IS NOT NULL;
SELECT COUNT(*) FROM follows WHERE clerk_follower_id IS NULL AND follower_id IS NOT NULL;

-- ============================================================
-- STEP 2: Promote clerk_user_id to primary (profiles table)
-- ============================================================

-- Option A: If profiles.id is the PK and you want clerk_user_id as new PK
-- This requires dropping the old PK constraint first
-- BE CAREFUL — only do this if no other tables have FK references to profiles.id

-- Option B (safer): Keep both columns, just stop using the old one
-- The old `id` column becomes dead weight but causes no harm

-- ============================================================
-- STEP 3: Drop old columns (only if Step 1 returned all zeros)
-- ============================================================

-- profiles: old `id` column (uuid) — caution: may be PK
-- Only drop if you've migrated the PK to clerk_user_id
-- ALTER TABLE profiles DROP COLUMN id;

-- Other tables: drop old user_id columns
ALTER TABLE reviews DROP COLUMN user_id;
ALTER TABLE saved_vendors DROP COLUMN user_id;
ALTER TABLE vendor_recommendations DROP COLUMN user_id;
ALTER TABLE vendor_used DROP COLUMN user_id;
ALTER TABLE vendor_claims DROP COLUMN user_id;
ALTER TABLE vendors DROP COLUMN claimed_by;
ALTER TABLE follows DROP COLUMN follower_id;
ALTER TABLE follows DROP COLUMN following_id;

-- ============================================================
-- STEP 4: Rename new columns to clean names (optional)
-- ============================================================

ALTER TABLE reviews RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE saved_vendors RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE vendor_recommendations RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE vendor_used RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE vendor_claims RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE vendors RENAME COLUMN clerk_claimed_by TO claimed_by;
ALTER TABLE follows RENAME COLUMN clerk_follower_id TO follower_id;
ALTER TABLE follows RENAME COLUMN clerk_following_id TO following_id;

-- If you rename columns, update the application code to match!
-- Search for: clerk_user_id, clerk_claimed_by, clerk_follower_id, clerk_following_id
```

---

## 2. Remove Supabase Auth configuration

Once Clerk is handling all authentication:

### In Supabase Dashboard
- [ ] Disable email/password auth provider (Settings > Authentication)
- [ ] Remove Google OAuth provider config (client ID/secret)
- [ ] Consider disabling Supabase Auth entirely if no other features depend on it
- [ ] Review and remove any auth-related triggers or functions

### In the codebase
- [ ] Confirm no code imports from `@supabase/ssr` (should already be uninstalled)
- [ ] Confirm `src/lib/supabase.ts` has no `auth: { ... }` config block
- [ ] Confirm no code calls `supabase.auth.*` anywhere

Search to verify:
```bash
grep -r "supabase.auth" src/
grep -r "@supabase/ssr" src/
grep -r "onAuthStateChange" src/
```

---

## 3. Clean up RLS policies

If RLS policies were disabled during migration:

- [ ] Decide whether to re-enable RLS with Clerk JWT verification
- [ ] If re-enabling: configure Supabase to verify Clerk JWTs (requires Clerk JWT template + Supabase JWT secret)
- [ ] If not re-enabling: ensure application-level access control is solid (it currently is)
- [ ] Document the decision

---

## 4. Remove old auth pages directory

If not already done during migration:

- [ ] Delete `src/app/auth/` directory entirely (contains forgot-password and reset-password)
- [ ] Verify no links point to `/auth/*` routes anywhere in the app

---

## 5. Clean up environment variables

- [ ] Remove Supabase Auth-specific env vars if any exist beyond the URL and anon key
- [ ] Verify `.env.local` only contains:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
  CLERK_SECRET_KEY=...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  ```

---

## 6. Update column names in code (if Step 1.4 renames were done)

If you renamed `clerk_user_id` → `user_id` etc. in the database, update every Supabase query:

```
clerk_user_id    →  user_id        (reviews, saved_vendors, vendor_recommendations, vendor_used, vendor_claims)
clerk_claimed_by →  claimed_by     (vendors)
clerk_follower_id → follower_id    (follows)
clerk_following_id → following_id  (follows)
```

Files to update:
- `src/app/page.tsx`
- `src/app/saved/page.tsx`
- `src/app/profile/[username]/page.tsx`
- `src/app/profile/edit/page.tsx`
- `src/app/vendor/claim/[id]/page.tsx`
- `src/app/vendor/dashboard/[id]/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/components/Navbar.tsx`

---

## 7. Final verification

- [ ] `npm run build` passes with no errors
- [ ] All items in `CLERK_MIGRATION.md` Section 7 (Testing Checklist) still pass
- [ ] No references to old column names in codebase
- [ ] No references to Supabase Auth in codebase
- [ ] No orphaned data in database

---

## 8. Archive migration docs

Once everything is clean:
- [ ] Move `CLERK_MIGRATION.md` to a `docs/` folder or delete it
- [ ] Move this file (`CLERK_CLEANUP.md`) to `docs/` or delete it
- [ ] Optionally add a brief note to README about the auth stack (Clerk + Supabase DB)
