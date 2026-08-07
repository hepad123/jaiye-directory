---
name: Supabase RLS blocks all anon writes
description: Every write table (follows, saved_vendors, vendor_used, vendor_recommendations, service_used, service_recommendations) has RLS that rejects the anon key with 42501. Only reads (SELECT) work with anon.
---

## Rule
Never call `supabase.from(table).insert/delete/update` directly from the frontend for any of these tables — the anon key is blocked by RLS and the call silently returns a 42501 error with no UI feedback.

Tables confirmed RLS-blocked for anon writes (as of Aug 2026):
- `follows`
- `saved_vendors`
- `vendor_used`
- `vendor_recommendations`
- `service_used`
- `service_recommendations`
- Likely also: `vendor_reviews`, `saved_services` PATCH

Tables that allow anon writes (no RLS block):
- `saved_services` (INSERT confirmed working)

**Why:** Supabase RLS policies were set up requiring auth.uid() to match, but the app migrated from Supabase Auth to Clerk. The Supabase anon key has no user identity, so RLS blocks all writes.

## How to apply
All INSERT/DELETE/UPDATE on RLS-blocked tables must go through the Express API server (dev) / Vercel serverless functions (prod) via `authFetch()` with the Clerk Bearer token. The server uses the service-role key which bypasses RLS.

Endpoints available:
- `POST/DELETE /api/follows` — body: `{ target_id }`
- `POST/DELETE /api/saved` — body: `{ vendor_id }`
- `POST/DELETE /api/interactions` — body: `{ vendor_id, type: 'used'|'recommend' }`
- `POST/DELETE /api/service-interactions` — body: `{ service_id, type: 'used'|'recommend' }`
- `PATCH /api/saved` — body: `{ vendor_id, notes?, quoted_price? }`

For any new table write: test with the anon key curl first. If it returns `{"code":"42501",...}`, route through the API.
