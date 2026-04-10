'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import Navbar from '@/components/Navbar'

interface Service {
  id: string
  name: string
  category: string
  subcategory: string
  city: string
  location: string | null
  instagram: string | null
  phone: string | null
  price_from: number | null
  bio: string | null
  verified: boolean
}

const CATEGORIES: Record<string, string[]> = {
  Hair: ['All', 'Braids', 'Wigs', 'Natural Hair', 'Weaves', 'Locs', 'Knotless', 'Faux Locs'],
  Makeup: ['All', 'Bridal MUA', 'Glam', 'Editorial', 'Airbrush'],
  Lashes: ['All', 'Extensions', 'Lash Lift', 'Strip Lashes'],
}

const CITIES = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan']

const CAT_ICON: Record<string, string> = { Hair: 'Hair', Makeup: 'MUA', Lashes: 'Lash' }

const SUB_COLOR: Record<string, string> = {
  'Braids': '#7C3AED', 'Wigs': '#DB2777', 'Natural Hair': '#059669', 'Weaves': '#D97706',
  'Locs': '#92400E', 'Knotless': '#6D28D9', 'Faux Locs': '#B45309', 'Bridal MUA': '#BE185D',
  'Glam': '#DC2626', 'Editorial': '#1D4ED8', 'Airbrush': '#0891B2',
  'Extensions': '#7C3AED', 'Lash Lift': '#0D9488', 'Strip Lashes': '#9333EA',
}

const NAIRA = 'N'
const PIN = 'v'
const HEART_EMPTY = 'o'
const HEART_FULL = 'O'
const CHECK = 'v'
const IG_LABEL = 'Instagram'
const CALL_LABEL = 'Call'
const NO_RESULT_LABELS: Record<string, string> = { Hair: 'Hair', Makeup: 'Makeup', Lashes: 'Lashes' }

function priceStr(price: number | null): string {
  if (!price) return 'Price on request'
  return NAIRA + price.toLocaleString()
}

export default function ServicesPage() {
  const { user } = useUser()
  const supabase = useSupabase()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Hair')
  const [sub, setSub] = useState('All')
  const [city, setCity] = useState('All')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => { setSub('All') }, [cat])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('services').select('*').eq('category', cat).order('verified', { ascending: false }).order('name')
    if (sub !== 'All') q = q.eq('subcategory', sub)
    if (city !== 'All') q = q.eq('city', city)
    const { data } = await q
    setServices(data || [])
    setLoading(false)
  }, [supabase, cat, sub, city])

  const fetchSaved = useCallback(async () => {
    if (!user?.id) { setSavedIds(new Set()); return }
    const { data } = await supabase.from('saved_services').select('service_id').eq('clerk_user_id', user.id)
    setSavedIds(new Set((data || []).map((r: { service_id: string }) => r.service_id)))
  }, [supabase, user])

  useEffect(() => { fetchServices() }, [fetchServices])
  useEffect(() => { fetchSaved() }, [fetchSaved])

  const toggleSave = async (sid: string) => {
    if (!user?.id) return
    setSavingId(sid)
    if (savedIds.has(sid)) {
      await supabase.from('saved_services').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
      setSavedIds(prev => { const n = new Set(prev); n.delete(sid); return n })
    } else {
      await supabase.from('saved_services').insert({ clerk_user_id: user.id, service_id: sid })
      setSavedIds(prev => new Set(prev).add(sid))
    }
    setSavingId(null)
  }

  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: jost }}>

        <div style={{ background: '#1C1917', color: '#fff', padding: '56px 24px 48px', textAlign: 'center' }}>
          <p style={{ fontFamily: play, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Beauty and Personal Care</p>
          <h1 style={{ fontFamily: play, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, lineHeight: 1.15, margin: '0 0 16px' }}>Find Your Glam</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>Hair stylists, makeup artists and lash technicians across Nigeria</p>
        </div>

        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex' }}>
            {Object.keys(CATEGORIES).map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding: '18px 28px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid var(--accent)' : '2px solid transparent', color: cat === c ? 'var(--accent)' : 'var(--text-muted)', fontFamily: jost, fontSize: 15, fontWeight: cat === c ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES[cat].map(s => (
                <button key={s} onClick={() => setSub(s)} style={{ padding: '5px 16px', borderRadius: 999, border: '1px solid', borderColor: sub === s ? 'var(--accent)' : 'var(--border)', background: sub === s ? 'var(--accent)' : 'transparent', color: sub === s ? '#fff' : 'var(--text-muted)', fontSize: 13, fontFamily: jost, fontWeight: sub === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>City:</span>
              {CITIES.map(ci => (
                <button key={ci} onClick={() => setCity(ci)} style={{ padding: '4px 14px', borderRadius: 999, border: '1px solid', borderColor: city === ci ? '#B45309' : 'var(--border)', background: city === ci ? 'rgba(180,83,9,0.08)' : 'transparent', color: city === ci ? '#B45309' : 'var(--text-muted)', fontSize: 13, fontFamily: jost, fontWeight: city === ci ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{ci}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {!loading && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              {services.length} {services.length === 1 ? 'result' : 'results'}
              {sub !== 'All' ? ' - ' + sub : ''}
              {city !== 'All' ? ' - ' + city : ''}
            </p>
          )}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 12, height: 200, animation: 'pulse 1.5s ease infinite', opacity: 0.5 }} />
              ))}
            </div>
          )}
          {!loading && services.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontFamily: play, fontSize: 22, marginBottom: 8 }}>No {NO_RESULT_LABELS[cat]} results found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Try a different subcategory or city</p>
            </div>
          )}
          {!loading && services.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {services.map(sv => (
                <Card key={sv.id} service={sv} isSaved={savedIds.has(sv.id)} isSaving={savingId === sv.id} onToggleSave={() => toggleSave(sv.id)} isLoggedIn={!!user} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:0.25} }`}</style>
    </>
  )
}

function Card({ service, isSaved, isSaving, onToggleSave, isLoggedIn }: { service: Service; isSaved: boolean; isSaving: boolean; onToggleSave: () => void; isLoggedIn: boolean }) {
  const ac = SUB_COLOR[service.subcategory] || '#D97706'
  const igUrl = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const telUrl = service.phone ? 'tel:' + service.phone : null
  const loc = [service.location, service.city].filter(Boolean).join(', ')
  const price = priceStr(service.price_from)
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'
  const linkBase: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, transition: 'all 0.15s' }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
      <div style={{ height: 4, background: ac }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <h3 style={{ fontFamily: play, fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.name}</h3>
              {service.verified && <span style={{ fontSize: 12, color: 'var(--accent)', flexShrink: 0 }}>{CHECK}</span>}
            </div>
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, background: ac + '18', color: ac, fontSize: 11, fontWeight: 600 }}>{service.subcategory}</span>
          </div>
          <button onClick={onToggleSave} disabled={isSaving || !isLoggedIn} title={!isLoggedIn ? 'Sign in to save' : isSaved ? 'Remove' : 'Save'} style={{ background: isSaved ? 'var(--accent)' : 'transparent', border: '1px solid', borderColor: isSaved ? 'var(--accent)' : 'var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoggedIn ? 'pointer' : 'default', opacity: isSaving ? 0.5 : 1, transition: 'all 0.15s', flexShrink: 0, marginLeft: 8 }}>
            <span style={{ fontSize: 14 }}>{isSaved ? HEART_FULL : HEART_EMPTY}</span>
          </button>
        </div>
        {loc && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px' }}>{PIN} {loc}</p>}
        {service.bio && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{service.bio}</p>}
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>{price}{service.price_from && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> from</span>}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {igUrl && <a href={igUrl} target="_blank" rel="noopener noreferrer" style={linkBase} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>{IG_LABEL}</a>}
          {telUrl && <a href={telUrl} style={linkBase} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#B45309'; (e.currentTarget as HTMLElement).style.color = '#B45309' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>{CALL_LABEL}</a>}
        </div>
      </div>
    </div>
  )
}
