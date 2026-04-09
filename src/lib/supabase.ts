import { createClient } from '@supabase/supabase-js'

// Client-side — uses the publishable (anon) key. Read-only via RLS.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)
