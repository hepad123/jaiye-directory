import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

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

type Props = { params: Promise<{ username: string }> }

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const { data: profile } = await supabaseServer
    .from('profiles').select('display_name, username')
    .eq('username', username).maybeSingle()

  const name = profile?.display_name || username
  return {
    title: `${name}'s Vendor Shortlist — Jaiye Directory`,
    description: `${name}'s saved Nigerian wedding vendors on Jaiye Directory.`,
  }
}

export default async function ShortlistPage({ params }: Props) {
  const { username } = await params

  const { data: profile } = await supabaseServer
    .from('profiles').select('clerk_user_id, display_name, username')
    .eq('username', username).maybeSingle()

  if (!profile) {
    return (
      <main style={{ fontFamily: 'sans-serif', background: '#F5F5F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
          <h2 style={{ fontSize: 18, color: '#1C1917', fontWeight: 700, margin: '0 0 8px' }}>Shortlist not found</h2>
          <p style={{ color: '#A8A29E', fontSize: 13, marginBottom: 20 }}>This user doesn't exist or hasn't saved any vendors yet.</p>
          <Link href="/" style={{ color: '#D97706', fontSize: 13, textDecoration: 'none' }}>← Browse the directory</Link>
        </div>
      </main>
    )
  }

  const { data: savedRows } = await supabaseServer
    .from('saved_vendors').select('vendor_id')
    .eq('clerk_user_id', profile.clerk_user_id)

  const vendorIds = (savedRows ?? []).map(r => r.vendor_id)

  let vendors: Vendor[] = []
  if (vendorIds.length > 0) {
    const { data: vendorData } = await supabaseServer
      .from('vendors')
      .select('id, name, category, location, instagram, price_from, phone, website')
      .in('id', vendorIds)
    vendors = (vendorData ?? []).map(v =>
      v.category === 'Fashion' ? { ...v, category: 'Outfits' } : v
    )
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, Vendor[]>>((acc, cat) => {
    const inCat = vendors.filter(v => v.category === cat)
    if (inCat.length > 0) acc[cat] = inCat
    return acc
  }, {})
  vendors.forEach(v => {
    if (!CATEGORY_ORDER.includes(v.category)) {
      if (!grouped[v.category]) grouped[v.category] = []
      if (!grouped[v.category].find(x => x.id === v.id)) grouped[v.category].push(v)
    }
  })

  const displayName = profile.display_name || username
  const firstName   = displayName.split(' ')[0]
  const totalSaved  = vendors.length

  return (
    <main style={{ fontFamily: "'Jost', sans-serif", background: '#F5F5F4', minHeight: '100vh' }}>

      <div style={{ background: 'linear-gradient(180deg, #E8E0D5 0%, #EDE8E0 40%, #F5F5F4 100%)', textAlign: 'center', padding: '40px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ height: 1, width: 44, background: '#D97706', opacity: 0.4 }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#D97706', opacity: 0.6 }} />
          <div style={{ height: 1, width: 44, background: '#D97706', opacity: 0.4 }} />
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#D97706', fontWeight: 600, marginBottom: 8 }}>
          Vendor Shortlist
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, color: '#1C1917', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 6px' }}>
          {firstName}'s Picks
        </h1>
        <p style={{ fontSize: 13, color: '#78716C', margin: '0 0 4px' }}>
          {totalSaved > 0
            ? `${totalSaved} saved vendor${totalSaved !== 1 ? 's' : ''} on Jaiye Directory`
            : 'No vendors saved yet'}
        </p>
        <div style={{ marginTop: 20, height: 1, background: 'linear-gradient(to right, transparent, #D97706 30%, #D97706 70%, transparent)', opacity: 0.3 }} />
      </div>

      <div style={{ background: '#1C1917', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: '#D97706', letterSpacing: '0.08em' }}>Jaiye</span>
          <span style={{ fontSize: 11, color: '#78716C' }}>Nigerian Wedding &amp; Event Vendors</span>
        </div>
        <Link href="/" style={{ fontSize: 11, color: '#D97706', textDecoration: 'none', fontWeight: 600, border: '1px solid #D97706', borderRadius: 20, padding: '4px 12px' }}>
          Browse directory →
        </Link>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
        {totalSaved === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
            <p style={{ color: '#A8A29E', fontSize: 13 }}>{firstName} hasn't saved any vendors yet.</p>
            <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 24px', background: '#D97706', color: 'white', borderRadius: 24, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
              Browse the directory
            </Link>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catVendors]) => (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: getColour(cat), color: 'white', fontSize: 12, fontWeight: 600 }}>
                  {getEmoji(cat)} {cat}
                </span>
                <span style={{ fontSize: 12, color: '#A8A29E' }}>{catVendors.length} vendor{catVendors.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {catVendors.map(v => {
                  const igHandle    = v.instagram?.replace('@', '').trim()
                  const whatsappNum = v.phone?.replace(/\D/g, '')
                  const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}` : null

                  return (
                    <div key={v.id} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E3DC', padding: '14px 16px', boxShadow: '0 1px 3px rgba(28,25,23,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1917', fontFamily: "'Fraunces', serif", marginBottom: 4 }}>
                            {v.name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {v.location  && <span style={{ fontSize: 11, color: '#A8A29E' }}>📍 {v.location}</span>}
                            {v.price_from && <span style={{ fontSize: 11, color: '#0D9488', fontWeight: 600 }}>💰 From ₦{v.price_from}</span>}
                          </div>
                        </div>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: getColour(cat), flexShrink: 0, marginTop: 6 }} />
                      </div>
                      {(igHandle || whatsappUrl) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {igHandle && (
                            <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer nofollow"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1px solid #E8E3DC', background: '#F5F5F4', color: '#57534E', fontSize: 11, textDecoration: 'none', fontWeight: 500 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                <circle cx="12" cy="12" r="4"/>
                                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                              </svg>
                              @{igHandle}
                            </a>
                          )}
                          {whatsappUrl && (
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer nofollow"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 11, textDecoration: 'none', fontWeight: 700 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {totalSaved > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, padding: '24px 20px', background: '#1C1917', borderRadius: 20 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: '#D97706', marginBottom: 6 }}>Jaiye Directory</div>
            <p style={{ fontSize: 12, color: '#A8A29E', margin: '0 0 16px', lineHeight: 1.6 }}>
              The go-to guide for Nigerian wedding &amp; event vendors.
              Save, share, and discover 200+ vendors.
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
