import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function run() {
  console.log('🚀 Running Jaiye Directory migration...\n')

  // ── 1. Rename category: "Fashion & Wedding Dress" → "Fashion" ──────────────
  console.log('1/7  Renaming "Fashion & Wedding Dress" → "Fashion"')
  const { error: e1 } = await supabase
    .from('vendors')
    .update({ category: 'Fashion' })
    .eq('category', 'Fashion & Wedding Dress')
  if (e1) { console.error('    ❌', e1.message); process.exit(1) }
  console.log('     ✓')

  // ── 2. Move "Accessories" → "Fashion" ──────────────────────────────────────
  console.log('2/7  Moving "Accessories" → "Fashion"')
  const { error: e2 } = await supabase
    .from('vendors')
    .update({ category: 'Fashion' })
    .eq('category', 'Accessories')
  if (e2) { console.error('    ❌', e2.message); process.exit(1) }
  console.log('     ✓')

  // ── 3. Rename "Catering-Cake-Food" → "Catering" ────────────────────────────
  console.log('3/7  Renaming "Catering-Cake-Food" → "Catering"')
  const { error: e3 } = await supabase
    .from('vendors')
    .update({ category: 'Catering' })
    .eq('category', 'Catering-Cake-Food')
  if (e3) { console.error('    ❌', e3.message); process.exit(1) }
  console.log('     ✓')

  // ── 4. Merge "Furniture & Rentals" → "Decor & Venue" ───────────────────────
  console.log('4/7  Merging "Furniture & Rentals" → "Decor & Venue"')
  const { error: e4 } = await supabase
    .from('vendors')
    .update({ category: 'Decor & Venue' })
    .eq('category', 'Furniture & Rentals')
  if (e4) { console.error('    ❌', e4.message); process.exit(1) }
  console.log('     ✓')

  // ── 5. Merge "Flowers" → "Decor & Venue" ───────────────────────────────────
  console.log('5/7  Merging "Flowers" → "Decor & Venue"')
  const { error: e5 } = await supabase
    .from('vendors')
    .update({ category: 'Decor & Venue' })
    .eq('category', 'Flowers')
  if (e5) { console.error('    ❌', e5.message); process.exit(1) }
  console.log('     ✓')

  // ── 6. Update Bekiri ────────────────────────────────────────────────────────
  console.log('6/7  Updating "Bekiri"')
  const { error: e6 } = await supabase
    .from('vendors')
    .update({
      category: 'Catering',
      services: 'Pancakes & desserts for weddings & events',
      website: null,
    })
    .eq('name', 'Bekiri')
  if (e6) { console.error('    ❌', e6.message); process.exit(1) }
  console.log('     ✓')

  // ── 7. Create reviews table ─────────────────────────────────────────────────
  console.log('7/7  Creating "reviews" table (via Supabase Management API)...')
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  if (!projectRef) { console.error('    ❌ Could not parse project ref from SUPABASE_URL'); process.exit(1) }

  const PAT = process.env.SUPABASE_ACCESS_TOKEN
  if (!PAT) {
    console.warn('\n⚠️   Skipping reviews table creation — SUPABASE_ACCESS_TOKEN not set.')
    console.warn('    Run this SQL manually in your Supabase dashboard SQL editor:\n')
    console.warn(`    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      vendor_id BIGINT REFERENCES vendors(id) ON DELETE CASCADE,
      reviewer_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);
    CREATE POLICY "Public insert" ON reviews FOR INSERT WITH CHECK (true);`)
  } else {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PAT}`,
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS reviews (
              id BIGSERIAL PRIMARY KEY,
              vendor_id BIGINT REFERENCES vendors(id) ON DELETE CASCADE,
              reviewer_name TEXT NOT NULL,
              rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
              comment TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
            ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
            DO $$ BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public read') THEN
                CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews' AND policyname='Public insert') THEN
                CREATE POLICY "Public insert" ON reviews FOR INSERT WITH CHECK (true);
              END IF;
            END $$;
          `,
        }),
      }
    )
    if (!res.ok) {
      const body = await res.text()
      console.error('    ❌ Management API error:', body)
      process.exit(1)
    }
    console.log('     ✓')
  }

  console.log('\n✅  Migration complete!')
}

run()
