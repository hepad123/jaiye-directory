/**
 * Ad-hoc script to sync Instagram profile data via Apify for vendors or services.
 *
 * Usage:
 *   npx tsx scripts/sync-instagram.ts                       # sync vendors (default)
 *   npx tsx scripts/sync-instagram.ts --table services      # sync services table
 *   npx tsx scripts/sync-instagram.ts --table both          # sync both tables
 *   npx tsx scripts/sync-instagram.ts --limit 3             # sync first 3 only
 *   npx tsx scripts/sync-instagram.ts --force-bio           # overwrite bio even if set
 *   npx tsx scripts/sync-instagram.ts --with-photos         # pull top post images (vendors only)
 *   npx tsx scripts/sync-instagram.ts --dry-run             # preview without writing
 *
 * Prerequisites:
 *   1. Run scripts/migrations/001_add_location_and_sync_fields.sql in Supabase SQL editor
 *   2. Run scripts/migrations/002_add_location_fields_to_services.sql in Supabase SQL editor
 *   3. Set APIFY_API_TOKEN in .env.local
 */

import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.resolve(__dirname, '..', '.env.local') })
import { createClient } from '@supabase/supabase-js'

// ── Config ──────────────────────────────────────────────────────────────────

const APIFY_TOKEN = process.env.APIFY_API_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!

const ACTOR_ID = 'apify~instagram-scraper'
const MAX_PHOTOS_PER_VENDOR = 6
const POLL_INTERVAL_MS = 5_000

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const forceBio = args.includes('--force-bio')
const withPhotos = args.includes('--with-photos')
const dryRun = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined
const tableIdx = args.indexOf('--table')
const tableArg = tableIdx !== -1 ? args[tableIdx + 1] : 'vendors'

// ── Supabase admin client ───────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET)

// ── Types ───────────────────────────────────────────────────────────────────

interface ApifyProfileResult {
  inputUrl: string
  username: string
  fullName: string
  biography: string
  profilePicUrl: string
  profilePicUrlHD: string
  followersCount: number
  postsCount: number
  verified: boolean
  businessCategoryName?: string
  businessAddress?: {
    city_name: string
    street_address: string
    latitude: number
    longitude: number
  }
  latestPosts?: Array<{
    displayUrl: string
    type: string
    likesCount: number
    timestamp: string
  }>
}

interface Row {
  id: string
  instagram: string
  bio: string | null
  cover_image_url: string | null
  instagram_synced_at: string | null
}

// ── City normalisation ──────────────────────────────────────────────────────

const KNOWN_CITIES: Record<string, string> = {
  lagos: 'Lagos', lekki: 'Lagos', ikeja: 'Lagos', 'victoria island': 'Lagos',
  ikoyi: 'Lagos', surulere: 'Lagos', yaba: 'Lagos', ajah: 'Lagos',
  abuja: 'FCT', ibadan: 'Oyo', 'port harcourt': 'Rivers', warri: 'Delta',
}

const JUNK_PATTERNS = [
  /opposite|upstairs|road|street|close|avenue/i,
  /anywhere|destination|worldwide|available to travel/i,
  /→|\/\/|𝐋|𝑵|𝘼|𝒔/,
  /sweetest spot/i,
  /@\w/,
]

const CITY_NORMALISATIONS: Record<string, string | null> = {
  'lagos ng': 'Lagos', 'lagos, nigeria': 'Lagos', 'eko': 'Lagos',
  'lekki phase 1': 'Lekki', 'lekki phase1': 'Lekki', 'agungi lekki': 'Lekki',
  'oregun': 'Lagos', 'suru lere': 'Lagos', 'unilag': 'Lagos',
  'town square': null, 'stoke': null, 'london - intl': null,
}

function normaliseCity(raw: string): { city: string; state: string | null } | null {
  const lower = raw.toLowerCase().trim()

  for (const [pattern, replacement] of Object.entries(CITY_NORMALISATIONS)) {
    if (lower === pattern || lower.includes(pattern)) {
      if (!replacement) return null
      const state = KNOWN_CITIES[replacement.toLowerCase()] || null
      return { city: replacement, state }
    }
  }

  for (const [cityLower, state] of Object.entries(KNOWN_CITIES)) {
    if (lower.includes(cityLower)) {
      const city = cityLower.charAt(0).toUpperCase() + cityLower.slice(1)
      return { city, state }
    }
  }

  for (const re of JUNK_PATTERNS) {
    if (re.test(raw)) return null
  }

  if (raw.length < 30 && /^[\w\s,-]+$/.test(raw)) {
    return { city: raw.trim(), state: null }
  }

  return null
}

function parseAddress(cityName: string) {
  const parts = cityName.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length >= 3) {
    const normalised = normaliseCity(parts[0])
    return {
      city: normalised?.city || parts[0],
      state: normalised?.state || parts[1],
      country: parts[2],
    }
  }

  const normalised = normaliseCity(cityName)
  if (normalised) {
    return { city: normalised.city, state: normalised.state, country: 'Nigeria' }
  }

  return null
}

function parseBioLocation(bio: string) {
  const locMatch = bio.match(/📍\s*([^🇳\n]+)/u)
  if (locMatch) {
    const raw = locMatch[1].trim()
    const normalised = normaliseCity(raw)
    if (normalised) return { city: normalised.city, state: normalised.state, country: 'Nigeria' }
    return null
  }
  return null
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Image upload to Supabase Storage ────────────────────────────────────────

const STORAGE_BUCKET = 'vendor-photos'

async function uploadProfilePic(
  igImageUrl: string,
  tableName: string,
  rowId: string,
): Promise<string | null> {
  try {
    const res = await fetch(igImageUrl)
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 100) return null // too small, probably an error response

    const filePath = `profile-pics/${tableName}/${rowId}.jpg`

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (upErr) {
      console.error(`    Storage upload error:`, upErr.message)
      return null
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  } catch (e) {
    console.error(`    Image download error:`, (e as Error).message)
    return null
  }
}

// ── Apify API calls ─────────────────────────────────────────────────────────

async function startApifyRun(igUrls: string[]): Promise<string> {
  const input = {
    addParentData: false,
    directUrls: igUrls,
    resultsLimit: 200,
    resultsType: 'details',
    searchLimit: 1,
    searchType: 'user',
  }

  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to start Apify run: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.data.id as string
}

async function waitForRun(runId: string): Promise<void> {
  console.log(`  Waiting for Apify run ${runId} to complete...`)
  while (true) {
    const res = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`
    )
    const data = await res.json()
    const status = data.data.status

    if (status === 'SUCCEEDED') {
      console.log(`  Run completed successfully.`)
      return
    }
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Apify run ${status}: ${runId}`)
    }

    process.stdout.write('.')
    await sleep(POLL_INTERVAL_MS)
  }
}

async function getRunResults(runId: string): Promise<ApifyProfileResult[]> {
  const res = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
  )
  if (!res.ok) {
    throw new Error(`Failed to fetch results: ${res.status}`)
  }
  return res.json()
}

// ── Sync a single table ─────────────────────────────────────────────────────

async function syncTable(tableName: string) {
  console.log(`\n── Syncing: ${tableName} ──`)

  let query = supabase
    .from(tableName)
    .select('id, instagram, bio, cover_image_url, instagram_synced_at')
    .not('instagram', 'is', null)
    .neq('instagram', '')

  if (limit) query = query.limit(limit)

  const { data: rows, error: fetchErr } = await query
  if (fetchErr) {
    console.error(`Failed to fetch ${tableName}:`, fetchErr)
    return
  }

  if (!rows || rows.length === 0) {
    console.log(`  No ${tableName} with Instagram handles found.`)
    return
  }

  console.log(`  Found ${rows.length} ${tableName} with Instagram handles.`)

  const byHandle = new Map<string, Row>()
  for (const r of rows as Row[]) {
    const handle = r.instagram.replace(/^@/, '').toLowerCase()
    byHandle.set(handle, r)
  }

  const igUrls = [...byHandle.keys()].map(h => `https://www.instagram.com/${h}`)

  console.log(`  Starting Apify run for ${igUrls.length} profiles...`)
  const runId = await startApifyRun(igUrls)
  await waitForRun(runId)

  const results = await getRunResults(runId)
  console.log(`  Got ${results.length} profile results.\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const profile of results) {
    const handle = profile.username.toLowerCase()
    const row = byHandle.get(handle)

    if (!row) {
      console.log(`  SKIP: ${profile.username} — no matching ${tableName} row`)
      skipped++
      continue
    }

    const update: Record<string, unknown> = {
      instagram_synced_at: new Date().toISOString(),
    }

    // Bio
    if (profile.biography && (forceBio || !row.bio)) {
      update.bio = profile.biography.slice(0, 500)
    }

    // Cover image — download and re-upload to Supabase Storage for permanent URL
    if (profile.profilePicUrlHD && !dryRun) {
      const permanentUrl = await uploadProfilePic(profile.profilePicUrlHD, tableName, row.id)
      if (permanentUrl) {
        update.cover_image_url = permanentUrl
      }
    } else if (profile.profilePicUrlHD && dryRun) {
      update.cover_image_url = '(would upload to storage)'
    }

    // Address
    if (profile.businessAddress) {
      const addr = profile.businessAddress
      if (addr.street_address) update.address_street = addr.street_address
      if (addr.latitude) update.latitude = addr.latitude
      if (addr.longitude) update.longitude = addr.longitude

      if (addr.city_name) {
        const parsed = parseAddress(addr.city_name)
        if (parsed) {
          update.address_city = parsed.city
          if (parsed.state) update.address_state = parsed.state
          if (parsed.country) update.address_country = parsed.country
        }
      }
    } else if (profile.biography) {
      const bioLoc = parseBioLocation(profile.biography)
      if (bioLoc) {
        update.address_city = bioLoc.city
        if (bioLoc.state) update.address_state = bioLoc.state
        if (bioLoc.country) update.address_country = bioLoc.country
      }
    }

    console.log(`  ${profile.username} → ${tableName} ${row.id}`)
    console.log(`    bio: ${update.bio ? 'yes' : 'skip (already set)'}`)
    console.log(`    address: ${update.address_city || update.latitude ? 'yes' : 'none found'}`)
    console.log(`    cover_image: ${update.cover_image_url ? 'yes' : 'skip'}`)

    if (!dryRun) {
      const { error: updateErr } = await supabase
        .from(tableName)
        .update(update)
        .eq('id', row.id)

      if (updateErr) {
        console.error(`    ERROR updating ${row.id}:`, updateErr)
        errors++
        continue
      }

      // Photos (vendors only)
      if (tableName === 'vendors' && withPhotos && profile.latestPosts && profile.latestPosts.length > 0) {
        await supabase
          .from('vendor_photos')
          .delete()
          .eq('vendor_id', row.id)
          .eq('source', 'instagram')

        const topPosts = profile.latestPosts
          .filter(p => p.displayUrl)
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, MAX_PHOTOS_PER_VENDOR)

        if (topPosts.length > 0) {
          const photoRows = topPosts.map(post => ({
            vendor_id: row.id,
            url: post.displayUrl,
            source: 'instagram',
          }))

          const { error: photoErr } = await supabase
            .from('vendor_photos')
            .insert(photoRows)

          if (photoErr) {
            console.error(`    ERROR inserting photos for ${row.id}:`, photoErr)
          } else {
            console.log(`    photos: inserted ${topPosts.length}`)
          }
        }
      }
    }

    updated++
  }

  console.log(`\n  ${tableName} summary: ${updated} updated, ${skipped} skipped, ${errors} errors`)
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!APIFY_TOKEN || APIFY_TOKEN === 'your_apify_token_here') {
    console.error('ERROR: Set APIFY_API_TOKEN in .env.local')
    process.exit(1)
  }

  console.log('=== Instagram Sync via Apify ===')
  if (dryRun) console.log('  (DRY RUN — no DB writes)')
  if (forceBio) console.log('  (--force-bio: will overwrite existing bios)')
  if (withPhotos) console.log('  (--with-photos: will sync portfolio images)')
  console.log(`  Table: ${tableArg}`)

  if (tableArg === 'both') {
    await syncTable('vendors')
    await syncTable('services')
  } else if (tableArg === 'vendors' || tableArg === 'services') {
    await syncTable(tableArg)
  } else {
    console.error(`ERROR: Unknown table "${tableArg}". Use --table vendors, --table services, or --table both`)
    process.exit(1)
  }

  if (dryRun) console.log('\n(DRY RUN — nothing was written)')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
