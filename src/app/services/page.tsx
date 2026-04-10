'use client'

import { useEffect, useState, useCallback } from 'react'
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

const CATEGORY_META: Record<string, { emoji: string; colour: string }> = {
  'Hair':   { emoji: '💇🏾', colour: '#D97706' },
  'Makeup': { emoji: '💄',   colour: '#DB2777' },
  'Lashes': { emoji: '✨',   colour: '#0D9488' },
}

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
  const catMeta = CATEGORY_META[cat] || { emoji: '✦', colour: '#D97706' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: jost }}>
      <div style={{ background: '#1C1917', color: '#fff', padding: '56px 24px 48px', textAlign: 'center' }}>
        <p style={{ fontFamily: play, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Beauty and Personal Care</p>
        <h1 style={{ fontFamily: play, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700, lineHeight: 1.15, margin: '0 0 16px' }}>Find Your Glam</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>Hair stylists, makeup artists and lash technicians across Nigeria</p>
      </div>

      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex' }}>
          {Object.keys(CATEGORIES).map(c => {
            const meta = CATEGORY_META[c] || { emoji: '✦', colour: '#D97706' }
            return (<button key={c} onClick={() => setCat(c)} style={{ padding: '16px 24px', background: 'none', border: 'none', borderBottom: cat === c ? '2px solid ' + meta.colour : '2px solid transparent', color: cat === c ? meta.colour : 'var(--text-muted)', fontFamily: jost, fontSize: 14, fontWeight: cat === c ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 14 }}>{meta.emoji}</span>{c}</button>)
          })}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '12px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES[cat].map(s => (<button key={s} onClick={() => setSub(s)} style={{ padding: '5px 14px', borderRadius: 999, border: '1px solid', borderColor: sub === s ? catMeta.colour : 'var(--border)', background: sub === s ? catMeta.colour : 'transparent', color: sub === s ? '#fff' : 'var(--text-muted)', fontSize: 12, fontFamily: jost, fontWeight: sub === s ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{s}</button>))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>City:</span>
            {CITIES.map(ci => (<button key={ci} onClick={() => setCity(ci)} style={{ padding: '4px 12px', borderRadius: 999, border: '1px solid', borderColor: city === ci ? '#B45309' : 'var(--border)', background: city === ci ? 'rgba(180,83,9,0.08)' : 'transparent', color: city === ci ? '#B45309' : 'var(--text-muted)', fontSize: 12, fontFamily: jost, fontWeight: city === ci ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>{ci}</button>))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {!loading && (<p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{services.length} {services.length === 1 ? 'result' : 'results'}{sub !== 'All' ? ' - ' + sub : ''}{city !== 'All' ? ' - ' + city : ''}</p>)}
        {loading && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>{[0,1,2,3,4,5].map(i => (<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 14, height: 180, animation: 'pulse 1.5s ease infinite', opacity: 0.4, border: '1px solid var(--border)' }} />))}</div>)}
        {!loading && services.length === 0 && (<div style={{ textAlign: 'center', padding: '80px 24px' }}><p style={{ fontFamily: play, fontSize: 22, marginBottom: 8 }}>No results found</p><p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Try a different subcategory or city</p></div>)}
        {!loading && services.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 14 }}>
            {services.map(sv => (<Card key={sv.id} service={sv} isSaved={savedIds.has(sv.id)} onToggleSave={() => toggleSave(sv.id)} stats={stats[sv.id] || emptyStats} onToggleUsed={() => toggleUsed(sv.id)} onToggleRec={() => toggleRec(sv.id)} isLoggedIn={!!user} onOpenAuth={openSignIn} />))}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.2} }`}</style>
    </div>
  )
}

function Card({ service, isSaved, onToggleSave, stats, onToggleUsed, onToggleRec, isLoggedIn, onOpenAuth }: {
  service: Service; isSaved: boolean; onToggleSave: () => void
  stats: ServiceStats; onToggleUsed: () => void; onToggleRec: () => void
  isLoggedIn: boolean; onOpenAuth: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const subs = service.subcategories || []
  const catMeta = CATEGORY_META[service.category] || { emoji: '✦', colour: '#D97706' }
  const ac = SUB_COLOR[subs[0]] || catMeta.colour
  const igUrl  = service.instagram ? 'https://instagram.com/' + service.instagram : null
  const waUrl  = service.phone ? 'https://wa.me/' + service.phone.replace(/\D/g, '') : null
  const loc    = [service.location, service.city].filter(Boolean).join(', ')
  const { usedCount, recCount, hasUsed, hasRec } = stats
  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'
  const btnBase: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', fontFamily: jost, border: '1px solid var(--border)' }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-card)' }}>

      <button onClick={() => { if (!isLoggedIn) { onOpenAuth(); return }; onToggleSave() }} style={{ position: 'absolute', top: 12, right: 12, background: isSaved ? 'var(--accent-light)' : 'var(--bg-card)', border: '1px solid ' + (isSaved ? 'var(--gold)' : 'var(--border)'), borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s', zIndex: 1 }}>
        <HeartIcon filled={isSaved} />
      </button>

      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: catMeta.colour, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, fontFamily: jost, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11 }}>{catMeta.emoji}</span>{service.category}
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, marginBottom: 6, paddingRight: 36, fontFamily: play }}>{service.name}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {subs.map((s: string) => (<span key={s} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: (SUB_COLOR[s] || ac) + '18', color: SUB_COLOR[s] || ac, fontSize: 10, fontWeight: 600, fontFamily: jost }}>{s}</span>))}
        </div>

        {(usedCount > 0 || recCount > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            {usedCount > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost }}>used {usedCount}</span>}
            {recCount  > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: jost }}>rec {recCount}</span>}
          </div>
        )}

        {loc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: jost }}>📍 {loc}</div>}

        {service.bio && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: jost }}>{service.bio}</p>}

        <div style={{ display: 'flex', gap: 6, marginBottom: expanded ? 10 : 0 }}>
          {igUrl && (
            <a href={igUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: jost, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; (e.currentTarget as HTMLElement).style.color = '#25D366' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <WhatsAppIcon />WhatsApp
            </a>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {service.website && <a href={'https://' + service.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#6366F1', textDecoration: 'none', fontFamily: jost }}>🌐 {service.website}</a>}
            <div style={{ marginTop: 2 }}>
              <button onClick={onToggleUsed} style={{ ...btnBase, background: hasUsed ? 'var(--accent-light)' : 'var(--bg-card)', borderColor: hasUsed ? 'var(--gold)' : 'var(--border)', color: hasUsed ? 'var(--gold)' : 'var(--text-muted)', marginBottom: 6 }}>
                👋 {hasUsed ? 'Used this stylist' : 'I used this stylist'}{usedCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {usedCount}</span>}
              </button>
            </div>
            <div>
              <button onClick={onToggleRec} style={{ ...btnBase, background: hasRec ? 'var(--accent-light)' : 'var(--bg-card)', borderColor: hasRec ? 'var(--gold)' : 'var(--border)', color: hasRec ? 'var(--gold)' : 'var(--text-muted)' }}>
                ⭐ {hasRec ? 'Recommended' : 'I recommend this stylist'}{recCount > 0 && <span style={{ fontWeight: 700, color: 'var(--accent)' }}> · {recCount}</span>}
              </button>
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 10, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '6px 0', fontFamily: jost }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, lineHeight: 1 }}>{expanded ? '-' : '+'}</span>
          {expanded ? 'Less info' : 'More info'}
        </button>
      </div>
    </div>
  )
}
