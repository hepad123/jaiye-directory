# Instagram Sync Scripts

Ad-hoc scripts for pulling vendor/service profile data from Instagram via Apify and storing it in Supabase.

## Prerequisites

1. **Apify API token** set in `.env.local` as `APIFY_API_TOKEN`
2. **Supabase migrations** run in SQL editor:
   - `scripts/migrations/001_add_location_and_sync_fields.sql` — adds address/geo columns to `vendors`, creates `vendor_photos` table
   - `scripts/migrations/002_add_location_fields_to_services.sql` — adds address/geo columns to `services`

## Scripts

### `sync-instagram.ts` — Main sync script

Pulls Instagram profile data via Apify and updates the database. Profile images are downloaded and re-uploaded to Supabase Storage so URLs never expire.

```bash
# Sync vendors (default)
npm run sync:instagram

# Sync services table
npm run sync:instagram -- --table services

# Sync both tables
npm run sync:instagram -- --table both

# Preview without writing to DB
npm run sync:instagram -- --dry-run

# Only sync first N rows (for testing)
npm run sync:instagram -- --limit 5

# Overwrite bio even if vendor already has one set
npm run sync:instagram -- --force-bio

# Also pull top post images into vendor_photos table
npm run sync:instagram -- --with-photos

# Combine flags
npm run sync:instagram -- --table both --dry-run --limit 3
```

### `clean-addresses.ts` — Address data cleanup

One-off script to normalise messy address data from Instagram. Maps free-text location strings to clean city names and infers states. Nulls out junk values (e.g. "Based in UK | Travels Worldwide").

```bash
npx tsx scripts/clean-addresses.ts --dry-run   # preview
npx tsx scripts/clean-addresses.ts              # apply
```

This logic is now also built into `sync-instagram.ts` so future syncs produce clean data automatically.

### `fix-cover-images.ts` — Re-upload Instagram CDN images

One-off script that finds any remaining Instagram CDN URLs (`cdninstagram.com` or `fbcdn.net`) in `cover_image_url` and re-uploads them to Supabase Storage. Already been run — only needed again if URLs somehow get reverted.

```bash
npx tsx scripts/fix-cover-images.ts --dry-run   # preview
npx tsx scripts/fix-cover-images.ts              # apply
```

---

## What we pull and store

The sync script matches rows by Instagram handle (`instagram` column) to Apify results by `username`.

### Stored in DB

| Apify field | DB column | Table | Notes |
|---|---|---|---|
| `biography` | `bio` | vendors, services | Only written if bio is currently empty (use `--force-bio` to overwrite) |
| `profilePicUrlHD` | `cover_image_url` | vendors, services | Downloaded and re-uploaded to Supabase Storage (`vendor-photos` bucket, `profile-pics/{table}/{id}.jpg`). Always overwritten on each sync. |
| `businessAddress.street_address` | `address_street` | vendors, services | Raw street address from IG business profile |
| `businessAddress.city_name` | `address_city` | vendors, services | Normalised through city cleanup logic (e.g. "Agungi Lekki" -> "Lekki", junk values nulled) |
| *(inferred from city)* | `address_state` | vendors, services | Inferred from known city->state mapping (e.g. Lekki -> Lagos, Abuja -> FCT) |
| *(inferred)* | `address_country` | vendors, services | Set to "Nigeria" when address is present |
| `businessAddress.latitude` | `latitude` | vendors, services | Raw coordinates from IG business profile |
| `businessAddress.longitude` | `longitude` | vendors, services | Raw coordinates from IG business profile |
| *(timestamp)* | `instagram_synced_at` | vendors, services | Set to current time on each sync run |
| `latestPosts[].displayUrl` | `vendor_photos.url` | vendors only | Only with `--with-photos` flag. Top 6 posts by likes. Tagged with `source='instagram'`. Old IG photos deleted and replaced on each sync. |

For vendors without a business address, the script also tries to parse location from the bio text (e.g. "📍Lagos" -> city=Lagos, state=Lagos).

### Available from Apify but NOT currently stored

| Apify field | What it is | Why not stored |
|---|---|---|
| `followersCount` | Number of IG followers | Goes stale immediately. Would need constant re-syncing to stay accurate. |
| `followsCount` | Number of accounts they follow | Not useful for the app. |
| `postsCount` | Total number of IG posts | Goes stale. |
| `fullName` | Display name on IG profile | We already have `name` in the DB which may be manually curated. |
| `verified` | IG blue tick status | We have our own `verified` column with different meaning (verified on our platform). |
| `isBusinessAccount` | Whether it's an IG business account | Could be useful for filtering but not critical. |
| `businessCategoryName` | IG business category (e.g. "Health/beauty") | We have our own `category` column. Could be useful for validation/suggestions. |
| `externalUrl` | Link in bio (often Linktree) | Could populate `website` column but may conflict with manually set values. |
| `externalUrls[]` | All links in bio | Same as above. |
| `highlightReelCount` | Number of IG story highlights | Not useful. |
| `relatedProfiles[]` | IG's suggested similar accounts | Could be useful for discovering new vendors to add to the directory. |
| `latestPosts[].caption` | Post captions | Could extract hashtags, mentions, service descriptions. |
| `latestPosts[].likesCount` | Likes per post | Could derive engagement rate or quality score. |
| `latestPosts[].commentsCount` | Comments per post | Same as above. |
| `latestPosts[].timestamp` | When post was published | Could show "last active" date. |
| `latestPosts[].mentions[]` | @mentions in posts | Could map collaborations between vendors. |
| `latestPosts[].locationName` | Tagged location on posts | Could provide more granular location data than the profile address. |
| `latestPosts[].videoViewCount` | Video views | Engagement metric. |
| `latestPosts[].musicInfo` | Audio used in reels | Not useful. |
| `latestIgtvVideos[]` | Older IGTV content | Mostly superseded by reels. |
| `profilePicUrl` | Lower-res profile pic (150x150) | We store the HD version instead. |

### Potentially useful for future features

- **`relatedProfiles[]`** — for a "discover vendors" feature or to find new vendors to add to the directory
- **`externalUrl`** — could auto-populate `website` for vendors that don't have one set
- **`latestPosts[].likesCount` + `commentsCount`** — could compute an engagement score for ranking/quality signals
- **`latestPosts[].locationName`** — tagged locations on posts could fill in address data for vendors that don't have a business address
- **`businessCategoryName`** — could validate or suggest category assignments

---

## Storage

Profile images are stored in Supabase Storage:
- **Bucket**: `vendor-photos` (public)
- **Path pattern**: `profile-pics/{table}/{row-id}.jpg`
  - e.g. `profile-pics/vendors/ac21d155-9fb6-46ea-a465-e77f71addc90.jpg`
  - e.g. `profile-pics/services/4f4a3604-e764-4daf-87f8-2acae31095d9.jpg`
- **Public URL format**: `https://rchuhowqhfgsxagtxlba.supabase.co/storage/v1/object/public/vendor-photos/profile-pics/...`

Images are uploaded with `upsert: true` so re-running the sync replaces the old image with the latest one.
