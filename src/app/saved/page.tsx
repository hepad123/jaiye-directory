'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
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

type CurrentUser = {
  name: string
  email: string
}

const FEATURED_VENDORS = ['Zapphaire Events', 'Glam by Omoye']

const CATEGORY_META: Record<string, { emoji: string; colour: string }> = {
  'Event Planning':        { emoji: '📋', colour: '#9B7BB8' },
  'Styling':               { emoji: '✨', colour: '#C45C7A' },
  'Outfits':               { emoji: '👗', colour: '#C4922A' },
  'Makeup':                { emoji: '💄', colour: '#D4789A' },
  'Hair & Gele':           { emoji: '💇🏾', colour: '#6A9BB5' },
  'Photography':           { emoji: '📸', colour: '#5A8A72' },
  'Videography & Content': { emoji: '🎥', colour: '#4A6A8A' },
  'Decor & Venue':         { emoji: '🏛️', colour: '#9A7A5A' },
  'Catering':              { emoji: '🍽️', colour: '#C4724A' },
  'Entertainment':         { emoji: '🎤', colour: '#7A6A9A' },
  'Other':                 { emoji: '✦',  colour: '#8A8A8A' },
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#B5294E'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

// ─── Icons ─────────────────────────────────────────────────────────────────

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

function HeartIcon({ filled, colour }: { filled: boolean; colour: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? colour : 'none'}
      stroke={filled ? colour : '#C4A898'} strokeWidth="2"
      style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

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

// ─── My Notes ────────────────────────────────────────────────────────────────

function MyNotes({
  vendorId,
  userId,
  initialNote,
}: {
  vendorId: string
  userId: string
  initialNote: string
}) {
  const [note, setNote] = useState(initialNote)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced auto-save — fires 800ms after user stops typing
  function handleChange(val: string) {
    setNote(val)
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      await supabase
        .from('saved_vendors')
        .update({ notes: val })
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1800)
    }, 800)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  return (
    <div style={{
      marginTop: 10,
      background: '#FFFBF5',
      border: '1px dashed #E8C87A',
      borderRadius: 10,
      padding: '8px 10px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#B8860B', letterSpacing: 0.4 }}>
          📝 My notes
        </span>
        <span style={{
          fontSize: 9, fontWeight: 600, transition: 'color 0.2s',
          color: saveStatus === 'saving' ? '#C4A898' : saveStatus === 'saved' ? '#5A8A72' : 'transparent',
        }}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '·'}
        </span>
      </div>

      {/* Prompt to start typing (no note yet, not focused) */}
      {!isEditing && !note && (
        <button
          onClick={() => setIsEditing(true)}
          style={{
            width: '100%', padding: '4px 0', background: 'none',
            border: 'none', cursor: 'text', textAlign: 'left',
            fontSize: 11, color: '#C4A898', fontStyle: 'italic',
            fontFamily: 'var(--font-dm-sans, sans-serif)',
          }}>
          + Add a private note about this vendor…
        </button>
      )}

      {/* Textarea — shown when editing or when there's an existing note */}
      {(isEditing || !!note) && (
        <textarea
          autoFocus={isEditing && !note}
          placeholder="e.g. Quoted ₦250k for aso-ebi, follow up in March…"
          value={note}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setIsEditing(true)}
          rows={3}
          style={{
            width: '100%', border: 'none', background: 'transparent',
            fontSize: 11, color: '#4A2A1A', lineHeight: 1.6,
            resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            fontFamily: 'var(--font-dm-sans, sans-serif)',
            padding: 0,
          }}
        />
      )}
    </div>
  )
}

// ─── Vendor Card (Saved Page) ─────────────────────────────────────────────────

function VendorCard({
  v, savedIds, onToggleSave, userId, savedNote,
}: {
  v: Vendor
  savedIds: Set<string>
  onToggleSave: (vendorId: string) => void
  userId: string
  savedNote: string
}) {
  const [expanded, setExpanded] = useState(false)
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
      background: 'white', borderRadius: 16,
      border: isFeatured ? `1.5px solid ${colour}55` : '1px solid #F0E8E2',
      overflow: 'hidden',
      boxShadow: isFeatured ? `0 4px 18px ${colour}22` : '0 2px 12px rgba(180,130,110,0.07)',
      position: 'relative',
    }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${colour}CC, ${colour}55)` }} />

      {isFeatured && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <div style={{ background: '#FFF8E7', border: '1px solid #E8C87A', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#B8860B' }}>
            ⭐ Top pick
          </div>
        </div>
      )}

      <button
        onClick={() => onToggleSave(v.id)}
        title="Remove from saved"
        style={{
          position: 'absolute', top: isFeatured ? 34 : 10, right: 10,
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

      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3, opacity: 0.9 }}>
          {getEmoji(v.category)} {v.category}
        </div>

        <div style={{ fontSize: 16, fontWeight: 600, color: '#2C1A12', lineHeight: 1.25, marginBottom: 6, paddingRight: 36 }}>
          {v.name}
        </div>

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

        {v.location && (
          <div style={{ fontSize: 11, color: '#9A8070', marginBottom: 4 }}>📍 {v.location}</div>
        )}

        {v.price_from && (
          <div style={{ fontSize: 11, color: '#5A8A72', fontWeight: 600, marginBottom: 4 }}>💰 From ₦{v.price_from}</div>
        )}

        {igHandle && (
          <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#C45C7A', textDecoration: 'none', fontWeight: 500, marginBottom: 4 }}>
            <InstagramIcon /> @{igHandle}
          </a>
        )}

        {whatsappUrl && (
          <div style={{ marginBottom: 4 }}>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        )}

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

        {/* ── Notes — always visible on the saved page ── */}
        <MyNotes vendorId={v.id} userId={userId} initialNote={savedNote} />

        {/* Expanded vendor details */}
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

// ─── Saved Page ────────────────────────────────────────────────────────────────

export default function SavedPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [savedVendors, setSavedVendors] = useState<Vendor[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jaiye_user')
      if (stored) {
        const user = JSON.parse(stored) as CurrentUser
        setCurrentUser(user)
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) return

    async function loadSaved() {
      setLoading(true)

      // Fetch saved rows including notes
      const { data: savedRows } = await supabase
        .from('saved_vendors')
        .select('vendor_id, notes')
        .eq('user_id', currentUser!.email)

      if (!savedRows || savedRows.length === 0) {
        setSavedVendors([])
        setSavedIds(new Set())
        setSavedNotes({})
        setLoading(false)
        return
      }

      const ids = savedRows.map(r => r.vendor_id)
      setSavedIds(new Set(ids))

      // Build notes map: vendorId → note text
      const notesMap: Record<string, string> = {}
      savedRows.forEach(r => { notesMap[r.vendor_id] = r.notes ?? '' })
      setSavedNotes(notesMap)

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .in('id', ids)

      if (vendorData) {
        const remapped = vendorData.map(v =>
          v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v
        )
        setSavedVendors(remapped)
      }
      setLoading(false)
    }

    loadSaved()
  }, [currentUser])

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
      setSavedVendors(prev => prev.filter(v => v.id !== vendorId))
      setSavedNotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
    }

    if (isSaved) {
      await supabase.from('saved_vendors')
        .delete()
        .eq('user_id', currentUser.email)
        .eq('vendor_id', vendorId)
    } else {
      await supabase.from('saved_vendors')
        .insert({ user_id: currentUser.email, vendor_id: vendorId })
    }
  }, [currentUser, savedIds])

  // Group by category in canonical order
  const grouped = CATEGORY_ORDER.reduce<Record<string, Vendor[]>>((acc, cat) => {
    const inCat = savedVendors.filter(v => v.category === cat)
    if (inCat.length > 0) acc[cat] = inCat
    return acc
  }, {})
  savedVendors.forEach(v => {
    if (!CATEGORY_ORDER.includes(v.category)) {
      if (!grouped[v.category]) grouped[v.category] = []
      if (!grouped[v.category].find(x => x.id === v.id)) grouped[v.category].push(v)
    }
  })

  const totalSaved = savedVendors.length

  return (
    <main style={{ fontFamily: 'var(--font-dm-sans, sans-serif)', background: '#FDF8F4', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #3D1515 0%, #7A2A2A 45%, #B85C3A 100%)',
        padding: 'clamp(28px, 5vw, 52px) 20px', textAlign: 'center',
      }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: 'rgba(232,200,122,0.7)', textDecoration: 'none',
          marginBottom: 16, letterSpacing: 0.3,
        }}>
          ← Back to directory
        </Link>
        <div style={{ fontSize: 13, color: '#E8C87A', letterSpacing: 8, marginBottom: 10, opacity: 0.9 }}>♡ ♡ ♡</div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 48px)', color: '#FFF5EC', margin: '0 0 6px', fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.5 }}>
          {currentUser ? `${currentUser.name.split(' ')[0]}'s Saved Vendors` : 'Saved Vendors'}
        </h1>
        <div style={{ width: 36, height: 1.5, background: '#E8C87A', margin: '10px auto', opacity: 0.8 }} />
        <p style={{ color: 'rgba(255,240,225,0.65)', fontSize: 13, margin: 0 }}>
          {loading ? 'Loading…' : totalSaved > 0 ? `${totalSaved} vendor${totalSaved !== 1 ? 's' : ''} saved` : 'Your shortlist, all in one place'}
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px 60px' }}>

        {!currentUser && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
            <h2 style={{ fontSize: 18, color: '#2C1A12', fontWeight: 700, margin: '0 0 8px' }}>Sign in to see your saved vendors</h2>
            <p style={{ color: '#9A8070', fontSize: 13, margin: '0 0 20px' }}>Head back to the directory and sign in to start saving vendors.</p>
            <Link href="/" style={{
              display: 'inline-block', padding: '10px 24px',
              background: '#C45C7A', color: 'white', borderRadius: 24,
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>
              Go to directory
            </Link>
          </div>
        )}

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))', gap: 12, marginTop: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, height: 120, opacity: 0.3, border: '1px solid #EDE4DC' }} />
            ))}
          </div>
        )}

        {!loading && currentUser && totalSaved === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
            <h2 style={{ fontSize: 18, color: '#2C1A12', fontWeight: 700, margin: '0 0 8px' }}>No saved vendors yet</h2>
            <p style={{ color: '#9A8070', fontSize: 13, margin: '0 0 20px' }}>Browse the directory and tap the ♡ on vendors you love.</p>
            <Link href="/" style={{
              display: 'inline-block', padding: '10px 24px',
              background: '#C45C7A', color: 'white', borderRadius: 24,
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
            }}>
              Browse vendors
            </Link>
          </div>
        )}

        {!loading && currentUser && totalSaved > 0 && (
          <div>
            {Object.entries(grouped).map(([cat, vendors]) => (
              <div key={cat} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 20,
                    background: getColour(cat), color: 'white',
                    fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
                  }}>
                    {getEmoji(cat)} {cat}
                  </span>
                  <span style={{ fontSize: 11, color: '#C4A898' }}>
                    {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 255px), 1fr))',
                  gap: 12,
                }}>
                  {vendors.map(v => (
                    <VendorCard
                      key={v.id}
                      v={v}
                      savedIds={savedIds}
                      onToggleSave={handleToggleSave}
                      userId={currentUser.email}
                      savedNote={savedNotes[v.id] ?? ''}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Link href="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 22px', borderRadius: 24,
                border: '1px solid #EDE4DC', background: 'white',
                color: '#8A6A58', fontSize: 12, textDecoration: 'none', fontWeight: 500,
              }}>
                ← Browse more vendors
              </Link>
            </div>
          </div>
        )}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #EDE4DC', color: '#C4A898', fontSize: 13 }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
