---
name: Vendors table schema
description: Actual column names in the Supabase `vendors` table — avoids 400 errors from nonexistent columns
---

## Confirmed columns (from directory/page.tsx types + live 400 debugging)

| Column | Notes |
|---|---|
| id | uuid |
| name | vendor display name |
| category | e.g. "Entertainment", "Photography" |
| services | description string |
| location | full location string e.g. "Lagos, Nigeria" — **no separate `city` column** |
| contact_name | |
| phone | |
| email | |
| instagram | |
| website | |
| discount_code | nullable |
| discount_description | nullable |
| discount_expiry | nullable |
| price_from | |
| rating | |
| notes | vendor notes/bio text — **no separate `bio` column** |
| created_at | |
| verified | boolean optional |
| wedding_type | optional |
| occasions | string[] optional |

## Key mistakes to avoid
- `vendors.city` → **does not exist** → use `location` and parse city from it (e.g. `location.split(",")[0]`)
- `vendors.bio` → **does not exist** → use `notes` instead
- `select("*", { count: "exact" })` count queries → unreliable with RLS; use `select("id")` + count `data.length` in JS instead

## vendor_reviews / service_reviews RLS
These tables **require a vendor_id / service_id WHERE clause** — unfiltered selects return 400 (not 0 rows).
The home page testimonials section works around this by fetching 8 vendor IDs first, then querying reviews per vendor_id.

**Why:** Discovered during home page 400-error debugging — two separate 400s both traced to nonexistent column names (`city` and `bio`) in SELECT clauses.
