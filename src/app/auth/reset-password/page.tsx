'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sanitizePassword, isValidPassword, LIMITS } from '@/lib/sanitize'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [done, setDone]                 = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [checking, setChecking]         = useState(true)

  useEffect(() => {
    // Supabase puts the access token in the URL hash after redirect
    // onAuthStateChange picks it up automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      }
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    const cleanPass   = sanitizePassword(password)
    const cleanConfirm = sanitizePassword(confirm)

    if (!isValidPassword(cleanPass)) { setError('Password must be at least 6 characters.'); return }
    if (cleanPass !== cleanConfirm)  { setError("Passwords don't match."); return }

    setLoading(true); setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password: cleanPass })

    if (updateError) {
      setError('Failed to update password. Your reset link may have expired — please request a new one.')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/'), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: 14, color: 'var(--text)',
    background: 'var(--bg-card)', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-jost, sans-serif)',
  }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>

      <div style={{ background: 'var(--hero-grad)', padding: '32px 20px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
          Account
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          New password
        </h1>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(28,25,23,0.08)' }}>

          {checking && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', margin: '0 auto' }} />
            </div>
          )}

          {!checking && done && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
                Password updated!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                You're all set. Taking you back to the directory…
              </p>
              <Link href="/" style={{ display: 'inline-block', padding: '11px 28px', background: 'var(--accent)', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                Go to directory
              </Link>
            </div>
          )}

          {!checking && !done && !validSession && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
                Link expired or invalid
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                This reset link has expired or already been used. Request a new one below.
              </p>
              <Link href="/auth/forgot-password" style={{ display: 'inline-block', padding: '11px 28px', background: 'var(--accent)', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                Request new link
              </Link>
            </div>
          )}

          {!checking && !done && validSession && (
            <>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                Choose a new password
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Must be at least 6 characters.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    autoFocus
                    maxLength={LIMITS.password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    style={{ ...inputStyle, paddingRight: 56 }}
                  />
                  <button onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: 0 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirm}
                  maxLength={LIMITS.password}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={inputStyle}
                />

                {error && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}

                <button
                  onClick={handleReset}
                  disabled={loading || !password || !confirm}
                  style={{
                    width: '100%', padding: '13px 16px',
                    background: loading || !password || !confirm ? 'var(--bg-pill)' : 'var(--accent)',
                    color: loading || !password || !confirm ? 'var(--text-muted)' : 'white',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700,
                    cursor: loading || !password || !confirm ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}>
                  {loading ? 'Updating…' : 'Update password →'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </main>
  )
}
