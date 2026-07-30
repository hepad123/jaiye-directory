import { useEffect, useState } from 'react'
import { useParams } from 'wouter'
import { Link } from 'wouter'
import { supabase } from '@/lib/supabase'

type Vendor = {
  id: string
  name: string
  category: string
  location: string
  instagram: string
  price_from: string
  phone: string
  website: string
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

export default function ShortlistPage() {
  const { username } = useParams() as { username: string }
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ clerk_user_id: string; display_name: string; username: string } | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [grouped, setGrouped] = useState<Record<string, Vendor[]>>({})

  useEffect(() => {
    if (!username) return

    async function load() {
      setLoading(true)

      const { data: profileData } = await supabase
        .from('profiles').select('clerk_user_id, display_name, username')
        .eq('username', username).maybeSingle()

      if (!profileData) { setLoading(false); return }
      setProfile(profileData)

      const { data: savedRows } = await supabase
        .from('saved_vendors').select('vendor_id')
        .eq('clerk_user_id', profileData.clerk_user_id)

      const vendorIds = (savedRows ?? []).map((r: { vendor_id: string }) => r.vendor_id)

      if (vendorIds.length > 0) {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, name, category, location, instagram, price_from, phone, website')
          .in('id', vendorIds)

        const mapped = (vendorData ?? []).map((v: Vendor) =>
          v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v
        )
        setVendors(mapped)

        const g = CATEGORY_ORDER.reduce<Record<string, Vendor[]>>((acc, cat) => {
          const inCat = mapped.filter((v: Vendor) => v.category === cat)
          if (inCat.length > 0) acc[cat] = inCat
          return acc
        }, {})
        mapped.forEach((v: Vendor) => {
          if (!CATEGORY_ORDER.includes(v.category)) {
            if (!g[v.category]) g[v.category] = []
            g[v.category].push(v)
          }
        })
        setGrouped(g)
      }

      setLoading(false)
    }

    load()
  }, [username])

  if (loading) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: '#F5F5F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      </main>
    )
  }

  if (!profile) {
    return (
      <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: '#F5F5F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 18, color: '#1C1917', fontWeight: 700, margin: '0 0 8px' }}>Shortlist not found</h2>
          <p style={{ color: '#A8A29E', fontSize: 13, marginBottom: 20 }}>This user doesn't exist or hasn't saved any vendors yet.</p>
          <Link href="/" style={{ color: '#D97706', fontSize: 13, textDecoration: 'none' }}>← Browse the directory</Link>
        </div>
      </main>
    )
  }

  const totalSaved = vendors.length
  const categories = Object.keys(grouped)

  return (
    <main style={{ fontFamily: 'var(--font-jost, sans-serif)', background: '#F5F5F4', minHeight: '100vh', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: '#1C1917', padding: '40px 20px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: '#D97706', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12 }}>Vendor Shortlist</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          {profile.display_name}'s Shortlist
        </h1>
        <p style={{ color: '#A8A29E', fontSize: 13, marginBottom: 20 }}>
          {totalSaved} vendor{totalSaved !== 1 ? 's' : ''} saved
        </p>
        <Link href="/" style={{ display: 'inline-block', padding: '8px 20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 24, color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none' }}>
          ← Browse the directory
        </Link>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {totalSaved === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♡</div>
            <p style={{ color: '#A8A29E', fontSize: 14 }}>No vendors saved yet.</p>
          </div>
        ) : categories.map(cat => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #E8E3DC' }}>
              <span style={{ fontSize: 18 }}>{getEmoji(cat)}</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: getColour(cat) }}>{cat}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#A8A29E' }}>{grouped[cat].length}</span>
            </div>
            {grouped[cat].map((v: Vendor) => {
              const igHandle = v.instagram?.replace('@', '').trim()
              const phone = v.phone?.replace(/\D/g, '')
              const whatsappUrl = phone ? `https://wa.me/${phone.startsWith('0') ? '234' + phone.slice(1) : phone}` : null
              return (
                <div key={v.id} style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #E8E3DC' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: '#1C1917', marginBottom: 4 }}>{v.name}</div>
                      {v.location && <div style={{ fontSize: 12, color: '#A8A29E' }}>📍 {v.location}</div>}
                    </div>
                    {v.price_from && <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>₦{v.price_from}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {igHandle && (
                      <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer nofollow"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1px solid #E8E3DC', background: '#F5F5F4', color: '#57534E', fontSize: 11, textDecoration: 'none', fontWeight: 500 }}>
                        @{igHandle}
                      </a>
                    )}
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer nofollow"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 11, textDecoration: 'none', fontWeight: 700 }}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
            <div style={{ height: 4, background: getColour(cat) + '20', borderRadius: '0 0 12px 12px' }} />
          </div>
        ))}

        {totalSaved > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '24px 20px', background: '#1C1917', borderRadius: 20 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: '#D97706', marginBottom: 6 }}>Jaiyé Directory</div>
            <p style={{ fontSize: 12, color: '#A8A29E', margin: '0 0 16px', lineHeight: 1.6 }}>
              The go-to guide for Nigerian wedding &amp; event vendors.
            </p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: '#D97706', color: 'white', borderRadius: 24, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Browse the directory →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
