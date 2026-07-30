import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

/**
 * Returns a fetch wrapper that automatically adds the Clerk session token
 * to the Authorization header for API calls.
 */
export function useAuthFetch() {
  const { getToken } = useAuth()

  return useCallback(async (url: string, init: RequestInit = {}) => {
    const token = await getToken()
    const extraHeaders: Record<string, string> = {}
    if (token) extraHeaders['Authorization'] = `Bearer ${token}`

    return fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(init.headers as Record<string, string> || {}),
      },
    })
  }, [getToken])
}
