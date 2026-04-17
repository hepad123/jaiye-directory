'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton, Show } from '@clerk/nextjs'
import Image from 'next/image'
import { useTheme } from '@/hooks/useTheme'
import { useSupabase } from '@/hooks/useSupabase'
import { useEffect, useState, useRef } from 'react'

type SearchProfile = {
  clerk_user_id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
}

function UserSearch() {
  const supabase = useSupabase()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProfile[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery(''); setResults([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('clerk_user_id, username, display_name, bio, avatar_url')
        .or('username.ilike.%' + query + '%,display_name.ilike.%' + query + '%')
        .limit(8)
      setResults(data ?? [])
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, supabase])

  const avatarColours = ['#D97706', '#6366F1', '#0D9488', '#2563EB', '#EA580C', '#DB2777']
  const avatarColour = (name: string) => avatarColours[name.charCodeAt(0) % avatarColours.length]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Search people" style={{ width: 32, height: 32, borderRadius: '50%', background: open ? 'var(--accent)' : 'var(--bg-pill)', border: '1.5px solid ' + (open ? 'var(--accent)' : 'var(--border)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'all 0.15s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={open ? 'white' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><circle cx="19" cy="19" r="3"/><line x1="21" y1="21" x2="17.5" y2="17.5"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 200, background: 'var(--bg-card)', borderRadius: 14, boxShadow: '0 8px 32px rgba(28,25,23,0.14)', border: '1px solid var(--border)', width: 300, overflow: 'hidden', fontFamily: 'var(--font-jost, sans-serif)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input ref={inputRef} type="text" placeholder="Search by name or @username..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', background: 'transparent', fontFamily: 'var(--font-jost, sans-serif)' }} />
            {query && <button onClick={() => { setQuery(''); setResults([]) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 0, lineHeight: 1 }}>x</button>}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {!query && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Type to search for people</div>}
            {query && searching && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Searching...</div>}
            {query && !searching && results.length === 0 && <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No users found for &quot;{query}&quot;</div>}
            {results.map(p => {
              const initials = (p.display_name || p.username || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
              const colour = avatarColour(p.display_name || p.username || 'a')
              return (
                <Link key={p.clerk_user_id} href={'/profile/' + p.username} onClick={() => { setOpen(false); setQuery(''); setResults([]) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {p.avatar_url ? (
                    <Image src={p.avatar_url} alt={p.display_name || p.username} width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid ' + colour + '50' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: colour + '20', border: '2px solid ' + colour + '50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colour }}>{initials}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || p.username}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{p.username}</div>
                    {p.bio && <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{p.bio}</div>}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} style={{ width: 44, height: 24, borderRadius: 12, background: isDark ? 'var(--accent)' : 'var(--bg-pill)', border: '1.5px solid var(--border)', position: 'relative', cursor: 'pointer', padding: 0, transition: 'background 0.2s, border-color 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 1, left: isDark ? 21 : 1, width: 18, height: 18, borderRadius: '50%', background: isDark ? 'white' : 'var(--bg-card)', border: '1px solid ' + (isDark ? 'transparent' : 'var(--border)'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {isDark ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        )}
      </div>
    </button>
  )
}

function ProfileDropdown({ user, username, displayName, profileChecked, isActive, signOut }: { user: ReturnType<typeof useUser>['user']; username: string; displayName: string; profileChecked: boolean; isActive: (path: string) => boolean; signOut: () => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { openUserProfile } = useClerk()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const avatarUrl = user?.imageUrl
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid ' + (open || isActive('/profile') ? 'var(--accent)' : 'var(--border)'), background: 'var(--bg-pill)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.15s' }}>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName || username || 'Profile'} width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-jost, sans-serif)' }}>{profileChecked ? (displayName || username || '?').charAt(0).toUpperCase() : (user?.firstName || '?').charAt(0).toUpperCase()}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 200, background: 'var(--bg-card)', borderRadius: 14, boxShadow: '0 8px 32px rgba(28,25,23,0.14)', border: '1px solid var(--border)', width: 220, overflow: 'hidden', fontFamily: 'var(--font-jost, sans-serif)' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{displayName || user?.firstName || 'User'}</div>
            {username && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{username}</div>}
          </div>
          <div style={{ padding: '6px 0' }}>
            {username && <Link href={'/profile/' + username} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', textDecoration: 'none', color: 'var(--text)', fontSize: 13, transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>&#128100;</span>My Profile</Link>}
            {username && <Link href="/profile/edit" onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', textDecoration: 'none', color: 'var(--text)', fontSize: 13, transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>&#9999;&#65039;</span>Edit Profile</Link>}
            <button onClick={() => { setOpen(false); openUserProfile() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-jost, sans-serif)', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>&#9881;&#65039;</span>Account Settings</button>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>
            <button onClick={() => { setOpen(false); signOut() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', background: 'none', border: 'none', color: '#DC2626', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-jost, sans-serif)', transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>&#128682;</span>Sign Out</button>
          </div>
        </div>
      )}
    </div>
  )
}

function NavDrawer({ open, onClose, pathname, savedCount }: { open: boolean; onClose: () => void; pathname: string; savedCount: number }) {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [eventsOpen, setEventsOpen] = useState(false)
  const manrope = "'Manrope', var(--font-jost, sans-serif)"
  const play = 'var(--font-playfair, serif)'

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  const navItem = (label: string, href: string, opts?: { count?: number }) => (
    <Link href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: isActive(href) ? '#B4690E' : 'var(--text)', textDecoration: 'none', borderLeft: isActive(href) ? '2px solid #B4690E' : '2px solid transparent', transition: 'all 0.1s', fontFamily: manrope, background: isActive(href) ? 'var(--bg-pill)' : 'transparent' }} onMouseEnter={e => { if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-pill)' }} onMouseLeave={e => { if (!isActive(href)) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <span>{label}</span>
      {opts?.count !== undefined && opts.count > 0 && <span style={{ fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 20, padding: '1px 7px', fontWeight: 700 }}>{opts.count}</span>}
    </Link>
  )

  const subItem = (label: string, href: string) => (
    <Link key={label} href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px 8px 32px', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: isActive(href) ? '#B4690E' : 'var(--text-muted)', textDecoration: 'none', fontFamily: manrope, fontWeight: 600, transition: 'color 0.1s' }} onMouseEnter={e => (e.currentTarget.style.color = '#B4690E')} onMouseLeave={e => { if (!isActive(href)) e.currentTarget.style.color = 'var(--text-muted)' }}>
      <div style={{ width: 3, height: 3, borderRadius: '50%', background: isActive(href) ? '#B4690E' : 'var(--border)', flexShrink: 0 }} />
      {label}
    </Link>
  )

  const sectionLabel = (label: string) => (
    <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', padding: '16px 20px 4px', fontFamily: manrope, fontWeight: 600, opacity: 0.6 }}>{label}</div>
  )

  const expandableItem = (label: string, isOpen: boolean, onToggle: () => void) => (
    <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: manrope, borderLeft: '2px solid transparent', transition: 'all 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <span>{label}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  )

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(28,25,23,0.4)', opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none', transition: 'opacity 0.2s', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 50, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.22s ease', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontFamily: play, fontSize: 22, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em' }}>Jaiye</div>
          <div style={{ fontFamily: manrope, fontSize: 10, color: 'var(--text-muted)', marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nigerian services and events directory</div>
        </div>

        <div style={{ flex: 1 }}>
          {sectionLabel('Explore')}
          {navItem('Home', '/')}

          {expandableItem('Services', servicesOpen, () => setServicesOpen(o => !o))}
          <div style={{ maxHeight: servicesOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.2s ease', background: 'var(--bg)' }}>
            {subItem('Hair', '/services?cat=Hair')}
            {subItem('Makeup', '/services?cat=Makeup')}
            {subItem('Lashes', '/services?cat=Lashes')}
            {subItem('Nails', '/services?cat=Nails')}
            {subItem('Brows', '/services?cat=Brows')}
          </div>

          {expandableItem('Events', eventsOpen, () => setEventsOpen(o => !o))}
          <div style={{ maxHeight: eventsOpen ? 120 : 0, overflow: 'hidden', transition: 'max-height 0.2s ease', background: 'var(--bg)' }}>
            {subItem('Wedding', '/directory?occasion=Wedding')}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
          {sectionLabel('You')}
          {navItem('Saved', '/saved', { count: savedCount })}
          {navItem('My Profile', '/profile/edit')}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', fontFamily: manrope, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Made with love for Nigerian brides
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap');`}</style>
    </>
  )
}

export default function Navbar() {
  const supabase = useSupabase()
  const { user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [savedCount, setSavedCount] = useState(0)
  const [profileChecked, setProfileChecked] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) { setUsername(''); setDisplayName(''); setSavedCount(0); setProfileChecked(false); return }
    supabase.from('profiles').select('username, display_name').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.username) { setUsername(data.username); setDisplayName(data.display_name || '') }
        else if (pathname !== '/onboarding') router.push('/onboarding')
        setProfileChecked(true)
      })
    refreshSavedCount()
  }, [user, pathname, router])

  function refreshSavedCount() {
    if (!user?.id) return
    supabase.from('saved_vendors').select('vendor_id', { count: 'exact' }).eq('clerk_user_id', user.id)
      .then(({ count }) => setSavedCount(count ?? 0))
  }

  useEffect(() => {
    const handler = () => refreshSavedCount()
    window.addEventListener('saved-change', handler)
    return () => window.removeEventListener('saved-change', handler)
  }, [user, supabase])

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  return (
    <>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} pathname={pathname || ''} savedCount={savedCount} />
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30, transition: 'background 0.2s ease, border-color 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setDrawerOpen(o => !o)} style={{ width: 32, height: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, flexShrink: 0, transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-pill)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <div style={{ width: 18, height: 1.5, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: drawerOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <div style={{ width: 14, height: 1.5, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', opacity: drawerOpen ? 0 : 1 }} />
            <div style={{ width: 18, height: 1.5, background: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: drawerOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>
          <Link href="/" style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 16, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.08em', flexShrink: 0 }}>Jaiye</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Show when="signed-in">
            <Link href="/saved" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 20, background: isActive('/saved') ? 'var(--bg-pill)' : 'transparent', textDecoration: 'none', color: isActive('/saved') ? 'var(--text)' : 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)', fontSize: 13, fontWeight: isActive('/saved') ? 600 : 400, transition: 'all 0.15s', position: 'relative' }}>
              <span style={{ fontSize: 14 }}>&#9825;</span>
              <span className="nav-label">Saved</span>
              {savedCount > 0 && <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{savedCount}</span>}
            </Link>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-jost, sans-serif)', fontSize: 13 }}>
                <span style={{ fontSize: 14 }}>&#9825;</span>
                <span className="nav-label">Saved</span>
              </button>
            </SignInButton>
          </Show>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />
          <ThemeToggle />
          <UserSearch />
          <Show when="signed-in">
            <ProfileDropdown user={user} username={username} displayName={displayName} profileChecked={profileChecked} isActive={isActive} signOut={signOut} />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-jost, sans-serif)' }}>Sign in</button>
            </SignInButton>
          </Show>
        </div>
      </div>
      <style>{'.nav-label {} @media (max-width: 640px) { .nav-label { display: none !important; } }'}</style>
    </>
  )
}
