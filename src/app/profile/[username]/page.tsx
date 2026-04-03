'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

const ACCENT    = '#D97706'
const DARK      = '#1C1917'
const BG        = '#F5F5F4'
const CARD_BG   = '#FFFFFF'
const BORDER    = '#E8E3DC'
const PILL_BG   = '#EEE8E0'
const PILL_TEXT = '#57534E'
const MUTED     = '#A8A29E'

type Profile = {
  id: string
  email: string
  display_name: string
  username?: string
  bio?: string
}

type Vendor = {
  id: string
  name: string
  category: string
  location: string
  instagram?: string
  price_from?: string
}

type FollowProfile = {
  id: string
  display_name: string
  username?: string
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

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? ACCENT
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colours  = [ACCENT, '#6366F1', '#0D9488', '#2563EB', '#EA580C', '#DB2777']
  const colour   = colours[name.charCodeAt(0) % colours.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${colour}18`, border: `2px solid ${colour}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: colour,
      fontFamily: 'var(--font-jost, sans-serif)', flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  )
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const colour   = getColour(vendor.category)
  const igHandle = vendor.instagram?.replace('@', '').trim()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD_BG }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colour}15`, border: `1px solid ${colour}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
        {getEmoji(vendor.category)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>
          {vendor.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {vendor.location && <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>{vendor.location}</span>}
          {igHandle && <span style={{ fontSize: 11, color: ACCENT, fontFamily: 'var(--font-jost, sans-serif)' }}>@{igHandle}</span>}
        </div>
      </div>
      {vendor.price_from && (
        <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, flexShrink: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>₦{vendor.price_from}</div>
      )}
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
  return (
    <div>
      {Object.entries(grouped).map(([cat, catVendors]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: PILL_BG, borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: getColour(cat), textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'var(--font-jost, sans-serif)' }}>
              {getEmoji(cat)} {cat}
            </span>
            <span style={{ fontSize: 10, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>· {catVendors.length}</span>
          </div>
          <div style={{ background: CARD_BG, borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            {catVendors.map(v => <VendorRow key={v.id} vendor={v} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function PeopleSheet({ title, people, onClose, currentUserId, onToggleFollow, followingIds }: {
  title: string; people: FollowProfile[]; onClose: () => void
  currentUserId?: string; onToggleFollow: (id: string) => void; followingIds: Set<string>
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(28,25,23,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: BG, borderRadius: '20px 20px 0 0', maxWidth: 480, margin: '0 auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(28,25,23,0.12)', fontFamily: 'var(--font-jost, sans-serif)' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, background: BORDER, borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: 0, fontFamily: 'var(--font-playfair, serif)' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: MUTED, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {people.length === 0
            ? <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No one here yet</div>
            : people.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${BORDER}` }}>
                <Avatar name={p.display_name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{p.display_name}</div>
                  {p.username && (
                    <Link href={`/profile/${p.username}`} onClick={onClose}
                      style={{ fontSize: 11, color: MUTED, textDecoration: 'none' }}>
                      @{p.username}
                    </Link>
                  )}
                </div>
                {currentUserId && p.id !== currentUserId && (
                  <button onClick={() => onToggleFollow(p.id)} style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: followingIds.has(p.id) ? CARD_BG : ACCENT,
                    color: followingIds.has(p.id) ? MUTED : 'white',
                    border: followingIds.has(p.id) ? `1px solid ${BORDER}` : 'none',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}>
                    {followingIds.has(p.id) ? 'Following' : 'Follow'}
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
  const params   = useParams()
  const username = params?.username as string
  const { user, openAuthModal } = useAuth()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [usedVendors, setUsedVendors]   = useState<Vendor[]>([])
  const [recVendors, setRecVendors]     = useState<Vendor[]>([])
  const [followers, setFollowers]       = useState<FollowProfile[]>([])
  const [following, setFollowing]       = useState<FollowProfile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]       = useState<'used' | 'recommended'>('used')
  const [sheet, setSheet]               = useState<'followers' | 'following' | null>(null)
  const [loading, setLoading]           = useState(true)
  const [notFound, setNotFound]         = useState(false)

  const isOwner = user?.id === profile?.id

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle()
      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData)
      const profileId = profileData.id
      const [usedRows, recRows, followerRows, followingRows, myFollowingRows] = await Promise.all([
        supabase.from('reviews').select('vendor_id').eq('user_id', profileId).eq('comment', '__used__'),
        supabase.from('vendor_recommendations').select('vendor_id').eq('user_id', profileId),
        supabase.from('follows').select('follower_id').eq('following_id', profileId),
        supabase.from('follows').select('following_id').eq('follower_id', profileId),
        user?.id ? supabase.from('follows').select('following_id').eq('follower_id', user.id) : Promise.resolve({ data: [] }),
      ])
      const usedIds     = [...new Set((usedRows.data      ?? []).map((r: {vendor_id: string}) => r.vendor_id))]
      const recIds      = [...new Set((recRows.data       ?? []).map((r: {vendor_id: string}) => r.vendor_id))]
      const followerIds = (followerRows.data  ?? []).map((r: {follower_id: string})  => r.follower_id)
      const followIds   = (followingRows.data ?? []).map((r: {following_id: string}) => r.following_id)
      const [usedVendorRes, recVendorRes, followerProfileRes, followingProfileRes] = await Promise.all([
        usedIds.length     ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', usedIds)     : Promise.resolve({ data: [] }),
        recIds.length      ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', recIds)      : Promise.resolve({ data: [] }),
        followerIds.length ? supabase.from('profiles').select('id, display_name, username').in('id', followerIds) : Promise.resolve({ data: [] }),
        followIds.length   ? supabase.from('profiles').select('id, display_name, username').in('id', followIds)   : Promise.resolve({ data: [] }),
      ])
      if (usedVendorRes.data)       setUsedVendors(usedVendorRes.data)
      if (recVendorRes.data)        setRecVendors(recVendorRes.data)
      if (followerProfileRes.data)  setFollowers(followerProfileRes.data)
      if (followingProfileRes.data) setFollowing(followingProfileRes.data)
      if (myFollowingRows.data)     setFollowingIds(new Set(myFollowingRows.data.map((r: {following_id: string}) => r.following_id)))
      setLoading(false)
    }
    load()
  }, [username, user])

  const handleToggleFollow = useCallback(async (targetId: string) => {
    if (!user?.id) { openAuthModal(); return }
    const isFollowing = followingIds.has(targetId)
    setFollowingIds(prev => { const n = new Set(prev); isFollowing ? n.delete(targetId) : n.add(targetId); return n })
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
      if (targetId === profile?.id) setFollowers(prev => prev.filter(f => f.id !== user.id))
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      if (targetId === profile?.id) {
        const { data } = await supabase.from('profiles').select('id, display_name, username').eq('id', user.id).maybeSingle()
        if (data) setFollowers(prev => [...prev, data])
      }
    }
  }, [user, followingIds, profile, openAuthModal])

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: BG, minHeight: '100vh' }}>
        <div style={{ height: 120, background: 'linear-gradient(180deg, #E8E0D5 0%, #EDE8E0 40%, #F5F5F4 100%)' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ background: CARD_BG, borderRadius: 20, padding: 20, marginTop: -8, boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: `1px solid ${BORDER}` }}>
            {[70, 40, 50].map((h, i) => (
              <div key={i} style={{ height: h, background: PILL_BG, borderRadius: 10, marginBottom: 12, opacity: 0.5 }} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 18, color: DARK, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>Profile not found</h2>
          <Link href="/" style={{ color: ACCENT, fontSize: 13, textDecoration: 'none' }}>← Back to directory</Link>
        </div>
      </main>
    )
  }

  const displayName        = profile?.display_name || 'Unknown'
  const handle             = profile?.username || ''
  const isFollowingProfile = followingIds.has(profile?.id ?? '')
  const activeVendors      = activeTab === 'used' ? usedVendors : recVendors

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: BG, minHeight: '100vh' }}>

      <div style={{ background: 'linear-gradient(180deg, #E8E0D5 0%, #EDE8E0 40%, #F5F5F4 100%)', padding: '32px 20px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: ACCENT, opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT, opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: ACCENT, opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, fontWeight: 600 }}>
          Vendor Profile
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ background: CARD_BG, borderRadius: 20, padding: '20px 20px 0', boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: `1px solid ${BORDER}`, position: 'relative', top: -12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <Avatar name={displayName} size={68} />
            <div style={{ flex: 1, display: 'flex', gap: 24, paddingTop: 8 }}>
              <button onClick={() => setSheet('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: 'var(--font-playfair, serif)' }}>{followers.length}</div>
                <div style={{ fontSize: 11, color: MUTED }}>Followers</div>
              </button>
              <button onClick={() => setSheet('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: 'var(--font-playfair, serif)' }}>{following.length}</div>
                <div style={{ fontSize: 11, color: MUTED }}>Following</div>
              </button>
            </div>

            {isOwner ? (
              <button style={{ padding: '7px 16px', borderRadius: 20, border: `1px solid ${BORDER}`, background: CARD_BG, fontSize: 12, fontWeight: 600, color: DARK, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Edit profile
              </button>
            ) : (
              <button
                onClick={() => { if (!user) { openAuthModal(); return }; handleToggleFollow(profile!.id) }}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: isFollowingProfile ? `1px solid ${BORDER}` : 'none',
                  background: isFollowingProfile ? CARD_BG : ACCENT,
                  fontSize: 12, fontWeight: 700,
                  color: isFollowingProfile ? MUTED : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                {isFollowingProfile ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div style={{ marginBottom: 16, paddingLeft: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: MUTED }}>@{handle}</div>
            {profile?.bio && (
              <div style={{ fontSize: 13, color: DARK, marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</div>
            )}
          </div>

          <div style={{ display: 'flex', borderTop: `1px solid ${BORDER}`, marginLeft: -20, marginRight: -20 }}>
            {[
              { key: 'used',        label: '✓ Used',  count: usedVendors.length },
              { key: 'recommended', label: '⭐ Recs', count: recVendors.length  },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as 'used' | 'recommended')}
                style={{
                  flex: 1, padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                  color: activeTab === tab.key ? ACCENT : MUTED,
                  fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                {tab.label}
                <span style={{ background: activeTab === tab.key ? `${ACCENT}18` : PILL_BG, color: activeTab === tab.key ? ACCENT : MUTED, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8, paddingBottom: 60 }}>
          {activeVendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: MUTED, fontSize: 13 }}>
              {activeTab === 'used'
                ? (isOwner ? "You haven't marked any vendors as used yet." : `${displayName.split(' ')[0]} hasn't marked any vendors yet.`)
                : (isOwner ? "You haven't recommended any vendors yet." : `${displayName.split(' ')[0]} hasn't recommended any vendors yet.`)}
            </div>
          ) : (
            <GroupedVendorList vendors={activeVendors} />
          )}
        </div>
      </div>

      {sheet && (
        <PeopleSheet
          title={sheet === 'followers' ? `Followers · ${followers.length}` : `Following · ${following.length}`}
          people={sheet === 'followers' ? followers : following}
          onClose={() => setSheet(null)}
          currentUserId={user?.id}
          onToggleFollow={handleToggleFollow}
          followingIds={followingIds}
        />
      )}

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: `1px solid ${BORDER}`, color: MUTED, fontSize: 12, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides &amp; families
      </footer>
    </main>
  )
}
