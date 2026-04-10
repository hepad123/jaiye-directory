'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'
import Navbar from '@/components/Navbar'

interface Service {
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
  verified: boolean
  website: string | null
}

type ServiceStats = {
  usedCount: number
  recCount: number
  hasUsed: boolean
  hasRec: boolean
}

const CATEGORIES: Record<string, string[]> = {
  Hair: ['All', 'Braids', 'Natural Hair', 'Relaxed Hair', 'Sew In', 'Silk Press', 'Textured Hair', 'Wigs', 'Weaves', 'Locs', 'Knotless', 'Faux Locs'],
  Makeup: ['All', 'Bridal MUA', 'Glam', 'Editorial', 'Airbrush'],
  Lashes: ['All', 'Extensions', 'Lash Lift', 'Strip Lashes'],
}

const CITIES = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan']

const SUB_COLOR: Record<string, string> = {
  'Braids': '#7C3AED', 'Wigs': '#DB2777', 'Natural Hair': '#059669', 'Weaves': '#D97706',
  'Locs': '#92400E', 'Knotless': '#6D28D9', 'Faux Locs': '#B45309', 'Bridal MUA': '#BE185D',
  'Glam': '#DC2626', 'Editorial': '#1D4ED8', 'Airbrush': '#0891B2',
  'Extensions': '#7C3AED', 'Lash Lift': '#0D9488', 'Strip Lashes': '#9333EA',
  'Relaxed Hair': '#0284C7', 'Sew In': '#7C2D12', 'Silk Press': '#9D174D', 'Textured Hair': '#065F46',
}

function priceStr(price: number | null): string {
  if (!price) return 'Price on request'
  return 'N' + price.toLocaleString()
}

const emptyStats: ServiceStats = { usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }

export default function ServicesPage() {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const supabase = useSupabase()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Hair')
  const [sub, setSub] = useState('All')
  const [city, setCity] = useState('All')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Record<string, ServiceStats>>({})

  useEffect(() => { setSub('All') }, [cat])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('services').select('*').eq('category', cat).order('verified', { ascending: false }).order('name')
    if (sub !== 'All') q = q.contains('subcategories', [sub])
    if (city !== 'All') q = q.eq('city', city)
    const { data } = await q
    const rows = data || []
    setServices(rows)
    if (rows.length > 0) {
      const ids = rows.map((s: Service) => s.id)
      const [usedRes, recRes] = await Promise.all([
        supabase.from('service_used').select('service_id, clerk_user_id').in('service_id', ids),
        supabase.from('service_recommendations').select('service_id, clerk_user_id').in('service_id', ids),
      ])
      const usedRows = usedRes.data || []
      const recRows  = recRes.data  || []
      const newStats: Record<string, ServiceStats> = {}
      rows.forEach((s: Service) => {
        newStats[s.id] = {
          usedCount: usedRows.filter((r: {service_id: string}) => r.service_id === s.id).length,
          recCount:  recRows.filter((r: {service_id: string})  => r.service_id === s.id).length,
          hasUsed:   user?.id ? usedRows.some((r: {service_id: string; clerk_user_id: string}) => r.service_id === s.id && r.clerk_user_id === user.id) : false,
          hasRec:    user?.id ? recRows.some((r: {service_id: string; clerk_user_id: string})  => r.service_id === s.id && r.clerk_user_id === user.id) : false,
        }
      })
      setStats(newStats)
    }
    setLoading(false)
  }, [supabase, cat, sub, city, user])

  const fetchSaved = useCallback(async () => {
    if (!user?.id) { setSavedIds(new Set()); return }
    const { data } = await supabase.from('saved_services').select('service_id').eq('clerk_user_id', user.id)
    setSavedIds(new Set((data || []).map((r: { service_id: string }) => r.service_id)))
  }, [supabase, user])

  useEffect(() => { fetchServices() }, [fetchServices])
  useEffect(() => { fetchSaved() }, [fetchSaved])

  const toggleSave = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const isSaved = savedIds.has(sid)
    setSavedIds(prev => { const n = new Set(prev); isSaved ? n.delete(sid) : n.add(sid); return n })
    if (isSaved) {
      await supabase.from('saved_services').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
    } else {
      await supabase.from('saved_services').insert({ clerk_user_id: user.id, service_id: sid })
    }
  }, [supabase, user, savedIds, openSignIn])

  const toggleUsed = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[sid] || emptyStats
    if (cur.hasUsed) {
      await supabase.from('service_used').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasUsed: false, usedCount: Math.max(0, prev[sid].usedCount - 1) } }))
    } else {
      await supabase.from('service_used').insert({ clerk_user_id: user.id, service_id: sid })
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasUsed: true, usedCount: (prev[sid]?.usedCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

  const toggleRec = useCallback(async (sid: string) => {
    if (!user?.id) { openSignIn(); return }
    const cur = stats[sid] || emptyStats
    if (cur.hasRec) {
      await supabase.from('service_recommendations').delete().eq('clerk_user_id', user.id).eq('service_id', sid)
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasRec: false, recCount: Math.max(0, prev[sid].recCount - 1) } }))
    } else {
      await supabase.from('service_recommendations').insert({ clerk_user_id: user.id, service_id: sid })
      setStats(prev => ({ ...prev, [sid]: { ...prev[sid], hasRec: true, recCount: (prev[sid]?.recCount || 0) + 1 } }))
    }
  }, [supabase, user, stats, openSignIn])

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
            {Object.keys(CATEGORIES).map(c => (<button key={c} onClick={() => setCat(c)} style={{ padding: '18px 28px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid var(--accent)' : '2px solid transparent', color: cat === c ? 'var(--accent)' : 'var(--text-muted)', fontFamily: jost, fontSize: 15, fontWeight: cat === c ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>{c}</button>))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES[cat].map(s => (<button key={s} onClick={() => setSub(s)} style={{ padding: '5px 16px', borderRadius: 999, border: '1px solid', borderColor: sub === s ? 'var(--accent)' : 'var(--border)', background: sub === s ? 'var(--accent)' : 'transparent', color: sub === s ? '#fff' : 'var(--text-muted)', fontSize: 13, fontFamily: jost, fontWeight: sub === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{s}</button>))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>City:</span>
              {CITIES.map(ci => (<button key={ci} onClick={() => setCity(ci)} style={{ padding: '4px 14px', borderRadius: 999, border: '1px solid', borderColor: city === ci ? '#B45309' : 'var(--border)', background: city === ci ? 'rgba(180,83,9,0.08)' : 'transparent', color: city === ci ? '#B45309' : 'var(--text-muted)', fontSize: 13, fontFamily: jost, fontWeight: city === ci ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{ci}</button>))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
          {!loading && (<p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{services.length} {services.length === 1 ? 'result' : 'results'}{sub !== 'All' ? ' - ' + sub : ''}{city !== 'All' ? ' - ' + city : ''}</p>)}
          {loading && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>{[0,1,2,3,4,5].map(i => (<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 12, height: 200, animation: 'pulse 1.5s ease infinite', opacity: 0.5 }} />))}</div>)}
          {!loading && services.length === 0 && (<div style={{ textAlign: 'center', padding: '80px 24px' }}><p style={{ fontFamily: play, fontSize: 22, marginBottom: 8 }}>No results found</p><p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Try a different subcategory or city</p></div>)}
          {!loading && services.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {services.map(sv => (<Card key={sv.id} service={sv} isSaved={savedIds.has(sv.id)} onToggleSave={() => toggleSave(sv.id)} stats={stats[sv.id] || emptyStats} onToggleUsed={() => toggleUsed(sv.id)} onToggleRec={() => toggleRec(sv.id)} isLoggedIn={!!user} onOpenAuth={openSignIn} />))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:0.25} }`}</style>
    </>
  )
}

function Card({ service, isSaved, onToggleSave, stats, onToggleUsed, onToggleRec, isLoggedIn, onOpenAuth }: {
  service: Service; isSaved: boolean; onToggleSave: () => void
  stats: ServiceStats; onToggleUsed: () => void; onToggleRec: () => void
  isLoggedIn: boolean; onOpenAuth: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const subs = service.subcategories || []
  const ac   = SUB_COLOR[subs[0]] || '#D97706'
  const igUrl  = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const telUrl = service.phone ? 'tel:' + service.phone : null
  const webUrl = service.website ? 'https://' + service.website : null
  const loc    = [service.location, service.city].filter(Boolean).join(', ')
  const price  = priceStr(service.price_from)
  const jost   = 'var(--font-jost, sans-serif)'
  const play   = 'var(--font-playfair, serif)'
  const { usedCount, recCount, hasUsed, hasRec } = stats

  const linkBase: React.CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, transition: 'all 0.15s' }
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: jost, border: '1px solid' }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
      <div style={{ height: 4, background: ac }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <h3 style={{ fontFamily: play, fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.name}</h3>
              {service.verified && <span style={{ fontSize: 11, color: 'var(--accent)', flexShrink: 0, fontFamily: jost }}>verified</span>}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {subs.map((s: string) => (<span key={s} style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, background: (SUB_COLOR[s] || '#D97706') + '18', color: SUB_COLOR[s] || '#D97706', fontSize: 11, fontWeight: 600 }}>{s}</span>))}
            </div>
          </div>
          <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleSave() }} title={!isLoggedIn ? 'Sign in to save' : isSaved ? 'Remove' : 'Save'} style={{ background: isSaved ? 'var(--accent)' : 'transparent', border: '1px solid', borderColor: isSaved ? 'var(--accent)' : 'var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, marginLeft: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'white' : 'none'} stroke={isSaved ? 'white' : 'var(--border)'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        {(usedCount > 0 || recCount > 0) && (<div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>{usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost }}>{usedCount} used</span>}{recCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost }}>{recCount} rec</span>}</div>)}

        {loc && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px' }}>{loc}</p>}
        {service.bio && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{service.bio}</p>}
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 14px' }}>{price}{service.price_from && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> from</span>}</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {igUrl && <a href={igUrl} target="_blank" rel="noopener noreferrer" style={linkBase} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>Instagram</a>}
          {telUrl && <a href={telUrl} style={linkBase} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#B45309'; (e.currentTarget as HTMLElement).style.color = '#B45309' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>Call</a>}
          {webUrl && <a href={webUrl} target="_blank" rel="noopener noreferrer" style={linkBase} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>Website</a>}
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleUsed() }} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light, #FEF3C7)' : 'var(--bg-card)', borderColor: hasUsed ? 'var(--gold, #B45309)' : 'var(--border)', color: hasUsed ? 'var(--gold, #B45309)' : 'var(--text-muted)' }}>
              I used this stylist {usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}>- {usedCount}</span>}
            </button>
            <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleRec() }} style={{ ...btnBase, background: hasRec ? 'var(--accent-light, #FEF3C7)' : 'var(--bg-card)', borderColor: hasRec ? 'var(--gold, #B45309)' : 'var(--border)', color: hasRec ? 'var(--gold, #B45309)' : 'var(--text-muted)' }}>
              I recommend this stylist {recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}>- {recCount}</span>}
            </button>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '6px 0', fontFamily: jost }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
          {expanded ? 'Less info' : 'More info'}
        </button>
      </div>
    </div>
  )
}
