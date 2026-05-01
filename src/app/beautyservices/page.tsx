'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import { useSearchParams } from 'next/navigation'
import SuggestVendorModal from '@/components/SuggestVendorModal'

interface Service {
  id: string
  name: string
  category: string
  subcategories: string[]
  city: string
  location: string | null
  instagram: string | null
  phone: string | null
  price_from: number | null
  bio: string | null
  website: string | null
}

type ServiceStats = {
  usedCount: number
  recCount: number
  hasUsed: boolean
  hasRec: boolean
}

type ServiceReview = {
  id: string
  clerk_user_id: string
  reviewer_name: string
  rating_experience: number
  rating_quality: number
  comment: string | null
  created_at: string
}

const CATEGORIES: Record<string, string[]> = {
  Hair:   ['All', 'Braids', 'Cornrows', 'Natural Hair', 'Ponytail', 'Relaxed Hair', 'Sew In', 'Silk Press', 'Textured Hair', 'Treatment', 'Wigs', 'Weaves', 'Locs', 'Knotless', 'Faux Locs'],
  Makeup: ['All', 'Bridal MUA', 'Glam', 'Editorial', 'Airbrush'],
  Lashes: ['All', 'Extensions', 'Lash Lift', 'Strip Lashes'],
  Nails:  ['All', 'Biab', 'Gel', 'Acrylic'],
  Brows:  ['All'],
}

const SUB_COLOR: Record<string, string> = {
  'Braids': '#7C3AED', 'Wigs': '#DB2777', 'Natural Hair': '#059669', 'Weaves': '#D97706',
  'Locs': '#92400E', 'Knotless': '#6D28D9', 'Faux Locs': '#B45309', 'Bridal MUA': '#BE185D',
  'Glam': '#DC2626', 'Editorial': '#1D4ED8', 'Airbrush': '#0891B2',
  'Extensions': '#7C3AED', 'Lash Lift': '#0D9488', 'Strip Lashes': '#9333EA',
  'Relaxed Hair': '#0284C7', 'Sew In': '#7C2D12', 'Silk Press': '#9D174D',
  'Textured Hair': '#065F46', 'Cornrows': '#0891B2', 'Ponytail': '#6D28D9', 'Treatment': '#065F46',
  'Biab': '#7C3AED', 'Gel': '#0D9488', 'Acrylic': '#DB2777',
}

const CATEGORY_ACCENT = '#B4690E'
const emptyStats: ServiceStats = { usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }
type SortMode = 'most_used' | 'most_rec'

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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
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

function StarPicker({ value, onChange, manrope }: { value: number; onChange: (v: number) => void; manrope: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} style={{ cursor: 'pointer', fontSize: 20, color: s <= (hover || value) ? '#D97706' : 'var(--border)', transition: 'color 0.1s' }}>★</span>
      ))}
    </div>
  )
}

function ReviewSection({ serviceId, currentUserId, displayName, manrope, newsreader }: {
  serviceId: string
  currentUserId: string | null
  displayName: string
  manrope: string
  newsreader: string
}) {
  const supabase = useSupabase()
  const { openSignIn } = useClerk()
  const [open, setOpen] = useState(false)
  const [reviews, setReviews] = useState<ServiceReview[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [editing, setEditing] = useState(false)
  const [ratingExp, setRatingExp] = useState(0)
  const [ratingQual, setRatingQual] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const myReview = reviews.find(r => r.clerk_user_id === currentUserId) || null
  const otherReviews = reviews.filter(r => r.clerk_user_id !== currentUserId)
  const allOtherReviews = showAll ? otherReviews : otherReviews.slice(0, 3)
  const hasMore = otherReviews.length > 3

  useEffect(() => {
    if (!open || loaded) return
    setLoading(true)
    supabase.from('service_reviews')
      .select('*')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoaded(true)
        setLoading(false)
      })
  }, [open, serviceId, loaded])

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
    if (!currentUserId) { openSignIn(); return }
    if (ratingExp === 0 || ratingQual === 0) return
    setSubmitting(true)
    const payload = {
      service_id: serviceId,
      clerk_user_id: currentUserId,
      reviewer_name: displayName,
      rating_experience: ratingExp,
      rating_quality: ratingQual,
      comment: comment.trim() || null,
    }
    const { data, error } = await supabase.from('service_reviews').upsert(payload, { onConflict: 'service_id,clerk_user_id' }).select()
    if (!error && data) {
      setReviews(prev => { const without = prev.filter(r => r.clerk_user_id !== currentUserId); return [data[0], ...without] })
      setEditing(false)
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!currentUserId || !myReview) return
    setDeleting(true)
    await supabase.from('service_reviews').delete().eq('id', myReview.id)
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

          {loaded && !editing && !myReview && currentUserId && (
            <button onClick={startEdit} style={{ width: '100%', padding: '8px', background: CATEGORY_ACCENT + '10', border: '1px dashed ' + CATEGORY_ACCENT, borderRadius: 10, fontSize: 11, color: CATEGORY_ACCENT, fontWeight: 600, cursor: 'pointer', fontFamily: manrope }}>
              + Write a review
            </button>
          )}
          {loaded && !editing && !currentUserId && (
            <button onClick={() => openSignIn()} style={{ width: '100%', padding: '8px', background: 'var(--bg-pill)', border: '1px dashed var(--border)', borderRadius: 10, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontFamily: manrope }}>
              Sign in to leave a review
            </button>
          )}

          {editing && (
            <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: manrope }}>Customer Experience</div>
                  <StarPicker value={ratingExp} onChange={setRatingExp} manrope={manrope} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, fontFamily: manrope }}>Quality of Output</div>
                  <StarPicker value={ratingQual} onChange={setRatingQual} manrope={manrope} />
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

function SortDropdown({ sortMode, setSortMode, manrope }: { sortMode: SortMode; setSortMode: (s: SortMode) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const [interacted, setInteracted] = useState(false)
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
  const currentLabel = interacted ? (options.find(o => o.key === sortMode)?.label || 'Sort') : 'Sort'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: CATEGORY_ACCENT, color: '#fff', fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
        {currentLabel}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 200, overflow: 'hidden' }}>
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

function SubcategoryDropdown({ cat, subs, setSubs, manrope }: { cat: string; subs: string[]; setSubs: (s: string[]) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sorted = CATEGORIES[cat].filter(s => s !== 'All').sort()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const toggle = (s: string) => {
    if (subs.includes(s)) { setSubs(subs.filter(x => x !== s)) } else { setSubs([...subs, s]) }
  }

  const label = subs.length === 0 ? 'All Styles' : subs.length === 1 ? subs[0] : subs.length + ' Styles'
  const isFiltered = subs.length > 0

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 200, maxHeight: 280, overflowY: 'auto' }}>
          <button onClick={() => { setSubs([]); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: subs.length === 0 ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: subs.length === 0 ? 700 : 400, color: subs.length === 0 ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer' }}>
            All Styles
          </button>
          {sorted.map(s => (
            <button key={s} onClick={() => toggle(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: subs.includes(s) ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: subs.includes(s) ? 700 : 400, color: subs.includes(s) ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (!subs.includes(s)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (!subs.includes(s)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {s}
              {subs.includes(s) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CityDropdown({ city, setCity, subCity, setSubCity, manrope }: { city: string; setCity: (c: string) => void; subCity: string; setSubCity: (s: string) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const topLevel = ['All', 'Lagos', 'Abuja', 'London']
  const londonAreas = ['All London', 'North London', 'South London', 'East London', 'West London']

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const isFiltered = city !== 'All'
  const label = city === 'All' ? 'All Locations' : subCity && subCity !== 'All London' ? subCity : city

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 200, overflow: 'hidden' }}>
          {topLevel.map(l => (
            <div key={l}>
              <button onClick={() => { setCity(l); setSubCity(l === 'London' ? 'All London' : ''); if (l !== 'London') setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: city === l ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: city === l ? 700 : 400, color: city === l ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (city !== l) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (city !== l) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                {l === 'All' ? 'All Locations' : l}
                {l === 'London' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
              </button>
              {l === 'London' && city === 'London' && (
                <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {londonAreas.map(area => (
                    <button key={area} onClick={() => { setSubCity(area); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px 8px 28px', background: subCity === area ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 11, fontFamily: manrope, fontWeight: subCity === area ? 700 : 400, color: subCity === area ? CATEGORY_ACCENT : 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (subCity !== area) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (subCity !== area) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      {area}
                      {subCity === area && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
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

function ServicesPage() {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const supabase = useSupabase()
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Hair')
  const [subs, setSubs] = useState<string[]>([])
  const [city, setCity] = useState('All')
  const [subCity, setSubCity] = useState('')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('most_rec')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Record<string, ServiceStats>>({})
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => { setSubs([]); setSearch('') }, [cat])
  useEffect(() => { if (city !== 'London') setSubCity('') }, [city])

  useEffect(() => {
    const c = searchParams.get('cat')
    if (c && Object.keys(CATEGORIES).includes(c)) setCat(c)
    const id = searchParams.get('id')
    if (id) {
      setTimeout(() => {
        const el = document.getElementById('service-' + id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.style.outline = '2px solid #B4690E'
          el.style.outlineOffset = '3px'
          setTimeout(() => { el.style.outline = 'none' }, 2500)
        }
      }, 800)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user?.id) { setDisplayName(''); return }
    supabase.from('profiles').select('display_name').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => { setDisplayName(data?.display_name || user.fullName || '') })
  }, [user, supabase])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('services').select('*').eq('category', cat).order('verified', { ascending: false }).order('name')
    if (city === 'London') {
      q = q.eq('city', 'London')
      if (subCity && subCity !== 'All London') {
        q = q.ilike('location', '%' + subCity + '%')
      }
    } else if (city !== 'All') {
      q = q.eq('city', city)
    }
    const { data } = await q
    let rows = data || []
    if (subs.length > 0) {
      rows = rows.filter((s: Service) => subs.some(sub => s.subcategories?.includes(sub)))
    }
    setServices(rows)
    if (rows.length > 0) {
      const ids = rows.map((s: Service) => s.id)
      const [usedRes, recRes] = await Promise.all([
        supabase.from('service_used').select('service_id, clerk_user_id').in('service_id', ids),
        supabase.from('service_recommendations').select('service_id, clerk_user_id').in('service_id', ids),
      ])
      const usedRows = usedRes.data || []
      const recRows  = recRes.data  || []
      const newStats: Record<string, ServiceStats> = {}
      rows.forEach((s: Service) => {
        newStats[s.id] = {
          usedCount: usedRows.filter((r: {service_id: string}) => r.service_id === s.id).length,
          recCount:  recRows.filter((r: {service_id: string})  => r.service_id === s.id).length,
          hasUsed:   user?.id ? usedRows.some((r: {service_id: string; clerk_user_id: string}) => r.service_id === s.id && r.clerk_user_id === user.id) : false,
          hasRec:    user?.id ? recRows.some((r: {service_id: string; clerk_user_id: string})  => r.service_id === s.id && r.clerk_user_id === user.id) : false,
        }
      })
      setStats(newStats)
    }
    setLoading(false)
  }, [supabase, cat, subs, city, subCity, user])

  const fetchSaved = useCallback(async () => {
    if (!user?.id) { setSavedIds(new Set()); return }
    const { data } = await supabase.from('saved_services').select('service_id').eq('clerk_user_id', user.id)
    setSavedIds(new Set((data || []).map((r: { service_id: string }) => r.service_id)))
  }, [supabase, user])

  useEffect(() => { fetchServices() }, [fetchServices])
  useEffect(() => { fetchSaved() }, [fetchSaved])

  const toggleSave = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const isSaved = savedIds.has(sid)
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(sid) : n.add(sid); return n })
    if (isSaved) {
      await supabase.from('saved_services').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
    } else {
      await supabase.from('saved_services').insert({ clerk_user_id: user.id, service_id: sid })
    }
  }, [supabase, user, savedIds, openSignIn])

  const toggleUsed = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[sid] || emptyStats
    if (cur.hasUsed) {
      await supabase.from('service_used').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasUsed: false, usedCount: Math.max(0, prev[sid].usedCount - 1) } }))
    } else {
      await supabase.from('service_used').insert({ clerk_user_id: user.id, service_id: sid })
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasUsed: true, usedCount: (prev[sid]?.usedCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

  const toggleRec = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[sid] || emptyStats
    if (cur.hasRec) {
      await supabase.from('service_recommendations').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasRec: false, recCount: Math.max(0, prev[sid].recCount - 1) } }))
    } else {
      await supabase.from('service_recommendations').insert({ clerk_user_id: user.id, service_id: sid })
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasRec: true, recCount: (prev[sid]?.recCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"

  const filteredServices = services.filter(sv => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      sv.name?.toLowerCase().includes(q) ||
      sv.bio?.toLowerCase().includes(q) ||
      sv.instagram?.toLowerCase().includes(q) ||
      sv.subcategories?.some(s => s.toLowerCase().includes(q))
    )
  })

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortMode === 'most_rec')  return (stats[b.id]?.recCount  || 0) - (stats[a.id]?.recCount  || 0)
    if (sortMode === 'most_used') return (stats[b.id]?.usedCount || 0) - (stats[a.id]?.usedCount || 0)
    return 0
  })

  return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', color: 'var(--text)', fontFamily: manrope, overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.2} } .hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      <div style={{ width: '100%', height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src="/pexels-services-hero.jpg" alt="Services" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      {/* Category tabs */}
      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {Object.keys(CATEGORIES).map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '18px 24px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid ' + CATEGORY_ACCENT : '2px solid transparent', color: cat === c ? CATEGORY_ACCENT : 'var(--text-muted)', fontFamily: manrope, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', marginBottom: 8 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.2"/><path d="M10 10l2 2" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input
              type="text"
              placeholder="Search stylists..."
              value={search}
              maxLength={80}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: 'var(--text)', fontFamily: manrope }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>x</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <SubcategoryDropdown cat={cat} subs={subs} setSubs={setSubs} manrope={manrope} />
            <CityDropdown city={city} setCity={setCity} subCity={subCity} setSubCity={setSubCity} manrope={manrope} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SortDropdown sortMode={sortMode} setSortMode={setSortMode} manrope={manrope} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 0' }}>
        {!loading && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, fontFamily: manrope, letterSpacing: '0.04em' }}>
            {sortedServices.length} {sortedServices.length === 1 ? 'result' : 'results'}
            {search ? ' for "' + search + '"' : ''}
            {subs.length > 0 ? ' \u00b7 ' + subs.join(', ') : ''}
            {city !== 'All' ? ' \u00b7 ' + (subCity && subCity !== 'All London' ? subCity : city) : ''}
          </p>
        )}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {[0,1,2,3,4,5].map(i => (<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 180, animation: 'pulse 1.5s ease infinite', opacity: 0.4, border: '1px solid var(--border)' }} />))}
          </div>
        )}
        {!loading && sortedServices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <p style={{ fontFamily: newsreader, fontSize: 24, marginBottom: 8 }}>No results found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: manrope }}>Try a different search or filter</p>
            <button onClick={() => { setSearch(''); setSubs([]); setCity('All'); setSubCity('') }} style={{ marginTop: 12, padding: '6px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: manrope }}>Clear filters</button>
          </div>
        )}
        {!loading && sortedServices.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {sortedServices.map(sv => (
              <Card
                key={sv.id}
                service={sv}
                isSaved={savedIds.has(sv.id)}
                onToggleSave={() => toggleSave(sv.id)}
                stats={stats[sv.id] || emptyStats}
                onToggleUsed={() => toggleUsed(sv.id)}
                onToggleRec={() => toggleRec(sv.id)}
                isLoggedIn={!!user}
                onOpenAuth={openSignIn}
                currentUserId={user?.id || null}
                displayName={displayName}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', padding: '40px 0 20px', borderTop: '1px solid var(--border)', marginTop: 40 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, fontFamily: manrope }}>Know a stylist who should be here?</p>
          <button onClick={() => setSuggestOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 24, border: '1.5px solid ' + CATEGORY_ACCENT, background: '#fff', color: CATEGORY_ACCENT, fontSize: 13, fontWeight: 700, fontFamily: manrope, cursor: 'pointer' }}>{'\u2736 Suggest a stylist'}</button>
        </div>
      </div>

      <SuggestVendorModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  )
}

function Card({ service, isSaved, onToggleSave, stats, onToggleUsed, onToggleRec, isLoggedIn, onOpenAuth, currentUserId, displayName }: {
  service: Service; isSaved: boolean; onToggleSave: () => void
  stats: ServiceStats; onToggleUsed: () => void; onToggleRec: () => void
  isLoggedIn: boolean; onOpenAuth: () => void
  currentUserId: string | null; displayName: string
}) {
  const [expanded, setExpanded] = useState(false)
  const subs = service.subcategories || []
  const ac = SUB_COLOR[subs[0]] || CATEGORY_ACCENT
  const igUrl = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const waUrl = service.phone ? 'https://wa.me/' + service.phone.replace(/\D/g, '') : null
  const bookUrl = service.website || null
  const loc = [service.location, service.city].filter(Boolean).join(', ')
  const { usedCount, recCount, hasUsed, hasRec } = stats
  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: manrope, border: '1px solid var(--border)' }

  return (
    <div id={'service-' + service.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 4px rgba(28,25,23,0.06)', transition: 'outline 0.3s ease' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 1 }}>
        <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleSave() }} style={{ background: isSaved ? 'var(--accent-light)' : '#fff', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s' }}>
          <HeartIcon filled={isSaved} />
        </button>
        {bookUrl && (
          <a href={bookUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: '#1C1917', border: '1px solid #1C1917', fontSize: 10, fontWeight: 700, color: '#ffffff', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: manrope, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book
          </a>
        )}
      </div>

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: CATEGORY_ACCENT, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5, fontFamily: manrope }}>{service.category}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, marginBottom: 6, paddingRight: 52, fontFamily: newsreader }}>{service.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {subs.map((s: string) => (<span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: (SUB_COLOR[s] || ac) + '18', color: SUB_COLOR[s] || ac, fontSize: 10, fontWeight: 600, fontFamily: manrope, letterSpacing: '0.04em' }}>{s}</span>))}
        </div>
        {(usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{usedCount} used &#128075;</span>}
            {recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>{recCount} rec &#11088;</span>}
          </div>
        )}
        {loc && <div style={{ fontSize: 11, color: '#92400E', fontWeight: 500, marginBottom: 4, fontFamily: manrope }}>&#128205; {loc}</div>}
        {service.bio && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: manrope }}>{service.bio}</p>}

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {igUrl && (
            <a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <WhatsAppIcon />WhatsApp
            </a>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>

          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
              <div>
                <button onClick={onToggleUsed} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light)' : '#fff', borderColor: hasUsed ? 'var(--gold)' : 'var(--border)', color: hasUsed ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {hasUsed ? 'Used this stylist' : 'I used this stylist'}{usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> {'\u00b7'} {usedCount}</span>}
                </button>
              </div>
              <div>
                <button onClick={onToggleRec} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : '#fff', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)' }}>
                  {hasRec ? 'Recommended' : 'I recommend this stylist'}{recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> {'\u00b7'} {recCount}</span>}
                </button>
              </div>
            </div>
          )}

          <ReviewSection
            serviceId={service.id}
            currentUserId={currentUserId}
            displayName={displayName}
            manrope={manrope}
            newsreader={newsreader}
          />
        </div>
      </div>
    </div>
  )
}

export default function ServicesPageWrapper() {
  return (
    <Suspense>
      <ServicesPage />
    </Suspense>
  )
}
