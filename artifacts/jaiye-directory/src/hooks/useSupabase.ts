import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://rchuhowqhfgsxagtxlba.supabase.co'

const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjaHVob3dxaGZnc3hhZ3R4bGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjUzMzcsImV4cCI6MjA4OTE0MTMzN30.HwRE7yrmQc-Qs6zg_rTeWBXI6uTqR_lFFr7jg0rVpkk'

// Gets the Clerk JWT without using a React hook, so this hook works even
// when ClerkProvider is absent or not yet loaded.
async function getClerkToken(): Promise<string | null> {
  try {
    // Clerk sets window.Clerk after initialization
    const clerk = (window as Window & { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk
    if (!clerk?.session) return null
    return await clerk.session.getToken()
  } catch {
    return null
  }
}

// Returns a Supabase client scoped to the current Clerk session (when available).
// Safe to call outside ClerkProvider — falls back to the anon client gracefully.
export function useSupabase() {
  return useMemo(() => {
    return createClient(url, key, {
      accessToken: () => getClerkToken(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
