'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  'Event Planning':        { emoji: '📋', colour: '#9B7BB8' },
  'Styling':               { emoji: '✨', colour: '#C45C7A' },
  'Fashion':               { emoji: '👗', colour: '#C4922A' },
  'Makeup':                { emoji: '💄', colour: '#D4789A' },
  'Hair & Gele':           { emoji: '💇🏾', colour: '#6A9BB5' },
  'Photography':           { emoji: '📸', colour: '#5A8A72' },
  'Videography & Content': { emoji: '🎥', colour: '#4A6A8A' },
  'Decor & Venue':         { emoji: '🏛️', colour: '#9A7A5A' },
  'Catering':              { emoji: '🍽️', colour: '#C4724A' },
  'Entertainment':         { emoji: '🎤', colour: '#7A6A9A' },
  'Other':                 { emoji: '✦',  colour: '#8A8A8A' },
  'Fashion (White Wedding)': { emoji: '👰', colour: '#C4922A' },
  'Fashion (Traditional)':   { emoji: '🪘', colour: '#B5540A' },
}

const FASHION_WHITE = [
  'Mazelle Bridal', 'Airvy Studio', 'Scholtz Ruberto', 'Wealth Atelier',
  'Ovems', 'House of Vieve', 'Horllard Fashion', 'Style by JC',
]
const FASHION_TRAD = [
  'Ziurry Fashion', 'Clasik Q Diane', 'Somo by Somo', 'Florence by Ester',
  'Myde Clothing', 'Prudential Atelier',
]

const LOCATION_ORDER = ['All', '🇳🇬 Nigeria', '🟢 Abuja', '🟢 Lagos', '🏙️ Lekki (Lagos)']
const DB_LOCATION_MAP: Record<string, string> = {
  'Nigeria':       '🇳🇬 Nigeria',
  'Abuja':         '🟢 Abuja',
  'Lagos':         '🟢 Lagos',
  'Lekki (Lagos)': '🏙️ Lekki (Lagos)',
}

const CATEGORY_ORDER = [
  'All', 'Event Planning', 'Fashion (White Wedding)', 'Fashion (Traditional)',
  'Styling', 'Makeup', 'Hair & Gele', 'Photography', 'Videography & Content',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#B5294E'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const isNewVendor = (v: Vendor) => {
  if (!v.created_at) return false
  const created = new Date(v.created_at)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return created > weekAgo
}

const InstagramIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)}
          style={{ cursor: onRate ? 'pointer' : 'default', color: s <= rating ? '#D4A853' : '#E8DDD5', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

function ReviewSection({ vendor }: { vendor: Vendor }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [usedVendor, setUsedVendor] = useState(false)
  const [usedName, setUsedName] = useState('')
  const [usedSubmitting, setUsedSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id])

  async function submitUsed() {
    if (!usedName.trim()) return
    setUsedSubmitting(true)
    const { data } = await supabase.from('reviews')
      .insert({ vendor_id: vendor.id, reviewer_name: usedName, rating: 5, comment: '__used__' })
      .select()
    if (data) setReviews(prev => [data[0], ...prev])
    setUsedVendor(false)
    setUsedName('')
    setUsedSubmitting(false)
  }

  async function submitReview() {
    if (!name.trim() || rating === 0) return
    setSubmitting(true)
    const { data } = await supabase.from('reviews')
      .insert({ vendor_id: vendor.id, reviewer_name: name, rating, comment })
      .select()
    if (data) {
      setReviews(prev => [data[0], ...prev])
      setName(''); setRating(0); setComment(''); setShowForm(false)
    }
    setSubmitting(false)
  }

  const realReviews = reviews.filter(r => r.comment !== '__used__')
  const usedCount   = reviews.filter(r => r.comment === '__used__').length

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2EAE4' }}>
      {/* I used this vendor */}
      <div style={{ marginBottom: 8 }}>
        {!usedVendor ? (
          <button onClick={() => setUsedVendor(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            border: '1px solid #E8DDD5', background: '#FDF8F4',
            cursor: 'pointer', fontSize: 11, color: '#9A7060', fontWeight: 500,
          }}>
            👋 I used this vendor {usedCount > 0 && <span style={{ color: '#C45C7A', fontWeight: 700 }}>· {usedCount}</span>}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input placeholder="Your name *" value={usedName} onChange={e => setUsedName(e.target.value)}
              style={{ flex: 1, padding: '5px 8px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, background: 'white' }} />
            <button onClick={submitUsed} disabled={usedSubmitting || !usedName.trim()}
              style={{ padding: '5px 12px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: !usedName.trim() ? 0.5 : 1 }}>✓</button>
            <button onClick={() => setUsedVendor(false)}
              style={{ padding: '5px 8px', background: 'none', border: 'none', fontSize: 13, color: '#bbb', cursor: 'pointer' }}>×</button>
          </div>
        )}
      </div>

      {/* Reviews list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#C4A898', letterSpacing: 0.5 }}>
          {realReviews.length > 0 ? `${realReviews.length} review${realReviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
        </span>
        <button onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 10, color: '#C45C7A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {showForm ? 'Cancel' : '+ Add review'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#FDF5F0', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, marginBottom: 6, boxSizing: 'border-box', background: 'white' }} />
          <div style={{ marginBottom: 6 }}><StarRating rating={rating} onRate={setRating} /></div>
          <textarea placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} rows={2}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, marginBottom: 6, boxSizing: 'border-box', resize: 'none', background: 'white' }} />
          <button onClick={submitReview} disabled={submitting || !name.trim() || rating === 0}
            style={{ padding: '5px 14px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: (!name.trim() || rating === 0) ? 0.45 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}

      {realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: '#FBF7F4', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7A5A4A' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && (
            <p style={{ fontSize: 10, color: '#9A7A6A', margin: '3px 0 0', lineHeight: 1.4 }}>{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function VendorCard({ v, isNew, resetKey }: { v: Vendor; isNew: boolean; resetKey: number }) {
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { setExpanded(false) }, [resetKey])
  const [copied, setCopied] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [usedCount, setUsedCount] = useState(0)

  const colour     = getColour(v.category)
  const igHandle   = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website

  useEffect(() => {
    supabase.from('reviews').select('rating, comment').eq('vendor_id', v.id)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const real = data.filter(r => r.comment !== '__used__')
        const used = data.filter(r => r.comment === '__used__')
        setUsedCount(used.length)
        if (real.length > 0) {
          const avg = real.reduce((sum, r) => sum + r.rating, 0) / real.length
          setAvgRating(Math.round(avg * 10) / 10)
        }
      })
  }, [v.id])

  function copyCode() {
    navigator.clipboard.writeText(v.discount_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappNumber = v.phone?.replace(/\D/g, '')
  const whatsappUrl    = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null

  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: isFeatured ? `1.5px solid ${colour}55` : '1px solid #F0E8E2',
      overflow: 'hidden',
      boxShadow: isFeatured ? `0 4px 18px ${colour}22` : '0 2px 12px rgba(180,130,110,0.07)',
      position: 'relative',
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${colour}CC, ${colour}55)` }} />

      {/* Badges */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
        {isFeatured && (
          <div style={{ background: '#FFF8E7', border: '1px solid #E8C87A', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#B8860B' }}>
            ⭐ Top pick
          </div>
        )}
        {v.verified && (
          <div style={{ background: '#F0F7FF', border: '1px solid #AAD0FF', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#3A7BD5' }}>
            ✓ Verified
          </div>
        )}
        {isNew && (
          <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#276749' }}>
            🆕 New
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Category label */}
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3, opacity: 0.9 }}>
          {getEmoji(v.category)} {v.category}
        </div>

        {/* Name */}
        <div style={{ fontSize: 16, fontWeight: 600, color: '#2C1A12', lineHeight: 1.25, marginBottom: 6 }}>
          {v.name}
        </div>

        {/* Social proof */}
        {(avgRating !== null || usedCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {avgRating !== null && (
              <span style={{ fontSize: 11, color: '#B8860B', display: 'flex', alignItems: 'center', gap: 3 }}>★ {avgRating}</span>
            )}
            {usedCount > 0 && (
              <span style={{ fontSize: 11, color: '#9A7060' }}>👋 {usedCount} bride{usedCount !== 1 ? 's' : ''} used this</span>
            )}
          </div>
        )}

        {/* Location */}
        {v.location && (
          <div style={{ fontSize: 11, color: '#9A8070', marginBottom: 4 }}>📍 {v.location}</div>
        )}

        {/* Price */}
        {v.price_from && (
          <div style={{ fontSize: 11, color: '#5A8A72', fontWeight: 600, marginBottom: 4 }}>💰 From ₦{v.price_from}</div>
        )}

        {/* Instagram */}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C45C7A', textDecoration: 'none', fontWeight: 500, marginBottom: 4 }}>
            <InstagramIcon /> @{igHandle}
          </a>
        )}

        {/* WhatsApp */}
        {whatsappUrl && (
          <div style={{ marginBottom: 4 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        )}

        {/* Discount code */}
        {v.discount_code && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#2C1A12', color: '#F5E6C8', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
              🏷️ {v.discount_code}
            </span>
            <button onClick={copyCode} style={{
              padding: '4px 10px', borderRadius: 20,
              border: '1px solid #EDE4DC', background: copied ? '#F0FFF4' : 'white',
              fontSize: 10, color: copied ? '#276749' : '#9A7060',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
            }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2EAE4', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: '#6A4A38', margin: 0, lineHeight: 1.55 }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: '#8A7060', margin: 0 }}>📞 {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: '#8A7060', margin: 0 }}>✉️ {v.email}</p>}
            {v.website  && (
              <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#6A9BB5', textDecoration: 'none' }}>
                🌐 {v.website}
              </a>
            )}
            {v.notes && <p style={{ fontSize: 10, color: '#B8A090', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>{v.notes}</p>}
            <ReviewSection vendor={v} />
          </div>
        )}

        {/* More info toggle */}
        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{
            marginTop: 10, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'none', border: '1px solid #EDE4DC', borderRadius: 20,
            cursor: 'pointer', fontSize: 10, color: '#B09080', fontWeight: 500, padding: '5px 0',
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #DDD0C8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#B09080', lineHeight: 1,
            }}>{expanded ? '−' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [vendors, setVendors]         = useState<Vendor[]>([])
  const [search, setSearch]           = useState('')
  const [category, setCategory]       = useState('All')
  const [location, setLocation]       = useState('All')
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [weddingType, setWeddingType] = useState('All')
  const [loading, setLoading]         = useState(true)
  const [cardResetKey, setCardResetKey] = useState(0)

  useEffect(() => {
    supabase.from('vendors').select('*').then(({ data, error }) => {
      if (error) console.error(error)
      else setVendors(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { setCardResetKey(k => k + 1) }, [category])

  // Remap fashion vendors into subcategories for display
  const vendorsWithSubcats = vendors.map(v => {
    if (v.category === 'Fashion') {
      if (FASHION_WHITE.includes(v.name)) return { ...v, category: 'Fashion (White Wedding)' }
      if (FASHION_TRAD.includes(v.name))  return { ...v, category: 'Fashion (Traditional)' }
    }
    return v
  })

  const allCats       = Array.from(new Set(vendorsWithSubcats.map(v => v.category)))
  const remainingCats = allCats.filter(c => !CATEGORY_ORDER.includes(c)).sort()
  const categories    = [...CATEGORY_ORDER.filter(c => c === 'All' || allCats.includes(c)), ...remainingCats]

  const getCategoryCount = (cat: string) =>
    cat === 'All' ? vendors.length : vendorsWithSubcats.filter(v => v.category === cat).length

  const newVendors = vendorsWithSubcats.filter(isNewVendor)

  const filtered = vendorsWithSubcats.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      v.name?.toLowerCase().includes(q) ||
      v.services?.toLowerCase().includes(q) ||
      v.instagram?.toLowerCase().includes(q) ||
      v.notes?.toLowerCase().includes(q)
    const matchCat = category === '__discounts__'
      ? !!v.discount_code
      : category === 'All' || v.category === category
    const dbLoc = Object.entries(DB_LOCATION_MAP).find(([, label]) => label === location)?.[0]
    const matchLocation = location === 'All' || v.location === dbLoc
    const matchNew = !showNewOnly || isNewVendor(v)
    const matchWeddingType = category !== 'Fashion' || weddingType === 'All' || v.wedding_type === weddingType || v.wedding_type === 'Both'
    return matchSearch && matchCat && matchLocation && matchNew && matchWeddingType
  })

  const sorted = [...filtered].sort((a, b) => {
    const aFeat = FEATURED_VENDORS.includes(a.name) ? 0 : 1
    const bFeat = FEATURED_VENDORS.includes(b.name) ? 0 : 1
    return aFeat - bFeat
  })

  return (
    <main style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', background: '#FDF8F4', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #3D1515 0%, #7A2A2A 45%, #B85C3A 100%)',
        padding: 'clamp(32px, 6vw, 60px) 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: '#E8C87A', letterSpacing: 8, marginBottom: 12, opacity: 0.9 }}>✦ ✦ ✦</div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 58px)', color: '#FFF5EC', margin: '0 0 8px', fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.5 }}>
          Jaiye Directory
        </h1>
        <div style={{ width: 36, height: 1.5, background: '#E8C87A', margin: '12px auto', opacity: 0.8 }} />
        <p style={{ color: 'rgba(255,240,225,0.75)', fontSize: 'clamp(12px, 2.5vw, 15px)', margin: 0, letterSpacing: 0.3 }}>
          Your guide to the best Nigerian wedding and event vendors
        </p>
        <p style={{ color: '#E8C87A', fontSize: 13, margin: '10px 0 0', opacity: 0.8 }}>
          200+ vendors and counting
        </p>
      </div>

      {/* Sticky filters */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#FDF8F4', borderBottom: '1px solid #EDE4DC' }}>

        {/* Category pills */}
        <div style={{ padding: '12px 16px 0', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 11, scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const isActive = category === cat
              const colour   = cat === 'All' ? '#9A7060' : getColour(cat)
              const emoji    = cat === 'All' ? '🌸' : getEmoji(cat)
              const count    = getCategoryCount(cat)
              return (
                <button key={cat} onClick={() => { setCategory(cat); setWeddingType('All') }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 13px', borderRadius: 20, flexShrink: 0,
                  border: isActive ? 'none' : '1px solid #E8DDD5',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                  background: isActive ? colour : '#FDFAF7',
                  color: isActive ? 'white' : '#8A6A58',
                  boxShadow: isActive ? `0 2px 10px ${colour}44` : 'none',
                  transition: 'all 0.15s ease',
                }}>
                  <span>{emoji}</span><span>{cat}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.28)' : '#EDE4DC',
                    color: isActive ? 'white' : '#A08070',
                    borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700,
                  }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fashion sub-filter pills */}
        {category === 'Fashion' && (
          <div style={{ padding: '0 16px 8px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 7 }}>
              {['All', 'White Wedding', 'Traditional', 'Both'].map(type => (
                <button key={type} onClick={() => setWeddingType(type)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20, flexShrink: 0,
                  border: weddingType === type ? 'none' : '1px solid #E8DDD5',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 11, fontWeight: weddingType === type ? 600 : 400,
                  background: weddingType === type ? '#C4922A' : '#FDFAF7',
                  color: weddingType === type ? 'white' : '#8A6A58',
                  boxShadow: weddingType === type ? '0 2px 10px #C4922A44' : 'none',
                  transition: 'all 0.15s ease',
                }}>
                  {type === 'White Wedding' ? '🤍' : type === 'Traditional' ? '👘' : type === 'Both' ? '✨' : '🌸'} {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discounts + New this week row */}
        <div style={{ padding: '0 16px 8px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 7 }}>
          <button onClick={() => { setCategory(category === '__discounts__' ? 'All' : '__discounts__'); setWeddingType('All') }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700,
            background: category === '__discounts__' ? '#C4922A' : '#2C1A12',
            color: category === '__discounts__' ? 'white' : '#F5E6C8',
            boxShadow: '0 2px 10px rgba(44,26,18,0.25)',
          }}>
            <span>🏷️</span><span>Discounts</span>
            <span style={{ background: '#C4922A', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>
              {vendors.filter(v => v.discount_code).length}
            </span>
          </button>

          {newVendors.length > 0 && (
            <button onClick={() => setShowNewOnly(!showNewOnly)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: showNewOnly ? '#276749' : '#F0FFF4',
              color: showNewOnly ? 'white' : '#276749',
              outline: showNewOnly ? 'none' : '1px solid #9AE6B4',
            }}>
              <span>🆕</span><span>New this week</span>
              <span style={{ background: '#9AE6B4', color: '#276749', borderRadius: 10, padding: '1px 7px', fontSize: 9, fontWeight: 700 }}>
                {newVendors.length}
              </span>
            </button>
          )}
        </div>

        {/* Search + Location */}
        <div style={{ padding: '0 16px 10px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid #EDE4DC',
            borderRadius: 24, padding: '7px 16px',
            boxShadow: '0 1px 4px rgba(180,130,110,0.08)',
          }}>
            <span style={{ color: '#C4A898', fontSize: 13 }}>🔍</span>
            <input type="text" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#4A2A1A' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A898', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
          <select value={location} onChange={e => setLocation(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 24, border: '1px solid #EDE4DC',
            background: 'white', fontSize: 11, color: '#8A6A58', cursor: 'pointer', outline: 'none', flexShrink: 0,
          }}>
            {LOCATION_ORDER.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor count */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 18px 2px' }}>
        <p style={{ color: '#C4A898', fontSize: 11, margin: 0 }}>{sorted.length} vendors</p>
      </div>

      {/* Vendor grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '10px 16px 52px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))',
        gap: 12,
      }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, height: 100, opacity: 0.3, border: '1px solid #EDE4DC' }} />
            ))
          : sorted.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '52px 16px' }}>
                <div style={{ fontSize: 36 }}>🌸</div>
                <p style={{ color: '#C4A898', marginTop: 10, fontSize: 13 }}>No vendors found.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('All'); setLocation('All'); setShowNewOnly(false); setWeddingType('All') }}
                  style={{ marginTop: 8, padding: '6px 18px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11 }}>
                  Show all
                </button>
              </div>
            )
            : sorted.map(v => <VendorCard key={v.id} v={v} isNew={isNewVendor(v)} resetKey={cardResetKey} />)
        }
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #EDE4DC', color: '#C4A898', fontSize: 13 }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
