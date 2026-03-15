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

const CATEGORY_COLOURS: Record<string, string> = {
  'Event Planning': '#7B4EA6',
  'Styling': '#B5294E',
  'Fashion': '#C4922A',
  'Makeup': '#E8639A',
  'Hair & Gele': '#3B82A0',
  'Photography': '#2D6A4F',
  'Videography & Content': '#1C3A5E',
  'Decor & Venue': '#8B5E3C',
  'Catering': '#C25B2A',
  'Entertainment': '#4B3F72',
  'Fashion & Wedding Dress': '#C4922A',
  'Catering-Cake-Food': '#C25B2A',
  'Furniture & Rentals': '#8B5E3C',
  'Accessories': '#C4922A',
  'Flowers': '#8B5E3C',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Event Planning': '📋',
  'Styling': '✨',
  'Fashion': '👗',
  'Makeup': '💄',
  'Hair & Gele': '💇🏾',
  'Photography': '📸',
  'Videography & Content': '🎥',
  'Decor & Venue': '🏛️',
  'Catering': '🍽️',
  'Entertainment': '🎤',
  'Fashion & Wedding Dress': '👗',
  'Catering-Cake-Food': '🍽️',
  'Furniture & Rentals': '🏛️',
  'Accessories': '👗',
  'Flowers': '🏛️',
}

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)}
          style={{ cursor: onRate ? 'pointer' : 'default', color: s <= rating ? '#D4A853' : '#ddd', fontSize: 12 }}>★</span>
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
    <div style={{ borderTop: '1px solid #f5eeee', marginTop: 8, paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
          {reviews.length > 0 ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}` : 'No reviews yet'}
        </span>
        <button onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 10, color: '#B5294E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {showForm ? 'Cancel' : '+ Review'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fdf8f5', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          <input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', border: '1px solid #e8d5d5', borderRadius: 4, fontSize: 11, marginBottom: 5, boxSizing: 'border-box' }} />
          <div style={{ marginBottom: 5 }}>
            <StarRating rating={rating} onRate={setRating} />
          </div>
          <textarea placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} rows={2}
            style={{ width: '100%', padding: '5px 8px', border: '1px solid #e8d5d5', borderRadius: 4, fontSize: 11, marginBottom: 5, boxSizing: 'border-box', resize: 'none' }} />
          <button onClick={submitReview} disabled={submitting || !name.trim() || rating === 0}
            style={{ padding: '4px 12px', background: '#B5294E', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', opacity: (!name.trim() || rating === 0) ? 0.5 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {reviews.slice(0, 2).map(r => (
            <div key={r.id} style={{ background: '#fafafa', borderRadius: 4, padding: '5px 7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#444' }}>{r.reviewer_name}</span>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p style={{ fontSize: 10, color: '#777', margin: '2px 0 0' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('vendors').select('*').then(({ data, error }) => {
      if (error) console.error(error)
      else setVendors(data || [])
      setLoading(false)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(vendors.map(v => v.category))).sort()]

  const getCategoryCount = (cat: string) =>
    cat === 'All' ? vendors.length : vendors.filter(v => v.category === cat).length

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      v.name?.toLowerCase().includes(q) ||
      v.services?.toLowerCase().includes(q) ||
      v.instagram?.toLowerCase().includes(q) ||
      v.notes?.toLowerCase().includes(q)
    const matchCat = category === 'All' || v.category === category
    return matchSearch && matchCat
  })

  const discountsOnly = filtered.filter(v => v.discount_code)

  return (
    <main style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', background: '#FAF6F3', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #2C1810 0%, #5C2D1E 40%, #8B4513 100%)',
        padding: 'clamp(28px, 5vw, 52px) 16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 16, color: '#D4A853', letterSpacing: 6, marginBottom: 10 }}>✦ ✦ ✦</div>
        <h1 style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontSize: 'clamp(32px, 7vw, 64px)',
          color: 'white', margin: '0 0 6px', fontWeight: 400, lineHeight: 1.1
        }}>
          Jaiye Directory
        </h1>
        <div style={{ width: 40, height: 1.5, background: '#D4A853', margin: '10px auto' }} />
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(13px, 2.5vw, 16px)', margin: 0 }}>
          Your guide to the best Nigerian wedding vendors
        </p>
      </div>

      {/* Category pills */}
      <div style={{ background: '#FAF6F3', padding: '14px 16px 0', borderBottom: '1px solid #EDE8E3' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const count = getCategoryCount(cat)
              const emoji = cat === 'All' ? '🌟' : (CATEGORY_EMOJIS[cat] || '✦')
              const colour = CATEGORY_COLOURS[cat] || '#B5294E'
              const isActive = category === cat
              return (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 24,
                  border: isActive ? 'none' : '1.5px solid #E8E0D8',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: 500,
                  background: isActive ? colour : 'white',
                  color: isActive ? 'white' : '#555',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: 14 }}>{emoji}</span>
                  <span>{cat}</span>
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#F0EAE4',
                    color: isActive ? 'white' : '#888',
                    borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700
                  }}>{count}</span>
                </button>
              )
            })}
            {/* Discounts pill */}
            <button onClick={() => {}} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 24,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 600,
              background: '#1C1C1C', color: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              <span style={{ fontSize: 14 }}>🏷️</span>
              <span>Discounts</span>
              <span style={{ background: '#D4A853', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                {vendors.filter(v => v.discount_code).length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: '#FAF6F3', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #EDE8E3' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #E8E0D8', borderRadius: 24, padding: '8px 16px' }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#333' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16, padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Count */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px 0' }}>
        <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
          {filtered.length} vendor{filtered.length !== 1 ? 's' : ''} {category !== 'All' ? `in ${category}` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      </div>

      {/* Grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '12px 16px 48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
        gap: 12
      }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 10, height: 140, opacity: 0.4, border: '1px solid #EDE8E3' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 36 }}>🌸</div>
            <p style={{ color: '#888', marginTop: 10, fontSize: 14 }}>No vendors found.</p>
            <button onClick={() => { setSearch(''); setCategory('All') }}
              style={{ marginTop: 8, padding: '7px 18px', background: '#B5294E', color: 'white', border: 'none', borderRadius: 16, cursor: 'pointer', fontSize: 12 }}>
              Show all vendors
            </button>
          </div>
        ) : (
          filtered.map(v => {
            const colour = CATEGORY_COLOURS[v.category] || '#B5294E'
            const igHandle = v.instagram?.replace('@', '')
            return (
              <div key={v.id} style={{
                background: 'white', borderRadius: 10,
                border: '1px solid #EDE8E3',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.15s',
              }}>
                <div style={{ height: 3, background: colour }} />
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {/* Category + name */}
                  <div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: colour,
                      textTransform: 'uppercase', letterSpacing: 1
                    }}>
                      {CATEGORY_EMOJIS[v.category] || '✦'} {v.category}
                    </span>
                    <h3 style={{
                      fontFamily: 'var(--font-cormorant, serif)',
                      fontSize: 17, margin: '2px 0 0', color: '#1C1C1C', fontWeight: 600, lineHeight: 1.2
                    }}>{v.name}</h3>
                  </div>

                  {/* Services */}
                  {v.services && (
                    <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {v.services}
                    </p>
                  )}

                  {/* Location */}
                  {v.location && (
                    <p style={{ fontSize: 11, color: '#999', margin: 0 }}>📍 {v.location}</p>
                  )}

                  {/* Contact row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {igHandle && (
                      <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#B5294E', textDecoration: 'none', fontWeight: 500 }}>
                        <InstagramIcon /> {v.instagram}
                      </a>
                    )}
                    {v.website && (
                      <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: '#3B82A0', textDecoration: 'none' }}>
                        🌐 {v.website}
                      </a>
                    )}
                  </div>

                  {v.phone && <p style={{ fontSize: 11, color: '#666', margin: 0 }}>📞 {v.phone}</p>}
                  {v.email && <p style={{ fontSize: 11, color: '#666', margin: 0 }}>✉️ {v.email}</p>}

                  {/* Discount */}
                  {v.discount_code && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#888' }}>
                        {v.discount_code.includes('%') || v.discount_code.includes('off') ? v.discount_code : `Discount available`}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        background: '#1C1C1C', color: 'white', letterSpacing: 0.5,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        📋 {v.discount_code}
                      </span>
                    </div>
                  )}

                  {v.notes && <p style={{ fontSize: 10, color: '#bbb', margin: 0, fontStyle: 'italic' }}>{v.notes}</p>}

                  {/* Reviews */}
                  <ReviewSection vendor={v} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid #EDE8E3',
        color: '#B5294E',
        fontFamily: 'var(--font-cormorant, serif)',
        fontSize: 16
      }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
