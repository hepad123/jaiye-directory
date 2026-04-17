'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useUser, useClerk } from '@clerk/nextjs'
import { useSupabase } from '@/hooks/useSupabase'

type Profile = {
  clerk_user_id: string
  display_name: string
  username?: string
  bio?: string
  avatar_url?: string
}

type Vendor = {
  id: string
  name: string
  category: string
  location: string
  instagram?: string
  price_from?: string
}

type ServiceRow = {
  id: string
  name: string
  category: string
  subcategories: string[]
  location: string | null
  city: string
  instagram: string | null
}

type FollowProfile = {
  clerk_user_id: string
  display_name: string
  username?: string
  avatar_url?: string
}

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
  'Nails':  { emoji: '💅',   colour: '#7C3AED' },
  'Brows':  { emoji: '🪮',   colour: '#92400E' },
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const SERVICE_CATEGORY_ORDER = ['Hair', 'Makeup', 'Lashes', 'Nails', 'Brows']

const ACCENT = '#B4690E'

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

const manrope    = "'Manrope', var(--font-jost, sans-serif)"
const newsreader = "'Newsreader', var(--font-playfair, serif)"

function Avatar({ name, size = 64, imageUrl }: { name: string; size?: number; imageUrl?: string }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colours  = ['#D97706', '#6366F1', '#0D9488', '#2563EB', '#EA580C', '#DB2777']
  const colour   = colours[name.charCodeAt(0) % colours.length]
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid ' + colour + '40' }}>
        <Image src={imageUrl} alt={name} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover' }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: colour + '18', border: '2px solid ' + colour + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.32, fontWeight: 700, color: colour, fontFamily: manrope, flexShrink: 0 }}>
      {initials || '?'}
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const colour   = getColour(vendor.category)
  const igHandle = vendor.instagram?.replace('@', '').trim()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: colour + '15', border: '1px solid ' + colour + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{getEmoji(vendor.category)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4, fontFamily: newsreader }}>{vendor.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {vendor.location && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>&#128205; {vendor.location}</span>}
          {igHandle && (
            <a href={'https://instagram.com/' + igHandle} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
        </div>
      </div>
      {vendor.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, flexShrink: 0, fontFamily: manrope }}>&#8358;{vendor.price_from}</div>}
    </div>
  )
}

function ServiceRowItem({ service }: { service: ServiceRow }) {
  const meta     = SERVICE_CATEGORY_META[service.category] || { emoji: '✦', colour: '#D97706' }
  const igHandle = service.instagram?.replace('@', '').trim()
  const loc      = [service.location, service.city].filter(Boolean).join(', ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.colour + '15', border: '1px solid ' + meta.colour + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{meta.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4, fontFamily: newsreader }}>{service.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {loc && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>&#128205; {loc}</span>}
          {igHandle && (
            <a href={'https://instagram.com/' + igHandle} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#fff8f5', border: '1px solid var(--border)', borderRadius: 20, fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 500, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; (e.currentTarget as HTMLElement).style.color = '#E1306C' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <InstagramIcon />Instagram
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupedServiceList({ services }: { services: ServiceRow[] }) {
  if (services.length === 0) return null
  const grouped = SERVICE_CATEGORY_ORDER.reduce<Record<string, ServiceRow[]>>((acc, cat) => {
    const inCat = services.filter(s => s.category === cat)
    if (inCat.length > 0) acc[cat] = inCat
    return acc
  }, {})
  if (Object.keys(grouped).length === 0) return null
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', fontFamily: manrope, padding: '16px 16px 6px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Services</div>
      {Object.entries(grouped).map(([cat, catServices]) => {
        const meta = SERVICE_CATEGORY_META[cat] || { emoji: '✦', colour: '#D97706' }
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-pill)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: meta.colour, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: manrope }}>{cat}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>· {catServices.length}</span>
            </div>
            <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
              {catServices.map(s => <ServiceRowItem key={s.id} service={s} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GroupedVendorList({ vendors }: { vendors: Vendor[] }) {
  if (vendors.length === 0) return null
  const grouped = CATEGORY_ORDER.reduce<Record<string, Vendor[]>>((acc, cat) => {
    const inCat = vendors.filter(v => v.category === cat || (cat === 'Outfits' && v.category === 'Fashion'))
    if (inCat.length > 0) acc[cat] = inCat
    return acc
  }, {})
  vendors.forEach(v => {
    const normCat = v.category === 'Fashion' ? 'Outfits' : v.category
    if (!CATEGORY_ORDER.includes(normCat)) {
      if (!grouped[normCat]) grouped[normCat] = []
      if (!grouped[normCat].find(x => x.id === v.id)) grouped[normCat].push(v)
    }
  })
  if (Object.keys(grouped).length === 0) return null
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', fontFamily: manrope, padding: '16px 16px 6px', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Events</div>
      {Object.entries(grouped).map(([cat, catVendors]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-pill)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: getColour(cat), textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: manrope }}>{cat}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: manrope }}>· {catVendors.length}</span>
          </div>
          <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            {catVendors.map(v => <VendorRow key={v.id} vendor={v} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function PeopleSheet({ title, people, onClose, currentUserId, onToggleFollow, followingIds }: { title: string; people: FollowProfile[]; onClose: () => void; currentUserId?: string; onToggleFollow: (id: string) => void; followingIds: Set<string> }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: '#fff8f5', borderRadius: '20px 20px 0 0', maxWidth: 480, margin: '0 auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(28,25,23,0.12)', fontFamily: manrope }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, background: 'var(--border)', borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0, fontFamily: newsreader }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>x</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {people.length === 0
            ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: manrope }}>No one here yet</div>
            : people.map(p => (
              <div key={p.clerk_user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={p.display_name} size={38} imageUrl={p.avatar_url} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: newsreader }}>{p.display_name}</div>
                  {p.username && <Link href={'/profile/' + p.username} onClick={onClose} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope }}>@{p.username}</Link>}
                </div>
                {currentUserId && p.clerk_user_id !== currentUserId && (
                  <button onClick={() => onToggleFollow(p.clerk_user_id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', background: followingIds.has(p.clerk_user_id) ? '#fff' : ACCENT, color: followingIds.has(p.clerk_user_id) ? 'var(--text-muted)' : 'white', border: followingIds.has(p.clerk_user_id) ? '1px solid var(--border)' : 'none', fontFamily: manrope }}>
                    {followingIds.has(p.clerk_user_id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
}

export default function ProfilePage() {
  const supabase = useSupabase()
  const params   = useParams()
  const username = params?.username as string
  const { user } = useUser()
  const { openSignIn } = useClerk()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [usedVendors, setUsedVendors]   = useState<Vendor[]>([])
  const [recVendors, setRecVendors]     = useState<Vendor[]>([])
  const [usedServices, setUsedServices] = useState<ServiceRow[]>([])
  const [recServices, setRecServices]   = useState<ServiceRow[]>([])
  const [followers, setFollowers]       = useState<FollowProfile[]>([])
  const [following, setFollowing]       = useState<FollowProfile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]       = useState<'used' | 'recommended'>('used')
  const [sheet, setSheet]               = useState<'followers' | 'following' | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)

  const isOwner = user?.id === profile?.clerk_user_id

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle()
      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData)
      const profileId = profileData.clerk_user_id

      const [usedRows, recRows, followerRows, followingRows, myFollowingRows, serviceUsedRows, serviceRecRows] = await Promise.all([
        supabase.from('vendor_used').select('vendor_id').eq('clerk_user_id', profileId),
        supabase.from('vendor_recommendations').select('vendor_id').eq('clerk_user_id', profileId),
        supabase.from('follows').select('clerk_follower_id').eq('clerk_following_id', profileId),
        supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', profileId),
        user?.id ? supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', user.id) : Promise.resolve({ data: [] }),
        supabase.from('service_used').select('service_id').eq('clerk_user_id', profileId),
        supabase.from('service_recommendations').select('service_id').eq('clerk_user_id', profileId),
      ])

      const usedIds        = [...new Set((usedRows.data        ?? []).map((r: { vendor_id: string }) => r.vendor_id))]
      const recIds         = [...new Set((recRows.data         ?? []).map((r: { vendor_id: string }) => r.vendor_id))]
      const followerIds    = (followerRows.data  ?? []).map((r: { clerk_follower_id: string })  => r.clerk_follower_id)
      const followIds      = (followingRows.data ?? []).map((r: { clerk_following_id: string }) => r.clerk_following_id)
      const serviceUsedIds = [...new Set((serviceUsedRows.data ?? []).map((r: { service_id: string }) => r.service_id))]
      const serviceRecIds  = [...new Set((serviceRecRows.data  ?? []).map((r: { service_id: string }) => r.service_id))]

      const [usedVendorRes, recVendorRes, followerProfileRes, followingProfileRes, usedServiceRes, recServiceRes] = await Promise.all([
        usedIds.length ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', usedIds) : Promise.resolve({ data: [] }),
        recIds.length  ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', recIds)  : Promise.resolve({ data: [] }),
        followerIds.length ? supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followerIds) : Promise.resolve({ data: [] }),
        followIds.length   ? supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followIds)   : Promise.resolve({ data: [] }),
        serviceUsedIds.length ? supabase.from('services').select('id, name, category, subcategories, location, city, instagram').in('id', serviceUsedIds) : Promise.resolve({ data: [] }),
        serviceRecIds.length  ? supabase.from('services').select('id, name, category, subcategories, location, city, instagram').in('id', serviceRecIds)  : Promise.resolve({ data: [] }),
      ])

      if (usedVendorRes.data)       setUsedVendors(usedVendorRes.data)
      if (recVendorRes.data)        setRecVendors(recVendorRes.data)
      if (followerProfileRes.data)  setFollowers(followerProfileRes.data)
      if (followingProfileRes.data) setFollowing(followingProfileRes.data)
      if (usedServiceRes.data)      setUsedServices(usedServiceRes.data)
      if (recServiceRes.data)       setRecServices(recServiceRes.data)
      if (myFollowingRows.data)     setFollowingIds(new Set(myFollowingRows.data.map((r: { clerk_following_id: string }) => r.clerk_following_id)))

      setLoading(false)
    }
    load()
  }, [username, user])

  const handleToggleFollow = useCallback(async (targetId: string) => {
    if (!user?.id) { openSignIn(); return }
    const isFollowing = followingIds.has(targetId)
    setFollowingIds(prev => { const n = new Set(prev); isFollowing ? n.delete(targetId) : n.add(targetId); return n })
    if (isFollowing) {
      await fetch('/api/follows', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_id: targetId }) })
      if (targetId === profile?.clerk_user_id) setFollowers(prev => prev.filter(f => f.clerk_user_id !== user.id))
    } else {
      await fetch('/api/follows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_id: targetId }) })
      if (targetId === profile?.clerk_user_id) {
        const { data } = await supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').eq('clerk_user_id', user.id).maybeSingle()
        if (data) setFollowers(prev => [...prev, data])
      }
    }
  }, [user, followingIds, profile, openSignIn])

  if (loading) {
    return (
      <main style={{ fontFamily: manrope, background: '#fff8f5', minHeight: '100vh' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ height: 120, background: 'var(--hero-grad)' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginTop: -8, boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: '1px solid var(--border)' }}>
            {[70, 40, 50].map((h, i) => (<div key={i} style={{ height: h, background: 'var(--bg-pill)', borderRadius: 10, marginBottom: 12, opacity: 0.5 }} />))}
          </div>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={{ fontFamily: manrope, background: '#fff8f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap');`}</style>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 600, margin: '0 0 8px', fontFamily: newsreader }}>Profile not found</h2>
          <Link href="/" style={{ color: ACCENT, fontSize: 13, textDecoration: 'none', fontFamily: manrope }}>Back to home</Link>
        </div>
      </main>
    )
  }

  const displayName        = profile?.display_name || 'Unknown'
  const handle             = profile?.username || ''
  const isFollowingProfile = followingIds.has(profile?.clerk_user_id ?? '')
  const activeVendors      = activeTab === 'used' ? usedVendors  : recVendors
  const activeServices     = activeTab === 'used' ? usedServices : recServices
  const totalUsed          = usedVendors.length  + usedServices.length
  const totalRec           = recVendors.length   + recServices.length

  return (
    <main style={{ fontFamily: manrope, background: '#fff8f5', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Manrope:wght@400;500;600;700&display=swap');`}</style>

      <div style={{ background: 'var(--hero-grad)', padding: '32px 20px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: ACCENT, opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: ACCENT, opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, fontWeight: 700, fontFamily: manrope }}>Profile</div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 0', boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: '1px solid var(--border)', position: 'relative', top: -12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <Avatar name={displayName} size={68} imageUrl={profile?.avatar_url} />
            <div style={{ flex: 1, display: 'flex', gap: 24, paddingTop: 8 }}>
              <button onClick={() => setSheet('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: newsreader }}>{followers.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>Followers</div>
              </button>
              <button onClick={() => setSheet('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: newsreader }}>{following.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: manrope }}>Following</div>
              </button>
            </div>
            {isOwner ? (
              <Link href="/profile/edit" style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid var(--border)', background: '#fff', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: manrope, textDecoration: 'none', display: 'inline-block' }}>Edit profile</Link>
            ) : (
              <button onClick={() => { if (!user) { openSignIn(); return }; handleToggleFollow(profile!.clerk_user_id) }} style={{ padding: '7px 16px', borderRadius: 20, border: isFollowingProfile ? '1px solid var(--border)' : 'none', background: isFollowingProfile ? '#fff' : ACCENT, fontSize: 12, fontWeight: 700, color: isFollowingProfile ? 'var(--text-muted)' : 'white', cursor: 'pointer', transition: 'all 0.15s', fontFamily: manrope }}>
                {isFollowingProfile ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div style={{ marginBottom: 16, paddingLeft: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 2, fontFamily: newsreader }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: manrope }}>@{handle}</div>
            {profile?.bio && <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 6, lineHeight: 1.6, fontFamily: manrope }}>{profile.bio}</div>}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border)', marginLeft: -20, marginRight: -20 }}>
            {[
              { key: 'used',        label: 'Used', count: totalUsed },
              { key: 'recommended', label: 'Recs', count: totalRec  },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as 'used' | 'recommended')} style={{ flex: 1, padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid ' + ACCENT : '2px solid transparent', color: activeTab === tab.key ? ACCENT : 'var(--text-muted)', fontSize: 11, fontWeight: activeTab === tab.key ? 700 : 500, letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: manrope }}>
                {tab.label}
                <span style={{ background: activeTab === tab.key ? ACCENT + '15' : 'var(--bg-pill)', color: activeTab === tab.key ? ACCENT : 'var(--text-muted)', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8, paddingBottom: 60 }}>
          {activeVendors.length === 0 && activeServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 13, fontFamily: manrope }}>
              {activeTab === 'used'
                ? (isOwner ? "You haven't marked any vendors or stylists as used yet." : displayName.split(' ')[0] + " hasn't marked any yet.")
                : (isOwner ? "You haven't recommended any vendors or stylists yet." : displayName.split(' ')[0] + " hasn't recommended any yet.")}
            </div>
          ) : (
            <>
              <GroupedServiceList services={activeServices} />
              <GroupedVendorList vendors={activeVendors} />
            </>
          )}
        </div>
      </div>

      {sheet && (
        <PeopleSheet
          title={sheet === 'followers' ? 'Followers - ' + followers.length : 'Following - ' + following.length}
          people={sheet === 'followers' ? followers : following}
          onClose={() => setSheet(null)}
          currentUserId={user?.id}
          onToggleFollow={handleToggleFollow}
          followingIds={followingIds}
        />
      )}

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, fontFamily: manrope, letterSpacing: '0.04em' }}>
        Made with love for Nigerian brides and families
      </footer>
    </main>
  )
}
