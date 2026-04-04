'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sanitizeEmail, isValidEmail, LIMITS } from '@/lib/sanitize'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit() {
    const cleanEmail = sanitizeEmail(email)
    if (!cleanEmail)           { setError('Please enter your email address.'); return }
    if (!isValidEmail(cleanEmail)) { setError('Please enter a valid email address.'); return }

    setLoading(true); setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
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
          Reset password
        </h1>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '32px 20px 60px' }}>

        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(28,25,23,0.08)' }}>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 24px' }}>
                We've sent a password reset link to <strong>{email}</strong>. Check your spam folder if it doesn't arrive within a minute.
              </p>
              <Link href="/" style={{ display: 'inline-block', padding: '11px 28px', background: 'var(--accent)', color: 'white', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jost, sans-serif)' }}>
                Back to directory
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
                Forgot your password?
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
                Enter the email address on your account and we'll send you a reset link.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  autoFocus
                  maxLength={LIMITS.email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{
                    width: '100%', padding: '12px 16px',
                    border: '1.5px solid var(--border)', borderRadius: 12,
                    fontSize: 14, color: 'var(--text)',
                    background: 'var(--bg-card)', outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}
                />

                {error && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !email.trim()}
                  style={{
                    width: '100%', padding: '13px 16px',
                    background: loading || !email.trim() ? 'var(--bg-pill)' : 'var(--accent)',
                    color: loading || !email.trim() ? 'var(--text-muted)' : 'white',
                    border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 700,
                    cursor: loading || !email.trim() ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}>
                  {loading ? 'Sending…' : 'Send reset link →'}
                </button>

                <Link href="/" style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', display: 'block', marginTop: 4 }}>
                  ← Back to directory
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
