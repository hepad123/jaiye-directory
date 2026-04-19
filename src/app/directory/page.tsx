'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import { sanitizeSearch, safeVendorUrl, LIMITS } from '@/lib/sanitize'

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
  occasions?: string[]
}

type VendorReview = {
  id: string
  clerk_user_id: string
  reviewer_name: string
  rating_experience: number
  rating_quality: number
  comment: string | null
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

type SortMode = 'most_used' | 'most_rec'

const CATEGORY_ACCENT = '#B4690E'

const OCCASION_TABS = [
  { key: 'weddings',      label: 'Weddings' },
  { key: 'birthdays',     label: 'Birthdays' },
  { key: 'corporate',     label: 'Corporate' },
  { key: 'celebrations',  label: 'Celebrations' },
  { key: 'babyshower',    label: 'Baby Showers' },
  { key: 'naming',        label: 'Naming Ceremonies' },
]

const OCCASION_CATEGORIES: Record<string, string[]> = {
  weddings:     ['Event Planning', 'Outfits', 'Styling', 'Makeup', 'Hair & Gele', 'Photography', 'Videography & Content', 'Decor & Venue', 'Catering', 'Entertainment', 'Accessories'],
  birthdays:    ['Event Planning', 'Decor & Venue', 'Catering', 'Entertainment', 'Photography', 'Videography & Content'],
  corporate:    ['Event Planning', 'Decor & Venue', 'Catering', 'Photography', 'Videography & Content'],
  celebrations: ['Event Planning', 'Decor & Venue', 'Catering', 'Entertainment', 'Photography', 'Videography & Content', 'Makeup'],
  babyshower:   ['Event Planning', 'Decor & Venue', 'Catering', 'Photography'],
  naming:       ['Event Planning', 'Decor & Venue', 'Catering', 'Entertainment', 'Photography', 'Outfits', 'Hair & Gele', 'Makeup'],
}

const WEDDING_TYPE_CATS = ['Outfits', 'Styling', 'Accessories']

const CATEGORY_META: Record<string, { colour: string }> = {
  'Event Planning':        { colour: '#6366F1' },
  'Styling':               { colour: '#0D9488' },
  'Outfits':               { colour: '#D97706' },
  'Makeup':                { colour: '#DB2777' },
  'Hair & Gele':           { colour: '#EA580C' },
  'Photography':           { colour: '#2563EB' },
  'Videography & Content': { colour: '#78716C' },
  'Decor & Venue':         { colour: '#92400E' },
  'Catering':              { colour: '#C2410C' },
  'Entertainment':         { colour: '#7C3AED' },
  'Accessories':           { colour: '#B45309' },
}

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'

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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} style={{ cursor: 'pointer', fontSize: 20, color: s <= (hover || value) ? '#D97706' : 'var(--border)', transition: 'color 0.1s' }}>&#9733;</span>
      ))}
    </div>
  )
}

function ReviewSection({ vendorId, currentUser, manrope, newsreader }: {
  vendorId: string
  currentUser: CurrentUser | null
  manrope: string
  newsreader: string
}) {
  const supabase = useSupabase()
  const { openSignIn } = useClerk()
  const [open, setOpen] = useState(false)
  const [reviews, setReviews] = useState<VendorReview[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState(false)
  const [ratingExp, setRatingExp] = useState(0)
  const [ratingQual, setRatingQual] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const myReview = reviews.find(r => r.clerk_user_id === currentUser?.id) || null
  const otherReviews = reviews.filter(r => r.clerk_user_id !== currentUser?.id)
  const allOtherReviews = showAll ? otherReviews : otherReviews.slice(0, 3)
  const hasMore = otherReviews.length > 3

  useEffect(() => {
    if (!open || loaded) return
    setLoading(true)
    supabase.from('vendor_reviews')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoaded(true)
        setLoading(false)
      })
  }, [open, vendorId, loaded])

  function startEdit() {
    if (myReview) {
      setRatingExp(myReview.rating_experience)
      setRatingQual(myReview.rating_quality)
      setComment(myReview.comment || '')
    } else {
      setRatingExp(0); setRatingQual(0); setComment('')
    }
    setEditing(true)
  }

  async function handleSubmit() {
    if (!currentUser) { openSignIn(); return }
    if (ratingExp === 0 || ratingQual === 0) return
    setSubmitting(true)
    const payload = {
      vendor_id: vendorId,
      clerk_user_id: currentUser.id,
      reviewer_name: currentUser.name,
      rating_experience: ratingExp,
      rating_quality: ratingQual,
      comment: comment.trim() || null,
    }
    const { data, error } = await supabase.from('vendor_reviews').upsert(payload, { onConflict: 'vendor_id,clerk_user_id' }).select()
    if (!error && data) {
      setReviews(prev => { const without = prev.filter(r => r.clerk_user_id !== currentUser.id); return [data[0], ...without] })
      setEditing(false)
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!currentUser || !myReview) return
    setDeleting(true)
    await supabase.from('vendor_reviews').delete().eq('id', myReview.id)
    setReviews(prev => prev.filter(r => r.id !== myReview.id))
    setEditing(false); setDeleting(false)
  }

  const totalCount = loaded ? reviews.length : null
  const avgExp = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating_experience, 0) / reviews.length).toFixed(1) : null
  const avgQual = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating_quality, 0) / reviews.length).toFixed(1) : null

  return (
    <div style={{ marginTop: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1, flexShrink: 0 }}>{open ? '-' : '+'}</span>
        <span>Reviews{totalCount !== null ? ' (' + totalCount + ')' : ''}</span>
        {avgExp && !open && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope, textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
            {'\u00b7'} Exp {avgExp}&#9733; Q {avgQual}&#9733;
          </span>
        )}
      </button>

      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope, textAlign: 'center', padding: '8px 0' }}>Loading...</p>}

          {loaded && avgExp && (
            <div style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>Avg Experience: <span style={{ color: '#D97706', fontWeight: 600 }}>{avgExp}&#9733;</span></span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>Avg Quality: <span style={{ color: '#D97706', fontWeight: 600 }}>{avgQual}&#9733;</span></span>
            </div>
          )}

          {loaded && !editing && !myReview && currentUser && (
            <button onClick={startEdit} style={{ width: '100%', padding: '8px', background: CATEGORY_ACCENT + '10', border: '1px dashed ' + CATEGORY_ACCENT, borderRadius: 10, fontSize: 11, color: CATEGORY_ACCENT, fontWeight: 600, cursor: 'pointer', fontFamily: manrope }}>
              + Write a review
            </button>
          )}
          {loaded && !editing && !currentUser && (
            <button onClick={() => openSignIn()} style={{ width: '100%', padding: '8px', background: 'var(--bg-pill)', border: '1px dashed var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: manrope }}>
              Sign in to leave a review
            </button>
          )}

          {editing && (
            <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: manrope }}>Customer Experience</div>
                  <StarPicker value={ratingExp} onChange={setRatingExp} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: manrope }}>Quality of Output</div>
                  <StarPicker value={ratingQual} onChange={setRatingQual} />
                </div>
                <textarea placeholder="Share your experience (optional)..." value={comment} onChange={e => setComment(e.target.value)} rows={3} maxLength={500} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, background: '#fff', color: 'var(--text)', padding: '8px 10px', resize: 'none' as const, outline: 'none', fontFamily: manrope, boxSizing: 'border-box' as const, lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleSubmit} disabled={submitting || ratingExp === 0 || ratingQual === 0} style={{ padding: '7px 18px', background: ratingExp > 0 && ratingQual > 0 ? CATEGORY_ACCENT : 'var(--bg-pill)', color: ratingExp > 0 && ratingQual > 0 ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: ratingExp > 0 && ratingQual > 0 ? 'pointer' : 'default', fontFamily: manrope, transition: 'all 0.15s' }}>
                    {submitting ? 'Saving...' : myReview ? 'Update' : 'Submit'}
                  </button>
                  <button onClick={() => setEditing(false)} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: manrope }}>Cancel</button>
                  {myReview && (
                    <button onClick={handleDelete} disabled={deleting} style={{ padding: '7px 14px', background: 'none', border: '1px solid #DC2626', borderRadius: 20, fontSize: 11, color: '#DC2626', cursor: 'pointer', fontFamily: manrope, marginLeft: 'auto' }}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {loaded && !editing && myReview && (
            <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: CATEGORY_ACCENT, fontFamily: manrope }}>Your review</span>
                <button onClick={startEdit} style={{ fontSize: 10, color: CATEGORY_ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: manrope }}>Edit</button>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: myReview.comment ? 4 : 0 }}>
                <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: manrope }}>Exp: <span style={{ color: '#D97706' }}>{'★'.repeat(myReview.rating_experience)}</span><span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - myReview.rating_experience)}</span></span>
                <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: manrope }}>Quality: <span style={{ color: '#D97706' }}>{'★'.repeat(myReview.rating_quality)}</span><span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - myReview.rating_quality)}</span></span>
              </div>
              {myReview.comment && <p style={{ fontSize: 11, color: 'var(--text)', margin: 0, lineHeight: 1.5, fontFamily: manrope }}>{myReview.comment}</p>}
            </div>
          )}

          {loaded && otherReviews.length === 0 && !myReview && !editing && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope, textAlign: 'center', padding: '4px 0' }}>No reviews yet {'\u2014'} be the first!</p>
          )}

          {loaded && allOtherReviews.map(r => (
            <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: newsreader }}>{r.reviewer_name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: r.comment ? 4 : 0 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>Exp: <span style={{ color: '#D97706' }}>{'★'.repeat(r.rating_experience)}</span><span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - r.rating_experience)}</span></span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>Quality: <span style={{ color: '#D97706' }}>{'★'.repeat(r.rating_quality)}</span><span style={{ color: 'var(--border)' }}>{'★'.repeat(5 - r.rating_quality)}</span></span>
              </div>
              {r.comment && <p style={{ fontSize: 11, color: 'var(--text)', margin: 0, lineHeight: 1.5, fontFamily: manrope }}>{r.comment}</p>}
            </div>
          ))}

          {loaded && hasMore && (
            <button onClick={() => setShowAll(o => !o)} style={{ width: '100%', padding: '7px', background: 'none', border: '1px solid var(--border)', borderRadius: 20, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              {showAll ? 'Show less' : 'Show all ' + otherReviews.length + ' reviews'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CategoryDropdown({ occasion, selectedCats, setSelectedCats, weddingType, setWeddingType, manrope }: {
  occasion: string
  selectedCats: string[]
  setSelectedCats: (c: string[]) => void
  weddingType: string
  setWeddingType: (t: string) => void
  manrope: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const availableCats = OCCASION_CATEGORIES[occasion] || []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const toggle = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter(c => c !== cat))
    } else {
      setSelectedCats([...selectedCats, cat])
    }
  }

  const label = selectedCats.length === 0
    ? 'All Vendors'
    : selectedCats.length === 1
      ? selectedCats[0]
      : selectedCats.length + ' Categories'

  const isFiltered = selectedCats.length > 0

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 220, maxHeight: 380, overflowY: 'auto' }}>
          <button onClick={() => { setSelectedCats([]); setWeddingType('All') }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: selectedCats.length === 0 ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: selectedCats.length === 0 ? 700 : 400, color: selectedCats.length === 0 ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer' }}>
            All Vendors
            {selectedCats.length === 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
          </button>
          {availableCats.map(cat => (
            <div key={cat}>
              <button onClick={() => toggle(cat)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: selectedCats.includes(cat) ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: selectedCats.includes(cat) ? 700 : 400, color: selectedCats.includes(cat) ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (!selectedCats.includes(cat)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (!selectedCats.includes(cat)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                {cat}
                {selectedCats.includes(cat) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              {selectedCats.includes(cat) && WEDDING_TYPE_CATS.includes(cat) && occasion === 'weddings' && (
                <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {['All', 'White Wedding', 'Traditional'].map(type => (
                    <button key={type} onClick={() => setWeddingType(type)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '7px 16px 7px 28px', background: weddingType === type ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 11, fontFamily: manrope, fontWeight: weddingType === type ? 700 : 400, color: weddingType === type ? CATEGORY_ACCENT : 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (weddingType !== type) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (weddingType !== type) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      {type === 'All' ? 'All styles' : type}
                      {weddingType === type && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
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

function SortDropdown({ sortMode, setSortMode, manrope }: { sortMode: SortMode; setSortMode: (s: SortMode) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const options: { key: SortMode; label: string }[] = [
    { key: 'most_rec',  label: 'Most Recommended' },
    { key: 'most_used', label: 'Most Used' },
  ]
  const currentLabel = options.find(o => o.key === sortMode)?.label || 'Sort'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: CATEGORY_ACCENT, color: '#fff', fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
        {currentLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 200, overflow: 'hidden' }}>
          {options.map(o => (
            <button key={o.key} onClick={() => { setSortMode(o.key); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: sortMode === o.key ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: sortMode === o.key ? 700 : 400, color: sortMode === o.key ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (sortMode !== o.key) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (sortMode !== o.key) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {o.label}
              {sortMode === o.key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
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
        {v.verified && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: manrope }}>Verified</div>}
        {isNew      && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: manrope }}>New</div>}
      </div>

      <button onClick={() => { if (!currentUser) { onOpenAuth(); return }; onToggleSave(v.id) }} style={{ position: 'absolute', top: saverLabel ? 38 : 12, right: 12, background: isSaved ? 'var(--accent-light)' : '#fff', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px', paddingTop: (v.verified || isNew) ? (saverLabel ? 52 : 36) : (saverLabel ? 18 : 14) }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: colour, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4, fontFamily: manrope }}>{v.category}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: newsreader }}>{v.name}</div>

        {(avgRating !== null || usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: manrope }}>&#9733; {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{usedCount} used &#128075;</span>}
            {recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{recCount} rec &#11088;</span>}
          </div>
        )}

        {v.location   && <div style={{ fontSize: 11, color: '#92400E', fontWeight: 500, marginBottom: 3, fontFamily: manrope }}>&#128205; {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, marginBottom: 3, fontFamily: manrope }}>From &#8358;{v.price_from}</div>}

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
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
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--text)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: manrope }}>&#127991; {v.discount_code}</span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: copied ? 'var(--accent-light)' : '#fff', fontSize: 10, color: copied ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: manrope }}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hasDetails && (
            <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
              {expanded ? 'Less info' : 'More info'}
            </button>
          )}

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 }}>
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
                  &#128075; {hasUsed ? 'Used this' : 'I used this vendor'}{usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> {'\u00b7'} {usedCount}</span>}
                </button>
              </div>
              <div>
                <button onClick={toggleRecommend} disabled={recSubmitting} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : '#fff', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)', opacity: recSubmitting ? 0.6 : 1 }}>
                  &#11088; {hasRec ? 'Recommended' : 'I recommend this'}{recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> {'\u00b7'} {recCount}</span>}
                </button>
              </div>
            </div>
          )}

          <ReviewSection vendorId={v.id} currentUser={currentUser} manrope={manrope} newsreader={newsreader} />
        </div>
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
  const [occasion, setOccasion] = useState('weddings')
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [weddingType, setWeddingType] = useState('All')
  const [location, setLocation] = useState('All')
  const [subLocation, setSubLocation] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('most_rec')
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
    const occ = params.get('occasion')
    if (occ && OCCASION_TABS.find(t => t.key === occ)) setOccasion(occ)
  }, [])

  useEffect(() => {
    setSelectedCats([])
    setWeddingType('All')
    setCardResetKey(k => k + 1)
  }, [occasion])

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
      .then(({ data }) => { if (data) setSavedIds(new Set(data.map((r: { vendor_id: string }) => r.vendor_id))) })
  }, [authUser])

  useEffect(() => {
    if (!authUser?.id) { setFollowSaverMap({}); return }
    async function loadFollowContext() {
      const { data: followRows } = await supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', authUser!.id)
      if (!followRows || followRows.length === 0) { setFollowSaverMap({}); return }
      const followingIds = followRows.map((r: { clerk_following_id: string }) => r.clerk_following_id)
      const { data: profiles } = await supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followingIds)
      if (!profiles || profiles.length === 0) { setFollowSaverMap({}); return }
      const profileMap: Record<string, FollowProfile> = {}
      profiles.forEach((p: { clerk_user_id: string; display_name: string; username: string; avatar_url?: string }) => { profileMap[p.clerk_user_id] = { ...p, id: p.clerk_user_id } })
      const { data: savedRows } = await supabase.from('saved_vendors').select('vendor_id, clerk_user_id').in('clerk_user_id', followingIds)
      if (!savedRows || savedRows.length === 0) { setFollowSaverMap({}); return }
      const map: Record<string, FollowProfile[]> = {}
      savedRows.forEach((row: { vendor_id: string; clerk_user_id: string }) => {
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
      const [vendorsRes, recsRes, usedRes] = await Promise.all([
        supabase.from('vendors').select('*'),
        supabase.from('vendor_recommendations').select('vendor_id, clerk_user_id'),
        supabase.from('vendor_used').select('vendor_id, clerk_user_id'),
      ])
      const allVendors = vendorsRes.data || []
      const allRecs    = recsRes.data    || []
      const allUsed    = usedRes.data    || []
      const mapped = allVendors.map((v: Vendor) => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
      setVendors(mapped)
      const stats: Record<string, VendorStats> = {}
      mapped.forEach((v: Vendor) => {
        const vendorRecs = allRecs.filter((r: { vendor_id: string }) => r.vendor_id === v.id)
        const vendorUsed = allUsed.filter((r: { vendor_id: string }) => r.vendor_id === v.id)
        stats[v.id] = {
          avgRating: null,
          usedCount: vendorUsed.length,
          recCount:  vendorRecs.length,
          hasUsed:   authUser?.id ? vendorUsed.some((r: { clerk_user_id: string }) => r.clerk_user_id === authUser.id) : false,
          hasRec:    authUser?.id ? vendorRecs.some((r: { clerk_user_id: string }) => r.clerk_user_id === authUser.id) : false,
        }
      })
      setVendorStats(stats)
      setLoading(false)
    }
    loadAll()
  }, [authUser])

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

  const occasionCats = OCCASION_CATEGORIES[occasion] || []

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.services?.toLowerCase().includes(q) || v.instagram?.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
    const matchOccasion = occasionCats.includes(v.category)
    const matchCat = selectedCats.length === 0 || selectedCats.includes(v.category)
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
    const matchWeddingType = (() => {
      if (weddingType === 'All') return true
      if (!WEDDING_TYPE_CATS.includes(v.category)) return true
      return v.wedding_type === weddingType || v.wedding_type === 'Both'
    })()
    return matchSearch && matchOccasion && matchCat && matchLoc && matchWeddingType
  })

  const sorted = [...filtered].sort((a, b) => {
    const aStats = vendorStats[a.id] || { recCount: 0, usedCount: 0 }
    const bStats = vendorStats[b.id] || { recCount: 0, usedCount: 0 }
    if (sortMode === 'most_rec')  return bStats.recCount  - aStats.recCount
    if (sortMode === 'most_used') return bStats.usedCount - aStats.usedCount
    return 0
  })

  const currentTab = OCCASION_TABS.find(t => t.key === occasion)
  const emptyStats: VendorStats = { avgRating: null, usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }

  return (
    <main style={{ fontFamily: manrope, background: '#fff8f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.15} } .hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      <div style={{ width: '100%', height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src="/pexels-directory-hero.jpg" alt="Directory" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15,10,5,0.7) 0%, transparent 100%)', padding: '24px 24px 16px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontFamily: manrope, fontWeight: 600, marginBottom: 4 }}>Events Directory</div>
          <div style={{ fontFamily: newsreader, fontSize: 28, fontWeight: 700, color: '#fff' }}>{currentTab?.label || 'Weddings'}</div>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff8f5', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {OCCASION_TABS.map(tab => {
            const isActive = occasion === tab.key
            return (
              <button key={tab.key} onClick={() => setOccasion(tab.key)} style={{ padding: '18px 20px', background: 'none', border: 'none', borderBottom: isActive ? '2px solid ' + CATEGORY_ACCENT : '2px solid transparent', color: isActive ? CATEGORY_ACCENT : 'var(--text-muted)', fontFamily: manrope, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.2"/><path d="M10 10l2 2" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Search vendors..." value={search} maxLength={LIMITS.search} onChange={e => setSearch(sanitizeSearch(e.target.value))} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: 'var(--text)', fontFamily: manrope }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>x</button>}
          </div>
          <CategoryDropdown occasion={occasion} selectedCats={selectedCats} setSelectedCats={setSelectedCats} weddingType={weddingType} setWeddingType={setWeddingType} manrope={manrope} />
          <LocationDropdown location={location} subLocation={subLocation} setLocation={setLocation} setSubLocation={setSubLocation} manrope={manrope} />
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <SortDropdown sortMode={sortMode} setSortMode={setSortMode} manrope={manrope} />
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
                <button onClick={() => { setSearch(''); setSelectedCats([]); setLocation('All'); setSubLocation(''); setWeddingType('All') }} style={{ marginTop: 8, padding: '6px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: manrope }}>
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
