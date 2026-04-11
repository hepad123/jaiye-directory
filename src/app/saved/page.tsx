'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import { sanitizeNote, safeVendorUrl, LIMITS } from '@/lib/sanitize'

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

type Service = {
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

const SERVICE_CATEGORY_META: Record<string, { emoji: string; colour: string }> = {
  'Hair':   { emoji: '💇🏾', colour: '#D97706' },
  'Makeup': { emoji: '💄',   colour: '#DB2777' },
  'Lashes': { emoji: '✨',   colour: '#0D9488' },
}

const SUB_COLOR: Record<string, string> = {
  'Braids': '#7C3AED', 'Wigs': '#DB2777', 'Natural Hair': '#059669', 'Weaves': '#D97706',
  'Locs': '#92400E', 'Knotless': '#6D28D9', 'Faux Locs': '#B45309', 'Bridal MUA': '#BE185D',
  'Glam': '#DC2626', 'Editorial': '#1D4ED8', 'Airbrush': '#0891B2',
  'Extensions': '#7C3AED', 'Lash Lift': '#0D9488', 'Strip Lashes': '#9333EA',
  'Relaxed Hair': '#0284C7', 'Sew In': '#7C2D12', 'Silk Press': '#9D174D', 'Textured Hair': '#065F46',
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

function formatNaira(n: number) {
  return 'N' + n.toLocaleString('en-NG', { maximumFractionDigits: 0 })
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'var(--accent)' : 'var(--border)'} strokeWidth="2" style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1,2,3,4,5].map(s => (<span key={s} style={{ color: s <= rating ? 'var(--accent)' : 'var(--border)', fontSize: 13 }}>★</span>))}
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.origin + '/shortlist/' + username : 'https://jaiye-directory.vercel.app/shortlist/' + username
  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'My vendor shortlist - Jaiye Directory', text: 'Check out the vendors I have saved for my wedding', url }); return } catch { }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }
  return (
    <button onClick={handleShare} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 24, background: copied ? 'var(--accent-light)' : 'var(--bg-card)', border: '1.5px solid ' + (copied ? 'var(--gold)' : 'var(--border)'), color: copied ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.2s' }}>
      {copied ? 'Link copied!' : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          Share my shortlist
        </>
      )}
    </button>
  )
}

function BudgetBar({ quotes }: { quotes: Record<string, number> }) {
  const entries = Object.entries(quotes).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (entries.length === 0) return null
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>💰</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: play }}>Budget Tracker</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0D9488', fontFamily: play }}>{formatNaira(total)}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: jost }}>{entries.length} vendor{entries.length !== 1 ? 's' : ''} quoted</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map(([name, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          return (
            <div key={name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', fontFamily: jost }}>{formatNaira(amount)}</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg-pill)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(to right, #D97706, #B45309)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MyNotes({ vendorId, initialNote, initialQuotedPrice, onQuoteChange }: { vendorId: string; initialNote: string; initialQuotedPrice: number | null; onQuoteChange: (vendorId: string, name: string, amount: number | null) => void }) {
  const [note, setNote] = useState(initialNote)
  const [price, setPrice] = useState(initialQuotedPrice?.toString() ?? '')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isEditing, setIsEditing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const jost = 'var(--font-jost, sans-serif)'

  function scheduleSave(newNote: string, newPrice: string) {
    setSaveStatus('saving')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const parsedPrice = parseFloat(newPrice.replace(/[^0-9.]/g, ''))
      const priceVal = isNaN(parsedPrice) ? null : parsedPrice
      const res = await fetch('/api/saved', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendorId, notes: newNote, quoted_price: priceVal }) })
      if (!res.ok) { setSaveStatus('idle'); return }
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1800)
    }, 800)
  }

  function handleNoteChange(val: string) { const clean = sanitizeNote(val); setNote(clean); scheduleSave(clean, price) }
  function handlePriceChange(val: string) {
    const clean = val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    setPrice(clean)
    const parsed = parseFloat(clean)
    onQuoteChange(vendorId, '', isNaN(parsed) ? null : parsed)
    scheduleSave(note, clean)
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  return (
    <div style={{ marginTop: 10, background: 'var(--bg-pill)', border: '1px dashed var(--border)', borderRadius: 10, padding: '8px 10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: 0.4, fontFamily: jost }}>My notes</span>
        <span style={{ fontSize: 9, fontWeight: 600, fontFamily: jost, color: saveStatus === 'saving' ? 'var(--text-muted)' : saveStatus === 'saved' ? '#16A34A' : 'transparent' }}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : '.'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost, flexShrink: 0 }}>Quoted price N</span>
        <input type="text" inputMode="numeric" placeholder="e.g. 250000" value={price} onChange={e => handlePriceChange(e.target.value)} style={{ flex: 1, minWidth: 0, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, background: 'var(--bg-card)', color: 'var(--text)', outline: 'none', fontFamily: jost }} />
      </div>
      {!isEditing && !note && (<button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '4px 0', background: 'none', border: 'none', cursor: 'text', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: jost }}>+ Add a private note...</button>)}
      {(isEditing || !!note) && (<textarea autoFocus={isEditing && !note} placeholder="e.g. Quoted N250k, follow up in March..." value={note} onChange={e => handleNoteChange(e.target.value)} onFocus={() => setIsEditing(true)} rows={3} maxLength={LIMITS.note} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 11, color: 'var(--text)', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: jost, padding: 0 }} />)}
    </div>
  )
}

function ReviewSection({ vendor }: { vendor: Vendor }) {
  const supabase = useSupabase()
  const [reviews, setReviews] = useState<Review[]>([])
  useEffect(() => {
    supabase.from('reviews').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).then(({ data }) => { if (data) setReviews(data) })
  }, [vendor.id])
  const realReviews = reviews.filter(r => r.comment !== '__used__')
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{realReviews.length > 0 ? realReviews.length + ' review' + (realReviews.length !== 1 ? 's' : '') : 'No reviews yet'}</span>
      {realReviews.slice(0, 2).map(r => (
        <div key={r.id} style={{ background: 'var(--bg-pill)', borderRadius: 8, padding: '6px 8px', marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-jost, sans-serif)' }}>{r.reviewer_name}</span>
            <StarRating rating={r.rating} />
          </div>
          {r.comment && r.comment !== '__used__' && (<p style={{ fontSize: 10, color: 'var(--text-pill)', margin: '3px 0 0', lineHeight: 1.4, fontFamily: 'var(--font-jost, sans-serif)' }}>{r.comment}</p>)}
        </div>
      ))}
    </div>
  )
}

function VendorCard({ v, savedIds, onToggleSave, savedNote, savedQuotedPrice, onQuoteChange }: { v: Vendor; savedIds: Set<string>; onToggleSave: (id: string) => void; savedNote: string; savedQuotedPrice: number | null; onQuoteChange: (vendorId: string, name: string, amount: number | null) => void }) {
  const supabase = useSupabase()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [usedCount, setUsedCount] = useState(0)
  const colour = getColour(v.category)
  const igHandle = v.instagram?.replace('@', '').trim()
  const isFeatured = FEATURED_VENDORS.includes(v.name)
  const hasDetails = v.services || v.phone || v.email || v.notes || v.website
  const isSaved = savedIds.has(v.id)
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'

  useEffect(() => {
    supabase.from('reviews').select('rating, comment').eq('vendor_id', v.id).then(({ data }) => {
      if (!data || data.length === 0) return
      const real = data.filter(r => r.comment !== '__used__')
      if (real.length > 0) setAvgRating(Math.round(real.reduce((s, r) => s + r.rating, 0) / real.length * 10) / 10)
    })
    supabase.from('vendor_used').select('id', { count: 'exact' }).eq('vendor_id', v.id).then(({ count }) => { if (count) setUsedCount(count) })
  }, [v.id])

  function copyCode() { navigator.clipboard.writeText(v.discount_code); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const whatsappUrl = v.phone?.replace(/\D/g, '') ? 'https://wa.me/' + v.phone.replace(/\D/g, '') : null

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-start' }}>
        {isFeatured && <div style={{ background: 'var(--accent-light)', border: '1px solid var(--gold)', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: 'var(--gold)', fontFamily: jost }}>Top pick</div>}
        {v.verified  && <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#4338CA', fontFamily: jost }}>Verified</div>}
      </div>
      <button onClick={() => onToggleSave(v.id)} style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? 'var(--accent-light)' : 'var(--bg-card)', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease' }}>
        <HeartIcon filled={isSaved} />
      </button>
      <div style={{ padding: '14px 14px 12px', paddingTop: (isFeatured || v.verified) ? 36 : 14 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: jost }}>{getEmoji(v.category)} {v.category}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8, paddingRight: 36, fontFamily: play }}>{v.name}</div>
        {(avgRating !== null || usedCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            {avgRating !== null && <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: jost }}>★ {avgRating}</span>}
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost }}>used by {usedCount}</span>}
          </div>
        )}
        {v.location && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontFamily: jost }}>📍 {v.location}</div>}
        {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, marginBottom: 3, fontFamily: jost }}>From N{v.price_from}</div>}
        {igHandle && (<a href={'https://instagram.com/' + igHandle} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 4, fontFamily: jost }}>@{igHandle}</a>)}
        {whatsappUrl && (<div style={{ marginBottom: 4 }}><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none', fontFamily: jost }}>WhatsApp</a></div>)}
        {v.discount_code && (
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--text)', color: 'var(--accent-light)', fontSize: 10, fontWeight: 700, letterSpacing: 0.8, fontFamily: jost }}>🏷️ {v.discount_code}</span>
            <button onClick={copyCode} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: copied ? 'var(--accent-light)' : 'var(--bg-card)', fontSize: 10, color: copied ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontFamily: jost }}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        )}
        <MyNotes vendorId={v.id} initialNote={savedNote} initialQuotedPrice={savedQuotedPrice} onQuoteChange={(vid, _name, amount) => onQuoteChange(vid, v.name, amount)} />
        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {v.services && <p style={{ fontSize: 11, color: 'var(--text-pill)', margin: 0, lineHeight: 1.55, fontFamily: jost }}>{v.services}</p>}
            {v.phone    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: jost }}>📞 {v.phone}</p>}
            {v.email    && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: jost }}>✉️ {v.email}</p>}
            {safeVendorUrl(v.website) && (<a href={safeVendorUrl(v.website)!} target="_blank" rel="noopener noreferrer nofollow" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: jost }}>🌐 {v.website}</a>)}
            {v.notes && <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, fontFamily: jost }}>{v.notes}</p>}
            <ReviewSection vendor={v} />
          </div>
        )}
        {hasDetails && (
          <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '6px 0', fontFamily: jost }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
            {expanded ? 'Less info' : 'More info'}
          </button>
        )}
      </div>
    </div>
  )
}

function ServiceCard({ service, savedIds, onToggleSave }: { service: Service; savedIds: Set<string>; onToggleSave: (id: string) => void }) {
  const isSaved = savedIds.has(service.id)
  const subs = service.subcategories || []
  const catMeta = SERVICE_CATEGORY_META[service.category] || { emoji: '✦', colour: '#D97706' }
  const igUrl = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const waUrl = service.phone ? 'https://wa.me/' + service.phone.replace(/\D/g, '') : null
  const loc = [service.location, service.city].filter(Boolean).join(', ')
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-card)' }}>
      <button onClick={() => onToggleSave(service.id)} style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? 'var(--accent-light)' : 'var(--bg-card)', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s ease', zIndex: 1 }}>
        <HeartIcon filled={isSaved} />
      </button>
      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: catMeta.colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: jost }}>{catMeta.emoji} {service.category}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 6, paddingRight: 36, fontFamily: play }}>{service.name}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {subs.map((s: string) => (<span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: (SUB_COLOR[s] || catMeta.colour) + '18', color: SUB_COLOR[s] || catMeta.colour, fontSize: 10, fontWeight: 600, fontFamily: jost }}>{s}</span>))}
        </div>
        {loc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: jost }}>📍 {loc}</div>}
        {service.bio && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: jost }}>{service.bio}</p>}
        <div style={{ display: 'flex', gap: 6 }}>
          {igUrl && (<a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}><InstagramIcon />Instagram</a>)}
          {waUrl && (<a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}><WhatsAppIcon />WhatsApp</a>)}
        </div>
      </div>
    </div>
  )
}

type Tab = 'vendors' | 'services'

export default function SavedPage() {
  const supabase = useSupabase()
  const { user, isLoaded } = useUser()
  const { openSignIn } = useClerk()
  const [activeTab, setActiveTab] = useState<Tab>('vendors')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [savedVendors, setSavedVendors] = useState<Vendor[]>([])
  const [savedServices, setSavedServices] = useState<Service[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savedServiceIds, setSavedServiceIds] = useState<Set<string>>(new Set())
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({})
  const [savedQuotes, setSavedQuotes] = useState<Record<string, number | null>>({})
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('display_name, username').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'You')
        setUsername(data?.username || '')
      })
  }, [user])

  useEffect(() => {
    if (!isLoaded) return
    if (!user?.id) { setLoading(false); return }
    async function loadSaved() {
      setLoading(true)
      const [savedVendorRows, savedServiceRows] = await Promise.all([
        supabase.from('saved_vendors').select('vendor_id, notes, quoted_price').eq('clerk_user_id', user!.id),
        supabase.from('saved_services').select('service_id').eq('clerk_user_id', user!.id),
      ])
      const vendorRows = savedVendorRows.data || []
      const serviceRows = savedServiceRows.data || []
      setSavedIds(new Set(vendorRows.map(r => r.vendor_id)))
      setSavedServiceIds(new Set(serviceRows.map(r => r.service_id)))
      const notesMap: Record<string, string> = {}
      const quotesMap: Record<string, number | null> = {}
      vendorRows.forEach(r => { notesMap[r.vendor_id] = r.notes ?? ''; quotesMap[r.vendor_id] = r.quoted_price ?? null })
      setSavedNotes(notesMap)
      setSavedQuotes(quotesMap)
      const [vendorData, serviceData] = await Promise.all([
        vendorRows.length > 0 ? supabase.from('vendors').select('*').in('id', vendorRows.map(r => r.vendor_id)) : Promise.resolve({ data: [] }),
        serviceRows.length > 0 ? supabase.from('services').select('*').in('id', serviceRows.map(r => r.service_id)) : Promise.resolve({ data: [] }),
      ])
      if (vendorData.data) {
        const mapped = vendorData.data.map(v => v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v)
        setSavedVendors(mapped)
        const names: Record<string, string> = {}
        mapped.forEach(v => { names[v.id] = v.name })
        setVendorNames(names)
      }
      if (serviceData.data) setSavedServices(serviceData.data)
      setLoading(false)
    }
    loadSaved()
  }, [user, isLoaded])

  const handleToggleSave = useCallback(async (vendorId: string) => {
    if (!user?.id) return
    const isSaved = savedIds.has(vendorId)
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(vendorId) : n.add(vendorId); return n })
    if (isSaved) {
      setSavedVendors(prev => prev.filter(v => v.id !== vendorId))
      setSavedNotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
      setSavedQuotes(prev => { const n = { ...prev }; delete n[vendorId]; return n })
      await fetch('/api/saved', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendorId }) })
    } else {
      await fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendor_id: vendorId }) })
    }
    window.dispatchEvent(new Event('saved-change'))
  }, [user, savedIds])

  const handleToggleServiceSave = useCallback(async (serviceId: string) => {
    if (!user?.id) return
    const isSaved = savedServiceIds.has(serviceId)
    setSavedServiceIds(prev => { const n = new Set(prev); isSaved ? n.delete(serviceId) : n.add(serviceId); return n })
    if (isSaved) {
      setSavedServices(prev => prev.filter(s => s.id !== serviceId))
      await supabase.from('saved_services').delete().eq('clerk_user_id', user.id).eq('service_id', serviceId)
    } else {
      await supabase.from('saved_services').insert({ clerk_user_id: user.id, service_id: serviceId })
    }
  }, [user, savedServiceIds, supabase])

  function
