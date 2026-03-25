'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Mode = 'login' | 'signup'
type Step = 'auth' | 'type' | 'profile'
type ProfileType = 'customer' | 'vendor'

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%', padding: '12px 16px',
  border: `1.5px solid ${hasError ? '#C45C7A' : '#EDE4DC'}`,
  borderRadius: 12, fontSize: 14, color: '#2C1A12',
  background: 'white', outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-jost, sans-serif)',
  transition: 'border-color 0.2s',
})

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '13px 16px',
  background: disabled ? '#E8DDD5' : '#8B6E9A',
  color: disabled ? '#B09080' : 'white',
  border: 'none', borderRadius: 12,
  fontSize: 14, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'var(--font-jost, sans-serif)',
})

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth()

  const [mode, setMode]                           = useState<Mode>('login')
  const [email, setEmail]                         = useState('')
  const [password, setPassword]                   = useState('')
  const [confirmPassword, setConfirmPassword]     = useState('')
  const [displayName, setDisplayName]             = useState('')
  const [username, setUsername]                   = useState('')
  const [profileType, setProfileType]             = useState<ProfileType | null>(null)
  const [step, setStep]                           = useState<Step>('auth')
  const [loading, setLoading]                     = useState(false)
  const [error, setError]                         = useState('')
  const [usernameOk, setUsernameOk]               = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername]   = useState(false)
  const [showPassword, setShowPassword]           = useState(false)

  if (!isAuthModalOpen) return null

  // During profile setup steps, user cannot dismiss the modal
  const isLocked = step === 'type' || step === 'profile'

  // ── Login ──────────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (authError) {
      setError('Incorrect email or password.')
      setLoading(false)
    } else {
      handleClose()
    }
  }

  // ── Sign up ────────────────────────────────────────────────────────────────

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError("Passwords don't match."); return }
    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setStep('type')
      setLoading(false)
    }
  }

  // ── Username check ─────────────────────────────────────────────────────────

  async function checkUsername(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(cleaned)
    setUsernameOk(null)
    if (cleaned.length < 3) return
    setCheckingUsername(true)
    const { data } = await supabase
      .from('profiles').select('username').eq('username', cleaned).maybeSingle()
    setUsernameOk(!data)
    setCheckingUsername(false)
  }

  // ── Save profile ───────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!displayName.trim()) { setError('Please enter your name.'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters.'); return }
    if (usernameOk === false) { setError('That username is taken.'); return }
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        username: username.trim(),
        profile_type: profileType,
      })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
    } else {
      await supabase.auth.updateUser({
        data: {
          display_name: displayName.trim(),
          username: username.trim(),
          profile_type: profileType,
          onboarding_complete: true,
        }
      })
      handleClose()
    }
  }

  function handleClose() {
    // Don't allow close if user is mid-onboarding
    if (isLocked) return
    closeAuthModal()
    setEmail(''); setPassword(''); setConfirmPassword('')
    setDisplayName(''); setUsername('')
    setStep('auth'); setError(''); setUsernameOk(null)
    setMode('login'); setProfileType(null)
  }

  function switchMode(m: Mode) {
    setMode(m); setError('')
    setPassword(''); setConfirmPassword('')
  }

  return (
    <>
      {/* Backdrop — not clickable during onboarding */}
      <div
        onClick={isLocked ? undefined : handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(44, 26, 18, 0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          cursor: isLocked ? 'default' : 'pointer',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', zIndex: 1000,
        bottom: 0, left: 0, right: 0,
        background: '#FDF8F4',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 44px',
        boxShadow: '0 -8px 40px rgba(44,26,18,0.18)',
        maxWidth: 480, margin: '0 auto',
        fontFamily: 'var(--font-jost, sans-serif)',
      }}>
        <div style={{ width: 36, height: 4, background: '#E8DDD5', borderRadius: 2, margin: '0 auto 24px' }} />

        {/* Only show close button on auth step */}
        {!isLocked && (
          <button onClick={handleClose} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: '#B09080', lineHeight: 1, padding: 4,
          }}>×</button>
        )}

        {/* ── Step 1: Auth ── */}
        {step === 'auth' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>✨</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px', fontFamily: 'var(--font-jost, sans-serif)' }}>
                {mode === 'login' ? 'Welcome back' : 'Join the Jaiye Directory'}
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-jost, sans-serif)' }}>
                {mode === 'login'
                  ? 'Sign in to see your saved vendors.'
                  : 'Save vendors, share recommendations and connect with other brides.'}
              </p>
            </div>

            <div style={{ display: 'flex', background: '#F0E8E2', borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '8px',
                  background: mode === m ? 'white' : 'transparent',
                  border: 'none', borderRadius: 9,
                  fontSize: 13, fontWeight: mode === m ? 700 : 500,
                  color: mode === m ? '#2C1A12' : '#9A8070',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  {m === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="email" placeholder="Email address" value={email} autoFocus
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={inputStyle(false)}
              />

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                  style={{ ...inputStyle(false), paddingRight: 44 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#B09080', padding: 0,
                }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {mode === 'signup' && (
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password" value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  style={inputStyle(false)}
                />
              )}

              {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 2px 4px' }}>{error}</p>}

              <button
                onClick={mode === 'login' ? handleLogin : handleSignUp}
                disabled={loading || !email.trim() || !password.trim()}
                style={btnStyle(loading || !email.trim() || !password.trim())}
              >
                {loading ? '…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>
            </div>

            {mode === 'login' && (
              <p style={{ fontSize: 11, color: '#C4A898', textAlign: 'center', margin: '14px 0 0', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} style={{
                  background: 'none', border: 'none', color: '#8B6E9A',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0,
                }}>Sign up free</button>
              </p>
            )}
          </>
        )}

        {/* ── Step 2: Profile type ── */}
        {step === 'type' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🌸</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px', fontFamily: 'var(--font-jost, sans-serif)' }}>
                One last thing!
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-jost, sans-serif)' }}>
                Just set up your profile and you're in.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setProfileType('customer')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                  border: profileType === 'customer' ? '2px solid #8B6E9A' : '2px solid #EDE4DC',
                  background: profileType === 'customer' ? '#F5F0F8' : 'white',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: profileType === 'customer' ? '#8B6E9A' : '#F0E8E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>👰🏾</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: profileType === 'customer' ? '#8B6E9A' : '#2C1A12', marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    I'm planning a wedding / event
                  </div>
                  <div style={{ fontSize: 12, color: '#9A8070', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    Save vendors, leave reviews, share recommendations
                  </div>
                </div>
                {profileType === 'customer' && <div style={{ marginLeft: 'auto', color: '#8B6E9A', fontSize: 18, flexShrink: 0 }}>✓</div>}
              </button>

              <button
                onClick={() => setProfileType('vendor')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                  border: profileType === 'vendor' ? '2px solid #C0A060' : '2px solid #EDE4DC',
                  background: profileType === 'vendor' ? '#FDF8EE' : 'white',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: profileType === 'vendor' ? '#C0A060' : '#F0E8E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>🎀</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: profileType === 'vendor' ? '#C0A060' : '#2C1A12', marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    I'm a wedding / event vendor
                  </div>
                  <div style={{ fontSize: 12, color: '#9A8070', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    Manage your listing, respond to reviews, grow your bookings
                  </div>
                </div>
                {profileType === 'vendor' && <div style={{ marginLeft: 'auto', color: '#C0A060', fontSize: 18, flexShrink: 0 }}>✓</div>}
              </button>
            </div>

            <button
              onClick={() => { if (profileType) setStep('profile') }}
              disabled={!profileType}
              style={btnStyle(!profileType)}
            >
              Continue →
            </button>

            <p style={{ fontSize: 11, color: '#C4A898', textAlign: 'center', margin: '12px 0 0', fontFamily: 'var(--font-jost, sans-serif)' }}>
              Step 2 of 3 — almost there!
            </p>
          </>
        )}

        {/* ── Step 3: Profile setup ── */}
        {step === 'profile' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>
                {profileType === 'vendor' ? '🎀' : '🌸'}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2C1A12', margin: '0 0 6px', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Set up your profile
              </h2>
              <p style={{ fontSize: 13, color: '#9A8070', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-jost, sans-serif)' }}>
                {profileType === 'vendor'
                  ? 'How should brides find you on Jaiye?'
                  : 'Just two quick things and you\'re in!'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9A8070', letterSpacing: 0.5, display: 'block', marginBottom: 6, fontFamily: 'var(--font-jost, sans-serif)' }}>
                  {profileType === 'vendor' ? 'BUSINESS NAME' : 'YOUR NAME'}
                </label>
                <input
                  type="text"
                  placeholder={profileType === 'vendor' ? 'e.g. Glam by Omoye' : 'e.g. Temi Adeyemi'}
                  value={displayName} autoFocus
                  onChange={e => { setDisplayName(e.target.value); setError('') }}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9A8070', letterSpacing: 0.5, display: 'block', marginBottom: 6, fontFamily: 'var(--font-jost, sans-serif)' }}>
                  YOUR @HANDLE
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 14, color: '#C4A898', fontWeight: 600,
                  }}>@</span>
                  <input
                    type="text"
                    placeholder={profileType === 'vendor' ? 'glambyomoye' : 'temi_adeye'}
                    value={username}
                    onChange={e => checkUsername(e.target.value)}
                    style={{
                      ...inputStyle(usernameOk === false),
                      paddingLeft: 28,
                      borderColor: usernameOk === true ? '#5A8A72' : usernameOk === false ? '#C45C7A' : '#EDE4DC',
                    }}
                  />
                  {username.length >= 3 && (
                    <span style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 13, color: usernameOk === true ? '#5A8A72' : '#C45C7A',
                    }}>
                      {checkingUsername ? '…' : usernameOk === true ? '✓' : usernameOk === false ? '✗' : ''}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#C4A898', margin: '6px 0 0 4px', fontFamily: 'var(--font-jost, sans-serif)' }}>
                  Letters, numbers and underscores only. Min 3 characters.
                </p>
              </div>

              {error && <p style={{ fontSize: 11, color: '#C45C7A', margin: '0 0 2px 4px' }}>{error}</p>}

              <button
                onClick={handleSaveProfile}
                disabled={loading || !displayName.trim() || username.length < 3 || usernameOk !== true}
                style={btnStyle(loading || !displayName.trim() || username.length < 3 || usernameOk !== true)}
              >
                {loading ? 'Saving…' : 'Create my profile →'}
              </button>

              <button
                onClick={() => setStep('type')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: '#B09080', textAlign: 'center',
                  padding: '4px 0', fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                ← Change account type
              </button>

              <p style={{ fontSize: 11, color: '#C4A898', textAlign: 'center', margin: '4px 0 0', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Step 3 of 3
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
