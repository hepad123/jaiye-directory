import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { useUser } from '@clerk/clerk-react'
import { useSupabase } from '@/hooks/useSupabase'

const ACCENT = '#B4690E'
const manrope = "'Manrope', sans-serif"

const CAT_COLORS: Record<string, string> = {
  'Photography': '#7C3AED', 'Videography & Content': '#9333EA',
  'Makeup': '#EC4899', 'Hair & Gele': '#F43F5E',
  'Event Planning': ACCENT, 'Decor & Venue': '#059669',
  'Catering': '#D97706', 'Entertainment': '#0891B2',
  'Styling': '#8B5CF6', 'Outfits': '#6366F1',
  'Accessories': '#14B8A6',
  // Beauty service categories
  'Hair': '#D97706', 'Lashes': '#0D9488', 'Nails': '#7C3AED', 'Brows': '#92400E',
}
const catColor = (cat: string) => CAT_COLORS[cat] || ACCENT

type ActivityItem = {
  id: string
  name: string
  category: string
  action: 'used' | 'recommended'
  kind: 'vendor' | 'service'
}

type PersonActivity = {
  id: string
  display_name: string
  username: string
  avatar_url?: string
  items: ActivityItem[]
}

export default function FollowingPage() {
  const { user } = useUser()
  const supabase = useSupabase()
  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState<PersonActivity[]>([])

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }

    async function load() {
      setLoading(true)

      // 1. Who does the current user follow?
      const { data: followRows } = await supabase
        .from('follows')
        .select('clerk_following_id')
        .eq('clerk_follower_id', user!.id)

      if (!followRows?.length) { setLoading(false); return }
      const followingIds = followRows.map((r: any) => r.clerk_following_id).filter(Boolean)
      if (!followingIds.length) { setLoading(false); return }

      // 2. Parallel: profiles + vendor activity + beauty service activity
      const [profilesRes, vendorUsedRes, vendorRecRes, serviceUsedRes, serviceRecRes] = await Promise.all([
        supabase.from('profiles').select('clerk_user_id, display_name, username, avatar_url').in('clerk_user_id', followingIds),
        supabase.from('vendor_used').select('vendor_id, clerk_user_id').in('clerk_user_id', followingIds),
        supabase.from('vendor_recommendations').select('vendor_id, clerk_user_id').in('clerk_user_id', followingIds),
        supabase.from('service_used').select('service_id, clerk_user_id').in('clerk_user_id', followingIds),
        supabase.from('service_recommendations').select('service_id, clerk_user_id').in('clerk_user_id', followingIds),
      ])

      const vendorUsedRows: Array<{ vendor_id: string; clerk_user_id: string }> = vendorUsedRes.data || []
      const vendorRecRows: Array<{ vendor_id: string; clerk_user_id: string }> = vendorRecRes.data || []
      const serviceUsedRows: Array<{ service_id: string; clerk_user_id: string }> = serviceUsedRes.data || []
      const serviceRecRows: Array<{ service_id: string; clerk_user_id: string }> = serviceRecRes.data || []

      // 3. Fetch vendor + service details in parallel
      const allVendorIds = [...new Set([...vendorUsedRows.map(r => r.vendor_id), ...vendorRecRows.map(r => r.vendor_id)])]
      const allServiceIds = [...new Set([...serviceUsedRows.map(r => r.service_id), ...serviceRecRows.map(r => r.service_id)])]

      const [vendorDetails, serviceDetails] = await Promise.all([
        allVendorIds.length > 0
          ? supabase.from('vendors').select('id, name, category').in('id', allVendorIds)
          : Promise.resolve({ data: [] }),
        allServiceIds.length > 0
          ? supabase.from('services').select('id, name, category').in('id', allServiceIds)
          : Promise.resolve({ data: [] }),
      ])

      const vendorMap: Record<string, { id: string; name: string; category: string }> = {}
      ;(vendorDetails.data || []).forEach((v: any) => { vendorMap[v.id] = v })

      const serviceMap: Record<string, { id: string; name: string; category: string }> = {}
      ;(serviceDetails.data || []).forEach((s: any) => { serviceMap[s.id] = s })

      // 4. Build per-person activity (vendors first, then services; dedup by id+kind)
      const profiles: any[] = profilesRes.data || []
      const result: PersonActivity[] = profiles.map(p => {
        const seen = new Set<string>()
        const items: ActivityItem[] = []

        // Vendor used
        vendorUsedRows.filter(r => r.clerk_user_id === p.clerk_user_id).forEach(r => {
          const v = vendorMap[r.vendor_id]
          const key = `vendor:${r.vendor_id}`
          if (v && !seen.has(key)) { seen.add(key); items.push({ ...v, action: 'used', kind: 'vendor' }) }
        })
        // Vendor recommended
        vendorRecRows.filter(r => r.clerk_user_id === p.clerk_user_id).forEach(r => {
          const v = vendorMap[r.vendor_id]
          const key = `vendor:${r.vendor_id}`
          if (v && !seen.has(key)) { seen.add(key); items.push({ ...v, action: 'recommended', kind: 'vendor' }) }
        })
        // Service used
        serviceUsedRows.filter(r => r.clerk_user_id === p.clerk_user_id).forEach(r => {
          const s = serviceMap[r.service_id]
          const key = `service:${r.service_id}`
          if (s && !seen.has(key)) { seen.add(key); items.push({ ...s, action: 'used', kind: 'service' }) }
        })
        // Service recommended
        serviceRecRows.filter(r => r.clerk_user_id === p.clerk_user_id).forEach(r => {
          const s = serviceMap[r.service_id]
          const key = `service:${r.service_id}`
          if (s && !seen.has(key)) { seen.add(key); items.push({ ...s, action: 'recommended', kind: 'service' }) }
        })

        return { id: p.clerk_user_id, display_name: p.display_name, username: p.username, avatar_url: p.avatar_url, items }
      }).filter(p => p.items.length > 0)

      setPeople(result)
      setLoading(false)
    }

    load()
  }, [user?.id])

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px,4vw,40px) clamp(16px,4vw,32px) 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 24, height: 1, background: ACCENT }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: ACCENT, fontFamily: manrope }}>Social Proof</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(2rem,6vw,3.5rem)', fontFamily: "'DM Serif Display', serif", color: '#1A1612', lineHeight: 0.95, letterSpacing: '0.02em' }}>
            Following<br />Activity
          </h1>
          <p style={{ marginTop: 14, fontSize: 13, color: '#9C8C7E', fontFamily: manrope, lineHeight: 1.6 }}>
            Vendors &amp; beauty services the people you follow have used or recommended.
          </p>
        </div>

        {/* Auth gate */}
        {!user ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 14, color: '#9C8C7E', fontFamily: manrope, marginBottom: 20 }}>
              Sign in to see activity from people you follow.
            </p>
            <Link href="/sign-in" style={{ display: 'inline-block', padding: '10px 28px', background: ACCENT, color: '#fff', borderRadius: 8, textDecoration: 'none', fontFamily: manrope, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>
              Sign In
            </Link>
          </div>

        ) : loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: '#EDE8E1', borderRadius: 14, height: 130, opacity: 1 - i * 0.2 }} />
            ))}
          </div>

        ) : people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <p style={{ fontSize: 14, color: '#9C8C7E', fontFamily: manrope, lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
              No activity yet from the people you follow.
              <br />
              <span style={{ fontSize: 12 }}>Follow people from their profiles, then come back here to see which vendors and stylists they recommend.</span>
            </p>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {people.map(person => (
              <div key={person.id} style={{ background: '#F5EEE6', borderRadius: 16, border: '1px solid #E5DDD4', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,22,18,0.05)' }}>

                {/* Person header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5DDD4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: ACCENT + '20', border: '2px solid ' + ACCENT + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {person.avatar_url
                        ? <img src={person.avatar_url} alt={person.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 15, fontWeight: 700, color: ACCENT, fontFamily: manrope }}>{person.display_name?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1612', fontFamily: manrope }}>{person.display_name}</div>
                      <div style={{ fontSize: 10, color: '#9C8C7E', fontFamily: manrope }}>
                        @{person.username} · {person.items.length} {person.items.length !== 1 ? 'picks' : 'pick'}
                      </div>
                    </div>
                  </div>
                  <Link href={`/profile/${person.username}`} style={{ fontSize: 10, color: ACCENT, fontWeight: 700, fontFamily: manrope, textDecoration: 'none', letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>
                    Profile →
                  </Link>
                </div>

                {/* Activity list */}
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {person.items.map(item => (
                    <Link
                      key={`${item.kind}:${item.id}`}
                      href={item.kind === 'vendor' ? `/directory?id=${item.id}` : `/beautyservices?id=${item.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', padding: '9px 12px', background: '#FAF7F2', borderRadius: 10, border: '1px solid #E5DDD4' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 3, height: 30, borderRadius: 2, background: catColor(item.category), flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1612', fontFamily: manrope }}>{item.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 10, color: catColor(item.category), fontFamily: manrope, fontWeight: 600 }}>{item.category}</span>
                            <span style={{ fontSize: 9, color: '#C4B9AE', fontFamily: manrope }}>·</span>
                            <span style={{ fontSize: 9, color: '#C4B9AE', fontFamily: manrope, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                              {item.kind === 'service' ? 'Beauty' : 'Vendor'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, fontFamily: manrope, letterSpacing: '0.06em',
                          textTransform: 'uppercase' as const, padding: '3px 9px', borderRadius: 20,
                          color: item.action === 'used' ? '#059669' : ACCENT,
                          background: item.action === 'used' ? '#DCFCE7' : ACCENT + '18',
                        }}>
                          {item.action === 'used' ? '👋 Used' : '⭐ Rec\'d'}
                        </span>
                        <span style={{ fontSize: 10, color: '#C4B9AE', fontFamily: manrope }}>→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
