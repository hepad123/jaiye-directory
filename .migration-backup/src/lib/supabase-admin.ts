import { createClient } from '@supabase/supabase-js'

// Server-side only — uses Supabase Secret API key (replaces legacy service_role JWT).
// The secret key cannot be used from a browser (Supabase rejects browser User-Agents).
// NEVER import this file in client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
