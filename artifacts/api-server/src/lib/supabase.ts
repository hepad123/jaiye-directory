import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set')
}

// Server-side only — uses Supabase Secret API key. Never expose to browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
