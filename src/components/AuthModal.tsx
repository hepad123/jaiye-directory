'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth()

  const [email, setEmail]     = useState('')
  const [otp, setOtp]         = useState('')
  const [step, setStep]       = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  if (!isAuthModalOpen) return null

  async function handleSendOtp() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setStep('otp')
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (otp.trim().length < 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })

    if (authError) {
      setError('Invalid or expired code. Please try again.')
      setLoading(false)
    } else {
      handleClose()
    }
  }

  function handleClose() {
    closeAuthModal()
    setEmail('')
    setOtp('')
    setStep('email')
    setError('')
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(44, 26, 18, 0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }} />

      {/* Sheet */}
      <div style={{
        position: 'fixed', zIndex: 1000,
        bottom: 0, left: 0, right: 0,
        background: '#FDF8F4',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 44px',
        boxShadow: '0 -8px 40px rgba(44,26,18,0.18)',
        maxWidth: 480,
        margin: '0 auto',
        fontFamily: 'var(--font-dm-sans, sans-serif)',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#E8DDD5', borderRadius: 2, margin: '0 auto 24px' }} />

        {/* Close */}
        <button onClick={handleClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, color: '#B09080', lineHeight: 1, padding: 4,
        }}>×</button>

        {step === 'email' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>✨</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px' }}>
                Join the Jaiye Directory
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6 }}>
                Save vendors, share recommendations<br />and connect with other brides.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#EDE4DC' }} />
              <span style={{ fontSize: 10, color: '#C4A898', letterSpacing: 1 }}>SIGN IN WITH EMAIL</span>
              <div style={{ flex: 1, height: 1, background: '#EDE4DC' }} />
            </div>

            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              autoFocus
              style={{
                width: '100%', padding: '13px 16px',
                border: `1.5px solid ${error ? '#C45C7A' : '#EDE4DC'}`,
                borderRadius: 12, fontSize: 14, color: '#2C1A12',
                background: 'white', outline: 'none',
                boxSizing: 'border-box',
                marginBottom: error ? 6 : 14,
                transition: 'border-color 0.2s',
              }}
            />

            {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 12px 4px' }}>{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              style={{
                width: '100%', padding: '13px 16px',
                background: loading || !email.trim() ? '#E8DDD5' : '#C45C7A',
                color: loading || !email.trim() ? '#B09080' : 'white',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                cursor: loading || !email.trim() ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Sending…' : 'Send code →'}
            </button>

            <p style={{ fontSize: 11, color: '#C4A898', textAlign: 'center', margin: '14px 0 0' }}>
              We'll send a 6-digit code to your email.
            </p>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📬</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px' }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6 }}>
                We sent a 6-digit code to<br />
                <span style={{ fontWeight: 700, color: '#C45C7A' }}>{email}</span>
              </p>
            </div>

            {/* OTP input */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              autoFocus
              style={{
                width: '100%', padding: '13px 16px',
                border: `1.5px solid ${error ? '#C45C7A' : '#EDE4DC'}`,
                borderRadius: 12, fontSize: 22, color: '#2C1A12',
                background: 'white', outline: 'none',
                boxSizing: 'border-box',
                marginBottom: error ? 6 : 14,
                textAlign: 'center', letterSpacing: 8, fontWeight: 700,
              }}
            />

            {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 12px 4px', textAlign: 'center' }}>{error}</p>}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              style={{
                width: '100%', padding: '13px 16px',
                background: loading || otp.length < 6 ? '#E8DDD5' : '#C45C7A',
                color: loading || otp.length < 6 ? '#B09080' : 'white',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                cursor: loading || otp.length < 6 ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Verifying…' : 'Verify code →'}
            </button>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              style={{
                width: '100%', marginTop: 10, padding: '10px',
                background: 'none', border: 'none',
                fontSize: 12, color: '#B09080', cursor: 'pointer',
              }}
            >
              ← Use a different email
            </button>
          </>
        )}
      </div>
    </>
  )
}
