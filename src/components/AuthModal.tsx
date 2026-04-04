'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  sanitizeEmail, sanitizePassword, sanitizeDisplayName, sanitizeUsername,
  isValidEmail, isValidPassword, isValidUsername, isValidDisplayName,
  LIMITS,
} from '@/lib/sanitize'

type Mode = 'login' | 'signup'
type Step = 'auth' | 'type' | 'profile'
type ProfileType = 'customer' | 'vendor'

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%', padding: '12px 16px',
  border: `1.5px solid ${hasError ? '#DC2626' : 'var(--border)'}`,
  borderRadius: 12, fontSize: 14, color: 'var(--text)',
  background: 'var(--bg-card)', outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-jost, sans-serif)',
  transition: 'border-color 0.2s',
})

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '13px 16px',
  background: disabled ? 'var(--bg-pill)' : 'var(--accent)',
  color: disabled ? 'var(--text-muted)' : 'white',
  border: 'none', borderRadius: 12,
  fontSize: 14, fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  transition: 'all 0.2s',
  fontFamily: 'var(--font-jost, sans-serif)',
})

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth()

  const [mode, setMode]                         = useState<Mode>('login')
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [displayName, setDisplayName]           = useState('')
  const [username, setUsername]                 = useState('')
  const [profileType, setProfileType]           = useState<ProfileType | null>(null)
  const [step, setStep]                         = useState<Step>('auth')
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')
  const [usernameOk, setUsernameOk]             = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [showPassword, setShowPassword]         = useState(false)

  if (!isAuthModalOpen) return null

  const isLocked = step === 'type' || step === 'profile'

  async function handleLogin() {
    const cleanEmail = sanitizeEmail(email)
    const cleanPass  = sanitizePassword(password)

    if (!cleanEmail || !cleanPass) { setError('Please fill in all fields.'); return }
    if (!isValidEmail(cleanEmail)) { setError('Please enter a valid email address.'); return }
    if (!isValidPassword(cleanPass)) { setError('Password must be 6–128 characters.'); return }

    setLoading(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail, password: cleanPass,
    })
    if (authError) { setError('Incorrect email or password.'); setLoading(false); return }

    const userId = data.user?.id
    if (userId) {
      const { data: profile } = await supabase.from('profiles')
        .select('username, display_name, profile_type').eq('id', userId).maybeSingle()
      const isComplete = profile?.username && profile?.display_name && profile?.profile_type
      if (!isComplete) {
        if (profile?.profile_type) setProfileType(profile.profile_type as ProfileType)
        setLoading(false); setStep('type'); return
      }
    }
    setLoading(false); handleClose()
  }

  async function handleSignUp() {
    const cleanEmail = sanitizeEmail(email)
    const cleanPass  = sanitizePassword(password)
    const cleanConf  = sanitizePassword(confirmPassword)

    if (!cleanEmail || !cleanPass) { setError('Please fill in all fields.'); return }
    if (!isValidEmail(cleanEmail))  { setError('Please enter a valid email address.'); return }
    if (!isValidPassword(cleanPass)) { setError('Password must be 6–128 characters.'); return }
    if (cleanPass !== cleanConf)    { setError("Passwords don't match."); return }

    setLoading(true); setError('')
    const { error: authError } = await supabase.auth.signUp({
      email: cleanEmail, password: cleanPass,
    })
    if (authError) { setError(authError.message); setLoading(false) }
    else { setStep('type'); setLoading(false) }
  }

  async function checkUsername(raw: string) {
    const cleaned = sanitizeUsername(raw)
    setUsername(cleaned); setUsernameOk(null)
    if (cleaned.length < 3) return
    setCheckingUsername(true)
    const { data } = await supabase.from('profiles')
      .select('username').eq('username', cleaned).maybeSingle()
    setUsernameOk(!data); setCheckingUsername(false)
  }

  async function handleSaveProfile() {
    const cleanName     = sanitizeDisplayName(displayName)
    const cleanUsername = sanitizeUsername(username)

    if (!isValidDisplayName(cleanName))    { setError('Please enter your name.'); return }
    if (!isValidUsername(cleanUsername))   { setError('Username must be 3–30 characters (letters, numbers, underscores).'); return }
    if (usernameOk === false)              { setError('That username is taken.'); return }

    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id, email: user.email,
      display_name: cleanName,
      username: cleanUsername,
      profile_type: profileType,
    })
    if (profileError) { setError(profileError.message); setLoading(false) }
    else {
      await supabase.auth.updateUser({
        data: { display_name: cleanName, username: cleanUsername, profile_type: profileType, onboarding_complete: true },
      })
      handleClose()
    }
  }

  function handleClose() {
    if (isLocked) return
    closeAuthModal()
    setEmail(''); setPassword(''); setConfirmPassword('')
    setDisplayName(''); setUsername('')
    setStep('auth'); setError(''); setUsernameOk(null)
    setMode('login'); setProfileType(null)
  }

  function switchMode(m: Mode) { setMode(m); setError(''); setPassword(''); setConfirmPassword('') }

  return (
    <>
      <div onClick={isLocked ? undefined : handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(28,25,23,0.5)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        cursor: isLocked ? 'default' : 'pointer',
      }} />

      <div style={{
        position: 'fixed', zIndex: 1000,
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg-card)',
        borderRadius: '24px 24px 0 0',
        padding: '28px 24px 44px',
        boxShadow: '0 -8px 40px rgba(28,25,23,0.15)',
        maxWidth: 480, margin: '0 auto',
        fontFamily: 'var(--font-jost, sans-serif)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 24px' }} />

        {!isLocked && (
          <button onClick={handleClose} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: 'var(--text-muted)', lineHeight: 1, padding: 4,
          }}>×</button>
        )}

        {/* Step 1: Auth */}
        {step === 'auth' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>✨</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-playfair, serif)' }}>
                {mode === 'login' ? 'Welcome back' : 'Join the Jaiye Directory'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                {mode === 'login' ? 'Sign in to see your saved vendors.' : 'Save vendors, share recommendations and connect with other brides.'}
              </p>
            </div>

            <div style={{ display: 'flex', background: 'var(--bg-pill)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '8px',
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  border: 'none', borderRadius: 9,
                  fontSize: 13, fontWeight: mode === m ? 700 : 500,
                  color: mode === m ? 'var(--text)' : 'var(--text-muted)',
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
                type="email"
                placeholder="Email address"
                value={email}
                autoFocus
                maxLength={LIMITS.email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={inputStyle(false)}
              />
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  maxLength={LIMITS.password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
                  style={{ ...inputStyle(false), paddingRight: 44 }}
                />
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)', padding: 0,
                }}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
              {mode === 'signup' && (
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  maxLength={LIMITS.password}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  style={inputStyle(false)}
                />
              )}
              {error && <p style={{ fontSize: 11, color: '#DC2626', margin: '0 0 2px 4px' }}>{error}</p>}
              <button
                onClick={mode === 'login' ? handleLogin : handleSignUp}
                disabled={loading || !email.trim() || !password.trim()}
                style={btnStyle(loading || !email.trim() || !password.trim())}>
                {loading ? '…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
              </button>
            </div>

            {mode === 'login' && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '14px 0 0' }}>
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Sign up free</button>
              </p>
            )}
          </>
        )}

        {/* Step 2: Profile type */}
        {step === 'type' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🎯</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-playfair, serif)' }}>One last thing!</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>Just set up your profile and you're in.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setProfileType('customer')} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                border: `2px solid ${profileType === 'customer' ? 'var(--accent)' : 'var(--border)'}`,
                background: profileType === 'customer' ? 'var(--accent-light)' : 'var(--bg-card)',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: profileType === 'customer' ? 'var(--accent)' : 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👰🏾</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: profileType === 'customer' ? 'var(--accent)' : 'var(--text)', marginBottom: 3 }}>I'm planning a wedding / event</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Save vendors, leave reviews, share recommendations</div>
                </div>
                {profileType === 'customer' && <div style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>✓</div>}
              </button>

              <button onClick={() => setProfileType('vendor')} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                border: `2px solid ${profileType === 'vendor' ? 'var(--text)' : 'var(--border)'}`,
                background: profileType === 'vendor' ? 'var(--bg-pill)' : 'var(--bg-card)',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: profileType === 'vendor' ? 'var(--text)' : 'var(--bg-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎀</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>I'm a wedding / event vendor</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>Manage your listing, respond to reviews, grow your bookings</div>
                </div>
                {profileType === 'vendor' && <div style={{ marginLeft: 'auto', color: 'var(--text)', fontSize: 18, flexShrink: 0 }}>✓</div>}
              </button>
            </div>

            <button onClick={() => { if (profileType) setStep('profile') }} disabled={!profileType} style={btnStyle(!profileType)}>Continue →</button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>Step 2 of 3 — almost there!</p>
          </>
        )}

        {/* Step 3: Profile setup */}
        {step === 'profile' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{profileType === 'vendor' ? '🎀' : '✨'}</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-playfair, serif)' }}>Set up your profile</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                {profileType === 'vendor' ? 'How should brides find you on Jaiye?' : "Just two quick things and you're in!"}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  {profileType === 'vendor' ? 'BUSINESS NAME' : 'YOUR NAME'}
                </label>
                <input
                  type="text"
                  placeholder={profileType === 'vendor' ? 'e.g. Glam by Omoye' : 'e.g. Temi Adeyemi'}
                  value={displayName}
                  autoFocus
                  maxLength={LIMITS.displayName}
                  onChange={e => { setDisplayName(sanitizeDisplayName(e.target.value)); setError('') }}
                  style={inputStyle(false)}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>YOUR @HANDLE</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>@</span>
                  <input
                    type="text"
                    placeholder={profileType === 'vendor' ? 'glambyomoye' : 'temi_adeye'}
                    value={username}
                    maxLength={LIMITS.username}
                    onChange={e => checkUsername(e.target.value)}
                    style={{
                      ...inputStyle(usernameOk === false), paddingLeft: 28,
                      borderColor: usernameOk === true ? '#16A34A' : usernameOk === false ? '#DC2626' : 'var(--border)',
                    }}
                  />
                  {username.length >= 3 && (
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: usernameOk === true ? '#16A34A' : '#DC2626' }}>
                      {checkingUsername ? '…' : usernameOk === true ? '✓' : usernameOk === false ? '✗' : ''}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0 4px' }}>Letters, numbers and underscores only. Min 3 characters.</p>
              </div>

              {error && <p style={{ fontSize: 11, color: '#DC2626', margin: '0 0 2px 4px' }}>{error}</p>}

              <button
                onClick={handleSaveProfile}
                disabled={loading || !displayName.trim() || username.length < 3 || usernameOk !== true}
                style={btnStyle(loading || !displayName.trim() || username.length < 3 || usernameOk !== true)}>
                {loading ? 'Saving…' : 'Create my profile →'}
              </button>

              <button onClick={() => setStep('type')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
                ← Change account type
              </button>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0' }}>Step 3 of 3</p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
