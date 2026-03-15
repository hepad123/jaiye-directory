'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

interface Vendor {
  id: number
  category: string
  name: string
  services: string | null
  location: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  website: string | null
  discount_code: string | null
  price_from: string | null
  rating: number | null
  notes: string | null
}

interface Review {
  id: number
  vendor_id: number
  reviewer_name: string
  rating: number
  comment: string | null
  created_at: string
}

// ─── Category config ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Event Planning':        '#7B4EA6',
  'Styling':               '#B5294E',
  'Fashion':               '#C4922A',
  'Makeup':                '#E8639A',
  'Hair & Gele':           '#3B82A0',
  'Photography':           '#2D6A4F',
  'Videography & Content': '#1C3A5E',
  'Decor & Venue':         '#8B5E3C',
  'Catering':              '#C25B2A',
  'Entertainment':         '#4B3F72',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#888'
}

function getInstagramHandle(instagram: string | null): string | null {
  if (!instagram) return null
  return instagram.replace(/^@/, '').trim()
}

// ─── Reviews section ──────────────────────────────────────────────────────────

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ color: s <= rating ? '#D4A853' : '#ddd' }}>★</span>
      ))}
    </span>
  )
}

function ReviewsSection({ vendorId }: { vendorId: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
    setReviews(data ?? [])
    setLoading(false)
    setFetched(true)
  }

  const toggle = () => {
    setExpanded(prev => {
      if (!prev && !fetched) fetchReviews()
      return !prev
    })
  }

  const submitReview = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError(null)
    setSubmitting(true)
    const { error: err } = await supabase.from('reviews').insert({
      vendor_id: vendorId,
      reviewer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    })
    if (err) {
      setError('Could not save review. Please try again.')
      setSubmitting(false)
      return
    }
    setName('')
    setComment('')
    setRating(5)
    setSubmitted(true)
    await fetchReviews()
    setSubmitting(false)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null

  return (
    <div style={{ marginTop: '8px' }}>
      <button className="reviews-toggle" onClick={toggle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>★</span>
          <span>Reviews</span>
          {avgRating !== null && (
            <span style={{ color: '#D4A853', fontWeight: 700 }}>{avgRating}</span>
          )}
          {reviews.length > 0 && (
            <span style={{ color: '#888', fontWeight: 400 }}>({reviews.length})</span>
          )}
        </span>
        <span style={{ fontSize: '11px', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {/* Existing reviews */}
          {loading && (
            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', margin: 0 }}>
              Loading reviews...
            </p>
          )}
          {!loading && reviews.length === 0 && (
            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', margin: 0 }}>
              No reviews yet — be the first!
            </p>
          )}
          {!loading && reviews.map(r => (
            <div
              key={r.id}
              style={{
                backgroundColor: '#FAFAFA',
                borderRadius: '10px',
                padding: '10px 12px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  {r.reviewer_name}
                </span>
                <StarDisplay rating={r.rating} size={13} />
              </div>
              {r.comment && (
                <p style={{ fontSize: '12px', color: '#555', margin: 0, lineHeight: 1.5 }}>
                  {r.comment}
                </p>
              )}
              <p style={{ fontSize: '11px', color: '#bbb', margin: '4px 0 0', }}>
                {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f0ebe4' }} />

          {/* Add review form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#555', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Leave a review
            </p>
            <input
              className="review-input"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
            />

            {/* Star picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#888', marginRight: '4px' }}>Rating:</span>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  className="star-btn"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  style={{ color: s <= (hoverRating || rating) ? '#D4A853' : '#ddd' }}
                  aria-label={`${s} star`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              className="review-input"
              placeholder="Your review (optional)"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              maxLength={300}
              style={{ resize: 'none' }}
            />

            {error && (
              <p style={{ fontSize: '12px', color: '#B5294E', margin: 0 }}>{error}</p>
            )}
            {submitted && (
              <p style={{ fontSize: '12px', color: '#2D6A4F', fontWeight: 600, margin: 0 }}>
                ✓ Review submitted!
              </p>
            )}

            <button className="submit-btn" onClick={submitReview} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Vendor card ──────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: Vendor }) {
  const color = getCategoryColor(vendor.category)
  const igHandle = getInstagramHandle(vendor.instagram)

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: '4px', backgroundColor: color, flexShrink: 0 }} />

      <div style={{ padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {/* Category + rating */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span
            style={{
              backgroundColor: color + '18',
              color: color,
              border: `1px solid ${color}30`,
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {vendor.category}
          </span>
          {vendor.rating && (
            <span style={{ color: '#D4A853', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ★ {vendor.rating}
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontSize: '21px',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {vendor.name}
        </h3>

        {/* Services */}
        {vendor.services && (
          <p
            className="line-clamp-2"
            style={{ fontSize: '13px', color: '#555', lineHeight: 1.5, margin: 0 }}
          >
            {vendor.services}
          </p>
        )}

        {/* Location */}
        {vendor.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px' }}>📍</span>
            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>{vendor.location}</span>
          </div>
        )}

        <div style={{ borderTop: '1px solid #f0ebe4' }} />

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {vendor.phone && (
            <a href={`tel:${vendor.phone}`}
               style={{ fontSize: '13px', color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📞</span><span>{vendor.phone}</span>
            </a>
          )}
          {vendor.email && (
            <a href={`mailto:${vendor.email}`}
               style={{ fontSize: '13px', color: '#B5294E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0 }}>✉️</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.email}</span>
            </a>
          )}
          {vendor.website && (
            <a href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
               target="_blank" rel="noopener noreferrer"
               style={{ fontSize: '13px', color: '#B5294E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ flexShrink: 0 }}>🌐</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
            </a>
          )}
          {igHandle && (
            <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
               style={{ fontSize: '13px', color: '#C2185B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📸</span><span>@{igHandle}</span>
            </a>
          )}
        </div>

        {/* Discount code */}
        {vendor.discount_code && vendor.discount_code.trim() !== '' && (
          <div style={{
            backgroundColor: '#FDF6EE', border: '1px dashed #D4A853', borderRadius: '8px',
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '14px' }}>🏷️</span>
            <div>
              <div style={{ fontSize: '10px', color: '#9a7832', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Discount Code
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#D4A853', letterSpacing: '0.05em' }}>
                {vendor.discount_code}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {vendor.notes && vendor.notes.trim() !== '' && (
          <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            {vendor.notes}
          </p>
        )}

        <div style={{ flex: 1, minHeight: '4px' }} />

        {/* Instagram button */}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
             style={{
               display: 'block', textAlign: 'center', backgroundColor: '#B5294E', color: '#ffffff',
               borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600,
               textDecoration: 'none', letterSpacing: '0.03em', transition: 'background-color 0.2s ease',
             }}
             onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#9b1f3f' }}
             onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#B5294E' }}
          >
            View on Instagram ↗
          </a>
        )}

        {/* Reviews */}
        <ReviewsSection vendorId={vendor.id} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    supabase
      .from('vendors')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (!error && data) setVendors(data)
        setLoading(false)
      })
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(vendors.map(v => v.category))).sort()
    return ['All', ...cats]
  }, [vendors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return vendors.filter(v => {
      const matchSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.services ?? '').toLowerCase().includes(q) ||
        (v.instagram ?? '').toLowerCase().includes(q) ||
        (v.notes ?? '').toLowerCase().includes(q)
      const matchCat = activeCategory === 'All' || v.category === activeCategory
      return matchSearch && matchCat
    })
  }, [vendors, search, activeCategory])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF6EE' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(135deg, #1a0a10 0%, #3d0f20 50%, #5c1a30 100%)',
        padding: 'clamp(40px, 8vw, 72px) 20px clamp(36px, 7vw, 60px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'rgba(212,168,83,0.08)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(181,41,78,0.12)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ color: '#D4A853', fontSize: '18px', letterSpacing: '0.3em', marginBottom: '14px', opacity: 0.8 }}>
            ✦ ✦ ✦
          </div>
          <h1 className="hero-title" style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontWeight: 600, color: '#ffffff', margin: '0 0 4px',
            lineHeight: 1, letterSpacing: '-0.01em',
          }}>
            Jaiye Directory
          </h1>
          <div style={{
            width: '72px', height: '2px', backgroundColor: '#D4A853',
            margin: '18px auto', borderRadius: '2px',
          }} />
          <p className="hero-tagline" style={{
            fontFamily: 'var(--font-dm-sans), sans-serif',
            color: 'rgba(255,255,255,0.75)', margin: 0,
            fontWeight: 300, letterSpacing: '0.04em',
          }}>
            Your guide to the best Nigerian wedding vendors
          </p>
        </div>
      </header>

      {/* ── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="filter-bar" style={{
        backgroundColor: '#FDF6EE',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Search */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute', left: '13px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '15px',
              color: '#aaa', pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, service, Instagram..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                borderRadius: '12px', border: '1.5px solid rgba(181,41,78,0.2)',
                backgroundColor: '#ffffff', fontSize: '15px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                color: '#1a1a1a', outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#B5294E' }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(181,41,78,0.2)' }}
            />
          </div>

          {/* Category pills */}
          <div className="scrollbar-hide" style={{
            display: 'flex', gap: '7px', overflowX: 'auto',
            paddingBottom: '2px', WebkitOverflowScrolling: 'touch',
          }}>
            {categories.map(cat => {
              const isActive = cat === activeCategory
              const color = cat === 'All' ? '#B5294E' : getCategoryColor(cat)
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 15px',
                    borderRadius: '20px',
                    border: `1.5px solid ${isActive ? color : 'rgba(0,0,0,0.12)'}`,
                    backgroundColor: isActive ? color : '#ffffff',
                    color: isActive ? '#ffffff' : '#555',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="main-content">

        {/* Count + clear */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: '14px', color: '#888', margin: 0 }}>
            {loading ? 'Loading vendors…' : (
              <>
                Showing{' '}
                <strong style={{ color: '#B5294E' }}>{filtered.length}</strong>
                {' '}of{' '}
                <strong style={{ color: '#1a1a1a' }}>{vendors.length}</strong>
                {' '}vendors
              </>
            )}
          </p>
          {(activeCategory !== 'All' || search) && (
            <button
              onClick={() => { setActiveCategory('All'); setSearch('') }}
              style={{
                fontSize: '12px', color: '#B5294E', background: 'none',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                textDecoration: 'underline',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="vendor-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                backgroundColor: '#fff', borderRadius: '16px', height: '340px',
                animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6,
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'clamp(48px,10vw,80px) 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌺</div>
            <h3 style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: '28px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px',
            }}>
              No vendors found
            </h3>
            <p style={{ fontSize: '15px', color: '#888', margin: '0 0 24px' }}>
              Try adjusting your search or category filter
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All') }}
              style={{
                backgroundColor: '#B5294E', color: '#fff', border: 'none',
                borderRadius: '10px', padding: '12px 28px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              Show all vendors
            </button>
          </div>
        )}

        {/* Vendor grid */}
        {!loading && filtered.length > 0 && (
          <div className="vendor-grid">
            {filtered.map(vendor => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '28px 24px',
        textAlign: 'center',
        backgroundColor: '#FDF6EE',
      }}>
        <p style={{
          fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontSize: '18px', color: '#B5294E', margin: 0, letterSpacing: '0.02em',
        }}>
          Made with ♥ for Nigerian brides
        </p>
      </footer>
    </div>
  )
}
