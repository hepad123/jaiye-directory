/**
 * One-off script to clean up messy address_city values from the Instagram sync.
 * Normalises known cities and nulls out unparseable free-text junk.
 *
 * Usage:
 *   npx tsx scripts/clean-addresses.ts --dry-run   # preview changes
 *   npx tsx scripts/clean-addresses.ts              # apply changes
 */

import { config } from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const dryRun = process.argv.includes('--dry-run')

// Map messy values to clean city names. null = clear the field.
const CITY_NORMALISATIONS: Record<string, string | null> = {
  // Clean Lagos variants
  'lagos ng':           'Lagos',
  'lagos, nigeria':     'Lagos',
  'eko':                'Lagos',
  // Lekki variants
  'lekki phase 1':      'Lekki',
  'agungi lekki':       'Lekki',
  // Specific Lagos areas → keep as-is but tag state
  'ikeja':              'Ikeja',
  'oregun':             'Lagos',
  'suru lere':          'Lagos',
  'unilag':             'Lagos',
  'town square':        null,
  // Non-Nigeria / junk → null
  'chicago, usa':                    null,
  'chicago | available to travel':   null,
  'chicago & the rest of the world ✈️': null,
  'based in uk | travels worldwide ✈️🛳🚘': null,
  'stoke':                           null,
  'london - intl':                   null,
  'united kingdom 🇬🇧🇬🇧🇬🇧':          null,
  '🇬🇧england🇬🇧|':                    null,
  'worldwide weddings':              null,
}

// Patterns that indicate junk (checked if not in the map above)
const JUNK_PATTERNS = [
  /opposite|upstairs|road|street/i,   // street addresses, not cities
  /anywhere|destination|worldwide/i,  // travel statements
  /→|\/\/|𝐋|𝑵|𝘼|𝒔/,                  // unicode fancy text / decorative
  /sweetest spot/i,
  /@\w/,                              // has @ mentions
]

function normalise(city: string): string | null | undefined {
  const lower = city.toLowerCase().trim()

  // Check exact matches in our map
  for (const [pattern, replacement] of Object.entries(CITY_NORMALISATIONS)) {
    if (lower === pattern || lower.includes(pattern)) {
      return replacement
    }
  }

  // Before checking junk patterns, see if a known city is embedded in the string
  const knownCities = ['Lagos', 'Abuja', 'Lekki', 'Ikeja', 'Ibadan', 'Port Harcourt', 'Warri']
  for (const c of knownCities) {
    if (lower.includes(c.toLowerCase())) return c
  }

  // Check junk patterns
  for (const re of JUNK_PATTERNS) {
    if (re.test(city)) return null
  }

  // If it's a short, clean-looking value, keep it
  return undefined // undefined = no change
}

async function main() {
  console.log('=== Address Cleanup ===')
  if (dryRun) console.log('  (DRY RUN)\n')

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, address_city, address_state, location')
    .not('address_city', 'is', null)

  if (error || !vendors) {
    console.error('Failed to fetch:', error)
    process.exit(1)
  }

  let cleaned = 0
  let nulled = 0
  let unchanged = 0

  for (const v of vendors) {
    const result = normalise(v.address_city)

    if (result === undefined) {
      unchanged++
      continue
    }

    if (result === null) {
      console.log(`  NULL: "${v.address_city}" → (cleared)`)
      if (!dryRun) {
        await supabase.from('vendors').update({
          address_city: null,
          address_state: null,
          address_country: null,
        }).eq('id', v.id)
      }
      nulled++
    } else {
      // Normalised to a clean city — also set address_state if we can infer it
      const state = inferState(result)
      console.log(`  CLEAN: "${v.address_city}" → "${result}"${state ? ` (state: ${state})` : ''}`)
      if (!dryRun) {
        const update: Record<string, string | null> = { address_city: result }
        if (state) update.address_state = state
        if (!v.address_state) update.address_country = 'Nigeria'
        await supabase.from('vendors').update(update).eq('id', v.id)
      }
      cleaned++
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`  Cleaned:   ${cleaned}`)
  console.log(`  Nulled:    ${nulled}`)
  console.log(`  Unchanged: ${unchanged}`)
  if (dryRun) console.log('  (DRY RUN — nothing written)')
}

function inferState(city: string): string | null {
  const lagosAreas = ['Lagos', 'Lekki', 'Ikeja', 'Victoria Island', 'Ikoyi', 'Surulere', 'Yaba', 'Ajah']
  if (lagosAreas.some(a => city.toLowerCase() === a.toLowerCase())) return 'Lagos'
  if (city === 'Abuja') return 'FCT'
  if (city === 'Ibadan') return 'Oyo'
  if (city === 'Port Harcourt') return 'Rivers'
  if (city === 'Warri') return 'Delta'
  return null
}

main().catch(err => { console.error(err); process.exit(1) })
