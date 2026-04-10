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

const CATEGORY_ORDER = [
  'Event Planning', 'Outfits', 'Styling', 'Makeup',
  'Hair & Gele', 'Photography', 'Videography & Content',
  'Decor & Venue', 'Catering', 'Entertainment', 'Other',
]

const getColour = (cat: string) => CATEGORY_META[cat]?.colour ?? '#D97706'
const getEmoji  = (cat: string) => CATEGORY_META[cat]?.emoji  ?? '✦'

function Avatar({ name, size = 64, imageUrl }: { name: string; size?: number; imageUrl?: string }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colours  = ['#D97706', '#6366F1', '#0D9488', '#2563EB', '#EA580C', '#DB2777']
  const colour   = colours[name.charCodeAt(0) % colours.length]

  if (imageUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        border: `2px solid ${colour}40`,
      }}>
        <Image src={imageUrl} alt={name} width={size} height={size} style={{ borderRadius: '50%', objectFit: 'cover' }} />
      </div>
    )
  }

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colour}15`, border: `1px solid ${colour}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
        {getEmoji(vendor.category)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>
          {vendor.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {vendor.location && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>{vendor.location}</span>}
          {igHandle && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-jost, sans-serif)' }}>@{igHandle}</span>}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--bg-pill)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: getColour(cat), textTransform: 'uppercase', letterSpacing: 1.2, fontFamily: 'var(--font-jost, sans-serif)' }}>
              {getEmoji(cat)} {cat}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)' }}>· {catVendors.length}</span>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
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
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999, background: 'var(--bg)', borderRadius: '20px 20px 0 0', maxWidth: 480, margin: '0 auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(28,25,23,0.12)', fontFamily: 'var(--font-jost, sans-serif)' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ width: 32, height: 3, background: 'var(--border)', borderRadius: 2, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-playfair, serif)' }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>×</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {people.length === 0
            ? <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No one here yet</div>
            : people.map(p => (
              <div key={p.clerk_user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                <Avatar name={p.display_name} size={38} imageUrl={p.avatar_url} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.display_name}</div>
                  {p.username && (
                    <Link href={`/profile/${p.username}`} onClick={onClose} style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      @{p.username}
                    </Link>
                  )}
                </div>
                {currentUserId && p.clerk_user_id !== currentUserId && (
                  <button onClick={() => onToggleFollow(p.clerk_user_id)} style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: followingIds.has(p.clerk_user_id) ? 'var(--bg-card)' : 'var(--accent)',
                    color: followingIds.has(p.clerk_user_id) ? 'var(--text-muted)' : 'white',
                    border: followingIds.has(p.clerk_user_id) ? '1px solid var(--border)' : 'none',
                    fontFamily: 'var(--font-jost, sans-serif)',
                  }}>
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
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).maybeSingle()
      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData)
      const profileId = profileData.clerk_user_id

      const [usedRows, recRows, followerRows, followingRows, myFollowingRows] = await Promise.all([
        supabase.from('vendor_used').select('vendor_id').eq('clerk_user_id', profileId),
        supabase.from('vendor_recommendations').select('vendor_id').eq('clerk_user_id', profileId),
        supabase.from('follows').select('clerk_follower_id').eq('clerk_following_id', profileId),
        supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', profileId),
        user?.id
          ? supabase.from('follows').select('clerk_following_id').eq('clerk_follower_id', user.id)
          : Promise.resolve({ data: [] }),
      ])

      const usedIds     = [...new Set((usedRows.data     ?? []).map((r: { vendor_id: string }) => r.vendor_id))]
      const recIds      = [...new Set((recRows.data      ?? []).map((r: { vendor_id: string }) => r.vendor_id))]
      const followerIds = (followerRows.data  ?? []).map((r: { clerk_follower_id: string })  => r.clerk_follower_id)
      const followIds   = (followingRows.data ?? []).map((r: { clerk_following_id: string }) => r.clerk_following_id)

      const [usedVendorRes, recVendorRes, followerProfileRes, followingProfileRes] = await Promise.all([
        usedIds.length
          ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', usedIds)
          : Promise.resolve({ data: [] }),
        recIds.length
          ? supabase.from('vendors').select('id, name, category, location, instagram, price_from').in('id', recIds)
          : Promise.resolve({ data: [] }),
        followerIds.length
          ? supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followerIds)
          : Promise.resolve({ data: [] }),
        followIds.length
          ? supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followIds)
          : Promise.resolve({ data: [] }),
      ])

      if (usedVendorRes.data)       setUsedVendors(usedVendorRes.data)
      if (recVendorRes.data)        setRecVendors(recVendorRes.data)
      if (followerProfileRes.data)  setFollowers(followerProfileRes.data)
      if (followingProfileRes.data) setFollowing(followingProfileRes.data)
      if (myFollowingRows.data)     setFollowingIds(new Set(myFollowingRows.data.map((r: { clerk_following_id: string }) => r.clerk_following_id)))

      setLoading(false)
    }
    load()
  }, [username, user])

  const handleToggleFollow = useCallback(async (targetId: string) => {
    if (!user?.id) { openSignIn(); return }
    const isFollowing = followingIds.has(targetId)
    setFollowingIds(prev => {
      const n = new Set(prev)
      isFollowing ? n.delete(targetId) : n.add(targetId)
      return n
    })
    if (isFollowing) {
      await fetch('/api/follows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })
      if (targetId === profile?.clerk_user_id) setFollowers(prev => prev.filter(f => f.clerk_user_id !== user.id))
    } else {
      await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })
      if (targetId === profile?.clerk_user_id) {
        const { data } = await supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').eq('clerk_user_id', user.id).maybeSingle()
        if (data) setFollowers(prev => [...prev, data])
      }
    }
  }, [user, followingIds, profile, openSignIn])

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>
        <div style={{ height: 120, background: 'var(--hero-grad)' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: 20, marginTop: -8, boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: '1px solid var(--border)' }}>
            {[70, 40, 50].map((h, i) => (
              <div key={i} style={{ height: h, background: 'var(--bg-pill)', borderRadius: 10, marginBottom: 12, opacity: 0.5 }} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (notFound) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 18, color: 'var(--text)', fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-playfair, serif)' }}>Profile not found</h2>
          <Link href="/" style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>← Back to directory</Link>
        </div>
      </main>
    )
  }

  const displayName        = profile?.display_name || 'Unknown'
  const handle             = profile?.username || ''
  const isFollowingProfile = followingIds.has(profile?.clerk_user_id ?? '')
  const activeVendors      = activeTab === 'used' ? usedVendors : recVendors

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--hero-grad)', padding: '32px 20px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>Vendor Profile</div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '20px 20px 0', boxShadow: '0 4px 24px rgba(28,25,23,0.08)', border: '1px solid var(--border)', position: 'relative', top: -12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <Avatar name={displayName} size={68} imageUrl={profile?.avatar_url} />
            <div style={{ flex: 1, display: 'flex', gap: 24, paddingTop: 8 }}>
              <button onClick={() => setSheet('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-playfair, serif)' }}>{followers.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Followers</div>
              </button>
              <button onClick={() => setSheet('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-playfair, serif)' }}>{following.length}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Following</div>
              </button>
            </div>

            {/* Edit profile button — now a Link */}
            {isOwner ? (
              <Link href="/profile/edit" style={{
                padding: '7px 16px', borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                fontSize: 12, fontWeight: 600,
                color: 'var(--text)', cursor: 'pointer',
                fontFamily: 'var(--font-jost, sans-serif)',
                textDecoration: 'none', display: 'inline-block',
              }}>
                Edit profile
              </Link>
            ) : (
              <button
                onClick={() => { if (!user) { openSignIn(); return }; handleToggleFollow(profile!.clerk_user_id) }}
                style={{
                  padding: '7px 16px', borderRadius: 20,
                  border: isFollowingProfile ? '1px solid var(--border)' : 'none',
                  background: isFollowingProfile ? 'var(--bg-card)' : 'var(--accent)',
                  fontSize: 12, fontWeight: 700,
                  color: isFollowingProfile ? 'var(--text-muted)' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                {isFollowingProfile ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div style={{ marginBottom: 16, paddingLeft: 2 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 2, fontFamily: 'var(--font-playfair, serif)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{handle}</div>
            {profile?.bio && <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 6, lineHeight: 1.5 }}>{profile.bio}</div>}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border)', marginLeft: -20, marginRight: -20 }}>
            {[
              { key: 'used',        label: '✓ Used',  count: usedVendors.length },
              { key: 'recommended', label: '⭐ Recs', count: recVendors.length  },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as 'used' | 'recommended')}
                style={{
                  flex: 1, padding: '13px 8px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'var(--font-jost, sans-serif)',
                }}>
                {tab.label}
                <span style={{ background: activeTab === tab.key ? 'var(--accent-light)' : 'var(--bg-pill)', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 8, paddingBottom: 60 }}>
          {activeVendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
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

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-jost, sans-serif)' }}>
        Made with ♥ for Nigerian brides &amp; families
      </footer>
    </main>
  )
}
