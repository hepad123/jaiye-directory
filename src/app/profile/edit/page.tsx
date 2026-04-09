'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import {
  sanitizeUsername, sanitizeText,
  isValidUsername, LIMITS,
} from '@/lib/sanitize'

export default function EditProfilePage() {
  const { user, isLoaded } = useUser()
  const { openUserProfile } = useClerk()
  const router = useRouter()

  const [displayName, setDisplayName]           = useState('')
  const [businessName, setBusinessName]         = useState('')
  const [profileType, setProfileType]           = useState('')
  const [username, setUsername]                 = useState('')
  const [bio, setBio]                           = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [usernameOk, setUsernameOk]             = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState('')
  const [saveMsg, setSaveMsg]                   = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.replace('/'); return }

    supabase.from('profiles').select('display_name, business_name, profile_type, username, bio')
      .eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '')
          setBusinessName(data.business_name || '')
          setProfileType(data.profile_type || '')
          setUsername(data.username || '')
          setBio(data.bio || '')
          setOriginalUsername(data.username || '')
        }
        setLoading(false)
      })
  }, [user, isLoaded, router])

  async function checkUsername(raw: string) {
    const cleaned = sanitizeUsername(raw)
    setUsername(cleaned)
    setUsernameOk(null)
    setError('')

    // If unchanged, it's always valid
    if (cleaned === originalUsername) { setUsernameOk(true); return }
    if (cleaned.length < 3) return

    setCheckingUsername(true)
    const { data } = await supabase.from('profiles')
      .select('username').eq('username', cleaned).maybeSingle()
    setUsernameOk(!data)
    setCheckingUsername(false)
  }

  async function handleSave() {
    const cleanUsername = sanitizeUsername(username)
    const cleanBio      = sanitizeText(bio, LIMITS.bio)

    if (!isValidUsername(cleanUsername)) { setError('Username must be 3–30 characters (letters, numbers, underscores).'); return }
    if (cleanUsername !== originalUsername && usernameOk === false) { setError('That username is taken.'); return }

    setSaving(true); setError(''); setSaveMsg('')

    const payload: Record<string, unknown> = { username: cleanUsername, bio: cleanBio || null }
    if (profileType === 'vendor') payload.business_name = businessName.trim()

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const { error: apiError } = await res.json().catch(() => ({ error: null }))
      setError(apiError || 'Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    setOriginalUsername(cleanUsername)
    setSaveMsg('Profile updated!')
    setSaving(false)

    // Redirect to their profile after a short pause
    setTimeout(() => router.push(`/profile/${cleanUsername}`), 1000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: 14, color: 'var(--text)',
    background: 'var(--bg-card)', outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--font-jost, sans-serif)',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600,
    color: 'var(--text-muted)', letterSpacing: 0.5,
    display: 'block', marginBottom: 8,
  }

  if (!isLoaded || loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'var(--hero-grad)', padding: '32px 20px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
          Your Account
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Edit Profile
        </h1>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px 60px' }}>

        <Link href={`/profile/${originalUsername}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}>
          ← Back to profile
        </Link>

        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(28,25,23,0.08)', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Display name (read-only — managed via Clerk Account Settings) */}
          <div>
            <label style={labelStyle}>YOUR NAME</label>
            <div style={{
              ...inputStyle, background: 'var(--bg-pill)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: 'var(--text)',
            }}>
              <span>{displayName || user?.fullName || 'Not set'}</span>
              <button
                onClick={() => openUserProfile()}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)', padding: 0 }}
              >
                Change
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0 4px' }}>
              Update your name via Account Settings.
            </p>
          </div>

          {/* Business name — vendors only */}
          {profileType === 'vendor' && (
            <div>
              <label style={labelStyle}>BUSINESS NAME</label>
              <input
                type="text"
                value={businessName}
                maxLength={LIMITS.displayName}
                onChange={e => { setBusinessName(e.target.value); setError(''); setSaveMsg('') }}
                placeholder="e.g. Glam by Omoye"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0 4px' }}>
                This is the name shown on your vendor listing.
              </p>
            </div>
          )}

          {/* Username */}
          <div>
            <label style={labelStyle}>YOUR @HANDLE</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>@</span>
              <input
                type="text"
                value={username}
                maxLength={LIMITS.username}
                onChange={e => checkUsername(e.target.value)}
                placeholder="yourhandle"
                style={{
                  ...inputStyle,
                  paddingLeft: 30,
                  borderColor:
                    username === originalUsername ? 'var(--border)' :
                    usernameOk === true  ? '#16A34A' :
                    usernameOk === false ? '#DC2626' :
                    'var(--border)',
                }}
              />
              {username.length >= 3 && username !== originalUsername && (
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: usernameOk === true ? '#16A34A' : '#DC2626' }}>
                  {checkingUsername ? '…' : usernameOk === true ? '✓' : usernameOk === false ? '✗ Taken' : ''}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0 4px' }}>
              Letters, numbers and underscores only. Your profile URL will be /profile/{username || 'yourhandle'}
            </p>
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>BIO <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={bio}
              onChange={e => { setBio(e.target.value); setSaveMsg('') }}
              placeholder="A little about you — wedding date, location, what you're planning…"
              rows={4}
              maxLength={LIMITS.bio}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Shown on your public profile.</p>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bio.length}/{LIMITS.bio}</span>
            </div>
          </div>

          {/* Errors / success */}
          {error   && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}
          {saveMsg && <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: 0 }}>✓ {saveMsg}</p>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || username.length < 3 || (username !== originalUsername && usernameOk !== true)}
              style={{
                flex: 1, padding: '13px 16px',
                background: saving || !displayName.trim() || username.length < 3 || (username !== originalUsername && usernameOk !== true)
                  ? 'var(--bg-pill)' : 'var(--accent)',
                color: saving || !displayName.trim() || username.length < 3 || (username !== originalUsername && usernameOk !== true)
                  ? 'var(--text-muted)' : 'white',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'var(--font-jost, sans-serif)',
              }}>
              {saving ? 'Saving…' : 'Save changes →'}
            </button>
            <Link href={`/profile/${originalUsername}`} style={{
              padding: '13px 20px', borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-muted)',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              display: 'flex', alignItems: 'center',
              fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              Cancel
            </Link>
          </div>

        </div>

        {/* Account Settings */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 20, padding: 28,
          border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(28,25,23,0.08)',
          marginTop: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-playfair, serif)' }}>
                Account Settings
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Change your name, email, password, or manage your account security.
              </p>
            </div>
            <button
              onClick={() => openUserProfile()}
              style={{
                padding: '9px 18px', borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-jost, sans-serif)',
                flexShrink: 0,
              }}
            >
              Manage →
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
