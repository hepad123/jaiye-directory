'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

// ─── Supabase browser client (singleton) ─────────────────────────────────────
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthContextType = {
  user: User | null
  loading: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  isAuthModalOpen: boolean
  signOut: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
  signOut: async () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                       = useState<User | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      syncLegacyStorage(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes — do NOT auto-close modal here
    // The modal closes itself after onboarding completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      syncLegacyStorage(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Keep legacy localStorage in sync so saved/page.tsx still works
  function syncLegacyStorage(u: User | null) {
    if (u) {
      const displayName =
        u.user_metadata?.display_name ||
        u.email?.split('@')[0] ||
        'User'
      localStorage.setItem('jaiye_user', JSON.stringify({ name: displayName, email: u.email }))
    } else {
      localStorage.removeItem('jaiye_user')
    }
  }

  const openAuthModal  = useCallback(() => setIsAuthModalOpen(true),  [])
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('jaiye_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, openAuthModal, closeAuthModal, isAuthModalOpen, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext)
}

// ─── Export supabase client for use elsewhere ─────────────────────────────────
export { supabase }
