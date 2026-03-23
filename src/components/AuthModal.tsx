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

  const [email, setEmail]         = useState('')
  const [otp, setOtp]             = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername]   = useState('')
  const [step, setStep]           = useState<'email' | 'otp' | 'profile'>('email')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  if (!isAuthModalOpen) return null

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────

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

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────

  async function handleVerifyOtp() {
    if (otp.trim().length < 6) {
      setError('Please enter the 6-digit code.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: 'email',
    })

    if (authError) {
      setError('Invalid or expired code. Please try again.')
      setLoading(false)
      return
    }

    // Check if this user already has a profile with a username
    const userId = data.user?.id
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.username) {
        // Returning user — already has a handle, close and done
        handleClose()
      } else {
        // New user or no username yet — show profile setup
        if (profile?.display_name) setDisplayName(profile.display_name)
        setStep('profile')
        setLoading(false)
      }
    } else {
      handleClose()
    }
  }

  // ── Username availability check ─────────────────────────────────────────────

  async function checkUsername(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(cleaned)
    setUsernameOk(null)
    if (cleaned.length < 3) return

    setCheckingUsername(true)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', cleaned)
      .maybeSingle()

    setUsernameOk(!data)
    setCheckingUsername(false)
  }

  // ── Step 3: Save profile ────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    if (!username.trim() || username.length < 3) { setError('Username must be at least 3 characters.'); return }
    if (usernameOk === false) { setError('That username is taken.'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        username: username.trim(),
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
    } else {
      // Update auth metadata too so useAuth can read display_name
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim(), username: username.trim() }
      })
      handleClose()
    }
  }

  function handleClose() {
    closeAuthModal()
    setEmail(''); setOtp(''); setDisplayName(''); setUsername('')
    setStep('email'); setError(''); setUsernameOk(null)
  }

  // ── Shared styles ───────────────────────────────────────────────────────────

  const inputStyle = (hasError = false): React.CSSProperties => ({
    width: '100%', padding: '13px 16px',
    border: `1.5px solid ${hasError ? '#C45C7A' : '#EDE4DC'}`,
    borderRadius: 12, fontSize: 14, color: '#2C1A12',
    background: 'white', outline: 'none',
    boxSizing: 'border-box', marginBottom: 12,
    transition: 'border-color 0.2s',
    fontFamily: 'var(--font-dm-sans, sans-serif)',
  })

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: '100%', padding: '13px 16px',
    background: disabled ? '#E8DDD5' : '#C45C7A',
    color: disabled ? '#B09080' : 'white',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-dm-sans, sans-serif)',
  })

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
        maxWidth: 480, margin: '0 auto',
        fontFamily: 'var(--font-dm-sans, sans-serif)',
      }}>
        <div style={{ width: 36, height: 4, background: '#E8DDD5', borderRadius: 2, margin: '0 auto 24px' }} />
        <button onClick={handleClose} style={{
          position: 'absolute', top: 20, right: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, color: '#B09080', lineHeight: 1, padding: 4,
        }}>×</button>

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
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
              type="email" placeholder="your@email.com" value={email} autoFocus
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              style={{ ...inputStyle(!!error), marginBottom: error ? 6 : 14 }}
            />
            {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 12px 4px' }}>{error}</p>}

            <button onClick={handleSendOtp} disabled={loading || !email.trim()} style={btnStyle(loading || !email.trim())}>
              {loading ? 'Sending…' : 'Send code →'}
            </button>
            <p style={{ fontSize: 11, color: '#C4A898', textAlign: 'center', margin: '14px 0 0' }}>
              We'll send a 6-digit code to your email.
            </p>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
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

            <input
              type="text" inputMode="numeric" placeholder="000000" value={otp} autoFocus
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              style={{
                ...inputStyle(!!error),
                fontSize: 22, textAlign: 'center', letterSpacing: 8, fontWeight: 700,
                marginBottom: error ? 6 : 14,
              }}
            />
            {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

            <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6} style={btnStyle(loading || otp.length < 6)}>
              {loading ? 'Verifying…' : 'Verify code →'}
            </button>
            <button onClick={() => { setStep('email'); setOtp(''); setError('') }} style={{
              width: '100%', marginTop: 10, padding: '10px',
              background: 'none', border: 'none',
              fontSize: 12, color: '#B09080', cursor: 'pointer',
            }}>
              ← Use a different email
            </button>
          </>
        )}

        {/* ── Step 3: Profile setup ── */}
        {step === 'profile' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🌸</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px' }}>
                Set up your profile
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6 }}>
                Just two quick things and you're in!
              </p>
            </div>

            {/* Display name */}
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9A8070', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              YOUR NAME
            </label>
            <input
              type="text" placeholder="e.g. Temi Adeyemi" value={displayName} autoFocus
              onChange={e => { setDisplayName(e.target.value); setError('') }}
              style={inputStyle(false)}
            />

            {/* Username */}
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9A8070', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
              YOUR @HANDLE
            </label>
            <div style={{ position: 'relative', marginBottom: 6 }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: '#C4A898', fontWeight: 600,
              }}>@</span>
              <input
                type="text" placeholder="temi_adeye" value={username}
                onChange={e => checkUsername(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px 13px 28px',
                  border: `1.5px solid ${usernameOk === false ? '#C45C7A' : usernameOk === true ? '#5A8A72' : '#EDE4DC'}`,
                  borderRadius: 12, fontSize: 14, color: '#2C1A12',
                  background: 'white', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
              {/* Availability indicator */}
              {username.length >= 3 && (
                <span style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13,
                }}>
                  {checkingUsername ? '…' : usernameOk === true ? '✓' : usernameOk === false ? '✗' : ''}
                </span>
              )}
            </div>

            <p style={{ fontSize: 11, color: '#C4A898', margin: '0 0 16px 4px' }}>
              Letters, numbers and underscores only. Min 3 characters.
            </p>

            {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 12px 4px' }}>{error}</p>}

            <button
              onClick={handleSaveProfile}
              disabled={loading || !displayName.trim() || username.length < 3 || usernameOk !== true}
              style={btnStyle(loading || !displayName.trim() || username.length < 3 || usernameOk !== true)}
            >
              {loading ? 'Saving…' : 'Create my profile →'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
