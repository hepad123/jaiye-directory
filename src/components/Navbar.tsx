'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'

const ACCENT = '#8B6E9A'
const DARK   = '#2A1A2A'
const MUTED  = '#9A8A9A'

type SearchProfile = {
  id: string
  username: string
  display_name: string
  bio?: string
}

function UserSearch() {
  const [open, setOpen]           = useState(false)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<SearchProfile[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const containerRef              = useRef<HTMLDivElement>(null)

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
        .select('id, username, display_name, bio')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8)
      setResults(data ?? [])
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const colours = [ACCENT, '#7B68C8', '#C07A2F', '#4A8FC4', '#C4563A', '#2E9E7A']
  const avatarColour = (name: string) => colours[name.charCodeAt(0) % colours.length]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Search people"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: open ? ACCENT : '#F0E8F0',
          border: `1.5px solid ${open ? ACCENT : '#D0C0D8'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, transition: 'all 0.15s',
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={open ? 'white' : MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <circle cx="19" cy="19" r="3"/>
          <line x1="21" y1="21" x2="17.5" y2="17.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 40, right: 0, zIndex: 200,
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(42,26,42,0.15)',
          border: '1px solid #E8E0E8',
          width: 300, overflow: 'hidden',
          fontFamily: 'var(--font-jost, sans-serif)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid #F0EBF4' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or @username…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: DARK, background: 'transparent', fontFamily: 'var(--font-jost, sans-serif)' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
            )}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {!query && <div style={{ padding: '20px 16px', textAlign: 'center', color: MUTED, fontSize: 12 }}>Type to search for people</div>}
            {query && searching && <div style={{ padding: '20px 16px', textAlign: 'center', color: MUTED, fontSize: 12 }}>Searching…</div>}
            {query && !searching && results.length === 0 && <div style={{ padding: '20px 16px', textAlign: 'center', color: MUTED, fontSize: 12 }}>No users found for "{query}"</div>}
            {results.map(p => {
              const initials = (p.display_name || p.username || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
              const colour   = avatarColour(p.display_name || p.username || 'a')
              return (
                <Link key={p.id} href={`/profile/${p.username}`}
                  onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #F8F5FC', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F5FC')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${colour}22`, border: `2px solid ${colour}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colour }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.display_name || p.username}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>@{p.username}</div>
                    {p.bio && <div style={{ fontSize: 10, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{p.bio}</div>}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const { user, openAuthModal } = useAuth()
  const pathname = usePathname()
  const [username, setUsername]     = useState('')
  const [initials, setInitials]     = useState('')
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!user?.id) { setUsername(''); setInitials(''); setSavedCount(0); return }
    supabase.from('profiles').select('username, display_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        const name  = data?.display_name || user.email?.split('@')[0] || ''
        const uname = data?.username     || user.email?.split('@')[0] || ''
        setUsername(uname)
        setInitials(name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase())
      })
    supabase.from('saved_vendors').select('vendor_id', { count: 'exact' }).eq('user_id', user.id)
      .then(({ count }) => setSavedCount(count ?? 0))
  }, [user])

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .nav-label { display: none !important; }
        }
      `}</style>

      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E8E0E8',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: 'var(--font-playfair, serif)',
          fontSize: 16, fontWeight: 700,
          color: DARK, textDecoration: 'none',
          letterSpacing: '0.08em',
          flexShrink: 0,
        }}>
          Jaiye
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Directory */}
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', borderRadius: 20,
            background: pathname === '/' ? '#F0E8F0' : 'transparent',
            textDecoration: 'none',
            color: pathname === '/' ? ACCENT : DARK,
            fontFamily: 'var(--font-jost, sans-serif)',
            fontSize: 13, fontWeight: pathname === '/' ? 600 : 500,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 16 }}>🌸</span>
            <span className="nav-label">Directory</span>
          </Link>

          {/* Saved */}
          {user ? (
            <Link href="/saved" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 20,
              background: isActive('/saved') ? '#F0E8F0' : 'transparent',
              textDecoration: 'none',
              color: isActive('/saved') ? ACCENT : DARK,
              fontFamily: 'var(--font-jost, sans-serif)',
              fontSize: 13, fontWeight: isActive('/saved') ? 600 : 500,
              transition: 'all 0.15s',
              position: 'relative',
            }}>
              <span style={{ fontSize: 16 }}>♡</span>
              <span className="nav-label">Saved</span>
              {savedCount > 0 && (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: ACCENT, color: '#fff',
                  fontSize: 9, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{savedCount}</span>
              )}
            </Link>
          ) : (
            <button onClick={openAuthModal} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 10px', borderRadius: 20,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: DARK, fontFamily: 'var(--font-jost, sans-serif)',
              fontSize: 13, fontWeight: 500,
            }}>
              <span style={{ fontSize: 16 }}>♡</span>
              <span className="nav-label">Saved</span>
            </button>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 18, background: '#D8D0D8', margin: '0 4px' }} />

          {/* User search */}
          <UserSearch />

          {/* Profile avatar */}
          {user && username ? (
            <Link href={`/profile/${username}`} title="My profile" style={{
              width: 32, height: 32, borderRadius: '50%',
              background: isActive('/profile') ? ACCENT : '#F0E8F0',
              border: `1.5px solid ${isActive('/profile') ? ACCENT : '#D0C0D8'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', fontSize: 12, fontWeight: 700,
              color: isActive('/profile') ? 'white' : DARK,
              flexShrink: 0, fontFamily: 'var(--font-jost, sans-serif)',
              transition: 'all 0.15s',
            }}>
              {initials}
            </Link>
          ) : (
            <button onClick={openAuthModal} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#F0E8F0', border: '1.5px solid #D0C0D8',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          )}

          {/* Sign out — hidden on mobile */}
          {user && (
            <button
              onClick={async () => { await supabase.auth.signOut() }}
              className="nav-label"
              style={{ fontSize: 11, color: '#B0A0B8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', fontFamily: 'var(--font-jost, sans-serif)' }}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </>
  )
}
