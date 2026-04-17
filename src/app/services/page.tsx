'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'

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
  website: string | null
}

type ServiceStats = {
  usedCount: number
  recCount: number
  hasUsed: boolean
  hasRec: boolean
}

const CATEGORIES: Record<string, string[]> = {
  Hair:   ['All', 'Braids', 'Cornrows', 'Natural Hair', 'Ponytail', 'Relaxed Hair', 'Sew In', 'Silk Press', 'Textured Hair', 'Treatment', 'Wigs', 'Weaves', 'Locs', 'Knotless', 'Faux Locs'],
  Makeup: ['All', 'Bridal MUA', 'Glam', 'Editorial', 'Airbrush'],
  Lashes: ['All', 'Extensions', 'Lash Lift', 'Strip Lashes'],
  Nails:  ['All', 'Biab', 'Gel', 'Acrylic'],
  Brows:  ['All'],
}

const SUB_COLOR: Record<string, string> = {
  'Braids': '#7C3AED', 'Wigs': '#DB2777', 'Natural Hair': '#059669', 'Weaves': '#D97706',
  'Locs': '#92400E', 'Knotless': '#6D28D9', 'Faux Locs': '#B45309', 'Bridal MUA': '#BE185D',
  'Glam': '#DC2626', 'Editorial': '#1D4ED8', 'Airbrush': '#0891B2',
  'Extensions': '#7C3AED', 'Lash Lift': '#0D9488', 'Strip Lashes': '#9333EA',
  'Relaxed Hair': '#0284C7', 'Sew In': '#7C2D12', 'Silk Press': '#9D174D',
  'Textured Hair': '#065F46', 'Cornrows': '#0891B2', 'Ponytail': '#6D28D9', 'Treatment': '#065F46',
  'Biab': '#7C3AED', 'Gel': '#0D9488', 'Acrylic': '#DB2777',
}

const CATEGORY_ACCENT = '#B4690E'

const emptyStats: ServiceStats = { usedCount: 0, recCount: 0, hasUsed: false, hasRec: false }

function InstagramIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--accent)' : 'none'} stroke={filled ? 'var(--accent)' : 'var(--border)'} strokeWidth="2" style={{ flexShrink: 0, transition: 'all 0.15s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function SubcategoryDropdown({ cat, subs, setSubs, manrope }: { cat: string; subs: string[]; setSubs: (s: string[]) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const sorted = CATEGORIES[cat].filter(s => s !== 'All').sort()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const toggle = (s: string) => {
    if (subs.includes(s)) { setSubs(subs.filter(x => x !== s)) } else { setSubs([...subs, s]) }
  }

  const label = subs.length === 0 ? 'All Styles' : subs.length === 1 ? subs[0] : subs.length + ' Styles'
  const isFiltered = subs.length > 0

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 200, maxHeight: 280, overflowY: 'auto' }}>
          <button onClick={() => { setSubs([]); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: subs.length === 0 ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: subs.length === 0 ? 700 : 400, color: subs.length === 0 ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer' }}>
            All Styles
          </button>
          {sorted.map(s => (
            <button key={s} onClick={() => toggle(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: subs.includes(s) ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: subs.includes(s) ? 700 : 400, color: subs.includes(s) ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (!subs.includes(s)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (!subs.includes(s)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {s}
              {subs.includes(s) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CityDropdown({ city, setCity, manrope }: { city: string; setCity: (c: string) => void; manrope: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cities = ['All', 'Lagos', 'Abuja']

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mouseup', handleClick)
    return () => document.removeEventListener('mouseup', handleClick)
  }, [])

  const isFiltered = city !== 'All'

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, border: '1.5px solid ' + CATEGORY_ACCENT, background: isFiltered ? CATEGORY_ACCENT : 'transparent', color: isFiltered ? '#fff' : CATEGORY_ACCENT, fontSize: 11, fontFamily: manrope, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
        {city === 'All' ? 'All Locations' : city}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,25,23,0.1)', minWidth: 160, overflow: 'hidden' }}>
          {cities.map(c => (
            <button key={c} onClick={() => { setCity(c); setOpen(false) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 16px', background: city === c ? CATEGORY_ACCENT + '10' : 'transparent', border: 'none', textAlign: 'left', fontSize: 12, fontFamily: manrope, fontWeight: city === c ? 700 : 400, color: city === c ? CATEGORY_ACCENT : 'var(--text)', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => { if (city !== c) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (city !== c) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              {c === 'All' ? 'All Locations' : c}
              {city === c && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CATEGORY_ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const supabase = useSupabase()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('Hair')
  const [subs, setSubs] = useState<string[]>([])
  const [city, setCity] = useState('All')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Record<string, ServiceStats>>({})

  useEffect(() => { setSubs([]) }, [cat])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('cat')
    if (c && Object.keys(CATEGORIES).includes(c)) setCat(c)
  }, [])

  const fetchServices = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('services').select('*').eq('category', cat).order('verified', { ascending: false }).order('name')
    if (city !== 'All') q = q.eq('city', city)
    const { data } = await q
    let rows = data || []
    if (subs.length > 0) {
      rows = rows.filter((s: Service) => subs.some(sub => s.subcategories?.includes(sub)))
    }
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
  }, [supabase, cat, subs, city, user])

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

  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"

  return (
    <div style={{ minHeight: '100vh', background: '#fff8f5', color: 'var(--text)', fontFamily: manrope, overflowX: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap'); @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.2} }`}</style>

      <div style={{ width: '100%', height: 260, overflow: 'hidden', position: 'relative' }}>
        <img src="/pexels-services-hero.jpg" alt="Services" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {Object.keys(CATEGORIES).map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '18px 24px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid ' + CATEGORY_ACCENT : '2px solid transparent', color: cat === c ? CATEGORY_ACCENT : 'var(--text-muted)', fontFamily: manrope, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff8f5', borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <SubcategoryDropdown cat={cat} subs={subs} setSubs={setSubs} manrope={manrope} />
          <CityDropdown city={city} setCity={setCity} manrope={manrope} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {!loading && (<p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20, fontFamily: manrope, letterSpacing: '0.04em' }}>{services.length} {services.length === 1 ? 'result' : 'results'}{subs.length > 0 ? ' - ' + subs.join(', ') : ''}{city !== 'All' ? ' - ' + city : ''}</p>)}
        {loading && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>{[0,1,2,3,4,5].map(i => (<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 180, animation: 'pulse 1.5s ease infinite', opacity: 0.4, border: '1px solid var(--border)' }} />))}</div>)}
        {!loading && services.length === 0 && (<div style={{ textAlign: 'center', padding: '80px 24px' }}><p style={{ fontFamily: newsreader, fontSize: 24, marginBottom: 8 }}>No results found</p><p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: manrope }}>Try a different subcategory or city</p></div>)}
        {!loading && services.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {services.map(sv => (<Card key={sv.id} service={sv} isSaved={savedIds.has(sv.id)} onToggleSave={() => toggleSave(sv.id)} stats={stats[sv.id] || emptyStats} onToggleUsed={() => toggleUsed(sv.id)} onToggleRec={() => toggleRec(sv.id)} isLoggedIn={!!user} onOpenAuth={openSignIn} />))}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ service, isSaved, onToggleSave, stats, onToggleUsed, onToggleRec, isLoggedIn, onOpenAuth }: {
  service: Service; isSaved: boolean; onToggleSave: () => void
  stats: ServiceStats; onToggleUsed: () => void; onToggleRec: () => void
  isLoggedIn: boolean; onOpenAuth: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const subs = service.subcategories || []
  const ac = SUB_COLOR[subs[0]] || CATEGORY_ACCENT
  const igUrl = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const waUrl = service.phone ? 'https://wa.me/' + service.phone.replace(/\D/g, '') : null
  const loc = [service.location, service.city].filter(Boolean).join(', ')
  const { usedCount, recCount, hasUsed, hasRec } = stats
  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const newsreader = "'Newsreader', var(--font-playfair, serif)"
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: manrope, border: '1px solid var(--border)' }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: '0 1px 4px rgba(28,25,23,0.06)' }}>
      <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleSave() }} style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? 'var(--accent-light)' : '#fff', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s', zIndex: 1 }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: CATEGORY_ACCENT, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5, fontFamily: manrope }}>
          {service.category}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', lineHeight: 1.25, marginBottom: 6, paddingRight: 36, fontFamily: newsreader }}>
          {service.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {subs.map((s: string) => (<span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: (SUB_COLOR[s] || ac) + '18', color: SUB_COLOR[s] || ac, fontSize: 10, fontWeight: 600, fontFamily: manrope, letterSpacing: '0.04em' }}>{s}</span>))}
        </div>
        {(usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>used {usedCount}</span>}
            {recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>rec {recCount}</span>}
          </div>
        )}
        {loc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: manrope }}>&#128205; {loc}</div>}
        {service.bio && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: manrope }}>{service.bio}</p>}

        <div style={{ display: 'flex', gap: 6, marginBottom: expanded ? 10 : 0 }}>
          {igUrl && (
            <a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <WhatsAppIcon />WhatsApp
            </a>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {service.website && <a href={'https://' + service.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: manrope }}>&#127760; {service.website}</a>}
            <div style={{ marginTop: 2 }}>
              <button onClick={onToggleUsed} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light)' : '#fff', borderColor: hasUsed ? 'var(--gold)' : 'var(--border)', color: hasUsed ? 'var(--gold)' : 'var(--text-muted)', marginBottom: 6 }}>
                {hasUsed ? 'Used this stylist' : 'I used this stylist'}{usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {usedCount}</span>}
              </button>
            </div>
            <div>
              <button onClick={onToggleRec} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : '#fff', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)' }}>
                {hasRec ? 'Recommended' : 'I recommend this stylist'}{recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {recCount}</span>}
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '6px 0', fontFamily: manrope, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
          {expanded ? 'Less info' : 'More info'}
        </button>
      </div>
    </div>
  )
}
