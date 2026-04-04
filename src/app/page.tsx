'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { sanitizeReviewComment, sanitizeSearch, isValidRating, safeVendorUrl, LIMITS } from '@/lib/sanitize'

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
  user_id?: string
  rating: number
  comment: string
  created_at: string
}

type CurrentUser = {
  id: string
  name: string
  email: string
  username: string
}

type FollowProfile = {
  id: string
  display_name: string
  username: string
}

type SearchProfile = {
  id: string
  username: string
  display_name: string
  bio?: string
}

type VendorStats = {
  avgRating: number | null
  usedCount: number
  recCount: number
  hasUsed: boolean
  hasRec: boolean
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

const LOCATION_ORDER = ['All', '🇳🇬 Nigeria', '🟢 Abuja', '🟢 Lagos', '🏙️ Lekki (Lagos)']
const DB_LOCATION_MAP: Record<string, string> = {
  'Nigeria':       '🇳🇬 Nigeria',
  'Abuja':         '🟢 Abuja',
  'Lagos':         '🟢 Lagos',
  'Lekki (Lagos)': '🏙️ Lekki (Lagos)',
}

const CATEGORY_ORDER = [
  'All', 'Event Planning', 'Outfits',
  'Styling', 'Makeup', 'Hair & Gele', 'Photography', 'Videography & Content',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const isNewVendor = (v: Vendor) => {
  if (!v.created_at) return false
  const created = new Date(v.created_at)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return created > weekAgo
}

function UserSearch() {
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<SearchProfile[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const containerRef              = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery(''); setResults([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8)
      setResults(data ?? [])
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const avatarColours = ['#D97706', '#6366F1', '#0D9488', '#2563EB', '#EA580C', '#DB2777']
  const avatarColour  = (name: string) => avatarColours[name.charCodeAt(0) % avatarColours.length]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Search people" style={{
        width: 32, height: 32, borderRadius: '50%',
        background: open ? 'var(--accent)' : 'var(--bg-pill)',
        border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, transition: 'all 0.15s',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={open ? 'white' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <circle cx="19" cy="19" r="3"/>
          <line x1="21" y1="21" x2="17.5" y2="17.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 40, right: 0, zIndex: 200,
          background: 'var(--bg-card)', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(28,25,23,0.12)',
          border: '1px solid var(--border)',
          width: 300, overflow: 'hidden',
          fontFamily: 'var(--font-jost, sans-serif)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input ref={inputRef} type="text" placeholder="Search by name or @username…" value={query}
              maxLength={LIMITS.search}
              onChange={e => setQuery(sanitizeSearch(e.target.value))}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', background: 'transparent', fontFamily: 'var(--font-jost, sans-serif)' }} />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {!query && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Type to search for people</div>}
            {query && searching && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Searching…</div>}
            {query && !searching && results.length === 0 && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No users found for "{query}"</div>}
            {results.map(p => {
              const initials = (p.display_name || p.username || '?').split(' ').map((x: string) => x[0]).slice(0, 2).join('').toUpperCase()
              const colour   = avatarColour(p.display_name || p.username || 'a')
              return (
                <Link key={p.id} href={`/profile/${p.username}`}
                  onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${colour}20`, border: `2px solid ${colour}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colour }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || p.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{p.username}</div>
                    {p.bio && <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{p.bio}</div>}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="var(--text-muted)" stroke="none"/>
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
      fill={filled ? 'var(--accent)' : 'none'}
      stroke={filled ? 'var(--accent)' : 'var(--border)'} strokeWidth="2"
      style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)}
          style={{ cursor: onRate ? 'pointer' : 'default', color: s <= rating ? 'var(--accent)' : 'var(--border)', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

function ReviewSection({ vendor, currentUser, onOpenAuth }: {
  vendor: Vendor; currentUser: CurrentUser | null; onOpenAuth: () => void
}) {
  const [reviews, setReviews]       = useState<Review[]>([])
  const [rating, setRating]         = useState(0)
  const [comment, setComment]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [loaded, setLoaded]         = useState(false)

  useEffect(() => {
    if (!loaded) return
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id, loaded])

  async function submitReview() {
    if (!currentUser) return
    if (!isValidRating(rating)) return
    const cleanComment = sanitizeReviewComment(comment)
    if (cleanComment.length > LIMITS.reviewComment) return
    setSubmitting(true)
    const { data } = await supabase.from('reviews')
      .insert({
        vendor_id:     vendor.id,
        reviewer_name: currentUser.name,
        user_id:       currentUser.id,
        rating,
        comment:       cleanComment,
      })
      .select()
    if (data) { setReviews(prev => [data[0], ...prev]); setRating(0); setComment(''); setShowForm(false) }
    setSubmitting(false)
  }

  const realReviews = reviews.filter(r => r.comment !== '__used__')

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {loaded ? (realReviews.length > 0 ? `${realReviews.length} review${realReviews.length !== 1 ? 's' : ''}` : 'No reviews yet') : 'Reviews'}
        </span>
        <button onClick={() => { if (!currentUser) { onOpenAuth(); return }; setLoaded(true); setShowForm(f => !f) }}
          style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {showForm ? 'Cancel' : '+ Add review'}
        </button>
      </div>
      {showForm && (
        <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ marginBottom: 6 }}><StarRating rating={rating} onRate={setRating} /></div>
          <textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            maxLength={LIMITS.reviewComment}
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, background: 'var(--bg)', color: 'var(--text)', padding: '6px 10px', marginBottom: 6, boxSizing: 'border-box' as const, resize: 'none' as const, fontFamily: 'var(--font-jost, sans-serif)', outline: 'none' }} />
          <button onClick={submitReview} disabled={submitting || rating === 0}
            style={{ padding: '5px 14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: rating === 0 ? 0.45 : 1, fontFamily: 'var(--font-jost, sans-serif)' }}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}
      {loaded && realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
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

function VendorCard({
  v, isNew, resetKey, currentUser, savedIds, onToggleSave, onOpenAuth, followSavers, stats, onStatChange,
}: {
  v: Vendor; isNew: boolean; resetKey: number; currentUser: CurrentUser | null
  savedIds: Set<string>; onToggleSave: (vendorId: string) => void
  onOpenAuth: () => void; followSavers: FollowProfile[]
  stats: VendorStats; onStatChange: (vendorId: string, patch: Partial<VendorStats>) => void
}) {
  const [expanded, setExpanded]             = useState(false)
  const [copied, setCopied]                 = useState(false)
  const [usedSubmitting, setUsedSubmitting] = useState(false)
  const [recSubmitting, setRecSubmitting]   = useState(false)

  useEffect(() => { setExpanded(false) }, [resetKey])

  const colour     = getColour(v.category)
  const igHandle   = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website
  const isSaved    = savedIds.has(v.id)
  const { avgRating, usedCount, recCount, hasUsed, hasRec } = stats

  async function submitUsed() {
    if (!currentUser) { onOpenAuth(); return }
    if (hasUsed || usedSubmitting) return
    setUsedSubmitting(true)
    await supabase.from('reviews').insert({ vendor_id: v.id, reviewer_name: currentUser.name, user_id: currentUser.id, rating: 5, comment: '__used__' })
    onStatChange(v.id, { usedCount: usedCount + 1, hasUsed: true })
    setUsedSubmitting(false)
  }

  async function toggleRecommend() {
    if (!currentUser) { onOpenAuth(); return }
    if (recSubmitting) return
    setRecSubmitting(true)
    if (hasRec) {
      await supabase.from('vendor_recommendations').delete().eq('vendor_id', v.id).eq('user_id', currentUser.id)
      onStatChange(v.id, { recCount: Math.max(0, recCount - 1), hasRec: false })
    } else {
      await supabase.from('vendor_recommendations').insert({ vendor_id: v.id, user_id: currentUser.id })
      onStatChange(v.id, { recCount: recCount + 1, hasRec: true })
    }
    setRecSubmitting(false)
  }

  function copyCode() { navigator.clipboard.writeText(v.discount_code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const whatsappNumber = v.phone?.replace(/\D/g, '')
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null

  const followSaverLabel = () => {
    if (followSavers.length === 0) return null
    const names = followSavers.map(p => p.display_name.split(' ')[0])
    if (names.length === 1) return `${names[0]} saved this`
    if (names.length === 2) return `${names[0]} & ${names[1]} saved this`
    return `${names[0]}, ${names[1]} +${names.length - 2} saved this`
  }

  const saverLabel = followSaverLabel()
  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px', borderRadius: 20, fontSize: 11,
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
    fontFamily: 'var(--font-jost, sans-serif)', border: '1px solid var(--border)',
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-card)' }}>
      {saverLabel && (
        <div style={{ background: `${colour}0D`, borderBottom: `1px solid ${colour}20`, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex' }}>
            {followSavers.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ width: 18, height: 18, borderRadius: '50%', background: `${colour}25`, border: '1.5px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: colour, marginLeft: i > 0 ? -5 : 0, fontFamily: 'var(--font-jost, sans-serif)' }}>
                {p.display_name[0].toUpperCase()}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 10, color: colour, fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>{saverLabel}</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: saverLabel ? 38 : 12, left: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {isFeatured && <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-jost, sans-serif)' }}>⭐ Top pick</div>}
        {v.verified  && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: 'var(--font-jost, sans-serif)' }}>✓ Verified</div>}
        {isNew       && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: 'var(--font-jost, sans-serif)' }}>🆕 New</div>}
      </div>

      <button onClick={() => { if (!currentUser) { onOpenAuth(); return }; onToggleSave(v.id) }}
        style={{ position: 'absolute', top: saverLabel ? 38 : 12, right: 12, background: isSaved ? 'var(--accent-light)' : 'var(--bg-card)', border: `1px solid ${isSaved ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px', paddingTop: (isFeatured || v.verified || isNew) ? (saverLabel ? 52 : 36) : (saverLabel ? 18 : 14) }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {getEmoji(v.category)} {v.category}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: 'var(--font-playfair, serif)' }}>
          {v.name}
        </div>

        {(avgRating !== null || usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-jost, sans-serif)' }}>★ {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>👋 {usedCount} used</span>}
            {recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>⭐ {recCount} rec</span>}
          </div>
        )}

        {v.location   && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>📍 {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>💰 From ₦{v.price_from}</div>}

        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)' }}>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--text)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: 'var(--font-jost, sans-serif)' }}>
              🏷️ {v.discount_code}
            </span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: copied ? 'var(--accent-light)' : 'var(--bg-card)', fontSize: 10, color: copied ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: 'var(--font-jost, sans-serif)' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}

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
            {v.notes    && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.notes}</p>}

            {followSavers.length > 0 && (
              <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--bg-pill)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, fontFamily: 'var(--font-jost, sans-serif)' }}>👯 Saved by people you follow</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {followSavers.map(p => (
                    <Link key={p.id} href={`/profile/${p.username}`}
                      style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px', fontFamily: 'var(--font-jost, sans-serif)' }}>
                      @{p.username}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 4 }}>
              {hasUsed ? (
                <div style={{ ...btnBase, background: 'var(--accent-light)', border: '1px solid var(--gold)', color: 'var(--gold)', cursor: 'default' }}>
                  👋 Used this · <span style={{ fontWeight: 700 }}>{usedCount}</span>
                </div>
              ) : (
                <button onClick={submitUsed} disabled={usedSubmitting} style={{ ...btnBase, background: 'var(--bg-card)', color: 'var(--text-muted)', opacity: usedSubmitting ? 0.6 : 1 }}>
                  👋 I used this vendor {usedCount > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>· {usedCount}</span>}
                </button>
              )}
            </div>

            <div style={{ marginTop: 4 }}>
              <button onClick={toggleRecommend} disabled={recSubmitting}
                style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : 'var(--bg-card)', border: hasRec ? '1px solid var(--gold)' : '1px solid var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)', opacity: recSubmitting ? 0.6 : 1 }}>
                ⭐ {hasRec ? 'Recommended' : 'I recommend this'} {recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}>· {recCount}</span>}
              </button>
            </div>

            <ReviewSection vendor={v} currentUser={currentUser} onOpenAuth={onOpenAuth} />
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

export default function Home() {
  const { user: authUser, openAuthModal } = useAuth()

  const [vendors, setVendors]               = useState<Vendor[]>([])
  const [search, setSearch]                 = useState('')
  const [category, setCategory]             = useState('All')
  const [location, setLocation]             = useState('All')
  const [showNewOnly, setShowNewOnly]       = useState(false)
  const [weddingType, setWeddingType]       = useState('All')
  const [loading, setLoading]               = useState(true)
  const [cardResetKey, setCardResetKey]     = useState(0)
  const [currentUser, setCurrentUser]       = useState<CurrentUser | null>(null)
  const [savedIds, setSavedIds]             = useState<Set<string>>(new Set())
  const [followSaverMap, setFollowSaverMap] = useState<Record<string, FollowProfile[]>>({})
  const [vendorStats, setVendorStats]       = useState<Record<string, VendorStats>>({})

  useEffect(() => {
    if (!authUser?.id || !authUser?.email) { setCurrentUser(null); return }
    supabase.from('profiles').select('username, display_name').eq('id', authUser.id).maybeSingle()
      .then(({ data }) => {
        const username    = data?.username     || authUser.email!.split('@')[0]
        const displayName = data?.display_name || authUser.user_metadata?.display_name || authUser.email!.split('@')[0]
        setCurrentUser({ id: authUser.id, name: displayName, email: authUser.email!, username })
      })
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id) { setSavedIds(new Set()); return }
    supabase.from('saved_vendors').select('vendor_id').eq('user_id', authUser.id)
      .then(({ data }) => { if (data) setSavedIds(new Set(data.map(r => r.vendor_id))) })
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id) { setFollowSaverMap({}); return }
    async function loadFollowContext() {
      const { data: followRows } = await supabase.from('follows').select('following_id').eq('follower_id', authUser!.id)
      if (!followRows || followRows.length === 0) { setFollowSaverMap({}); return }
      const followingIds = followRows.map(r => r.following_id)
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, username').in('id', followingIds)
      if (!profiles || profiles.length === 0) { setFollowSaverMap({}); return }
      const profileMap: Record<string, FollowProfile> = {}
      profiles.forEach(p => { profileMap[p.id] = p })
      const { data: savedRows } = await supabase.from('saved_vendors').select('vendor_id, user_id').in('user_id', followingIds)
      if (!savedRows || savedRows.length === 0) { setFollowSaverMap({}); return }
      const map: Record<string, FollowProfile[]> = {}
      savedRows.forEach(row => {
        const profile = profileMap[row.user_id]
        if (!profile) return
        if (!map[row.vendor_id]) map[row.vendor_id] = []
        if (!map[row.vendor_id].find(p => p.id === profile.id)) map[row.vendor_id].push(profile)
      })
      setFollowSaverMap(map)
    }
    loadFollowContext()
  }, [authUser])

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      const [vendorsRes, reviewsRes, recsRes] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('reviews').select('vendor_id, rating, comment, user_id'),
        supabase.from('vendor_recommendations').select('vendor_id, user_id'),
      ])
      const allVendors = vendorsRes.data || []
      const allReviews = reviewsRes.data || []
      const allRecs    = recsRes.data    || []
      setVendors(allVendors)
      const stats: Record<string, VendorStats> = {}
      allVendors.forEach(v => {
        const vendorReviews = allReviews.filter(r => r.vendor_id === v.id)
        const realReviews   = vendorReviews.filter(r => r.comment !== '__used__')
        const usedReviews   = vendorReviews.filter(r => r.comment === '__used__')
        const vendorRecs    = allRecs.filter(r => r.vendor_id === v.id)
        const avgRating = realReviews.length > 0
          ? Math.round(realReviews.reduce((s, r) => s + r.rating, 0) / realReviews.length * 10) / 10
          : null
        stats[v.id] = {
          avgRating,
          usedCount: usedReviews.length,
          recCount:  vendorRecs.length,
          hasUsed:   authUser?.id ? usedReviews.some(r => r.user_id === authUser.id) : false,
          hasRec:    authUser?.id ? vendorRecs.some(r => r.user_id === authUser.id)  : false,
        }
      })
      setVendorStats(stats)
      setLoading(false)
    }
    loadAll()
  }, [authUser])

  useEffect(() => { setCardResetKey(k => k + 1) }, [category])

  const handleToggleSave = useCallback(async (vendorId: string) => {
    if (!authUser?.id) return
    const isSaved = savedIds.has(vendorId)
    setSavedIds(prev => { const n = new Set(prev); if (isSaved) n.delete(vendorId); else n.add(vendorId); return n })
    if (isSaved) {
      await supabase.from('saved_vendors').delete().eq('user_id', authUser.id).eq('vendor_id', vendorId)
    } else {
      await supabase.from('saved_vendors').insert({ user_id: authUser.id, vendor_id: vendorId })
    }
  }, [authUser, savedIds])

  const handleStatChange = useCallback((vendorId: string, patch: Partial<VendorStats>) => {
    setVendorStats(prev => ({ ...prev, [vendorId]: { ...prev[vendorId], ...patch } }))
  }, [])

  const vendorsWithSubcats = vendors.map(v => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
  const allCats            = Array.from(new Set(vendorsWithSubcats.map(v => v.category)))
  const remainingCats      = allCats.filter(c => !CATEGORY_ORDER.includes(c)).sort()
  const categories         = [...CATEGORY_ORDER.filter(c => c === 'All' || allCats.includes(c)), ...remainingCats]
  const getCategoryCount   = (cat: string) => cat === 'All' ? vendors.length : vendorsWithSubcats.filter(v => v.category === cat).length
  const newVendors         = vendorsWithSubcats.filter(isNewVendor)

  const filtered = vendorsWithSubcats.filter(v => {
    const q           = search.toLowerCase()
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.services?.toLowerCase().includes(q) || v.instagram?.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
    const matchCat    = category === '__discounts__' ? !!v.discount_code : category === 'All' || v.category === category
    const dbLoc       = Object.entries(DB_LOCATION_MAP).find(([, label]) => label === location)?.[0]
    const matchLoc    = location === 'All' || v.location === dbLoc
    const matchNew    = !showNewOnly || isNewVendor(v)
    const matchType   = category !== 'Outfits' || weddingType === 'All' || v.wedding_type === weddingType || v.wedding_type === 'Both'
    return matchSearch && matchCat && matchLoc && matchNew && matchType
  })

  const sorted     = [...filtered].sort((a, b) => (FEATURED_VENDORS.includes(a.name) ? 0 : 1) - (FEATURED_VENDORS.includes(b.name) ? 0 : 1))
  const emptyStats: VendorStats = { avgRating: null, usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>

      <div style={{ background: 'var(--hero-grad)' }}>
        <div style={{ textAlign: 'center', padding: 'clamp(32px, 5vw, 48px) clamp(20px, 4vw, 40px) clamp(28px, 4vw, 36px)', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
            <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          </div>
          <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 10, fontFamily: 'var(--font-jost, sans-serif)' }}>
            Wedding &amp; Event Vendors
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 6px' }}>
            Jaiye
          </h1>
          <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--text-pill)', marginBottom: 18, fontFamily: 'var(--font-jost, sans-serif)' }}>
            Directory
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-pill)', letterSpacing: '0.04em', fontWeight: 400, margin: '0 0 5px', fontFamily: 'var(--font-jost, sans-serif)' }}>
            Your guide to the best Nigerian wedding and event vendors
          </p>
          <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.06em', fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>
            200+ vendors
          </div>
          <div style={{ marginTop: 26, height: 1, background: `linear-gradient(to right, transparent, var(--accent) 30%, var(--accent) 70%, transparent)`, opacity: 0.4 }} />
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)', borderBottom: '1px solid var(--border)', transition: 'background 0.2s ease' }}>
        <div style={{ padding: '10px 16px 0', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10 }}>
              {categories.map(cat => {
                const isActive = category === cat
                const colour   = cat === 'All' ? 'var(--text)' : getColour(cat)
                return (
                  <button key={cat} onClick={() => { setCategory(cat); setWeddingType('All') }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 11px', borderRadius: 20, flexShrink: 0,
                    border: `1px solid ${isActive ? colour : 'var(--border)'}`,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    background: isActive ? colour : 'var(--bg-card)',
                    color: isActive ? '#fff' : 'var(--text-pill)',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-jost, sans-serif)', lineHeight: 1,
                  }}>
                    <span style={{ fontSize: 11 }}>{cat === 'All' ? '✦' : getEmoji(cat)}</span>
                    <span>{cat}</span>
                    <span style={{ fontSize: 10, opacity: 0.55 }}>{getCategoryCount(cat)}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 10, width: 40, pointerEvents: 'none', background: 'linear-gradient(to right, transparent, var(--bg) 80%)' }} />
          </div>

          {category === 'Outfits' && (
            <div style={{ display: 'flex', gap: 6, paddingBottom: 8 }}>
              {['All', 'White Wedding', 'Traditional'].map(type => (
                <button key={type} onClick={() => setWeddingType(type)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 11px', borderRadius: 20, flexShrink: 0,
                  border: `1px solid ${weddingType === type ? '#D97706' : 'var(--border)'}`,
                  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12, lineHeight: 1,
                  fontWeight: weddingType === type ? 600 : 400,
                  background: weddingType === type ? '#D97706' : 'var(--bg-card)',
                  color: weddingType === type ? '#fff' : 'var(--text-pill)',
                  transition: 'all 0.15s ease', fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  {type === 'White Wedding' ? '🤍' : type === 'Traditional' ? '👘' : '✦'} {type}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, paddingBottom: 10 }}>
            <button onClick={() => { setCategory(category === '__discounts__' ? 'All' : '__discounts__'); setWeddingType('All') }} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 11px', borderRadius: 20,
              border: `1px solid ${category === '__discounts__' ? 'var(--text)' : 'var(--border)'}`,
              cursor: 'pointer', fontSize: 12, lineHeight: 1,
              fontWeight: category === '__discounts__' ? 600 : 400,
              background: category === '__discounts__' ? 'var(--text)' : 'var(--bg-card)',
              color: category === '__discounts__' ? 'var(--accent-light)' : 'var(--text-pill)',
              fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.15s ease',
            }}>
              🏷️ Discounts
              <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>{vendors.filter(v => v.discount_code).length}</span>
            </button>

            {newVendors.length > 0 && (
              <button onClick={() => setShowNewOnly(!showNewOnly)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 11px', borderRadius: 20,
                border: `1px solid ${showNewOnly ? 'var(--text)' : 'var(--border)'}`,
                cursor: 'pointer', fontSize: 12, lineHeight: 1,
                fontWeight: showNewOnly ? 600 : 400,
                background: showNewOnly ? 'var(--text)' : 'var(--bg-card)',
                color: showNewOnly ? 'var(--bg)' : 'var(--text-pill)',
                fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.15s ease',
              }}>
                🆕 New this week
                <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 2 }}>{newVendors.length}</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '0 16px 10px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.2"/>
              <path d="M10 10l2 2" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search vendors…"
              value={search}
              maxLength={LIMITS.search}
              onChange={e => setSearch(sanitizeSearch(e.target.value))}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-jost, sans-serif)' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>}
          </div>
          <select value={location} onChange={e => setLocation(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', fontSize: 12, color: 'var(--text-pill)', cursor: 'pointer', outline: 'none', flexShrink: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>
            {LOCATION_ORDER.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 18px 2px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>{sorted.length} vendors</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px 52px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 14 }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 100, opacity: 0.3, border: '1px solid var(--border)' }} />
            ))
          : sorted.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '52px 16px' }}>
                <div style={{ fontSize: 36 }}>🔍</div>
                <p style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>No vendors found.</p>
                <button onClick={() => { setSearch(''); setCategory('All'); setLocation('All'); setShowNewOnly(false); setWeddingType('All') }}
                  style={{ marginTop: 8, padding: '6px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-jost, sans-serif)' }}>
                  Show all
                </button>
              </div>
            )
            : sorted.map(v => (
              <VendorCard
                key={v.id} v={v} isNew={isNewVendor(v)} resetKey={cardResetKey}
                currentUser={currentUser} savedIds={savedIds}
                onToggleSave={handleToggleSave} onOpenAuth={openAuthModal}
                followSavers={followSaverMap[v.id] || []}
                stats={vendorStats[v.id] || emptyStats}
                onStatChange={handleStatChange}
              />
            ))
        }
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides &amp; families
      </footer>
    </main>
  )
}
