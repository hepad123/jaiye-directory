'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Palette ───────────────────────────────────────────────────────────────────
const ACCENT    = '#8B6E9A'
const DARK      = '#2A1A2A'
const BG        = '#FAFAFA'
const GOLD      = '#C0A060'
const MUTED     = '#9A8A9A'
const IG_COLOUR = '#8B6E9A'

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
  'Event Planning':        { emoji: '📋', colour: '#7B68C8' },
  'Styling':               { emoji: '✨', colour: '#2E9E7A' },
  'Outfits':               { emoji: '👗', colour: '#C07A2F' },
  'Makeup':                { emoji: '💄', colour: '#C45C7A' },
  'Hair & Gele':           { emoji: '💅', colour: '#C4563A' },
  'Photography':           { emoji: '📷', colour: '#4A8FC4' },
  'Videography & Content': { emoji: '🎬', colour: '#7A6058' },
  'Decor & Venue':         { emoji: '🏛️', colour: '#9A7A5A' },
  'Catering':              { emoji: '🍽️', colour: '#C4724A' },
  'Entertainment':         { emoji: '🎤', colour: '#7A6A9A' },
  'Other':                 { emoji: '✦',  colour: '#9E6BAA' },
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? ACCENT
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

// ─── Icons ────────────────────────────────────────────────────────────────────

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke={IG_COLOUR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill={IG_COLOUR} stroke="none"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? ACCENT : 'none'}
      stroke={filled ? ACCENT : '#C4A8C8'} strokeWidth="2"
      style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= rating ? '#D4A853' : '#E0D8E8', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

// ─── My Notes ─────────────────────────────────────────────────────────────────

function MyNotes({ vendorId, userId, initialNote }: { vendorId: string; userId: string; initialNote: string }) {
  const [note, setNote]             = useState(initialNote)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isEditing, setIsEditing]   = useState(false)
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(val: string) {
    setNote(val)
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      await supabase.from('saved_vendors')
        .update({ notes: val })
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1800)
    }, 800)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div style={{ marginTop: 10, background: '#F8F5FC', border: `1px dashed ${GOLD}`, borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 0.4, fontFamily: 'var(--font-jost, sans-serif)' }}>📝 My notes</span>
        <span style={{ fontSize: 9, fontWeight: 600, transition: 'color 0.2s', fontFamily: 'var(--font-jost, sans-serif)', color: saveStatus === 'saving' ? '#B0A0B8' : saveStatus === 'saved' ? '#5A8A72' : 'transparent' }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '·'}
        </span>
      </div>
      {!isEditing && !note && (
        <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '4px 0', background: 'none', border: 'none', cursor: 'text', textAlign: 'left', fontSize: 11, color: '#B0A0B8', fontStyle: 'italic', fontFamily: 'var(--font-jost, sans-serif)' }}>
          + Add a private note about this vendor…
        </button>
      )}
      {(isEditing || !!note) && (
        <textarea
          autoFocus={isEditing && !note}
          placeholder="e.g. Quoted ₦250k for aso-ebi, follow up in March…"
          value={note} onChange={e => handleChange(e.target.value)} onFocus={() => setIsEditing(true)} rows={3}
          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 11, color: DARK, lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jost, sans-serif)', padding: 0 }}
        />
      )}
    </div>
  )
}

// ─── Review Section ───────────────────────────────────────────────────────────

function ReviewSection({ vendor }: { vendor: Vendor }) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id])

  const realReviews = reviews.filter(r => r.comment !== '__used__')

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EDE8F0' }}>
      <span style={{ fontSize: 10, color: '#B0A0B8', letterSpacing: 0.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
        {realReviews.length > 0 ? `${realReviews.length} review${realReviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
      </span>
      {realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: '#F5F0F8', borderRadius: 8, padding: '6px 8px', marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#5A4868', fontFamily: 'var(--font-jost, sans-serif)' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && (
            <p style={{ fontSize: 10, color: '#7A6888', margin: '3px 0 0', lineHeight: 1.4, fontFamily: 'var(--font-jost, sans-serif)' }}>{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────

function VendorCard({ v, savedIds, onToggleSave, userId, savedNote }: {
  v: Vendor; savedIds: Set<string>; onToggleSave: (vendorId: string) => void; userId: string; savedNote: string
}) {
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
        const used = data.filter(r => r.comment === '__used__')
        setUsedCount(used.length)
        if (real.length > 0) setAvgRating(Math.round(real.reduce((s, r) => s + r.rating, 0) / real.length * 10) / 10)
      })
  }, [v.id])

  function copyCode() { navigator.clipboard.writeText(v.discount_code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const whatsappNumber = v.phone?.replace(/\D/g, '')
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null

  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1.5px solid ${colour}55`, overflow: 'hidden', position: 'relative' }}>

      {/* Badges */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {isFeatured && <div style={{ background: '#FDF3E3', border: '1px solid #E8C87A', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#A07820', fontFamily: 'var(--font-jost, sans-serif)' }}>⭐ Top pick</div>}
        {v.verified && <div style={{ background: '#F0EEFF', border: '1px solid #C0A8E8', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#6050A8', fontFamily: 'var(--font-jost, sans-serif)' }}>✓ Verified</div>}
      </div>

      {/* Heart */}
      <button onClick={() => onToggleSave(v.id)} title="Remove from saved"
        style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? '#F5F0F8' : 'white', border: `1px solid ${isSaved ? '#D0B8E0' : '#E8E0F0'}`, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px', paddingTop: (isFeatured || v.verified) ? 36 : 14 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {getEmoji(v.category)} {v.category}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: DARK, lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: 'var(--font-playfair, serif)' }}>
          {v.name}
        </div>

        {(avgRating !== null || usedCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: '#B8860B', fontFamily: 'var(--font-jost, sans-serif)' }}>★ {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>👋 {usedCount} used</span>}
          </div>
        )}

        {v.location && <div style={{ fontSize: 11, color: MUTED, marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>📍 {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#5A8A72', fontWeight: 600, marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>💰 From ₦{v.price_from}</div>}

        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: MUTED, textDecoration: 'none', marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
            <InstagramIcon />@{igHandle}
          </a>
        )}

        {whatsappUrl && (
          <div style={{ marginBottom: 4 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        )}

        {v.discount_code && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: DARK, color: '#F5EAF8', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: 'var(--font-jost, sans-serif)' }}>
              🏷️ {v.discount_code}
            </span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid #E8E0F0', background: copied ? '#F0EEFF' : 'white', fontSize: 10, color: copied ? '#6050A8' : MUTED, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}

        <MyNotes vendorId={v.id} userId={userId} initialNote={savedNote} />

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #EDE8F0', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: '#5A4868', margin: 0, lineHeight: 1.55, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: MUTED, margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>📞 {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: MUTED, margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>✉️ {v.email}</p>}
            {v.website  && <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#7B68C8', textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>🌐 {v.website}</a>}
            {v.notes    && <p style={{ fontSize: 10, color: '#B0A0B8', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.notes}</p>}
            <ReviewSection vendor={v} />
          </div>
        )}

        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid #E8E0F0', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: MUTED, fontWeight: 500, padding: '6px 0', fontFamily: 'var(--font-jost, sans-serif)' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #D8D0E8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: MUTED, lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Saved Page ───────────────────────────────────────────────────────────────

export default function SavedPage() {
  const { user, openAuthModal } = useAuth()

  const [displayName, setDisplayName]   = useState('')
  const [savedVendors, setSavedVendors] = useState<Vendor[]>([])
  const [savedIds, setSavedIds]         = useState<Set<string>>(new Set())
  const [savedNotes, setSavedNotes]     = useState<Record<string, string>>({})
  const [loading, setLoading]           = useState(true)

  // Load display name from profiles
  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
        else setDisplayName(user.email?.split('@')[0] || 'You')
      })
  }, [user])

  // Load saved vendors using UUID
  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    async function loadSaved() {
      setLoading(true)
      const { data: savedRows } = await supabase
        .from('saved_vendors')
        .select('vendor_id, notes')
        .eq('user_id', user!.id)

      if (!savedRows || savedRows.length === 0) {
        setSavedVendors([]); setSavedIds(new Set()); setSavedNotes({})
        setLoading(false); return
      }

      const ids = savedRows.map(r => r.vendor_id)
      setSavedIds(new Set(ids))

      const notesMap: Record<string, string> = {}
      savedRows.forEach(r => { notesMap[r.vendor_id] = r.notes ?? '' })
      setSavedNotes(notesMap)

      const { data: vendorData } = await supabase
        .from('vendors').select('*').in('id', ids)
      if (vendorData) setSavedVendors(
        vendorData.map(v => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
      )
      setLoading(false)
    }
    loadSaved()
  }, [user])

  const handleToggleSave = useCallback(async (vendorId: string) => {
    if (!user?.id) return
    const isSaved = savedIds.has(vendorId)
    setSavedIds(prev => { const n = new Set(prev); if (isSaved) n.delete(vendorId); else n.add(vendorId); return n })
    if (isSaved) {
      setSavedVendors(prev => prev.filter(v => v.id !== vendorId))
      setSavedNotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
      await supabase.from('saved_vendors').delete()
        .eq('user_id', user.id).eq('vendor_id', vendorId)
    } else {
      await supabase.from('saved_vendors').insert({ user_id: user.id, vendor_id: vendorId })
    }
  }, [user, savedIds])

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

  const totalSaved  = savedVendors.length
  const firstName   = displayName.split(' ')[0]

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: BG, minHeight: '100vh' }}>

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E0E8', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: DARK, textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-jost, sans-serif)' }}>
          ← Directory
        </Link>
        {user && (
          <div style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>
            {firstName}'s saved vendors
          </div>
        )}
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #DDD0E4 0%, #EDE4F0 40%, #FAFAFA 100%)', textAlign: 'center', padding: 'clamp(32px, 5vw, 48px) 20px clamp(28px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ height: 1, width: 44, background: GOLD, opacity: 0.6 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, opacity: 0.8 }} />
          <div style={{ height: 1, width: 44, background: GOLD, opacity: 0.6 }} />
        </div>
        <div style={{ fontFamily: 'var(--font-jost, sans-serif)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, fontWeight: 500, marginBottom: 10 }}>
          Your Shortlist
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 700, color: DARK, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 6px' }}>
          {firstName ? `${firstName}'s` : 'Saved'}
        </h1>
        <div style={{ fontFamily: 'var(--font-jost, sans-serif)', fontSize: 13, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#6A586A', marginBottom: 16 }}>
          Saved Vendors
        </div>
        <div style={{ fontFamily: 'var(--font-jost, sans-serif)', fontSize: 11, color: GOLD, fontWeight: 500 }}>
          {loading ? 'Loading…' : totalSaved > 0 ? `${totalSaved} vendor${totalSaved !== 1 ? 's' : ''} saved` : 'Your shortlist, all in one place'}
        </div>
        <div style={{ marginTop: 26, height: 1, background: `linear-gradient(to right, transparent, ${GOLD} 30%, ${GOLD} 70%, transparent 100%)` }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Not signed in */}
        {!user && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
            <h2 style={{ fontSize: 18, color: DARK, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>Sign in to see your saved vendors</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: '0 0 20px', fontFamily: 'var(--font-jost, sans-serif)' }}>Head back to the directory and sign in to start saving vendors.</p>
            <button onClick={openAuthModal} style={{ display: 'inline-block', padding: '10px 24px', background: ACCENT, color: 'white', borderRadius: 24, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jost, sans-serif)' }}>
              Sign in
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 12, marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, height: 120, opacity: 0.3, border: '1px solid #E8E0E8' }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && user && totalSaved === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
            <h2 style={{ fontSize: 18, color: DARK, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>No saved vendors yet</h2>
            <p style={{ color: MUTED, fontSize: 13, margin: '0 0 20px', fontFamily: 'var(--font-jost, sans-serif)' }}>Browse the directory and tap the ♡ on vendors you love.</p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: ACCENT, color: 'white', borderRadius: 24, textDecoration: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-jost, sans-serif)' }}>
              Browse vendors
            </Link>
          </div>
        )}

        {/* Vendor groups */}
        {!loading && user && totalSaved > 0 && (
          <div>
            {Object.entries(grouped).map(([cat, vendors]) => (
              <div key={cat} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 40, background: getColour(cat), color: 'white', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    {getEmoji(cat)} {cat}
                  </span>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>
                    {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 12 }}>
                  {vendors.map(v => (
                    <VendorCard key={v.id} v={v} savedIds={savedIds}
                      onToggleSave={handleToggleSave}
                      userId={user.id}
                      savedNote={savedNotes[v.id] ?? ''} />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 24, border: '1px solid #E8E0F0', background: 'white', color: MUTED, fontSize: 12, textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-jost, sans-serif)' }}>
                ← Browse more vendors
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #E8E0E8', color: MUTED, fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
