'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import {
  sanitizeDisplayName, sanitizeUsername,
  isValidUsername, LIMITS,
} from '@/lib/sanitize'

type ProfileType = 'customer' | 'vendor'

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [step, setStep]                         = useState<'type' | 'profile'>('type')
  const [profileType, setProfileType]           = useState<ProfileType | null>(null)
  const [displayName, setDisplayName]           = useState('')
  const [username, setUsername]                  = useState('')
  const [loading, setLoading]                   = useState(false)
  const [redirecting, setRedirecting]           = useState(true)
  const [error, setError]                       = useState('')
  const [usernameOk, setUsernameOk]             = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername]  = useState(false)

  // Check if user already has a profile — if so, redirect to home
  useEffect(() => {
    if (!isLoaded || !user) return

    async function checkProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('clerk_user_id')
        .eq('clerk_user_id', user!.id)
        .maybeSingle()

      if (data) {
        // Already onboarded — go home
        router.replace('/')
      } else {
        setRedirecting(false)
      }
    }
    checkProfile()
  }, [isLoaded, user, router])

  async function checkUsername(raw: string) {
    const cleaned = sanitizeUsername(raw)
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

  async function handleSaveProfile() {
    if (!user) return
    const cleanUsername  = sanitizeUsername(username)

    // display_name is always the person's real name from Clerk
    // business_name is only for vendors
    const clerkName = user.fullName || user.firstName || ''
    const businessName = profileType === 'vendor' ? displayName.trim() : null

    if (profileType === 'vendor' && !businessName) { setError('Please enter your business name.'); return }
    if (!isValidUsername(cleanUsername))   { setError('Username must be 3\u201330 characters (letters, numbers, underscores).'); return }
    if (usernameOk === false)             { setError('That username is taken.'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: clerkName,
        business_name: businessName,
        username: cleanUsername,
        profile_type: profileType,
      }),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg || 'Something went wrong.')
      setLoading(false)
      return
    }

    // Redirect immediately — no modal to dismiss, no freeze
    router.push('/')
  }

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

  // Show loading while checking if profile exists
  if (!isLoaded || redirecting) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 24,
        padding: '28px 24px 36px', boxShadow: '0 8px 40px rgba(28,25,23,0.12)',
        maxWidth: 480, width: '100%', margin: '0 16px',
        border: '1px solid var(--border)',
      }}>

        {/* ── Step 1: Profile type ── */}
        {step === 'type' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🎯</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-playfair, serif)' }}>
                One last thing!
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Just set up your profile and you're in.
              </p>
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

            <button onClick={() => { if (profileType) setStep('profile') }} disabled={!profileType} style={btnStyle(!profileType)}>
              Continue →
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>
              Step 1 of 2
            </p>
          </>
        )}

        {/* ── Step 2: Profile setup ── */}
        {step === 'profile' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{profileType === 'vendor' ? '🎀' : '✨'}</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', fontFamily: 'var(--font-playfair, serif)' }}>
                {profileType === 'vendor' ? 'Set up your vendor profile' : 'Pick your @handle'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                {profileType === 'vendor' ? 'How should brides find you on Jaiye?' : "Just one more thing and you're in!"}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Business name — vendors only */}
              {profileType === 'vendor' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    BUSINESS NAME
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Glam by Omoye"
                    value={displayName} autoFocus
                    maxLength={LIMITS.displayName}
                    onChange={e => { setDisplayName(e.target.value.slice(0, LIMITS.displayName)); setError('') }}
                    style={inputStyle(false)}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                  YOUR @HANDLE
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>@</span>
                  <input
                    type="text"
                    placeholder={profileType === 'vendor' ? 'glambyomoye' : 'temi_adeye'}
                    value={username} maxLength={LIMITS.username}
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
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0 4px' }}>
                  Letters, numbers and underscores only. Min 3 characters.
                </p>
              </div>

              {error && <p style={{ fontSize: 11, color: '#DC2626', margin: '0 0 2px 4px' }}>{error}</p>}

              <button
                onClick={handleSaveProfile}
                disabled={loading || (profileType === 'vendor' && !displayName.trim()) || username.length < 3 || usernameOk !== true}
                style={btnStyle(loading || (profileType === 'vendor' && !displayName.trim()) || username.length < 3 || usernameOk !== true)}>
                {loading ? 'Saving…' : 'Create my profile →'}
              </button>

              <button onClick={() => setStep('type')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
                ← Change account type
              </button>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0' }}>
                Step 2 of 2
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
