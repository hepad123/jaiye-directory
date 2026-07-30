import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

// Client-side — uses the publishable (anon) key. Read-only via RLS.
// Returns a lazy no-op client when env vars aren't configured yet so the
// app can still render during development before secrets are set.
function makeClient(): SupabaseClient {
  if (!url || !key) {
    // Create with placeholder values — queries will fail gracefully
    // until the real secrets are provided via Replit Secrets.
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return createClient(url, key)
}

export const supabase = makeClient()
