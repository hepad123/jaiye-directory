import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const vendors = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'vendors.json'), 'utf-8')
)

async function seed() {
  console.log(`Seeding ${vendors.length} vendors...`)
  const { error } = await supabase.from('vendors').insert(vendors)
  if (error) { console.error('Error:', error); process.exit(1) }
  console.log(`Seeded ${vendors.length} vendors successfully!`)
}

seed()
