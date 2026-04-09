'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

type Vendor = {
  id: string
  name: string
  category: string
  location: string
  claim_status: string
  claimed_by: string | null
}

export default function ClaimVendorPage() {
  const { id }   = useParams() as { id: string }
  const router   = useRouter()
  const { user } = useUser()
  const { openSignIn } = useClerk()

  const [vendor, setVendor]       = useState<Vendor | null>(null)
  const [message, setMessage]     = useState('')
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]         = useState('')
  const [existingClaim, setExistingClaim] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: v } = await supabase
        .from('vendors').select('id, name, category, location, claim_status, claimed_by')
        .eq('id', id).maybeSingle()
      setVendor(v)

      if (user?.id && v) {
        const { data: claim } = await supabase
          .from('vendor_claims').select('id')
          .eq('vendor_id', id).eq('clerk_user_id', user.id).maybeSingle()
        if (claim) setExistingClaim(true)
      }
      setLoading(false)
    }
    load()
  }, [id, user])

  async function handleSubmit() {
    if (!user) { openSignIn(); return }
    if (!message.trim()) { setError('Please add a message explaining your connection to this vendor.'); return }
    if (message.length > 500) { setError('Message must be under 500 characters.'); return }

    setSubmitting(true); setError('')
    const res = await fetch('/api/vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim', vendor_id: id, message: message.trim() }),
    })
    if (!res.ok) {
      const { error: errMsg } = await res.json()
      if (errMsg === 'duplicate') {
        setError('You have already submitted a claim for this vendor.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </main>
    )
  }

  if (!vendor) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontFamily: 'var(--font-playfair, serif)', color: 'var(--text)', marginBottom: 8 }}>Vendor not found</h2>
          <Link href="/" style={{ color: 'var(--accent)', fontSize: 13 }}>← Back to directory</Link>
        </div>
      </main>
    )
  }

  if (vendor.claim_status === 'claimed') {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-playfair, serif)', color: 'var(--text)', marginBottom: 8 }}>Already claimed</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{vendor.name} has already been claimed by their owner.</p>
          <Link href="/" style={{ color: 'var(--accent)', fontSize: 13 }}>← Back to directory</Link>
        </div>
      </main>
    )
  }

  if (submitted || existingClaim) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-playfair, serif)', color: 'var(--text)', marginBottom: 8 }}>Claim submitted!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            We'll review your claim for <strong>{vendor.name}</strong> and be in touch. This usually takes 1–2 business days.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent)', color: 'white', borderRadius: 24, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            Back to directory
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none', marginBottom: 32 }}>
          ← Back to directory
        </Link>

        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(28,25,23,0.08)' }}>

          <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
            Vendor Claiming
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>
            Claim {vendor.name}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px', lineHeight: 1.6 }}>
            Are you the owner or representative of this business? Claim your listing to manage your profile, respond to reviews, and add photos.
          </p>

          <div style={{ background: 'var(--bg-pill)', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 22 }}>🏢</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-playfair, serif)' }}>{vendor.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vendor.category} · {vendor.location}</div>
            </div>
          </div>

          {!user ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>You need to be signed in to claim a listing.</p>
              <button onClick={() => openSignIn()} style={{ padding: '12px 28px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Sign in to continue
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                  WHY ARE YOU CLAIMING THIS LISTING?
                </label>
                <textarea
                  placeholder="e.g. I am the owner of Glam by Omoye. My Instagram is @glambyomoye and I can verify via email or phone…"
                  value={message}
                  onChange={e => { setMessage(e.target.value); setError('') }}
                  rows={5}
                  maxLength={500}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 13, color: 'var(--text)', background: 'var(--bg-card)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-jost, sans-serif)', lineHeight: 1.6 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>{message.length}/500</div>
              </div>

              {error && <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{error}</p>}

              <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ fontSize: 11, color: 'var(--gold)', margin: 0, lineHeight: 1.6 }}>
                  ⚠️ Claims are reviewed manually. We verify ownership before approving. Please include contact details or proof of ownership in your message.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                style={{ padding: '13px 16px', background: !message.trim() || submitting ? 'var(--bg-pill)' : 'var(--accent)', color: !message.trim() || submitting ? 'var(--text-muted)' : 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: !message.trim() || submitting ? 'default' : 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-jost, sans-serif)' }}>
                {submitting ? 'Submitting…' : 'Submit claim →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
