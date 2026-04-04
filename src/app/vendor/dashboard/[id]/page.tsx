'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { sanitizeText, safeVendorUrl, LIMITS } from '@/lib/sanitize'

type Vendor = {
  id: string
  name: string
  category: string
  location: string
  services: string
  phone: string
  email: string
  instagram: string
  website: string
  price_from: string
  bio: string
  cover_image_url: string
  claim_status: string
  claimed_by: string
}

type Review = {
  id: string
  reviewer_name: string
  rating: number
  comment: string
  created_at: string
  response?: { id: string; response: string }
}

type Photo = {
  id: string
  url: string
  caption: string
}

export default function VendorDashboard() {
  const { id }   = useParams() as { id: string }
  const router   = useRouter()
  const { user } = useAuth()

  const [vendor, setVendor]         = useState<Vendor | null>(null)
  const [reviews, setReviews]       = useState<Review[]>([])
  const [photos, setPhotos]         = useState<Photo[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const [activeTab, setActiveTab]   = useState<'profile' | 'reviews' | 'photos'>('profile')
  const [uploading, setUploading]   = useState(false)
  const fileRef                     = useRef<HTMLInputElement>(null)

  // Editable fields
  const [bio, setBio]               = useState('')
  const [services, setServices]     = useState('')
  const [phone, setPhone]           = useState('')
  const [website, setWebsite]       = useState('')
  const [instagram, setInstagram]   = useState('')
  const [priceFrom, setPriceFrom]   = useState('')

  useEffect(() => {
    async function load() {
      const { data: v } = await supabase
        .from('vendors').select('*').eq('id', id).maybeSingle()

      if (!v || v.claimed_by !== user?.id || v.claim_status !== 'claimed') {
        router.replace('/')
        return
      }

      setVendor(v)
      setBio(v.bio || '')
      setServices(v.services || '')
      setPhone(v.phone || '')
      setWebsite(v.website || '')
      setInstagram(v.instagram || '')
      setPriceFrom(v.price_from || '')

      // Load reviews with responses
      const { data: reviewData } = await supabase
        .from('reviews').select('id, reviewer_name, rating, comment, created_at')
        .eq('vendor_id', id)
        .neq('comment', '__used__')
        .order('created_at', { ascending: false })

      if (reviewData) {
        const reviewIds = reviewData.map(r => r.id)
        const { data: responseData } = await supabase
          .from('review_responses').select('id, review_id, response')
          .in('review_id', reviewIds)

        const responseMap: Record<string, { id: string; response: string }> = {}
        responseData?.forEach(r => { responseMap[r.review_id] = { id: r.id, response: r.response } })

        setReviews(reviewData.map(r => ({ ...r, response: responseMap[r.id] })))
      }

      // Load photos
      const { data: photoData } = await supabase
        .from('vendor_photos').select('*').eq('vendor_id', id)
        .order('created_at', { ascending: false })
      if (photoData) setPhotos(photoData)

      setLoading(false)
    }

    if (user?.id) load()
  }, [id, user, router])

  async function saveProfile() {
    setSaving(true); setSaveMsg('')
    const { error } = await supabase.from('vendors').update({
      bio:       sanitizeText(bio, 500),
      services:  sanitizeText(services, LIMITS.generic),
      phone:     sanitizeText(phone, 30),
      website:   safeVendorUrl(website) || website,
      instagram: sanitizeText(instagram.replace('@', ''), 50),
      price_from: sanitizeText(priceFrom, 20),
    }).eq('id', id)

    if (error) { setSaveMsg('Error saving. Please try again.') }
    else { setSaveMsg('Saved ✓') }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function uploadPhoto(file: File) {
    if (!user?.id) return
    setUploading(true)
    const ext      = file.name.split('.').pop()
    const fileName = `${id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('vendor-photos')
      .upload(fileName, file, { upsert: false })

    if (uploadError) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('vendor-photos').getPublicUrl(fileName)

    const { data: photo } = await supabase.from('vendor_photos')
      .insert({ vendor_id: id, user_id: user.id, url: publicUrl })
      .select().maybeSingle()

    if (photo) setPhotos(prev => [photo, ...prev])
    setUploading(false)
  }

  async function deletePhoto(photoId: string, url: string) {
    await supabase.from('vendor_photos').delete().eq('id', photoId)
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function submitResponse(reviewId: string, response: string) {
    if (!user?.id || !response.trim()) return
    const { data } = await supabase.from('review_responses')
      .insert({ review_id: reviewId, vendor_id: id, user_id: user.id, response: response.trim() })
      .select().maybeSingle()

    if (data) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, response: { id: data.id, response: data.response } } : r
      ))
    }
  }

  async function deleteResponse(reviewId: string, responseId: string) {
    await supabase.from('review_responses').delete().eq('id', responseId)
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, response: undefined } : r
    ))
  }

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </main>
    )
  }

  if (!vendor) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid var(--border)', borderRadius: 10,
    fontSize: 13, color: 'var(--text)', background: 'var(--bg-card)',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-jost, sans-serif)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    letterSpacing: 0.5, display: 'block', marginBottom: 6,
  }

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>Vendor Dashboard</div>
          <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{vendor.name}</h1>
        </div>
        <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← Directory</Link>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex' }}>
        {[
          { key: 'profile', label: '✏️ Profile' },
          { key: 'reviews', label: `💬 Reviews (${reviews.length})` },
          { key: 'photos',  label: `📸 Photos (${photos.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} style={{
            flex: 1, padding: '12px 8px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500,
            fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>Business details</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>BIO</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} maxLength={500}
                    placeholder="Tell brides about your business, style, and what makes you special…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>{bio.length}/500</div>
                </div>

                <div>
                  <label style={labelStyle}>SERVICES</label>
                  <textarea value={services} onChange={e => setServices(e.target.value)} rows={3} maxLength={500}
                    placeholder="e.g. Bridal makeup, editorial looks, trials…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>PHONE / WHATSAPP</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} maxLength={20}
                      placeholder="+234 800 000 0000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>PRICE FROM (₦)</label>
                    <input type="text" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} maxLength={20}
                      placeholder="e.g. 50,000" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>INSTAGRAM</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>@</span>
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value.replace('@', ''))} maxLength={50}
                      placeholder="yourhandle" style={{ ...inputStyle, paddingLeft: 30 }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>WEBSITE</label>
                  <input type="text" value={website} onChange={e => setWebsite(e.target.value)} maxLength={200}
                    placeholder="https://yourwebsite.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                <button onClick={saveProfile} disabled={saving} style={{
                  padding: '11px 24px', background: saving ? 'var(--bg-pill)' : 'var(--accent)',
                  color: saving ? 'var(--text-muted)' : 'white', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
                  fontFamily: 'var(--font-jost, sans-serif)', transition: 'all 0.2s',
                }}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                {saveMsg && <span style={{ fontSize: 12, color: saveMsg.includes('Error') ? '#DC2626' : '#16A34A', fontWeight: 600 }}>{saveMsg}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                No reviews yet. They'll appear here when customers leave feedback.
              </div>
            ) : reviews.map(r => (
              <ReviewCard key={r.id} review={r} onSubmitResponse={submitResponse} onDeleteResponse={deleteResponse} />
            ))}
          </div>
        )}

        {/* Photos tab */}
        {activeTab === 'photos' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }} />

            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              width: '100%', padding: '14px', background: 'var(--bg-card)',
              border: '2px dashed var(--border)', borderRadius: 14, cursor: uploading ? 'default' : 'pointer',
              fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)',
              marginBottom: 16, transition: 'all 0.15s',
            }}>
              {uploading ? 'Uploading…' : '📸 Upload a photo'}
            </button>

            {photos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                No photos yet. Upload your work to attract more bookings.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: 'var(--bg-pill)' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => deletePhoto(p.id, p.url)} style={{
                      position: 'absolute', top: 6, right: 6, width: 24, height: 24,
                      borderRadius: '50%', background: 'rgba(28,25,23,0.7)', border: 'none',
                      color: 'white', fontSize: 14, cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ReviewCard({ review, onSubmitResponse, onDeleteResponse }: {
  review: Review
  onSubmitResponse: (reviewId: string, response: string) => Promise<void>
  onDeleteResponse: (reviewId: string, responseId: string) => Promise<void>
}) {
  const [showForm, setShowForm]   = useState(false)
  const [response, setResponse]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!response.trim()) return
    setSubmitting(true)
    await onSubmitResponse(review.id, response)
    setResponse(''); setShowForm(false); setSubmitting(false)
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 16, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-playfair, serif)' }}>{review.reviewer_name}</span>
          <span style={{ marginLeft: 8, color: 'var(--accent)', fontSize: 12 }}>{'★'.repeat(review.rating)}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
      {review.comment && <p style={{ fontSize: 13, color: 'var(--text-pill)', margin: '0 0 12px', lineHeight: 1.5 }}>{review.comment}</p>}

      {review.response ? (
        <div style={{ background: 'var(--bg-pill)', borderRadius: 10, padding: '10px 14px', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>Your response</div>
          <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{review.response.response}</p>
          <button onClick={() => onDeleteResponse(review.id, review.response!.id)}
            style={{ marginTop: 8, fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Delete response
          </button>
        </div>
      ) : (
        <div>
          {!showForm ? (
            <button onClick={() => setShowForm(true)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
              + Reply to this review
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} maxLength={1000}
                placeholder="Write a professional, helpful response…"
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 12, color: 'var(--text)', background: 'var(--bg-card)', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-jost, sans-serif)', lineHeight: 1.6 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSubmit} disabled={submitting || !response.trim()} style={{ padding: '8px 18px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {submitting ? 'Posting…' : 'Post response'}
                </button>
                <button onClick={() => { setShowForm(false); setResponse('') }} style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
