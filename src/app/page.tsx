'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import { useUser } from '@clerk/nextjs'

export default function HomePage() {
  const supabase = useSupabase()
  const { user } = useUser()
  const [vendorCount, setVendorCount] = useState(211)
  const [memberCount, setMemberCount] = useState(7)
  const [serviceCount, setServiceCount] = useState(8)
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    async function loadCounts() {
      const [vRes, mRes, sRes] = await Promise.all([
        supabase.from('vendors').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }),
      ])
      if (vRes.count) setVendorCount(vRes.count)
      if (mRes.count) setMemberCount(mRes.count)
      if (sRes.count) setServiceCount(sRes.count)
    }
    loadCounts()
  }, [supabase])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').select('display_name').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        const name = data?.display_name || user.firstName || ''
        setFirstName(name.split(' ')[0])
      })
  }, [user, supabase])

  const jost = 'var(--font-jost, sans-serif)'
  const play = 'var(--font-playfair, serif)'

  const cardLink = (href: string, label: string, sub: string, color: string) => (
    <Link href={href} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s', borderTop: '3px solid ' + color }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
      <div style={{ fontFamily: play, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
      <div style={{ fontFamily: jost, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sub}</div>
      <div style={{ fontFamily: jost, fontSize: 12, color: color, fontWeight: 600, marginTop: 4 }}>Explore →</div>
    </Link>
  )

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: jost }}>

        <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: 'clamp(48px, 8vw, 80px) 24px clamp(40px, 6vw, 64px)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
            <div style={{ height: 1, width: 44, background: 'var(--accent)', opacity: 0.4 }} />
          </div>
          {firstName ? (
            <p style={{ fontFamily: jost, fontSize: 13, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Welcome back, {firstName}</p>
          ) : (
            <p style={{ fontFamily: jost, fontSize: 13, color: 'var(--accent)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Welcome to</p>
          )}
          <h1 style={{ fontFamily: play, fontSize: 'clamp(48px, 8vw, 72px)', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 8px' }}>Jaiye</h1>
          <p style={{ fontFamily: jost, fontSize: 13, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 20 }}>Directory</p>
          <p style={{ fontFamily: jost, fontSize: 16, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>Your community guide to the best Nigerian wedding vendors, stylists and beauty professionals</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: play, fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{vendorCount}+</div>
              <div style={{ fontFamily: jost, fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Vendors</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: play, fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{serviceCount}+</div>
              <div style={{ fontFamily: jost, fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Stylists</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: play, fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{memberCount}+</div>
              <div style={{ fontFamily: jost, fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Members</div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
          <h2 style={{ fontFamily: play, fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Where would you like to start?</h2>
          <p style={{ fontFamily: jost, fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Browse by what you need — wedding vendors, beauty services, or both.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {cardLink('/services', 'Services', 'Hair stylists, makeup artists and lash technicians across Nigeria', '#D97706')}
            {cardLink('/directory', 'Bridal and Events', 'Over 200 wedding and event vendors — planners, photographers, caterers and more', '#6366F1')}
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 64px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontFamily: jost, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 600 }}>Community</div>
            <h3 style={{ fontFamily: play, fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Built by the community, for the community</h3>
            <p style={{ fontFamily: jost, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>Jaiye is a living directory maintained by brides and event lovers who share their real experiences. Save vendors, leave reviews, mark who you have used, and share your shortlist with friends and family.</p>
            <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent)', color: '#fff', borderRadius: 24, textDecoration: 'none', fontFamily: jost, fontSize: 13, fontWeight: 600, marginTop: 4 }}>Browse the directory →</Link>
          </div>
        </div>

        <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontFamily: jost }}>
          Made with love for Nigerian brides and families
        </footer>
      </main>
    </>
  )
}
