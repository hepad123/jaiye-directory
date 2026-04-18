'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'

const newsreader = "'Newsreader', var(--font-playfair, serif)"
const manrope = "'Manrope', var(--font-jost, sans-serif)"
const ACCENT = '#B4690E'
const BORDER = '#E8E3DC'

const CATEGORIES = [
  'Event Planning', 'Photography', 'Videography & Content', 'Decor & Venue',
  'Catering', 'Entertainment', 'Outfits', 'Styling', 'Hair & Gele',
  'Makeup', 'Hair', 'Lashes', 'Nails', 'Brows', 'Other'
]

type Props = {
  open: boolean
  onClose: () => void
}

export default function SuggestVendorModal({ open, onClose }: Props) {
  const { user } = useUser()
  const supabase = useSupabase()

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (!open) return null

  function reset() {
    setName(''); setCategory(''); setLocation(''); setInstagram(''); setPhone(''); setWebsite(''); setDone(false)
  }

  function handleClose() {
    reset(); onClose()
  }

  async function handleSubmit() {
    if (!name.trim() || !category) return
    setSaving(true)
    await supabase.from('vendor_suggestions').insert({
      name: name.trim(),
      category,
      location: location.trim() || null,
      instagram: instagram.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      suggested_by_clerk_id: user?.id || null,
    })
    setSaving(false)
    setDone(true)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&family=Manrope:wght@400;500;600;700&display=swap');
        .suggest-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; }
        @media(min-width: 640px) { .suggest-overlay { align-items: center; } }
        .suggest-box { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; padding: 28px 24px 40px; }
        @media(min-width: 640px) { .suggest-box { border-radius: 16px; padding: 28px 24px; } }
        .s-label { font-family: ${manrope}; font-size: 11px; font-weight: 700; color: #1C1917; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; display: block; }
        .s-input { width: 100%; border: 1px solid ${BORDER}; border-radius: 8px; padding: 10px 12px; font-family: ${manrope}; font-size: 14px; color: #1C1917; background: #fff; box-sizing: border-box; outline: none; }
        .s-input:focus { border-color: ${ACCENT}; }
        .s-submit { width: 100%; padding: 13px; background: ${ACCENT}; color: #fff; border: none; border-radius: 10px; font-family: ${manrope}; font-weight: 700; font-size: 15px; cursor: pointer; margin-top: 8px; }
        .s-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .s-cancel { display: block; text-align: center; margin-top: 12px; font-family: ${manrope}; font-size: 13px; color: #78716c; cursor: pointer; background: none; border: none; width: 100%; }
      `}</style>

      <div className="suggest-overlay" onClick={handleClose}>
        <div className="suggest-box" onClick={e => e.stopPropagation()}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#10022;</div>
              <h2 style={{ fontFamily: newsreader, fontSize: 22, color: '#1C1917', margin: '0 0 10px' }}>Thank you!</h2>
              <p style={{ fontFamily: manrope, fontSize: 14, color: '#78716c', margin: '0 0 28px', lineHeight: 1.6 }}>We'll review your suggestion and add them to the directory if they're a great fit.</p>
              <button className="s-submit" onClick={handleClose}>Done</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: manrope, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 4px' }}>Community</p>
                <h2 style={{ fontFamily: newsreader, fontSize: 22, color: '#1C1917', margin: '0 0 6px' }}>Suggest a vendor or stylist</h2>
                <p style={{ fontFamily: manrope, fontSize: 13, color: '#78716c', margin: 0 }}>Know someone who should be on Jaiye? Let us know.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="s-label">Name *</label>
                  <input className="s-input" placeholder="e.g. Glam by Omoye" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div>
                  <label className="s-label">Category *</label>
                  <select className="s-input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="s-label">Location</label>
                  <input className="s-input" placeholder="e.g. Lagos, London" value={location} onChange={e => setLocation(e.target.value)} />
                </div>

                <div>
                  <label className="s-label">Instagram *</label>
                  <input className="s-input" placeholder="@handle" value={instagram} onChange={e => setInstagram(e.target.value)} />
                </div>

                <div>
                  <label className="s-label">Phone</label>
                  <input className="s-input" placeholder="+234..." value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                <div>
                  <label className="s-label">Website</label>
                  <input className="s-input" placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
              </div>

              <button className="s-submit" onClick={handleSubmit} disabled={saving || !name.trim() || !category || !instagram.trim()}>{'Submit suggestion'}</button>
              <button className="s-cancel" onClick={handleClose}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
