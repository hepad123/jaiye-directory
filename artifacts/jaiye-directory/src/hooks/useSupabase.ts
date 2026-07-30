import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

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
    if (!url || !key) {
      // No env vars yet — return a client that will fail gracefully on queries
      return createClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    }
    return createClient(url, key, {
      accessToken: () => getClerkToken(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
