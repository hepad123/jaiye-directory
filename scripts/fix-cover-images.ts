/**
 * One-off script to re-upload existing Instagram CDN cover images to Supabase Storage.
 * Replaces expiring IG URLs with permanent Supabase Storage URLs.
 *
 * Usage:
 *   npx tsx scripts/fix-cover-images.ts --dry-run    # preview
 *   npx tsx scripts/fix-cover-images.ts               # run for real
 */

import { config } from 'dotenv'
import * as path from 'path'

config({ path: path.resolve(__dirname, '..', '.env.local') })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const BUCKET = 'vendor-photos'
const dryRun = process.argv.includes('--dry-run')

async function uploadImage(igUrl: string, table: string, id: string): Promise<string | null> {
  try {
    const res = await fetch(igUrl)
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 100) return null

    const filePath = `profile-pics/${table}/${id}.jpg`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.error(`  Upload error for ${id}:`, error.message)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data.publicUrl
  } catch (e) {
    console.error(`  Fetch error for ${id}:`, (e as Error).message)
    return null
  }
}

async function fixTable(table: string) {
  console.log(`\n── ${table} ──`)

  const { data: rows, error } = await supabase
    .from(table)
    .select('id, name, cover_image_url')
    .not('cover_image_url', 'is', null)
    .like('cover_image_url', '%cdninstagram.com%') // only IG URLs, skip already-fixed ones

  if (error) {
    console.error(`Failed to fetch ${table}:`, error)
    return
  }

  if (!rows || rows.length === 0) {
    console.log('  No Instagram CDN URLs to fix.')
    return
  }

  console.log(`  Found ${rows.length} rows with Instagram CDN URLs.`)

  let fixed = 0
  let failed = 0

  for (const row of rows) {
    if (dryRun) {
      console.log(`  WOULD FIX: ${row.name} (${row.id})`)
      fixed++
      continue
    }

    const permanentUrl = await uploadImage(row.cover_image_url, table, row.id)
    if (permanentUrl) {
      await supabase.from(table).update({ cover_image_url: permanentUrl }).eq('id', row.id)
      console.log(`  FIXED: ${row.name}`)
      fixed++
    } else {
      console.log(`  FAILED: ${row.name}`)
      failed++
    }
  }

  console.log(`  ${table}: ${fixed} fixed, ${failed} failed`)
}

async function main() {
  console.log('=== Fix Cover Images ===')
  if (dryRun) console.log('  (DRY RUN)')

  await fixTable('vendors')
  await fixTable('services')

  if (dryRun) console.log('\n(DRY RUN — nothing written)')
}

main().catch(e => { console.error(e); process.exit(1) })
