import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'

// Returns the shared Supabase anon client.
// Supabase is not configured to verify Clerk JWTs, so we use the anon key
// for all requests. User data is scoped by explicit clerk_user_id column
// filters in every query rather than RLS auth.uid().
export function useSupabase() {
  return useMemo(() => supabase, [])
}
