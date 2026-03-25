'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/hooks/useAuth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ACCENT = '#8B6E9A'
const DARK   = '#2A1A2A'
const BG     = '#FAFAFA'
const GOLD   = '#C0A060'
const MUTED  = '#9A8A9A'

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
  verified?: boolean
}

type FollowProfile = {
  id: string
  display_name: string
  username?: string
}

const CATEGORY_META: Record<string, { emoji: string; colour: string }> = {
  'Event Planning':        { emoji: '📋', colour: '#7B68C8' },
  'Styling':               { emoji: '✨', colour: '#2E9E7A' },
  'Outfits':               { emoji: '👗', colour: '#C07A2F' },
  'Makeup':                { emoji: '💄', colour: '#C45C7A' },
  'Hair & Gele':           { emoji: '💅', colour: '#C4563A' },
  'Photography':           { emoji: '📷', colour: '#4A8FC4' },
  'Videography & Content': { emoji: '🎬', colour: '#7A6058' },
  'Decor & Venue':         { emoji: '🏛️', colour: '#9A7A5A' },
  'Catering':              { emoji: '🍽️', colour: '#C4724A' },
  'Entertainment':         { emoji: '🎤', colour: '#7A6A9A' },
  'Other':                 { emoji: '✦',  colour: '#9E6BAA' },
}

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? ACCENT
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colours  = [ACCENT, '#7B68C8', '#C07A2F', '#4A8FC4', '#C4563A', '#2E9E7A']
  const colour   = colours[name.charCodeAt(0) % colours.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${colour}22`, border: `2px solid ${colour}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: colour,
      fontFamily: 'var(--font-jost, sans-serif)', flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  )
}

// ─── Vendor Row ───────────────────────────────────────────────────────────────

function VendorRow({ vendor }: { vendor: Vendor }) {
  const colour   = getColour(vendor.category)
  const igHandle = vendor.instagram?.replace('@', '').trim()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid #F0EBF4', background: 'white' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colour}18`, border: `1px solid ${colour}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
        {getEmoji(vendor.category)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>
          {vendor.name}
          {vendor.verified && <span style={{ marginLeft: 5, fontSize: 11, color: '#5A8A72' }}>✓</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {vendor.location && <span style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>{vendor.location}</span>}
          {igHandle && <span style={{ fontSize: 11, color: ACCENT, fontFamily: 'var(--font-jost, sans-serif)' }}>@{igHandle}</span>}
        </div>
      </div>
      {vendor.price_from && (
        <div style={{ fontSize: 11, color: '#5A8A72', fontWeight: 600, flexShrink: 0, fontFamily: 'var(--font-jost, sans-serif)' }}>₦{vendor.price_from}</div>
      )}
    </div>
  )
}

// ─── Grouped vendor list ──────────────────────────────────────────────────────

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#F5F0F8', borderBottom: '1px solid #EDE8F0', borderTop: '1px solid #EDE8F0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: getColour(cat), textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'var(--font-jost, sans-serif)' }}>
              {getEmoji(cat)} {cat}
            </span>
            <span style={{ fontSize: 10, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>· {catVendors.length}</span>
          </div>
          <div style={{ background: 'white', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            {catVendors.map(v => <VendorRow key={v.id} vendor={v} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── People sheet ─────────────────────────────────────────────────────────────

function PeopleSheet({ title, people, onClose, currentUserId, onToggleFollow, followingIds }: {
  title: string
  people: FollowProfile[]
  onClose: () => void
  currentUserId?: string
  onToggleFollow: (id: string) => void
  followingIds: Set<string>
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(42,26,42,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: BG, borderRadius: '20px 20px 0 0', maxWidth: 480, margin: '0 auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(42,26,42,0.15)', fontFamily: 'var(--font-jost, sans-serif)' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #E8E0E8', flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, background: '#E0D8E8', borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK, margin: 0, fontFamily: 'var(--font-playfair, serif)' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: MUTED, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {people.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: MUTED, fontSize: 13 }}>No one here yet</div>
          ) : people.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #F0EBF4' }}>
              <Avatar name={p.display_name} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: DARK, fontFamily: 'var(--font-jost, sans-serif)' }}>{p.display_name}</div>
                {p.username && (
                  <Link href={`/profile/${p.username}`} onClick={onClose}
                    style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)', textDecoration: 'none' }}>
                    @{p.username}
                  </Link>
                )}
              </div>
              {currentUserId && p.id !== currentUserId && (
                <button onClick={() => onToggleFollow(p.id)} style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  background: followingIds.has(p.id) ? 'white' : ACCENT,
                  color: followingIds.has(p.id) ? MUTED : 'white',
                  border: followingIds.has(p.id) ? '1px solid #E8E0E8' : 'none',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                  {followingIds.has(p.id) ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params   = useParams()
  const username = params?.username as string
  const { user, openAuthModal } = useAuth()

  const [profile, setProfile]               = useState<Profile | null>(null)
  const [usedVendors, setUsedVendors]       = useState<Vendor[]>([])
  const [recVendors, setRecVendors]         = useState<Vendor[]>([])
  const [followers, setFollowers]           = useState<FollowProfile[]>([])
  const [following, setFollowing]           = useState<FollowProfile[]>([])
  const [followingIds, setFollowingIds]     = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab]           = useState<'used' | 'recommended'>('used')
  const [sheet, setSheet]                   = useState<'followers' | 'following' | null>(null)
  const [loading, setLoading]               = useState(true)
  const [notFound, setNotFound]             = useState(false)

  const isOwner = user?.id === profile?.id

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Load profile by username
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).maybeSingle()
      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData)

      const profileId = profileData.id

      // ── Used vendors ──────────────────────────────────────────────────────
      const { data: usedRows } = await supabase
        .from('reviews')
        .select('vendor_id')
        .eq('user_id', profileId)
        .eq('comment', '__used__')

      const usedIds = [...new Set((usedRows ?? []).map(r => r.vendor_id))]
      if (usedIds.length) {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, name, category, location, instagram, price_from, verified')
          .in('id', usedIds)
        if (vendorData) setUsedVendors(vendorData)
      }

      // ── Recommended vendors ───────────────────────────────────────────────
      const { data: recRows } = await supabase
        .from('vendor_recommendations')
        .select('vendor_id')
        .eq('user_id', profileId)

      const recIds = [...new Set((recRows ?? []).map(r => r.vendor_id))]
      if (recIds.length) {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, name, category, location, instagram, price_from, verified')
          .in('id', recIds)
        if (vendorData) setRecVendors(vendorData)
      }

      // ── Followers (people who follow this profile) ────────────────────────
      const { data: followerRows } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profileId)

      if (followerRows?.length) {
        const ids = followerRows.map(r => r.follower_id)
        const { data: fp } = await supabase
          .from('profiles').select('id, display_name, username').in('id', ids)
        if (fp) setFollowers(fp)
      }

      // ── Following (people this profile follows) ───────────────────────────
      const { data: followingRows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profileId)

      if (followingRows?.length) {
        const ids = followingRows.map(r => r.following_id)
        const { data: fp } = await supabase
          .from('profiles').select('id, display_name, username').in('id', ids)
        if (fp) setFollowing(fp)
      }

      // ── Current viewer's following list ───────────────────────────────────
      if (user?.id) {
        const { data: myFollowing } = await supabase
          .from('follows').select('following_id').eq('follower_id', user.id)
        if (myFollowing) setFollowingIds(new Set(myFollowing.map(r => r.following_id)))
      }

      setLoading(false)
    }
    load()
  }, [username, user])

  const handleToggleFollow = useCallback(async (targetId: string) => {
    if (!user?.id) { openAuthModal(); return }
    const isFollowing = followingIds.has(targetId)

    // Optimistic update
    setFollowingIds(prev => {
      const n = new Set(prev)
      isFollowing ? n.delete(targetId) : n.add(targetId)
      return n
    })

    if (isFollowing) {
      await supabase.from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetId)

      // Remove from followers list if viewing this profile's followers
      if (targetId === profile?.id) {
        setFollowers(prev => prev.filter(f => f.id !== user.id))
      }
    } else {
      await supabase.from('follows')
        .insert({ follower_id: user.id, following_id: targetId })

      // Add to followers list if viewing this profile's followers
      if (targetId === profile?.id) {
        const { data } = await supabase
          .from('profiles').select('id, display_name, username').eq('id', user.id).maybeSingle()
        if (data) setFollowers(prev => [...prev, data])
      }
    }
  }, [user, followingIds, profile, openAuthModal])

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: BG, minHeight: '100vh' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E0E8', padding: '14px 32px' }}>
          <Link href="/" style={{ fontSize: 13, color: DARK, textDecoration: 'none', fontWeight: 500 }}>← Directory</Link>
        </div>
        <div style={{ height: 180, background: 'linear-gradient(180deg, #DDD0E4 0%, #EDE4F0 40%, #FAFAFA 100%)' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 20, marginTop: -8, boxShadow: '0 4px 24px rgba(42,26,42,0.08)', border: '1px solid #E8E0E8' }}>
            {[70, 40, 50].map((h, i) => (
              <div key={i} style={{ height: h, background: '#F0EBF4', borderRadius: 10, marginBottom: 12, opacity: 0.5 }} />
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
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌸</div>
          <h2 style={{ fontSize: 18, color: DARK, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>Profile not found</h2>
          <Link href="/" style={{ color: ACCENT, fontSize: 13, textDecoration: 'none', fontFamily: 'var(--font-jost, sans-serif)' }}>← Back to directory</Link>
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

      {/* Nav */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8E0E8', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: DARK, textDecoration: 'none', fontWeight: 500, fontFamily: 'var(--font-jost, sans-serif)' }}>
          ← Directory
        </Link>
        <div style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>@{handle}</div>
      </div>

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(180deg, #DDD0E4 0%, #EDE4F0 40%, #FAFAFA 100%)', padding: '32px 20px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: GOLD, opacity: 0.6 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: GOLD, opacity: 0.8 }} />
          <div style={{ height: 1, width: 44, background: GOLD, opacity: 0.6 }} />
        </div>
        <div style={{ fontFamily: 'var(--font-jost, sans-serif)', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: ACCENT, fontWeight: 500 }}>
          Vendor Profile
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>

        {/* Profile card */}
        <div style={{ background: 'white', borderRadius: 20, padding: '20px 20px 0', boxShadow: '0 4px 24px rgba(42,26,42,0.08)', border: '1px solid #E8E0E8', position: 'relative', top: -12 }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <Avatar name={displayName} size={68} />
            <div style={{ flex: 1, display: 'flex', gap: 24, paddingTop: 8 }}>
              <button onClick={() => setSheet('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: 'var(--font-playfair, serif)' }}>{followers.length}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>Followers</div>
              </button>
              <button onClick={() => setSheet('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: DARK, fontFamily: 'var(--font-playfair, serif)' }}>{following.length}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>Following</div>
              </button>
            </div>

            {isOwner ? (
              <button style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid #E8E0E8', background: 'white', fontSize: 12, fontWeight: 600, color: DARK, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)' }}>
                Edit profile
              </button>
            ) : (
              <button
                onClick={() => { if (!user) { openAuthModal(); return }; handleToggleFollow(profile!.id) }}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: isFollowingProfile ? '1px solid #E8E0E8' : 'none',
                  background: isFollowingProfile ? 'white' : ACCENT,
                  fontSize: 12, fontWeight: 700,
                  color: isFollowingProfile ? MUTED : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                {isFollowingProfile ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Name / handle / bio */}
          <div style={{ marginBottom: 16, paddingLeft: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: DARK, marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: MUTED, fontFamily: 'var(--font-jost, sans-serif)' }}>@{handle}</div>
            {profile?.bio && (
              <div style={{ fontSize: 13, color: DARK, marginTop: 6, lineHeight: 1.5, fontFamily: 'var(--font-jost, sans-serif)' }}>{profile.bio}</div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderTop: '1px solid #E8E0E8', marginLeft: -20, marginRight: -20 }}>
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
                <span style={{ background: activeTab === tab.key ? `${ACCENT}18` : '#F0EBF4', color: activeTab === tab.key ? ACCENT : MUTED, borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Vendor list */}
        <div style={{ marginTop: 8, paddingBottom: 60 }}>
          {activeVendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: MUTED, fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>
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

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #E8E0E8', color: MUTED, fontSize: 13, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides
      </footer>
    </main>
  )
}
