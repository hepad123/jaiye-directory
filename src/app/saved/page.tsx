'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import { sanitizeNote, safeVendorUrl, LIMITS } from '@/lib/sanitize'

type Vendor = {
  id: string
  category: string
  name: string
  services: string
  location: string
  contact_name: string
  phone: string
  email: string
  instagram: string
  website: string
  discount_code: string
  price_from: string
  rating: string
  notes: string
  created_at?: string
  verified?: boolean
  wedding_type?: string
}

type Review = {
  id: string
  vendor_id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
}

const FEATURED_VENDORS = ['Zapphaire Events', 'Glam by Omoye']

const CATEGORY_META: Record<string, { emoji: string; colour: string }> = {
  'Event Planning':        { emoji: '📋', colour: '#6366F1' },
  'Styling':               { emoji: '✨', colour: '#0D9488' },
  'Outfits':               { emoji: '👗', colour: '#D97706' },
  'Makeup':                { emoji: '💄', colour: '#DB2777' },
  'Hair & Gele':           { emoji: '💅', colour: '#EA580C' },
  'Photography':           { emoji: '📷', colour: '#2563EB' },
  'Videography & Content': { emoji: '🎬', colour: '#78716C' },
  'Decor & Venue':         { emoji: '🏛️', colour: '#92400E' },
  'Catering':              { emoji: '🍽️', colour: '#C2410C' },
  'Entertainment':         { emoji: '🎤', colour: '#7C3AED' },
  'Other':                 { emoji: '✦',  colour: '#57534E' },
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

function formatNaira(n: number) {
  return '₦' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? 'var(--accent)' : 'none'}
      stroke={filled ? 'var(--accent)' : 'var(--border)'} strokeWidth="2"
      style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? 'var(--accent)' : 'var(--border)', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://jaiye-directory.vercel.app'}/shortlist/${username}`

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: "My vendor shortlist — Jaiye Directory",
          text: "Check out the vendors I've saved for my wedding 💍",
          url,
        })
        return
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 24, background: copied ? 'var(--accent-light)' : 'var(--bg-card)', border: `1.5px solid ${copied ? 'var(--gold)' : 'var(--border)'}`, color: copied ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.2s' }}>
      {copied ? <>✓ Link copied!</> : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share my shortlist
        </>
      )}
    </button>
  )
}

function BudgetBar({ quotes }: { quotes: Record<string, number> }) {
  const entries = Object.entries(quotes).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (entries.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-playfair, serif)' }}>Budget Tracker</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0D9488', fontFamily: 'var(--font-playfair, serif)' }}>{formatNaira(total)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>{entries.length} vendor{entries.length !== 1 ? 's' : ''} quoted</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map(([name, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          return (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jost, sans-serif)' }}>{formatNaira(amount)}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-pill)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(to right, #D97706, #B45309)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MyNotes({ vendorId, userId, initialNote, initialQuotedPrice, onQuoteChange }: {
  vendorId: string
  userId: string
  initialNote: string
  initialQuotedPrice: number | null
  onQuoteChange: (vendorId: string, name: string, amount: number | null) => void
}) {
  const [note, setNote]             = useState(initialNote)
  const [price, setPrice]           = useState(initialQuotedPrice?.toString() ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isEditing, setIsEditing]   = useState(false)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleSave(newNote: string, newPrice: string) {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const parsedPrice = parseFloat(newPrice.replace(/[^0-9.]/g, ''))
      const priceVal = isNaN(parsedPrice) ? null : parsedPrice
      const res = await fetch('/api/saved', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId, notes: newNote, quoted_price: priceVal }),
      })
      if (!res.ok) { setSaveStatus('idle'); return }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1800)
    }, 800)
  }

  function handleNoteChange(val: string) {
    const clean = sanitizeNote(val)
    setNote(clean)
    scheduleSave(clean, price)
  }

  function handlePriceChange(val: string) {
    // only allow digits and one decimal point
    const clean = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setPrice(clean)
    const parsed = parseFloat(clean)
    onQuoteChange(vendorId, '', isNaN(parsed) ? null : parsed)
    scheduleSave(note, clean)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div style={{ marginTop: 10, background: 'var(--bg-pill)', border: '1px dashed var(--border)', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.4, fontFamily: 'var(--font-jost, sans-serif)' }}>📝 My notes</span>
        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)', color: saveStatus === 'saving' ? 'var(--text-muted)' : saveStatus === 'saved' ? '#16A34A' : 'transparent' }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '·'}
        </span>
      </div>

      {/* Quoted price input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)', flexShrink: 0 }}>Quoted price ₦</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 250000"
          value={price}
          onChange={e => handlePriceChange(e.target.value)}
          style={{ flex: 1, minWidth: 0, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, background: 'var(--bg-card)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}
        />
      </div>

      {!isEditing && !note && (
        <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '4px 0', background: 'none', border: 'none', cursor: 'text', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-jost, sans-serif)' }}>
          + Add a private note…
        </button>
      )}
      {(isEditing || !!note) && (
        <textarea
          autoFocus={isEditing && !note}
          placeholder="e.g. Quoted ₦250k for aso-ebi, follow up in March…"
          value={note}
          onChange={e => handleNoteChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          rows={3}
          maxLength={LIMITS.note}
          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 11, color: 'var(--text)', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jost, sans-serif)', padding: 0 }}
        />
      )}
    </div>
  )
}

function ReviewSection({ vendor }: { vendor: Vendor }) {
  const supabase = useSupabase()
  const [reviews, setReviews] = useState<Review[]>([])
  useEffect(() => {
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id])
  const realReviews = reviews.filter(r => r.comment !== '__used__')
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
        {realReviews.length > 0 ? `${realReviews.length} review${realReviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
      </span>
      {realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 8, padding: '6px 8px', marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jost, sans-serif)' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && (
            <p style={{ fontSize: 10, color: 'var(--text-pill)', margin: '3px 0 0', lineHeight: 1.4, fontFamily: 'var(--font-jost, sans-serif)' }}>{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function VendorCard({ v, savedIds, onToggleSave, userId, savedNote, savedQuotedPrice, onQuoteChange }: {
  v: Vendor
  savedIds: Set<string>
  onToggleSave: (id: string) => void
  userId: string
  savedNote: string
  savedQuotedPrice: number | null
  onQuoteChange: (vendorId: string, name: string, amount: number | null) => void
}) {
  const supabase = useSupabase()
  const [expanded, setExpanded]   = useState(false)
  const [copied, setCopied]       = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [usedCount, setUsedCount] = useState(0)

  const colour     = getColour(v.category)
  const igHandle   = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website
  const isSaved    = savedIds.has(v.id)

  useEffect(() => {
    supabase.from('reviews').select('rating, comment').eq('vendor_id', v.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const real = data.filter(r => r.comment !== '__used__')
        if (real.length > 0) setAvgRating(Math.round(real.reduce((s, r) => s + r.rating, 0) / real.length * 10) / 10)
      })
    supabase.from('vendor_used').select('id', { count: 'exact' }).eq('vendor_id', v.id)
      .then(({ count }) => { if (count) setUsedCount(count) })
  }, [v.id])

  function copyCode() { navigator.clipboard.writeText(v.discount_code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const whatsappUrl = v.phone?.replace(/\D/g, '') ? `https://wa.me/${v.phone.replace(/\D/g, '')}` : null

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {isFeatured && <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-jost, sans-serif)' }}>⭐ Top pick</div>}
        {v.verified  && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: 'var(--font-jost, sans-serif)' }}>✓ Verified</div>}
      </div>
      <button onClick={() => onToggleSave(v.id)}
        style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? 'var(--accent-light)' : 'var(--bg-card)', border: `1px solid ${isSaved ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>
      <div style={{ padding: '14px 14px 12px', paddingTop: (isFeatured || v.verified) ? 36 : 14 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {getEmoji(v.category)} {v.category}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: 'var(--font-playfair, serif)' }}>
          {v.name}
        </div>
        {(avgRating !== null || usedCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-jost, sans-serif)' }}>★ {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>👋 {usedCount} used</span>}
          </div>
        )}
        {v.location   && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>📍 {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>💰 From ₦{v.price_from}</div>}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
            @{igHandle}
          </a>
        )}
        {whatsappUrl && (
          <div style={{ marginBottom: 4 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>
              WhatsApp
            </a>
          </div>
        )}
        {v.discount_code && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--text)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: 'var(--font-jost, sans-serif)' }}>
              🏷️ {v.discount_code}
            </span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: copied ? 'var(--accent-light)' : 'var(--bg-card)', fontSize: 10, color: copied ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}
        <MyNotes
          vendorId={v.id}
          userId={userId}
          initialNote={savedNote}
          initialQuotedPrice={savedQuotedPrice}
          onQuoteChange={(vid, _name, amount) => onQuoteChange(vid, v.name, amount)}
        />
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: 'var(--text-pill)', margin: 0, lineHeight: 1.55, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>📞 {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>✉️ {v.email}</p>}
            {safeVendorUrl(v.website) && (
              <a href={safeVendorUrl(v.website)!} target="_blank" rel="noopener noreferrer nofollow"
                style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>
                🌐 {v.website}
              </a>
            )}
            {v.notes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.notes}</p>}
            <ReviewSection vendor={v} />
          </div>
        )}
        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '6px 0', fontFamily: 'var(--font-jost, sans-serif)' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SavedPage() {
  const supabase = useSupabase()
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const [displayName, setDisplayName]     = useState('')
  const [username, setUsername]           = useState('')
  const [savedVendors, setSavedVendors]   = useState<Vendor[]>([])
  const [savedIds, setSavedIds]           = useState<Set<string>>(new Set())
  const [savedNotes, setSavedNotes]       = useState<Record<string, string>>({})
  const [savedQuotes, setSavedQuotes]     = useState<Record<string, number | null>>({})
  const [vendorNames, setVendorNames]     = useState<Record<string, string>>({})
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('display_name, username').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'You')
        setUsername(data?.username || '')
      })
  }, [user])

  useEffect(() => {
    if (!isLoaded) return
    if (!user?.id) { setLoading(false); return }
    async function loadSaved() {
      setLoading(true)
      const { data: savedRows } = await supabase
        .from('saved_vendors')
        .select('vendor_id, notes, quoted_price')
        .eq('clerk_user_id', user!.id)
      if (!savedRows || savedRows.length === 0) {
        setSavedVendors([]); setSavedIds(new Set()); setSavedNotes({}); setSavedQuotes({})
        setLoading(false); return
      }
      const ids = savedRows.map(r => r.vendor_id)
      setSavedIds(new Set(ids))
      const notesMap: Record<string, string> = {}
      const quotesMap: Record<string, number | null> = {}
      savedRows.forEach(r => {
        notesMap[r.vendor_id]  = r.notes ?? ''
        quotesMap[r.vendor_id] = r.quoted_price ?? null
      })
      setSavedNotes(notesMap)
      setSavedQuotes(quotesMap)
      const { data: vendorData } = await supabase.from('vendors').select('*').in('id', ids)
      if (vendorData) {
        const mapped = vendorData.map(v => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
        setSavedVendors(mapped)
        const names: Record<string, string> = {}
        mapped.forEach(v => { names[v.id] = v.name })
        setVendorNames(names)
      }
      setLoading(false)
    }
    loadSaved()
  }, [user, isLoaded])

  const handleToggleSave = useCallback(async (vendorId: string) => {
    if (!user?.id) return
    const isSaved = savedIds.has(vendorId)
    setSavedIds(prev => { const n = new Set(prev); if (isSaved) n.delete(vendorId); else n.add(vendorId); return n })
    if (isSaved) {
      setSavedVendors(prev => prev.filter(v => v.id !== vendorId))
      setSavedNotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
      setSavedQuotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
      await fetch('/api/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId }),
      })
    } else {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId }),
      })
    }
  }, [user, savedIds])

  function handleQuoteChange(vendorId: string, name: string, amount: number | null) {
    setSavedQuotes(prev => ({ ...prev, [vendorId]: amount }))
    if (name) setVendorNames(prev => ({ ...prev, [vendorId]: name }))
  }

  // Build quotes map keyed by vendor name for BudgetBar
  const namedQuotes: Record<string, number> = {}
  Object.entries(savedQuotes).forEach(([vid, amount]) => {
    if (amount !== null && amount > 0) namedQuotes[vendorNames[vid] || vid] = amount
  })

  const grouped = CATEGORY_ORDER.reduce<Record<string, Vendor[]>>((acc, cat) => {
    const inCat = savedVendors.filter(v => v.category === cat)
    if (inCat.length > 0) acc[cat] = inCat
    return acc
  }, {})
  savedVendors.forEach(v => {
    if (!CATEGORY_ORDER.includes(v.category)) {
      if (!grouped[v.category]) grouped[v.category] = []
      if (!grouped[v.category].find(x => x.id === v.id)) grouped[v.category].push(v)
    }
  })

  const totalSaved = savedVendors.length
  const firstName  = displayName.split(' ')[0]
  const isLoading  = !isLoaded || loading

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--hero-grad)', textAlign: 'center', padding: 'clamp(32px, 5vw, 48px) 20px clamp(28px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 10 }}>Your Shortlist</div>
        <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 6px' }}>
          {firstName ? `${firstName}'s` : 'Saved'}
        </h1>
        <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--text-pill)', marginBottom: 16 }}>Saved Vendors</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 16 }}>
          {isLoading ? 'Loading…' : totalSaved > 0 ? `${totalSaved} vendor${totalSaved !== 1 ? 's' : ''} saved` : 'Your shortlist, all in one place'}
        </div>
        {!isLoading && user && totalSaved > 0 && username && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ShareButton username={username} />
          </div>
        )}
        <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(to right, transparent, var(--accent) 30%, var(--accent) 70%, transparent)', opacity: 0.4 }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 60px' }}>
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 12, marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 120, opacity: 0.3, border: '1px solid var(--border)' }} />
            ))}
          </div>
        )}
        {!isLoading && !user && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
            <h2 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>Sign in to see your saved vendors</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>Head back to the directory and sign in to start saving vendors.</p>
            <button onClick={() => openSignIn()} style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jost, sans-serif)' }}>Sign in</button>
          </div>
        )}
        {!isLoading && user && totalSaved === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
            <h2 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>No saved vendors yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>Browse the directory and tap the ♡ on vendors you love.</p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--accent)', color: 'white', borderRadius: 24, textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jost, sans-serif)' }}>Browse vendors</Link>
          </div>
        )}
        {!isLoading && user && totalSaved > 0 && (
          <div>
            <BudgetBar quotes={namedQuotes} />
            {Object.entries(grouped).map(([cat, vendors]) => (
              <div key={cat} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: getColour(cat), color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    {getEmoji(cat)} {cat}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 12 }}>
                  {vendors.map(v => (
                    <VendorCard
                      key={v.id}
                      v={v}
                      savedIds={savedIds}
                      onToggleSave={handleToggleSave}
                      userId={user.id}
                      savedNote={savedNotes[v.id] ?? ''}
                      savedQuotedPrice={savedQuotes[v.id] ?? null}
                      onQuoteChange={handleQuoteChange}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 24, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 12, textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-jost, sans-serif)' }}>
                ← Browse more vendors
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides &amp; families
      </footer>
    </main>
  )
}
