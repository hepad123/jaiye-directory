'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import { useSearchParams } from 'next/navigation'
import SuggestVendorModal from '@/components/SuggestVendorModal'

type Vendor = {
  id: string
  category: string
  name: string
  services: string
  location: string
  instagram: string
  phone: string
  website: string
  notes: string
  created_at?: string
  verified?: boolean
}

type VendorStats = {
  usedCount: number
  recCount: number
  hasUsed: boolean
  hasRec: boolean
}

type VendorReview = {
  id: string
  clerk_user_id: string
  reviewer_name: string
  rating_experience: number
  rating_quality: number
  rating_quality_results: number | null
  rating_value: number | null
  rating_professionalism: number | null
  rating_cleanliness: number | null
  rating_reliability: number | null
  rating_flexibility: number | null
  comment: string | null
  created_at: string
}

type ReviewCat = { key: string; label: string; hint: string; required: boolean }

const REVIEW_CATS_BY_CATEGORY: Record<string, ReviewCat[]> = {
  'Event Planning': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Photography': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Videography & Content': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Decor & Venue': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_cleanliness', label: 'Cleanliness & comfort', hint: '', required: false },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Catering': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_cleanliness', label: 'Cleanliness & comfort', hint: '', required: false },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Entertainment': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Outfits': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Styling': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Accessories': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Hair & Gele': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_cleanliness', label: 'Cleanliness & comfort', hint: '', required: false },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
  'Makeup': [
    { key: 'rating_quality_results', label: 'Quality of results', hint: 'overall satisfaction', required: true },
    { key: 'rating_value', label: 'Value for money', hint: '', required: true },
    { key: 'rating_professionalism', label: 'Professionalism', hint: 'listening, communication, care', required: true },
    { key: 'rating_cleanliness', label: 'Cleanliness & comfort', hint: '', required: false },
    { key: 'rating_reliability', label: 'Reliability', hint: 'punctuality, keeping to hours', required: false },
    { key: 'rating_flexibility', label: 'Flexibility', hint: '', required: false },
  ],
}

function calcOverallScore(r: VendorReview, cats: ReviewCat[]): number | null {
  const vals = cats
    .map(c => (r as unknown as Record<string, number | null>)[c.key])
    .filter((v): v is number => v !== null && v !== undefined)
  if (vals.length < 3) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2 * 10) / 10
}

function calcCatAvg(reviews: VendorReview[], key: string): number | null {
  const vals = reviews
    .map(r => (r as unknown as Record<string, number | null>)[key])
    .filter((v): v is number => v !== null && v !== undefined)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

const EVENT_CATEGORIES = [
  'Event Planning', 'Photography', 'Videography & Content', 'Decor & Venue',
  'Catering', 'Entertainment', 'Outfits', 'Styling', 'Accessories', 'Hair & Gele', 'Makeup',
]

const CATEGORY_ACCENT = '#B4690E'
const emptyStats: VendorStats = { usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }
type SortMode = 'most_used' | 'most_rec'

const CATEGORY_COLOR: Record<string, string> = {
  'Event Planning': '#6366F1', 'Photography': '#2563EB', 'Videography & Content': '#78716C',
  'Decor & Venue': '#92400E', 'Catering': '#C2410C', 'Entertainment': '#7C3AED',
  'Outfits': '#D97706', 'Styling': '#0D9488', 'Accessories': '#B45309',
  'Hair & Gele': '#EA580C', 'Makeup': '#DB2777',
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          style={{ cursor: 'pointer', fontSize: 20, color: s <= (hover || value) ? '#D97706' : '#D1C9BE', transition: 'color 0.1s', userSelect: 'none' }}>
          &#9733;
        </span>
      ))}
    </div>
  )
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= Math.round(value) ? '#D97706' : '#D1C9BE' }}>&#9733;</span>
      ))}
    </span>
  )
}

function ReviewsDivider({ manrope, cats }: { manrope: string; cats: ReviewCat[] }) {
  const [showInfo, setShowInfo] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowInfo(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', margin: '4px 0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: CATEGORY_ACCENT, fontFamily: manrope }}>Reviews</span>
          <button onClick={() => setShowInfo(o => !o)} style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid ' + CATEGORY_ACCENT, background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: CATEGORY_ACCENT, fontFamily: manrope, lineHeight: 1 }}>i</span>
          </button>
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {showInfo && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', boxShadow: '0 8px 24px rgba(28,25,23,0.12)', minWidth: 220, maxWidth: 260 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', fontFamily: manrope, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>How reviews work</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {cats.map(c => (
              <div key={c.label} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ color: '#D97706', fontSize: 10, flexShrink: 0 }}>&#9733;</span>
                <span style={{ fontSize: 10, color: 'var(--text)', fontFamily: manrope }}>
                  {c.label}{c.hint ? <span style={{ color: 'var(--text-muted)' }}> — {c.hint}</span> : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsSection({ vendorId, vendorCategory, currentUserId, displayName, manrope, newsreader }: {
  vendorId: string; vendorCategory: string; currentUserId: string | null; displayName: string; manrope: string; newsreader: string
}) {
  const supabase = useSupabase()
  const { openSignIn } = useClerk()
  const [reviews, setReviews] = useState<VendorReview[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const REVIEW_CATS = REVIEW_CATS_BY_CATEGORY[vendorCategory] || REVIEW_CATS_BY_CATEGORY['Event Planning']

  const myReview = reviews.find(r => r.clerk_user_id === currentUserId) || null
  const otherReviews = reviews.filter(r => r.clerk_user_id !== currentUserId)
  const allReviews = myReview ? [myReview, ...otherReviews] : otherReviews
  const visibleReviews = showAll ? allReviews : allReviews.slice(0, 3)

  const validScores = reviews.map(r => calcOverallScore(r, REVIEW_CATS)).filter((v): v is number => v !== null)
  const avgOverall = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length * 10) / 10
    : null

  useEffect(() => {
    setLoading(true)
    supabase.from('vendor_reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoaded(true); setLoading(false) })
  }, [vendorId])

  function startEdit() {
    if (myReview) {
      const r: Record<string, number> = {}
      REVIEW_CATS.forEach(c => {
        const v = (myReview as unknown as Record<string, number | null>)[c.key]
        if (v !== null && v !== undefined) r[c.key] = v
      })
      setRatings(r)
      setComment(myReview.comment || '')
    } else {
      setRatings({}); setComment('')
    }
    setShowForm(true)
  }

  const mandatoryMet = REVIEW_CATS.filter(c => c.required).every(c => (ratings[c.key] || 0) > 0)

  async function handleSubmit() {
    if (!currentUserId) { openSignIn(); return }
    if (!mandatoryMet) return
    setSubmitting(true)
    const payload: Record<string, string | number | null> = {
      vendor_id: vendorId,
      clerk_user_id: currentUserId,
      reviewer_name: displayName,
      comment: comment.trim() || null,
      rating_experience: ratings['rating_professionalism'] || 0,
      rating_quality: ratings['rating_quality_results'] || 0,
    }
    REVIEW_CATS.forEach(c => { payload[c.key] = ratings[c.key] !== undefined ? ratings[c.key] : null })
    const { data, error } = await supabase.from('vendor_reviews').upsert(payload, { onConflict: 'vendor_id,clerk_user_id' }).select()
    if (!error && data) {
      setReviews(prev => { const without = prev.filter(r => r.clerk_user_id !== currentUserId); return [data[0], ...without] })
      setShowForm(false)
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!currentUserId || !myReview) return
    setDeleting(true)
    await supabase.from('vendor_reviews').delete().eq('id', myReview.id)
    setReviews(prev => prev.filter(r => r.id !== myReview.id))
    setShowForm(false); setDeleting(false)
  }

  if (loading) return <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope, textAlign: 'center', padding: '4px 0' }}>Loading reviews...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {loaded && reviews.length > 0 && avgOverall !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: CATEGORY_ACCENT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: manrope, lineHeight: 1 }}>{avgOverall}</span>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', fontFamily: manrope, lineHeight: 1 }}>/10</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
            {REVIEW_CATS.map(c => {
              const avg = calcCatAvg(reviews, c.key)
              if (avg === null) return null
              return (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>{c.label} <span style={{ color: CATEGORY_ACCENT }}>({avg})</span></span>
                  <StarDisplay value={avg} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loaded && allReviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visibleReviews.filter(r => r.comment).slice(0, 2).map(r => (
            <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 8, padding: '8px 10px' }}>
              <p style={{ fontSize: 11, color: 'var(--text)', margin: '0 0 3px', lineHeight: 1.5, fontFamily: manrope, fontStyle: 'italic' }}>{'\u201c'}{r.comment}{'\u201d'}</p>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </div>
          ))}
        </div>
      )}

      {loaded && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { if (!currentUserId) { openSignIn(); return }; showForm ? setShowForm(false) : startEdit() }}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', borderRadius: 20, border: '1.5px solid ' + CATEGORY_ACCENT, background: CATEGORY_ACCENT, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: manrope, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' as const, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {myReview ? 'Edit your review' : '+ Leave a review'}
          </button>
          {allReviews.length > 0 && (
            <button onClick={() => setShowAll(o => !o)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, fontFamily: manrope, cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' }}>
              {showAll ? 'Show less' : 'See all ' + allReviews.length + ' reviews'}
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REVIEW_CATS.map(c => (
            <div key={c.key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', fontFamily: manrope, textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
                  {c.label}{c.hint ? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({c.hint})</span> : ''}
                  {c.required && <span style={{ color: CATEGORY_ACCENT }}> *</span>}
                </span>
                {!c.required && (ratings[c.key] || 0) === 0 && (
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: manrope, letterSpacing: '0.06em' }}>OPTIONAL</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarPicker value={ratings[c.key] || 0} onChange={v => setRatings(prev => ({ ...prev, [c.key]: v }))} />
                {(ratings[c.key] || 0) > 0 && !c.required && (
                  <button onClick={() => setRatings(prev => { const n = { ...prev }; delete n[c.key]; return n })} style={{ fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: manrope }}>clear</button>
                )}
              </div>
            </div>
          ))}
          <textarea placeholder="Any additional comments? (optional)" value={comment} onChange={e => setComment(e.target.value)} rows={3} maxLength={500} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, fontSize: 16, background: '#fff', color: 'var(--text)', padding: '8px 10px', resize: 'none' as const, outline: 'none', fontFamily: manrope, boxSizing: 'border-box' as const, lineHeight: 1.5 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleSubmit} disabled={submitting || !mandatoryMet} style={{ padding: '7px 18px', background: mandatoryMet ? CATEGORY_ACCENT : 'var(--bg-pill)', color: mandatoryMet ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: mandatoryMet ? 'pointer' : 'default', fontFamily: manrope, transition: 'all 0.15s' }}>
              {submitting ? 'Saving...' : myReview ? 'Update' : 'Submit'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '7px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: manrope }}>Cancel</button>
            {myReview && (
              <button onClick={handleDelete} disabled={deleting} style={{ padding: '7px 14px', background: 'none', border: '1px solid #DC2626', borderRadius: 20, fontSize: 11, color: '#DC2626', cursor: 'pointer', fontFamily: manrope, marginLeft: 'auto' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>
      )}

      {showAll && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allReviews.map(r => {
            const isMe = r.clerk_user_id === currentUserId
            return (
              <div key={r.id} style={{ background: isMe ? 'var(--accent-light)' : 'var(--bg-pill)', border: isMe ? '1px solid var(--gold)' : 'none', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isMe && <span style={{ fontSize: 9, color: CATEGORY_ACCENT, fontFamily: manrope, fontWeight: 700, letterSpacing: '0.06em', background: CATEGORY_ACCENT + '15', padding: '2px 7px', borderRadius: 20 }}>YOUR REVIEW</span>}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {isMe && <button onClick={startEdit} style={{ fontSize: 10, color: CATEGORY_ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: manrope }}>Edit</button>}
                </div>
                {REVIEW_CATS.map(c => {
                  const v = (r as unknown as Record<string, number | null>)[c.key]
                  if (!v) return null
                  return (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope, textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 600 }}>{c.label}</span>
                      <StarDisplay value={v} />
                    </div>
                  )
                })}
                {r.comment && <p style={{ fontSize: 11, color: 'var(--text)', margin: '6px 0 0', lineHeight: 1.5, fontFamily: manrope }}>{r.comment}</p>}
              </div>
            )
          })}
        </div>
      )}

      {loaded && allReviews.length === 0 && !showForm && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope, textAlign: 'center', padding: '4px 0' }}>No reviews yet {'\u2014'} be the first!</p>
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
    { key: 'most_rec', label: 'Most Recommended' },
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
            <button key={o.key} onClick={() => { setSortMode(o.key); setInteracted(true); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: interacted && sortMode === o.key ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: interacted && sortMode === o.key ? 700 : 400, color: interacted && sortMode === o.key ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (!(interacted && sortMode === o.key)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (!(interacted && sortMode === o.key)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {o.label}
              {interacted && sortMode === o.key && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LocationDropdown({ location, setLocation, manrope }: { location: string; setLocation: (l: string) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const locations = ['All', 'Lagos', 'Abuja', 'London']
  const isFiltered = location !== 'All'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {location === 'All' ? 'All Locations' : location}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 180, overflow: 'hidden' }}>
          {locations.map(l => (
            <button key={l} onClick={() => { setLocation(l); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: location === l ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: location === l ? 700 : 400, color: location === l ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (location !== l) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (location !== l) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {l === 'All' ? 'All Locations' : l}
              {location === l && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function EventServicesPage() {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const supabase = useSupabase()
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Event Planning')
  const [location, setLocation] = useState('All')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('most_rec')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Record<string, VendorStats>>({})
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')

  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"

  useEffect(() => { setSearch('') }, [cat])

  useEffect(() => {
    const c = searchParams.get('cat')
    if (c && EVENT_CATEGORIES.includes(c)) setCat(c)
    const id = searchParams.get('id')
    if (id) {
      setTimeout(() => {
        const el = document.getElementById('vendor-' + id)
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

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    const dbCat = cat === 'Outfits' ? 'Fashion' : cat
    let q = supabase.from('vendors').select('*').eq('category', dbCat).order('verified', { ascending: false }).order('name')
    if (location !== 'All') q = q.ilike('location', '%' + location + '%')
    const { data } = await q
    const rows = (data || []).map((v: Vendor) => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
    setVendors(rows)
    if (rows.length > 0) {
      const ids = rows.map((v: Vendor) => v.id)
      const [recsRes, usedRes] = await Promise.all([
        supabase.from('vendor_recommendations').select('vendor_id, clerk_user_id').in('vendor_id', ids),
        supabase.from('vendor_used').select('vendor_id, clerk_user_id').in('vendor_id', ids),
      ])
      const recRows = recsRes.data || []
      const usedRows = usedRes.data || []
      const newStats: Record<string, VendorStats> = {}
      rows.forEach((v: Vendor) => {
        newStats[v.id] = {
          usedCount: usedRows.filter((r: {vendor_id: string}) => r.vendor_id === v.id).length,
          recCount: recRows.filter((r: {vendor_id: string}) => r.vendor_id === v.id).length,
          hasUsed: user?.id ? usedRows.some((r: {vendor_id: string; clerk_user_id: string}) => r.vendor_id === v.id && r.clerk_user_id === user.id) : false,
          hasRec: user?.id ? recRows.some((r: {vendor_id: string; clerk_user_id: string}) => r.vendor_id === v.id && r.clerk_user_id === user.id) : false,
        }
      })
      setStats(newStats)
    }
    setLoading(false)
  }, [supabase, cat, location, user])

  const fetchSaved = useCallback(async () => {
    if (!user?.id) { setSavedIds(new Set()); return }
    const { data } = await supabase.from('saved_vendors').select('vendor_id').eq('clerk_user_id', user.id)
    setSavedIds(new Set((data || []).map((r: { vendor_id: string }) => r.vendor_id)))
  }, [supabase, user])

  useEffect(() => { fetchVendors() }, [fetchVendors])
  useEffect(() => { fetchSaved() }, [fetchSaved])

  const toggleSave = useCallback(async (vid: string) => {
    if (!user?.id) { openSignIn(); return }
    const isSaved = savedIds.has(vid)
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(vid) : n.add(vid); return n })
    if (isSaved) {
      await supabase.from('saved_vendors').delete().eq('clerk_user_id', user.id).eq('vendor_id', vid)
    } else {
      await supabase.from('saved_vendors').insert({ clerk_user_id: user.id, vendor_id: vid })
    }
    window.dispatchEvent(new Event('saved-change'))
  }, [supabase, user, savedIds, openSignIn])

  const toggleUsed = useCallback(async (vid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[vid] || emptyStats
    if (cur.hasUsed) {
      await supabase.from('vendor_used').delete().eq('clerk_user_id', user.id).eq('vendor_id', vid)
      setStats(prev => ({ ...prev, [vid]: { ...prev[vid], hasUsed: false, usedCount: Math.max(0, prev[vid].usedCount - 1) } }))
    } else {
      await supabase.from('vendor_used').insert({ clerk_user_id: user.id, vendor_id: vid })
      setStats(prev => ({ ...prev, [vid]: { ...prev[vid], hasUsed: true, usedCount: (prev[vid]?.usedCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

  const toggleRec = useCallback(async (vid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[vid] || emptyStats
    if (cur.hasRec) {
      await supabase.from('vendor_recommendations').delete().eq('clerk_user_id', user.id).eq('vendor_id', vid)
      setStats(prev => ({ ...prev, [vid]: { ...prev[vid], hasRec: false, recCount: Math.max(0, prev[vid].recCount - 1) } }))
    } else {
      await supabase.from('vendor_recommendations').insert({ clerk_user_id: user.id, vendor_id: vid })
      setStats(prev => ({ ...prev, [vid]: { ...prev[vid], hasRec: true, recCount: (prev[vid]?.recCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

  const filteredVendors = vendors.filter(v => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return v.name?.toLowerCase().includes(q) || v.services?.toLowerCase().includes(q) || v.instagram?.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
  })

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    if (sortMode === 'most_rec') return (stats[b.id]?.recCount || 0) - (stats[a.id]?.recCount || 0)
    if (sortMode === 'most_used') return (stats[b.id]?.usedCount || 0) - (stats[a.id]?.usedCount || 0)
    return 0
  })

  const catColour = CATEGORY_COLOR[cat] || CATEGORY_ACCENT

  return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', color: 'var(--text)', fontFamily: manrope, overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.2} } .hide-scrollbar::-webkit-scrollbar{display:none}`}</style>

      <div style={{ width: '100%', height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src="/pexels-directory-hero.jpg" alt="Event Services" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,10,5,0.7) 0%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 24 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontFamily: manrope, fontWeight: 600, marginBottom: 4 }}>Event Services</div>
          <div style={{ fontFamily: newsreader, fontSize: 28, fontWeight: 700, color: '#fff' }}>{cat}</div>
        </div>
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scrollbar">
          {EVENT_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '16px 18px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid ' + CATEGORY_ACCENT : '2px solid transparent', color: cat === c ? CATEGORY_ACCENT : 'var(--text-muted)', fontFamily: manrope, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 999, padding: '7px 16px', marginBottom: 8 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.2"/><path d="M10 10l2 2" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <input type="text" placeholder={'Search ' + cat.toLowerCase() + '...'} value={search} maxLength={80} onChange={e => setSearch(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: 'var(--text)', fontFamily: manrope }} />
            {search ? <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>x</button> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <LocationDropdown location={location} setLocation={setLocation} manrope={manrope} />
            <SortDropdown sortMode={sortMode} setSortMode={setSortMode} manrope={manrope} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 0' }}>
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: manrope, letterSpacing: '0.04em' }}>
              {sortedVendors.length} {sortedVendors.length === 1 ? 'result' : 'results'}
              {search ? ' for "' + search + '"' : ''}
              {location !== 'All' ? ' \u00b7 ' + location : ''}
            </p>
            <button onClick={() => setSuggestOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 24, border: '1.5px solid ' + CATEGORY_ACCENT, background: '#fff', color: CATEGORY_ACCENT, fontSize: 11, fontWeight: 700, fontFamily: manrope, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Suggest
            </button>
          </div>
        )}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {[0,1,2,3,4,5].map(i => <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 180, animation: 'pulse 1.5s ease infinite', opacity: 0.4, border: '1px solid var(--border)' }} />)}
          </div>
        )}
        {!loading && sortedVendors.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <p style={{ fontFamily: newsreader, fontSize: 24, marginBottom: 8 }}>No results found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: manrope }}>Try a different search or filter</p>
            <button onClick={() => { setSearch(''); setLocation('All') }} style={{ marginTop: 12, padding: '6px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: manrope }}>Clear filters</button>
          </div>
        )}
        {!loading && sortedVendors.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {sortedVendors.map(v => (
              <VendorCard
                key={v.id}
                vendor={v}
                catColour={catColour}
                isSaved={savedIds.has(v.id)}
                onToggleSave={() => toggleSave(v.id)}
                stats={stats[v.id] || emptyStats}
                onToggleUsed={() => toggleUsed(v.id)}
                onToggleRec={() => toggleRec(v.id)}
                isLoggedIn={!!user}
                onOpenAuth={openSignIn}
                currentUserId={user?.id || null}
                displayName={displayName}
              />
            ))}
          </div>
        )}
      </div>

      <SuggestVendorModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </div>
  )
}

function VendorCard({ vendor, catColour, isSaved, onToggleSave, stats, onToggleUsed, onToggleRec, isLoggedIn, onOpenAuth, currentUserId, displayName }: {
  vendor: Vendor; catColour: string; isSaved: boolean; onToggleSave: () => void
  stats: VendorStats; onToggleUsed: () => void; onToggleRec: () => void
  isLoggedIn: boolean; onOpenAuth: () => void
  currentUserId: string | null; displayName: string
}) {
  const [moreOpen, setMoreOpen] = useState(false)
  const igHandle = vendor.instagram?.replace('@', '').trim()
  const waUrl = vendor.phone ? 'https://wa.me/' + vendor.phone.replace(/\D/g, '') : null
  const bookUrl = vendor.website || null
  const { usedCount, recCount, hasUsed, hasRec } = stats
  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: manrope, border: '1px solid var(--border)', letterSpacing: '0.04em' }
  const reviewCats = REVIEW_CATS_BY_CATEGORY[vendor.category] || REVIEW_CATS_BY_CATEGORY['Event Planning']

  return (
    <div id={'vendor-' + vendor.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', position: 'relative', boxShadow: '0 1px 4px rgba(28,25,23,0.06)' }}>
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, zIndex: 1 }}>
        <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleSave() }} style={{ background: isSaved ? 'var(--accent-light)' : '#fff', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s' }}>
          <HeartIcon filled={isSaved} />
        </button>
        {bookUrl && (
          <a href={bookUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: '#1C1917', fontSize: 10, fontWeight: 700, color: '#fff', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontFamily: manrope, whiteSpace: 'nowrap' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book
          </a>
        )}
      </div>

      <div style={{ padding: '14px 14px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: catColour, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4, fontFamily: manrope }}>{vendor.category}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 52, fontFamily: newsreader }}>{vendor.name}</div>

        {vendor.location && <div style={{ fontSize: 11, color: '#92400E', fontWeight: 500, marginBottom: 4, fontFamily: manrope }}>&#128205; {vendor.location}</div>}
        {vendor.services && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: manrope }}>{vendor.services}</p>}

        {(usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>&#128075; {usedCount} used</span>}
            {recCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>&#11088; {recCount} rec</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {igHandle && (
            <a href={'https://instagram.com/' + igHandle} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <WhatsAppIcon />WhatsApp
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleUsed() }} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light)' : '#fff', borderColor: hasUsed ? 'var(--gold)' : 'var(--border)', color: hasUsed ? 'var(--gold)' : 'var(--text-muted)' }}>
            &#128075; {hasUsed ? 'Used this' : 'I used this'}
          </button>
          <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleRec() }} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : '#fff', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)' }}>
            &#11088; {hasRec ? 'Recommended' : 'I recommend'}
          </button>
        </div>

        <ReviewsDivider manrope={manrope} cats={reviewCats} />

        <ReviewsSection
          vendorId={vendor.id}
          vendorCategory={vendor.category}
          currentUserId={currentUserId}
          displayName={displayName}
          manrope={manrope}
          newsreader={newsreader}
        />

        <div style={{ marginTop: 12 }}>
          <button onClick={() => setMoreOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{moreOpen ? '-' : '+'}</span>
            {moreOpen ? 'Less info' : 'More info'}
          </button>
          {moreOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 10 }}>
              {vendor.phone && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: manrope }}>&#128222; {vendor.phone}</p>}
              {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: manrope }}>&#127760; {vendor.website}</a>}
              {vendor.notes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: manrope }}>{vendor.notes}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventServicesPageWrapper() {
  return (
    <Suspense>
      <EventServicesPage />
    </Suspense>
  )
}
