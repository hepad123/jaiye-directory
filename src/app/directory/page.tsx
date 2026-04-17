'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
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
  avatar_url?: string
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

const CATEGORY_ORDER = [
  'All', 'Event Planning', 'Outfits',
  'Styling', 'Makeup', 'Hair & Gele', 'Photography', 'Videography & Content',
]

const CATEGORY_ACCENT = '#B4690E'

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const isNewVendor = (v: Vendor) => {
  if (!v.created_at) return false
  const created = new Date(v.created_at)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return created > weekAgo
}

function InstagramIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'var(--accent)' : 'var(--border)'} strokeWidth="2" style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)} style={{ cursor: onRate ? 'pointer' : 'default', color: s <= rating ? 'var(--accent)' : 'var(--border)', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

function ReviewSection({ vendor, currentUser, onOpenAuth }: { vendor: Vendor; currentUser: CurrentUser | null; onOpenAuth: () => void }) {
  const supabase = useSupabase()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const manrope = "'Manrope', var(--font-jost, sans-serif)"

  useEffect(() => {
    if (!loaded) return
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id, loaded])

  async function submitReview() {
    if (!currentUser) return
    if (!isValidRating(rating)) return
    const cleanComment = sanitizeReviewComment(comment)
    if (cleanComment.length > LIMITS.reviewComment) return
    setSubmitting(true)
    const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendor.id, reviewer_name: currentUser.name, rating, comment: cleanComment }) })
    const { data } = await res.json()
    if (data) { setReviews(prev => [data[0], ...prev]); setRating(0); setComment(''); setShowForm(false) }
    setSubmitting(false)
  }

  const realReviews = reviews.filter(r => r.comment !== '__used__')

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, fontFamily: manrope }}>{loaded ? (realReviews.length > 0 ? realReviews.length + ' review' + (realReviews.length !== 1 ? 's' : '') : 'No reviews yet') : 'Reviews'}</span>
        <button onClick={() => { if (!currentUser) { onOpenAuth(); return }; setLoaded(true); setShowForm(f => !f) }} style={{ fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: manrope }}>{showForm ? 'Cancel' : '+ Add review'}</button>
      </div>
      {showForm && (
        <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <div style={{ marginBottom: 6 }}><StarRating rating={rating} onRate={setRating} /></div>
          <textarea placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} rows={2} maxLength={LIMITS.reviewComment} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, background: 'var(--bg)', color: 'var(--text)', padding: '6px 10px', marginBottom: 6, boxSizing: 'border-box' as const, resize: 'none' as const, fontFamily: manrope, outline: 'none' }} />
          <button onClick={submitReview} disabled={submitting || rating === 0} style={{ padding: '5px 14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: rating === 0 ? 0.45 : 1, fontFamily: manrope }}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      )}
      {loaded && realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', fontFamily: manrope }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && <p style={{ fontSize: 10, color: 'var(--text-pill)', margin: '3px 0 0', lineHeight: 1.4, fontFamily: manrope }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  )
}

function LocationDropdown({ location, subLocation, setLocation, setSubLocation, manrope }: { location: string; subLocation: string; setLocation: (l: string) => void; setSubLocation: (s: string) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const topLevel = ['All', 'Lagos', 'Abuja']
  const lagosAreas = ['All Lagos', 'Lekki', 'Victoria Island', 'Ikoyi']
  const isFiltered = location !== 'All'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const label = location === 'All' ? 'All Locations' : subLocation !== 'All Lagos' && subLocation !== '' ? subLocation : location

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 180, overflow: 'hidden' }}>
          {topLevel.map(l => (
            <div key={l}>
              <button onClick={() => { setLocation(l); setSubLocation(l === 'Lagos' ? 'All Lagos' : ''); if (l !== 'Lagos') setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: location === l ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: location === l ? 700 : 400, color: location === l ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (location !== l) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (location !== l) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                {l === 'All' ? 'All Locations' : l}
                {l === 'Lagos' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
              {l === 'Lagos' && location === 'Lagos' && (
                <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {lagosAreas.map(area => (
                    <button key={area} onClick={() => { setSubLocation(area); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px 8px 28px', background: subLocation === area ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 11, fontFamily: manrope, fontWeight: subLocation === area ? 700 : 400, color: subLocation === area ? CATEGORY_ACCENT : 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (subLocation !== area) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (subLocation !== area) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      {area}
                      {subLocation === area && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VendorCard({ v, isNew, resetKey, currentUser, savedIds, onToggleSave, onOpenAuth, followSavers, stats, onStatChange }: {
  v: Vendor; isNew: boolean; resetKey: number; currentUser: CurrentUser | null
  savedIds: Set<string>; onToggleSave: (vendorId: string) => void
  onOpenAuth: () => void; followSavers: FollowProfile[]
  stats: VendorStats; onStatChange: (vendorId: string, patch: Partial<VendorStats>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [usedSubmitting, setUsedSubmitting] = useState(false)
  const [recSubmitting, setRecSubmitting] = useState(false)
  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"

  useEffect(() => { setExpanded(false) }, [resetKey])

  const colour = getColour(v.category)
  const igHandle = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website
  const isSaved = savedIds.has(v.id)
  const { avgRating, usedCount, recCount, hasUsed, hasRec } = stats

  async function toggleUsed() {
    if (!currentUser) { onOpenAuth(); return }
    if (usedSubmitting) return
    setUsedSubmitting(true)
    if (hasUsed) {
      await fetch('/api/interactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: v.id, type: 'used' }) })
      onStatChange(v.id, { usedCount: Math.max(0, usedCount - 1), hasUsed: false })
    } else {
      await fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: v.id, type: 'used' }) })
      onStatChange(v.id, { usedCount: usedCount + 1, hasUsed: true })
    }
    setUsedSubmitting(false)
  }

  async function toggleRecommend() {
    if (!currentUser) { onOpenAuth(); return }
    if (recSubmitting) return
    setRecSubmitting(true)
    if (hasRec) {
      await fetch('/api/interactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: v.id, type: 'recommend' }) })
      onStatChange(v.id, { recCount: Math.max(0, recCount - 1), hasRec: false })
    } else {
      await fetch('/api/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: v.id, type: 'recommend' }) })
      onStatChange(v.id, { recCount: recCount + 1, hasRec: true })
    }
    setRecSubmitting(false)
  }

  function copyCode() { navigator.clipboard.writeText(v.discount_code); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const whatsappNumber = v.phone?.replace(/\D/g, '')
  const whatsappUrl = whatsappNumber ? 'https://wa.me/' + whatsappNumber : null

  const followSaverLabel = () => {
    if (followSavers.length === 0) return null
    const names = followSavers.map(p => p.display_name.split(' ')[0])
    if (names.length === 1) return names[0] + ' saved this'
    if (names.length === 2) return names[0] + ' & ' + names[1] + ' saved this'
    return names[0] + ', ' + names[1] + ' +' + (names.length - 2) + ' saved this'
  }

  const saverLabel = followSaverLabel()
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: manrope, border: '1px solid var(--border)' }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 4px rgba(28,25,23,0.06)' }}>
      {saverLabel && (
        <div style={{ background: colour + '0D', borderBottom: '1px solid ' + colour + '20', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex' }}>
            {followSavers.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ width: 18, height: 18, borderRadius: '50%', background: colour + '25', border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: colour, marginLeft: i > 0 ? -5 : 0, fontFamily: manrope }}>
                {p.display_name[0].toUpperCase()}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 10, color: colour, fontWeight: 600, fontFamily: manrope }}>{saverLabel}</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: saverLabel ? 38 : 12, left: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {isFeatured && <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'var(--gold)', fontFamily: manrope }}>Top pick</div>}
        {v.verified  && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: manrope }}>Verified</div>}
        {isNew       && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: manrope }}>New</div>}
      </div>

      <button onClick={() => { if (!currentUser) { onOpenAuth(); return }; onToggleSave(v.id) }} style={{ position: 'absolute', top: saverLabel ? 38 : 12, right: 12, background: isSaved ? 'var(--accent-light)' : '#fff', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px', paddingTop: (isFeatured || v.verified || isNew) ? (saverLabel ? 52 : 36) : (saverLabel ? 18 : 14) }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: colour, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4, fontFamily: manrope }}>
          {v.category}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: newsreader }}>
          {v.name}
        </div>

        {(avgRating !== null || usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: manrope }}>&#9733; {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{usedCount} used &#128075;</span>}
{recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{recCount} rec &#11088;</span>}
          </div>
        )}

        {v.location   && <div style={{ fontSize: 11, color: '#92400E', fontWeight: 500, marginBottom: 3, fontFamily: manrope }}>&#128205; {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, marginBottom: 3, fontFamily: manrope }}>From &#8358;{v.price_from}</div>}

        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
  {igHandle && (
    <a href={'https://instagram.com/' + igHandle} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
      <InstagramIcon />Instagram
    </a>
  )}
  {whatsappUrl && (
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
      <WhatsAppIcon />WhatsApp
    </a>
  )}
</div>

        {v.discount_code && (
          <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--text)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: manrope }}>
              &#127991; {v.discount_code}
            </span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: copied ? 'var(--accent-light)' : '#fff', fontSize: 10, color: copied ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: manrope }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: 'var(--text-pill)', margin: 0, lineHeight: 1.55, fontFamily: manrope }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: manrope }}>&#128222; {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: manrope }}>&#9993; {v.email}</p>}
            {safeVendorUrl(v.website) && (
              <a href={safeVendorUrl(v.website)!} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: manrope }}>&#127760; {v.website}</a>
            )}
            {v.notes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: manrope }}>{v.notes}</p>}

            {followSavers.length > 0 && (
              <div style={{ marginTop: 4, padding: '8px 10px', background: 'var(--bg-pill)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, fontFamily: manrope }}>Saved by people you follow</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {followSavers.map(p => (
                    <Link key={p.id} href={'/profile/' + p.username} style={{ fontSize: 10, color: 'var(--accent)', textDecoration: 'none', background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 9px', fontFamily: manrope }}>@{p.username}</Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 4 }}>
              <button onClick={toggleUsed} disabled={usedSubmitting} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light)' : '#fff', borderColor: hasUsed ? 'var(--gold)' : 'var(--border)', color: hasUsed ? 'var(--gold)' : 'var(--text-muted)', opacity: usedSubmitting ? 0.6 : 1 }}>
  &#128075; {hasUsed ? 'Used this' : 'I used this vendor'}{usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {usedCount}</span>}
</button>
            </div>
            <div style={{ marginTop: 4 }}>
              <button onClick={toggleRecommend} disabled={recSubmitting} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : '#fff', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)', opacity: recSubmitting ? 0.6 : 1 }}>
  &#11088; {hasRec ? 'Recommended' : 'I recommend this'}{recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {recCount}</span>}
</button>
            </div>
            <ReviewSection vendor={v} currentUser={currentUser} onOpenAuth={onOpenAuth} />
          </div>
        )}

        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function DirectoryPage() {
  const supabase = useSupabase()
  const { user: authUser } = useUser()
  const { openSignIn } = useClerk()
  const openAuthModal = () => openSignIn()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [location, setLocation] = useState('All')
  const [subLocation, setSubLocation] = useState('')
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [weddingType, setWeddingType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [cardResetKey, setCardResetKey] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [followSaverMap, setFollowSaverMap] = useState<Record<string, FollowProfile[]>>({})
  const [vendorStats, setVendorStats] = useState<Record<string, VendorStats>>({})

  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('search')
    if (q) setSearch(q)
    const occasion = params.get('occasion')
    if (occasion) setSearch(occasion)
  }, [])

  useEffect(() => {
    if (!authUser?.id) { setCurrentUser(null); return }
    supabase.from('profiles').select('username, display_name').eq('clerk_user_id', authUser.id).maybeSingle()
      .then(({ data }) => {
        const email = authUser.primaryEmailAddress?.emailAddress || ''
        const username = data?.username || email.split('@')[0]
        const displayName = data?.display_name || authUser.fullName || email.split('@')[0]
        setCurrentUser({ id: authUser.id, name: displayName, email, username })
      })
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id) { setSavedIds(new Set()); return }
    supabase.from('saved_vendors').select('vendor_id').eq('clerk_user_id', authUser.id)
      .then(({ data }) => { if (data) setSavedIds(new Set(data.map((r: {vendor_id: string}) => r.vendor_id))) })
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id) { setFollowSaverMap({}); return }
    async function loadFollowContext() {
      const { data: followRows } = await supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', authUser!.id)
      if (!followRows || followRows.length === 0) { setFollowSaverMap({}); return }
      const followingIds = followRows.map((r: {clerk_following_id: string}) => r.clerk_following_id)
      const { data: profiles } = await supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followingIds)
      if (!profiles || profiles.length === 0) { setFollowSaverMap({}); return }
      const profileMap: Record<string, FollowProfile> = {}
      profiles.forEach((p: {clerk_user_id: string; display_name: string; username: string; avatar_url?: string}) => { profileMap[p.clerk_user_id] = { ...p, id: p.clerk_user_id } })
      const { data: savedRows } = await supabase.from('saved_vendors').select('vendor_id, clerk_user_id').in('clerk_user_id', followingIds)
      if (!savedRows || savedRows.length === 0) { setFollowSaverMap({}); return }
      const map: Record<string, FollowProfile[]> = {}
      savedRows.forEach((row: {vendor_id: string; clerk_user_id: string}) => {
        const profile = profileMap[row.clerk_user_id]
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
      const [vendorsRes, reviewsRes, recsRes, usedRes] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('reviews').select('vendor_id, rating, comment, clerk_user_id'),
        supabase.from('vendor_recommendations').select('vendor_id, clerk_user_id'),
        supabase.from('vendor_used').select('vendor_id, clerk_user_id'),
      ])
      const allVendors = vendorsRes.data || []
      const allReviews = reviewsRes.data || []
      const allRecs    = recsRes.data    || []
      const allUsed    = usedRes.data    || []
      setVendors(allVendors)
      const stats: Record<string, VendorStats> = {}
      allVendors.forEach((v: Vendor) => {
        const vendorReviews = allReviews.filter((r: {vendor_id: string; comment: string}) => r.vendor_id === v.id)
        const realReviews   = vendorReviews.filter((r: {comment: string}) => r.comment !== '__used__')
        const vendorRecs    = allRecs.filter((r: {vendor_id: string}) => r.vendor_id === v.id)
        const vendorUsed    = allUsed.filter((r: {vendor_id: string}) => r.vendor_id === v.id)
        const avgRating = realReviews.length > 0
          ? Math.round(realReviews.reduce((s: number, r: {rating: number}) => s + r.rating, 0) / realReviews.length * 10) / 10
          : null
        stats[v.id] = {
          avgRating,
          usedCount: vendorUsed.length,
          recCount:  vendorRecs.length,
          hasUsed:   authUser?.id ? vendorUsed.some((r: {clerk_user_id: string}) => r.clerk_user_id === authUser.id) : false,
          hasRec:    authUser?.id ? vendorRecs.some((r: {clerk_user_id: string}) => r.clerk_user_id === authUser.id) : false,
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
      await fetch('/api/saved', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendorId }) })
    } else {
      await fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendorId }) })
    }
    window.dispatchEvent(new Event('saved-change'))
  }, [authUser, savedIds])

  const handleStatChange = useCallback((vendorId: string, patch: Partial<VendorStats>) => {
    setVendorStats(prev => ({ ...prev, [vendorId]: { ...prev[vendorId], ...patch } }))
  }, [])

  const vendorsWithSubcats = vendors.map(v => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
  const allCats = Array.from(new Set(vendorsWithSubcats.map(v => v.category)))
  const remainingCats = allCats.filter(c => !CATEGORY_ORDER.includes(c)).sort()
  const categories = [...CATEGORY_ORDER.filter(c => c === 'All' || allCats.includes(c)), ...remainingCats]
  const newVendors = vendorsWithSubcats.filter(isNewVendor)

  const filtered = vendorsWithSubcats.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.services?.toLowerCase().includes(q) || v.instagram?.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
    const matchCat = category === '__discounts__' ? !!v.discount_code : category === 'All' || v.category === category
    const matchLoc = (() => {
      if (location === 'All') return true
      if (location === 'Abuja') return v.location?.toLowerCase().includes('abuja')
      if (location === 'Lagos') {
        if (!v.location?.toLowerCase().includes('lagos') && !v.location?.toLowerCase().includes('lekki') && !v.location?.toLowerCase().includes('victoria island') && !v.location?.toLowerCase().includes('ikoyi')) return false
        if (subLocation === 'All Lagos' || subLocation === '') return true
        if (subLocation === 'Lekki') return v.location?.toLowerCase().includes('lekki')
        if (subLocation === 'Victoria Island') return v.location?.toLowerCase().includes('victoria island') || v.location?.toLowerCase().includes('v.i') || v.location?.toLowerCase().includes('vi,')
        if (subLocation === 'Ikoyi') return v.location?.toLowerCase().includes('ikoyi')
      }
      return true
    })()
    const matchNew = !showNewOnly || isNewVendor(v)
    const matchType = category !== 'Outfits' || weddingType === 'All' || v.wedding_type === weddingType || v.wedding_type === 'Both'
    return matchSearch && matchCat && matchLoc && matchNew && matchType
  })

  const sorted = [...filtered].sort((a, b) => (FEATURED_VENDORS.includes(a.name) ? 0 : 1) - (FEATURED_VENDORS.includes(b.name) ? 0 : 1))
  const emptyStats: VendorStats = { avgRating: null, usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }

  return (
    <main style={{ fontFamily: manrope, background: '#fff8f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.15} } .hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      <div style={{ width: '100%', height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src="/pexels-directory-hero.jpg" alt="Directory" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff8f5', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {categories.map(cat => {
            const isActive = category === cat
            const colour = cat === 'All' ? CATEGORY_ACCENT : getColour(cat)
            return (
              <button key={cat} onClick={() => { setCategory(cat); setWeddingType('All') }} style={{ padding: '18px 20px', background: 'none', border: 'none', borderBottom: isActive ? '2px solid ' + CATEGORY_ACCENT : '2px solid transparent', color: isActive ? CATEGORY_ACCENT : 'var(--text-muted)', fontFamily: manrope, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.2"/><path d="M10 10l2 2" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Search vendors..." value={search} maxLength={LIMITS.search} onChange={e => setSearch(sanitizeSearch(e.target.value))} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: 'var(--text)', fontFamily: manrope }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>x</button>}
          </div>
          <LocationDropdown location={location} subLocation={subLocation} setLocation={setLocation} setSubLocation={setSubLocation} manrope={manrope} />
        </div>

        <div style={{ maxWidth: 1200, margin: '8px auto 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setCategory(category === '__discounts__' ? 'All' : '__discounts__')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (category === '__discounts__' ? 'var(--text)' : 'var(--border)'), cursor: 'pointer', fontSize: 11, fontWeight: category === '__discounts__' ? 700 : 500, background: category === '__discounts__' ? 'var(--text)' : 'transparent', color: category === '__discounts__' ? 'var(--accent-light)' : 'var(--text-muted)', fontFamily: manrope, transition: 'all 0.15s', letterSpacing: '0.04em' }}>
            Discounts <span style={{ fontSize: 10, opacity: 0.6 }}>{vendors.filter(v => v.discount_code).length}</span>
          </button>
          {newVendors.length > 0 && (
            <button onClick={() => setShowNewOnly(!showNewOnly)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (showNewOnly ? 'var(--text)' : 'var(--border)'), cursor: 'pointer', fontSize: 11, fontWeight: showNewOnly ? 700 : 500, background: showNewOnly ? 'var(--text)' : 'transparent', color: showNewOnly ? 'var(--bg)' : 'var(--text-muted)', fontFamily: manrope, transition: 'all 0.15s', letterSpacing: '0.04em' }}>
              New this week <span style={{ fontSize: 10, opacity: 0.55 }}>{newVendors.length}</span>
            </button>
          )}
          {category === 'Outfits' && ['All', 'White Wedding', 'Traditional'].map(type => (
            <button key={type} onClick={() => setWeddingType(type)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid ' + (weddingType === type ? CATEGORY_ACCENT : 'var(--border)'), cursor: 'pointer', fontSize: 11, fontWeight: weddingType === type ? 700 : 500, background: weddingType === type ? CATEGORY_ACCENT : 'transparent', color: weddingType === type ? '#fff' : 'var(--text-muted)', fontFamily: manrope, transition: 'all 0.15s', letterSpacing: '0.04em' }}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 16px 2px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0, fontFamily: manrope, letterSpacing: '0.04em' }}>{sorted.length} vendors</p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px 52px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 14 }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, height: 100, opacity: 0.3, border: '1px solid var(--border)' }} />
            ))
          : sorted.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '52px 16px' }}>
                <p style={{ fontFamily: newsreader, fontSize: 22, marginBottom: 8 }}>No vendors found</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: manrope }}>Try adjusting your filters</p>
                <button onClick={() => { setSearch(''); setCategory('All'); setLocation('All'); setSubLocation(''); setShowNewOnly(false); setWeddingType('All') }} style={{ marginTop: 8, padding: '6px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: manrope }}>
                  Show all
                </button>
              </div>
            )
            : sorted.map(v => (
              <VendorCard key={v.id} v={v} isNew={isNewVendor(v)} resetKey={cardResetKey} currentUser={currentUser} savedIds={savedIds} onToggleSave={handleToggleSave} onOpenAuth={openAuthModal} followSavers={followSaverMap[v.id] || []} stats={vendorStats[v.id] || emptyStats} onStatChange={handleStatChange} />
            ))
        }
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, fontFamily: manrope, letterSpacing: '0.04em' }}>
        Made with love for Nigerian brides and families
      </footer>
    </main>
  )
}
