'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

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

type CurrentUser = {
  name: string
  email: string
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

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#C45C7A'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const isNewVendor = (v: Vendor) => {
  if (!v.created_at) return false
  const created = new Date(v.created_at)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return created > weekAgo
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const InstagramIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#C45C7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="#C45C7A" stroke="none"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

function HeartIcon({ filled, colour }: { filled: boolean; colour: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? colour : 'none'}
      stroke={filled ? colour : '#C4A898'} strokeWidth="2"
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
          style={{ cursor: onRate ? 'pointer' : 'default', color: s <= rating ? '#D4A853' : '#E8DDD5', fontSize: 13 }}>★</span>
      ))}
    </div>
  )
}

// ─── Review Section ───────────────────────────────────────────────────────────

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
      <div style={{ marginBottom: 8 }}>
        {!usedVendor ? (
          <button onClick={() => setUsedVendor(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            border: '1px solid #E8DDD5', background: '#FDF8F4',
            cursor: 'pointer', fontSize: 11, color: '#9A7060', fontWeight: 500,
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            👋 I used this vendor {usedCount > 0 && <span style={{ color: '#C45C7A', fontWeight: 700 }}>· {usedCount}</span>}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input placeholder="Your name *" value={usedName} onChange={e => setUsedName(e.target.value)}
              style={{ flex: 1, padding: '5px 8px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, background: 'white', fontFamily: 'var(--font-jost, sans-serif)' }} />
            <button onClick={submitUsed} disabled={usedSubmitting || !usedName.trim()}
              style={{ padding: '5px 12px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: !usedName.trim() ? 0.5 : 1, fontFamily: 'var(--font-jost, sans-serif)' }}>✓</button>
            <button onClick={() => setUsedVendor(false)}
              style={{ padding: '5px 8px', background: 'none', border: 'none', fontSize: 13, color: '#bbb', cursor: 'pointer' }}>×</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#C4A898', letterSpacing: 0.5, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {realReviews.length > 0 ? `${realReviews.length} review${realReviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
        </span>
        <button onClick={() => setShowForm(!showForm)}
          style={{ fontSize: 10, color: '#C45C7A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {showForm ? 'Cancel' : '+ Add review'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#FDF5F0', borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <input placeholder="Your name *" value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, marginBottom: 6, boxSizing: 'border-box', background: 'white', fontFamily: 'var(--font-jost, sans-serif)' }} />
          <div style={{ marginBottom: 6 }}><StarRating rating={rating} onRate={setRating} /></div>
          <textarea placeholder="Share your experience..." value={comment} onChange={e => setComment(e.target.value)} rows={2}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #EDD8CE', borderRadius: 8, fontSize: 11, marginBottom: 6, boxSizing: 'border-box', resize: 'none', background: 'white', fontFamily: 'var(--font-jost, sans-serif)' }} />
          <button onClick={submitReview} disabled={submitting || !name.trim() || rating === 0}
            style={{ padding: '5px 14px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, fontSize: 11, cursor: 'pointer', opacity: (!name.trim() || rating === 0) ? 0.45 : 1, fontFamily: 'var(--font-jost, sans-serif)' }}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}

      {realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: '#FBF7F4', borderRadius: 8, padding: '6px 8px', marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#7A5A4A', fontFamily: 'var(--font-jost, sans-serif)' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && (
            <p style={{ fontSize: 10, color: '#9A7A6A', margin: '3px 0 0', lineHeight: 1.4, fontFamily: 'var(--font-jost, sans-serif)' }}>{r.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Vendor Card ──────────────────────────────────────────────────────────────

function VendorCard({
  v, isNew, resetKey, currentUser, savedIds, onToggleSave, onOpenAuth,
}: {
  v: Vendor
  isNew: boolean
  resetKey: number
  currentUser: CurrentUser | null
  savedIds: Set<string>
  onToggleSave: (vendorId: string) => void
  onOpenAuth: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  useEffect(() => { setExpanded(false) }, [resetKey])
  const [copied, setCopied] = useState(false)
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
      background: 'white',
      borderRadius: 16,
      border: isFeatured ? `1.5px solid ${colour}44` : '1px solid #EDE8E3',
      overflow: 'hidden',
      boxShadow: isFeatured ? `0 4px 18px ${colour}18` : '0 2px 12px rgba(180,130,110,0.06)',
      position: 'relative',
    }}>
      {/* Badges row — top right */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
        {isFeatured && (
          <div style={{ background: '#FDF3E3', border: '1px solid #E8C87A', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#A07820', fontFamily: 'var(--font-jost, sans-serif)' }}>
            ⭐ Top pick
          </div>
        )}
        {v.verified && (
          <div style={{ background: '#F0F7FF', border: '1px solid #AAD0FF', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#3A7BD5', fontFamily: 'var(--font-jost, sans-serif)' }}>
            ✓ Verified
          </div>
        )}
        {isNew && (
          <div style={{ background: '#EDF5E8', border: '1px solid #9AE6B4', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#3B6D11', fontFamily: 'var(--font-jost, sans-serif)' }}>
            🆕 New
          </div>
        )}
      </div>

      {/* Save / Heart button */}
      <button
        onClick={() => {
          if (!currentUser) { onOpenAuth(); return }
          onToggleSave(v.id)
        }}
        title={currentUser ? (isSaved ? 'Remove from saved' : 'Save vendor') : 'Sign in to save vendors'}
        style={{
          position: 'absolute',
          top: isFeatured ? 38 : 12,
          right: 12,
          background: isSaved ? '#FFF0F4' : 'white',
          border: `1px solid ${isSaved ? '#F4C0CC' : '#EDE4DC'}`,
          borderRadius: '50%', width: 28, height: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
          boxShadow: isSaved ? '0 2px 8px rgba(196,92,122,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'all 0.15s ease',
        }}>
        <HeartIcon filled={isSaved} colour="#C45C7A" />
      </button>

      <div style={{ padding: '14px 14px 12px' }}>
        {/* Category label */}
        <div style={{
          fontSize: 9, fontWeight: 600, color: colour,
          textTransform: 'uppercase', letterSpacing: 1.2,
          marginBottom: 4, opacity: 0.95,
          fontFamily: 'var(--font-jost, sans-serif)',
        }}>
          {getEmoji(v.category)} {v.category}
        </div>

        {/* Vendor name — Playfair Display */}
        <div style={{
          fontSize: 17, fontWeight: 700, color: '#2C1A12',
          lineHeight: 1.25, marginBottom: 8, paddingRight: 36,
          fontFamily: 'var(--font-playfair, serif)',
        }}>
          {v.name}
        </div>

        {/* Rating / used count */}
        {(avgRating !== null || usedCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {avgRating !== null && (
              <span style={{ fontSize: 11, color: '#B8860B', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>★ {avgRating}</span>
            )}
            {usedCount > 0 && (
              <span style={{ fontSize: 11, color: '#9A7060', fontFamily: 'var(--font-jost, sans-serif)' }}>👋 {usedCount} bride{usedCount !== 1 ? 's' : ''} used this</span>
            )}
          </div>
        )}

        {/* Location */}
        {v.location && (
          <div style={{ fontSize: 11, color: '#9A8A82', marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>
            📍 {v.location}
          </div>
        )}

        {/* Price */}
        {v.price_from && (
          <div style={{ fontSize: 11, color: '#5A8A72', fontWeight: 600, marginBottom: 3, fontFamily: 'var(--font-jost, sans-serif)' }}>
            💰 From ₦{v.price_from}
          </div>
        )}

        {/* Instagram — pink icon, grey handle */}
        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#9A8A82', textDecoration: 'none',
              marginBottom: 4, fontFamily: 'var(--font-jost, sans-serif)',
            }}>
            <InstagramIcon />
            @{igHandle}
          </a>
        )}

        {/* WhatsApp */}
        {whatsappUrl && (
          <div style={{ marginBottom: 4 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        )}

        {/* Discount code */}
        {v.discount_code && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#2C1A12', color: '#F5E6C8', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: 'var(--font-jost, sans-serif)' }}>
              🏷️ {v.discount_code}
            </span>
            <button onClick={copyCode} style={{
              padding: '4px 10px', borderRadius: 20,
              border: '1px solid #EDE4DC', background: copied ? '#F0FFF4' : 'white',
              fontSize: 10, color: copied ? '#276749' : '#9A7060',
              cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
              fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F2EAE4', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: '#6A4A38', margin: 0, lineHeight: 1.55, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: '#8A7060', margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>📞 {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: '#8A7060', margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>✉️ {v.email}</p>}
            {v.website  && (
              <a href={v.website.startsWith('http') ? v.website : `https://${v.website}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#6A9BB5', textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>
                🌐 {v.website}
              </a>
            )}
            {v.notes && <p style={{ fontSize: 10, color: '#B8A090', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{v.notes}</p>}
            <ReviewSection vendor={v} />
          </div>
        )}

        {/* More / Less info button */}
        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{
            marginTop: 10, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'none', border: '1px solid #EDE4DC', borderRadius: 20,
            cursor: 'pointer', fontSize: 10, color: '#9A8A82', fontWeight: 500,
            padding: '6px 0', fontFamily: 'var(--font-jost, sans-serif)',
            transition: 'background 0.15s ease',
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user: authUser, openAuthModal } = useAuth()

  const [vendors, setVendors]           = useState<Vendor[]>([])
  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState('All')
  const [location, setLocation]         = useState('All')
  const [showNewOnly, setShowNewOnly]   = useState(false)
  const [weddingType, setWeddingType]   = useState('All')
  const [loading, setLoading]           = useState(true)
  const [cardResetKey, setCardResetKey] = useState(0)

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [savedIds, setSavedIds]       = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jaiye_user')
      if (stored) {
        const user = JSON.parse(stored) as CurrentUser
        setCurrentUser(user)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (authUser?.email) {
      const displayName =
        authUser.user_metadata?.display_name ||
        authUser.email.split('@')[0]
      setCurrentUser({ name: displayName, email: authUser.email })
    }
  }, [authUser])

  useEffect(() => {
    if (!currentUser) { setSavedIds(new Set()); return }
    supabase
      .from('saved_vendors')
      .select('vendor_id')
      .eq('user_id', currentUser.email)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map(r => r.vendor_id)))
      })
  }, [currentUser])

  useEffect(() => {
    supabase.from('vendors').select('*').then(({ data, error }) => {
      if (error) console.error(error)
      else setVendors(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { setCardResetKey(k => k + 1) }, [category])

  function handleSignOut() {
    localStorage.removeItem('jaiye_user')
    setCurrentUser(null)
    setSavedIds(new Set())
  }

  const handleToggleSave = useCallback(async (vendorId: string) => {
    if (!currentUser) return
    const isSaved = savedIds.has(vendorId)
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(vendorId)
      else next.add(vendorId)
      return next
    })
    if (isSaved) {
      await supabase.from('saved_vendors').delete().eq('user_id', currentUser.email).eq('vendor_id', vendorId)
    } else {
      await supabase.from('saved_vendors').insert({ user_id: currentUser.email, vendor_id: vendorId })
    }
  }, [currentUser, savedIds])

  const vendorsWithSubcats = vendors.map(v =>
    v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v
  )

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
    const matchWeddingType = category !== 'Outfits' || weddingType === 'All' || v.wedding_type === weddingType || v.wedding_type === 'Both'
    return matchSearch && matchCat && matchLocation && matchNew && matchWeddingType
  })

  const sorted = [...filtered].sort((a, b) => {
    const aFeat = FEATURED_VENDORS.includes(a.name) ? 0 : 1
    const bFeat = FEATURED_VENDORS.includes(b.name) ? 0 : 1
    return aFeat - bFeat
  })

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: '#FDF8F4', minHeight: '100vh' }}>

      {/* ── Nav bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #EDE5DC',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 16,
      }}>
        {/* Saved vendors */}
        {currentUser && savedIds.size > 0 ? (
          <Link href="/saved" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: '#2C1A12', fontWeight: 500, textDecoration: 'none',
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            ♡ Saved
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: '#C45C7A', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{savedIds.size}</span>
          </Link>
        ) : !currentUser ? (
          <button onClick={openAuthModal} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: '#2C1A12', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            ♡ Saved
          </button>
        ) : null}

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: '#E0D8D2' }} />

        {/* Profile avatar */}
        {currentUser && authUser ? (
          <Link
            href={`/profile/${authUser.email?.split('@')[0]}`}
            title="My profile"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#F0EBE6', border: '1.5px solid #D8CEC8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#2C1A12',
              flexShrink: 0, fontFamily: 'var(--font-jost, sans-serif)',
            }}>
            {currentUser.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
          </Link>
        ) : (
          <button onClick={openAuthModal} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#F0EBE6', border: '1.5px solid #D8CEC8',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#9A8A82" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        )}

        {/* Sign out (only when signed in) */}
        {currentUser && (
          <button onClick={handleSignOut} style={{
            fontSize: 11, color: '#B0A49C', background: 'none',
            border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            Sign out
          </button>
        )}
      </div>

      {/* ── Hero ── */}
      <div style={{ background: '#fff' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 40, padding: 'clamp(32px, 5vw, 52px) clamp(20px, 4vw, 40px) clamp(28px, 4vw, 40px)',
          maxWidth: 1200, margin: '0 auto',
        }}>
          {/* Left: title */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
              color: '#C45C7A', marginBottom: 16, fontWeight: 500,
              fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              Wedding &amp; Event Vendors
            </div>
            <h1 style={{
              fontFamily: 'var(--font-playfair, serif)',
              fontSize: 'clamp(42px, 7vw, 76px)',
              fontWeight: 700, color: '#2C1A12',
              letterSpacing: '-1px', lineHeight: 0.95,
              margin: 0,
            }}>
              Jaiye Directory
            </h1>
          </div>

          {/* Right: tagline + stat */}
          <div style={{ textAlign: 'right', paddingBottom: 6, minWidth: 200, maxWidth: 260 }}>
            <p style={{
              fontSize: 13, color: '#7A6058', lineHeight: 1.75,
              marginBottom: 20, fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              Your guide to the best Nigerian<br />wedding and event vendors
            </p>
            <div style={{
              fontFamily: 'var(--font-playfair, serif)',
              fontSize: 40, fontWeight: 700, color: '#2C1A12',
              letterSpacing: '-1px', lineHeight: 1,
            }}>
              200+
            </div>
            <div style={{
              fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#9A8A82', marginTop: 2,
              fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              Vendors &amp; counting
            </div>
          </div>
        </div>

        {/* Gold rule */}
        <div style={{
          height: 2,
          background: 'linear-gradient(to right, #E8C87A 0%, #E8C87A 60%, transparent 100%)',
        }} />
      </div>

      {/* ── Sticky filters ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#FDF8F4', borderBottom: '1px solid #EDE4DC' }}>

        {/* Category pills */}
        <div style={{ padding: '14px 16px 0', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
              {categories.map(cat => {
                const isActive = category === cat
                const colour   = cat === 'All' ? '#2C1A12' : getColour(cat)
                const emoji    = cat === 'All' ? '🌸' : getEmoji(cat)
                const count    = getCategoryCount(cat)
                return (
                  <button key={cat} onClick={() => { setCategory(cat); setWeddingType('All') }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 40, flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                    background: isActive ? colour : '#EDE5DE',
                    color: isActive ? '#FDF8F4' : '#5A4038',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}>
                    <span>{emoji}</span>
                    <span>{cat}</span>
                    <span style={{ fontSize: 11, opacity: 0.55 }}>{count}</span>
                  </button>
                )
              })}
            </div>
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 12,
              width: 52, pointerEvents: 'none',
              background: 'linear-gradient(to right, transparent, #FDF8F4 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 11, color: '#C4A898', fontWeight: 700, paddingRight: 2, paddingBottom: 12 }}>+</span>
            </div>
          </div>
        </div>

        {/* Fashion sub-filters */}
        {category === 'Outfits' && (
          <div style={{ padding: '0 16px 8px', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'White Wedding', 'Traditional'].map(type => (
                <button key={type} onClick={() => setWeddingType(type)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '9px 18px', borderRadius: 40, flexShrink: 0,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontSize: 13, fontWeight: weddingType === type ? 500 : 400,
                  background: weddingType === type ? '#C07A2F' : '#EDE5DE',
                  color: weddingType === type ? '#FDF8F4' : '#5A4038',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  {type === 'White Wedding' ? '🤍' : type === 'Traditional' ? '👘' : '🌸'} {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discounts + New this week */}
        <div style={{ padding: '0 16px 10px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8 }}>
          <button onClick={() => { setCategory(category === '__discounts__' ? 'All' : '__discounts__'); setWeddingType('All') }} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 40, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: category === '__discounts__' ? 500 : 400,
            background: '#2C1A12', color: '#FDF8F4',
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            <span>🏷️</span>
            <span>Discounts</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{vendors.filter(v => v.discount_code).length}</span>
          </button>

          {newVendors.length > 0 && (
            <button onClick={() => setShowNewOnly(!showNewOnly)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 40, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: showNewOnly ? 500 : 400,
              background: showNewOnly ? '#276749' : '#EDE5DE',
              color: showNewOnly ? '#FDF8F4' : '#5A4038',
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-jost, sans-serif)',
            }}>
              <span>🆕</span>
              <span>New this week</span>
              <span style={{ fontSize: 11, opacity: 0.55 }}>{newVendors.length}</span>
            </button>
          )}
        </div>

        {/* Search + Location */}
        <div style={{ padding: '0 16px 12px', maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid #E0D8D2',
            borderRadius: 10, padding: '9px 16px',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#B0A49C" strokeWidth="1.2"/>
              <path d="M10 10l2 2" stroke="#B0A49C" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text" placeholder="Search vendors…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, background: 'transparent', color: '#2C1A12',
                fontFamily: 'var(--font-jost, sans-serif)',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4A898', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
          <select value={location} onChange={e => setLocation(e.target.value)} style={{
            padding: '9px 14px', borderRadius: 10, border: '1px solid #E0D8D2',
            background: 'white', fontSize: 13, color: '#5A4038',
            cursor: 'pointer', outline: 'none', flexShrink: 0,
            fontFamily: 'var(--font-jost, sans-serif)',
          }}>
            {LOCATION_ORDER.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor count */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '8px 18px 2px' }}>
        <p style={{ color: '#9A8A82', fontSize: 13, margin: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>
          {sorted.length} vendors
        </p>
      </div>

      {/* Vendor grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '10px 16px 52px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))',
        gap: 14,
      }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, height: 100, opacity: 0.3, border: '1px solid #EDE4DC' }} />
            ))
          : sorted.length === 0
            ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '52px 16px' }}>
                <div style={{ fontSize: 36 }}>🌸</div>
                <p style={{ color: '#C4A898', marginTop: 10, fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>No vendors found.</p>
                <button
                  onClick={() => { setSearch(''); setCategory('All'); setLocation('All'); setShowNewOnly(false); setWeddingType('All') }}
                  style={{ marginTop: 8, padding: '6px 18px', background: '#C45C7A', color: 'white', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-jost, sans-serif)' }}>
                  Show all
                </button>
              </div>
            )
            : sorted.map(v => (
              <VendorCard
                key={v.id}
                v={v}
                isNew={isNewVendor(v)}
                resetKey={cardResetKey}
                currentUser={currentUser}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
                onOpenAuth={openAuthModal}
              />
            ))
        }
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #EDE4DC', color: '#9A8A82', fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
