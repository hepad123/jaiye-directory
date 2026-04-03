'use client'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  isAuthModalOpen: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  isAuthModalOpen: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                       = useState<User | null>(null)
  const [loading, setLoading]                 = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    // onAuthStateChange fires immediately with the current session
    // including restoring from localStorage — so we use it as the
    // single source of truth and only set loading=false after it fires
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      syncLegacyStorage(session?.user ?? null)
      setLoading(false)  // ← only mark done after auth state is known
    })

    return () => subscription.unsubscribe()
  }, [])

  function syncLegacyStorage(u: User | null) {
    if (typeof window === 'undefined') return
    if (u) {
      const displayName = u.user_metadata?.display_name || u.email?.split('@')[0] || 'User'
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

export function useAuth() {
  return useContext(AuthContext)
}

export { supabase }
