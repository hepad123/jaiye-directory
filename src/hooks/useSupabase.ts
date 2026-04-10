import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useSupabase() {
  const { session } = useSession()

  return useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        accessToken: async () => {
          if (!session) return null
          return (await session.getToken()) ?? null
        },
      }
    )
  }, [session])
}
