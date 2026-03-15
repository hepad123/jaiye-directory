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
}

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#B5294E'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const InstagramIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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

  useEffect(() => {
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id])

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

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2EAE4' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#C4A898', letterSpacing: 0.5 }}>
          {reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
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
      {reviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: '#FBF7F4', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7A5A4A' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && <p style={{ fontSize: 10, color: '#9A7A6A', margin: '3px 0 0', lineHeight: 1.4 }}>{r.comment}</p>}
        </div>
      ))}
    </div>
  )
}

function VendorCard({ v }: { v: Vendor }) {
  const [expanded, setExpanded] = useState(false)
  const colour    = getColour(v.category)
  const igHandle  = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: isFeatured ? `1.5px solid ${colour}55` : '1px solid #F0E8E2',
      overflow: 'hidden',
      boxShadow: isFeatured
        ? `0 4px 18px ${colour}22`
        : '0 2px 12px rgba(180,130,110,0.07)',
      position: 'relative',
    }}>
      {/* Colour top stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${colour}CC, ${colour}55)` }} />

      {/* ⭐ Featured badge — top left */}
      {isFeatured && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: '#FFF8E7',
          border: '1px solid #E8C87A',
          borderRadius: 20,
          padding: '2px 8px',
          display: 'flex', alignItems: 'center', gap: 3,
          fontSize: 9, fontWeight: 700, color: '#B8860B',
          letterSpacing: 0.5,
        }}>
          ⭐ Top pick
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>

        {/* Category */}
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3, opacity: 0.9 }}>
          {getEmoji(v.category)} {v.category}
        </div>

        {/* Name */}
        <div style={{ fontSize: 16, fontWeight: 600, color: '#2C1A12', lineHeight: 1.25, marginBottom: 6 }}>
          {v.name}
        </div>

        {/* Location — always visible */}
        {v.location && (
          <div style={{ fontSize: 11, color: '#9A8070', marginBottom: 5 }}>
            📍 {v.location}
          </div>
        )}

        {/* Rating — always visible if present */}
        {v.rating && (
          <div style={{ fontSize: 11, color: '#B8860B', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
            ⭐ {v.rating}
          </div>
        )}

        {/* Instagram */}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C45C7A', textDecoration: 'none', fontWeight: 500, marginBottom: v.discount_code ? 6 : 0 }}>
            <InstagramIcon /> @{igHandle}
          </a>
        )}

        {/* Discount */}
        {v.discount_code && (
          <div style={{ marginTop: igHandle ? 6 : 0, marginBottom: 2 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 20,
              background: '#2C1A12', color: '#F5E6C8',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.8
            }}>
              🏷️ {v.discount_code}
            </span>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2EAE4', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services  && <p style={{ fontSize: 11, color: '#6A4A38', margin: 0, lineHeight: 1.55 }}>{v.services}</p>}
            {v.phone     && <p style={{ fontSize: 11, color: '#8A7060', margin: 0 }}>📞 {v.phone}</p>}
            {v.email     && <p style={{ fontSize: 11, color: '#8A7060', margin: 0 }}>✉️ {v.email}</p>}
            {v.website   && (
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

        {/* More info — always at the bottom */}
        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{
            marginTop: 10,
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'none',
            border: '1px solid #EDE4DC',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 10, color: '#B09080', fontWeight: 500,
            padding: '5px 0',
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '1.5px solid #DDD0C8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#B09080', lineHeight: 1
            }}>{expanded ? '−' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [vendors, setVendors]   = useState<Vendor[]>([])
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('vendors').select('*').then(({ data, error }) => {
      if (error) console.error(error)
      else setVendors(data || [])
      setLoading(false)
    })
  }, [])

  // Event Planning first, then the rest alphabetically
  const otherCats = Array.from(new Set(vendors.map(v => v.category)))
    .filter(c => c !== 'Event Planning')
    .sort()
  const categories = ['All', 'Event Planning', ...otherCats]

  const getCategoryCount = (cat: string) =>
    cat === 'All' ? vendors.length : vendors.filter(v => v.category === cat).length

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      v.name?.toLowerCase().includes(q) ||
      v.services?.toLowerCase().includes(q) ||
      v.instagram?.toLowerCase().includes(q) ||
      v.notes?.toLowerCase().includes(q)
    const matchCat = category === '__discounts__'
      ? !!v.discount_code
      : category === 'All' || v.category === category
    return matchSearch && matchCat
  })

  return (
    <main style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', background: '#FDF8F4', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #3D1515 0%, #7A2A2A 45%, #B85C3A 100%)',
        padding: 'clamp(32px, 6vw, 60px) 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: '#E8C87A', letterSpacing: 8, marginBottom: 12, opacity: 0.9 }}>✦ ✦ ✦</div>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 58px)', color: '#FFF5EC', margin: '0 0 8px', fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.5 }}>
          Jaiye Directory
        </h1>
        <div style={{ width: 36, height: 1.5, background: '#E8C87A', margin: '12px auto', opacity: 0.8 }} />
        <p style={{ color: 'rgba(255,240,225,0.75)', fontSize: 'clamp(12px, 2.5vw, 15px)', margin: 0, letterSpacing: 0.3 }}>
          Your guide to the best Nigerian wedding vendors
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
              const emoji    = cat === 'All' ? '🌸'      : getEmoji(cat)
              const count    = getCategoryCount(cat)
              return (
                <button key={cat} onClick={() => setCategory(cat)} style={{
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
                  <span style={{ fontSize: 13 }}>{emoji}</span>
                  <span>{cat}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.28)' : '#EDE4DC',
                    color: isActive ? 'white' : '#A08070',
                    borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700
                  }}>{count}</span>
                </button>
              )
            })}

            {/* Discounts pill */}
            <button onClick={() => setCategory(category === '__discounts__' ? 'All' : '__discounts__')} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: 20, flexShrink: 0,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 11, fontWeight: 700,
              background: category === '__discounts__' ? '#C4922A' : '#2C1A12',
              color: category === '__discounts__' ? 'white' : '#F5E6C8',
              boxShadow: '0 2px 10px rgba(44,26,18,0.25)',
            }}>
              <span style={{ fontSize: 13 }}>🏷️</span>
              <span>Discounts</span>
              <span style={{
                background: '#C4922A', color: 'white',
                borderRadius: 10, padding: '1px 6px', fontSize: 9, fontWeight: 700
              }}>{vendors.filter(v => v.discount_code).length}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '0 16px 10px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid #EDE4DC',
            borderRadius: 24, padding: '7px 16px',
            boxShadow: '0 1px 4px rgba(180,130,110,0.08)'
          }}>
            <span style={{ color: '#C4A898', fontSize: 13 }}>🔍</span>
            <input type="text" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', color: '#4A2A1A' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A898', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* Count */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 18px 2px' }}>
        <p style={{ color: '#C4A898', fontSize: 11, margin: 0 }}>{filtered.length} vendors</p>
      </div>

      {/* Grid */}
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
          : filtered.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '52px 16px' }}>
                <div style={{ fontSize: 36 }}>🌸</div>
                <p style={{ color: '#C4A898', marginTop: 10, fontSize: 13 }}>No vendors found.</p>
                <button onClick={() => { setSearch(''); setCategory('All') }}
                  style={{ marginTop: 8, padding: '6px 18px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11 }}>
                  Show all
                </button>
              </div>
            )
            : filtered.map(v => <VendorCard key={v.id} v={v} />)
        }
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #EDE4DC', color: '#C4A898', fontSize: 13 }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
