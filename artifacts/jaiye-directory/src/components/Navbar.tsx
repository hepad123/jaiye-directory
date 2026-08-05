import { Link, useLocation } from 'wouter'
import { useUser, useClerk, SignInButton } from '@clerk/clerk-react'
import { useSupabase } from '@/hooks/useSupabase'
import { supabase as anonSupabase } from '@/lib/supabase'
import { useClerkAvailable } from '@/context/auth'
import { useEffect, useState, useRef } from 'react'

type SearchProfile = { clerk_user_id: string; username: string; display_name: string; avatar_url?: string }

/* ─────────────────────────────────────────────────────────
   UserSearch — public reads, uses anon client directly (no Clerk)
───────────────────────────────────────────────────────── */
function UserSearch() {
  const supabase = anonSupabase
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchProfile[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) { setOpen(false); setQ(''); setResults([]) }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setBusy(true)
      const { data } = await supabase.from('profiles').select('clerk_user_id, username, display_name, avatar_url').or('username.ilike.%' + q + '%,display_name.ilike.%' + q + '%').limit(8)
      setResults(data ?? [])
      setBusy(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q, supabase])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Find people"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: open ? 'rgba(180,105,14,0.12)' : 'transparent', border: 'none', cursor: 'pointer', color: open ? '#B4690E' : '#9C8C7E', fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Find</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 300, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 16px 48px rgba(26,22,18,0.18)', border: '1px solid #E5DDD4', width: 280, overflow: 'hidden', fontFamily: "'Manrope',sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #E5DDD4' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9C8C7E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input ref={inputRef} type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or @handle"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#1A1612', background: 'transparent', fontFamily: "'Manrope',sans-serif" }} />
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {busy && <div style={{ padding: '12px 14px', fontSize: 12, color: '#9C8C7E' }}>Searching…</div>}
            {!busy && q && results.length === 0 && <div style={{ padding: '12px 14px', fontSize: 12, color: '#9C8C7E' }}>No users found</div>}
            {results.map(p => (
              <Link key={p.clerk_user_id} href={'/profile/' + p.username}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', borderBottom: '1px solid #F0EAE0' }}
                onClick={() => { setOpen(false); setQ(''); setResults([]) }}>
                {p.avatar_url
                  ? <img src={p.avatar_url} alt={p.display_name} width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(180,105,14,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#B4690E', flexShrink: 0 }}>{p.display_name[0]?.toUpperCase()}</div>
                }
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1612' }}>{p.display_name}</div>
                  <div style={{ fontSize: 10, color: '#9C8C7E' }}>@{p.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   ProfileMenu — uses Clerk hooks (only rendered inside ClerkProvider)
───────────────────────────────────────────────────────── */
function ProfileMenu({ user, username, displayName, signOut }: { user: ReturnType<typeof useUser>['user']; username: string; displayName: string; signOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const initials = ((user?.fullName || displayName || 'U').split(' ').map(p => p[0]).slice(0, 2).join('')).toUpperCase()
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(180,105,14,0.40)', background: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {user?.imageUrl
          ? <img src={user.imageUrl} alt={displayName} width={30} height={30} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 11, fontWeight: 700, color: '#B4690E', fontFamily: "'Manrope',sans-serif" }}>{initials}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 38, right: 0, zIndex: 300, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 16px 48px rgba(26,22,18,0.18)', border: '1px solid #E5DDD4', minWidth: 190, overflow: 'hidden', fontFamily: "'Manrope',sans-serif" }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #E5DDD4' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1612' }}>{displayName || user?.fullName}</div>
            {username && <div style={{ fontSize: 11, color: '#9C8C7E', marginTop: 2 }}>@{username}</div>}
          </div>
          {username && <Link href={'/profile/' + username} style={{ display: 'block', padding: '10px 14px', fontSize: 13, color: '#6B6359', textDecoration: 'none', borderBottom: '1px solid #F0EAE0' }} onClick={() => setOpen(false)}>View profile</Link>}
          <Link href="/profile/edit" style={{ display: 'block', padding: '10px 14px', fontSize: 13, color: '#6B6359', textDecoration: 'none', borderBottom: '1px solid #F0EAE0' }} onClick={() => setOpen(false)}>Edit profile</Link>
          <button onClick={() => { setOpen(false); signOut() }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Manrope',sans-serif" }}>Sign out</button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   NavbarAuth — ALL Clerk hooks live here, mounted only when
   ClerkProvider is present in the tree.
───────────────────────────────────────────────────────── */
function NavbarAuth() {
  const { user, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const supabase = useSupabase()
  const [, pathname] = [null, useLocation()[0]]
  const [savedCount, setSavedCount] = useState(0)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const isActive = (p: string) => pathname === p

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('username, display_name').eq('clerk_user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) { setUsername(data.username || ''); setDisplayName(data.display_name || '') } })
  }, [user])

  useEffect(() => {
    if (!user) { setSavedCount(0); return }
    supabase.from('saved_vendors').select('vendor_id', { count: 'exact', head: true }).eq('clerk_user_id', user.id)
      .then(({ count }) => setSavedCount(count ?? 0))
  }, [user])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isSignedIn ? (
        <Link href="/saved" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: isActive('/saved') ? 'rgba(180,105,14,0.12)' : 'transparent', textDecoration: 'none', color: isActive('/saved') ? '#B4690E' : '#9C8C7E', fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>
          <span style={{ fontSize: 15 }}>♡</span>
          {savedCount > 0 && <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#B4690E', color: '#FFFFFF', fontSize: 8, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{savedCount}</span>}
        </Link>
      ) : (
        <SignInButton mode="modal">
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9C8C7E', fontSize: 15 }}>♡</button>
        </SignInButton>
      )}
      <div style={{ width: 1, height: 16, background: 'rgba(26,22,18,0.10)' }} />
      <UserSearch />
      <div style={{ width: 1, height: 16, background: 'rgba(26,22,18,0.10)' }} />
      {isSignedIn ? (
        <ProfileMenu user={user} username={username} displayName={displayName} signOut={signOut} />
      ) : (
        <SignInButton mode="modal">
          <button style={{ padding: '7px 16px', borderRadius: 8, background: '#B4690E', border: 'none', color: '#FFFFFF', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: "'Manrope',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Sign In</button>
        </SignInButton>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   NavbarNoAuth — shown when ClerkProvider is not available
───────────────────────────────────────────────────────── */
function NavbarNoAuth() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <UserSearch />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   DrawerAccordion — expandable section with category chips
───────────────────────────────────────────────────────── */
function DrawerAccordion({
  href, label, isActive, onNavigate,
  categories,
}: {
  href: string; label: string; isActive: boolean;
  onNavigate: (href: string) => void;
  categories: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {/* Row: section link + chevron toggle */}
      <div style={{ display: 'flex', alignItems: 'center', borderLeft: isActive ? '3px solid #B4690E' : '3px solid transparent' }}>
        <button
          onClick={() => onNavigate(href)}
          style={{ flex: 1, textAlign: 'left', padding: '12px 20px', fontSize: 13, color: isActive ? '#B4690E' : '#6B6359', background: 'none', border: 'none', cursor: 'pointer', fontWeight: isActive ? 700 : 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Manrope',sans-serif" }}>
          {label}
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
          style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: '#9C8C7E', display: 'flex', alignItems: 'center', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      {/* Category chips */}
      {open && (
        <div style={{ padding: '4px 20px 14px 20px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {categories.map(cat => (
            <button
              key={cat.href}
              onClick={() => onNavigate(cat.href)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "'Manrope',sans-serif", letterSpacing: '0.06em', cursor: 'pointer', border: '1px solid rgba(180,105,14,0.30)', background: 'rgba(180,105,14,0.07)', color: '#B4690E', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#B4690E'; (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,105,14,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = '#B4690E' }}>
              {cat.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Navbar — main shell, no Clerk hooks here
───────────────────────────────────────────────────────── */
export default function Navbar() {
  const [pathname, navigate] = useLocation()
  const clerkAvailable = useClerkAvailable()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isActive = (p: string) => pathname === p

  const close = () => setDrawerOpen(false)
  const go = (href: string) => { navigate(href); close() }

  const navLink = (href: string, label: string) => (
    <Link href={href} style={{ fontSize: 12, fontWeight: isActive(href) ? 700 : 500, color: isActive(href) ? '#B4690E' : '#6B6359', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Manrope',sans-serif", transition: 'color 0.15s', padding: '4px 0' }}>{label}</Link>
  )

  const beautyCategories = [
    { label: 'Hair', href: '/beautyservices?category=hair' },
    { label: 'Makeup', href: '/beautyservices?category=makeup' },
    { label: 'Lashes', href: '/beautyservices?category=lashes' },
    { label: 'Nails', href: '/beautyservices?category=nails' },
    { label: 'Brows', href: '/beautyservices?category=brows' },
    { label: 'Skincare', href: '/beautyservices?category=skincare' },
    { label: 'Braids', href: '/beautyservices?category=braids' },
  ]

  const eventCategories = [
    { label: 'Weddings', href: '/eventservices?category=weddings' },
    { label: 'Birthdays', href: '/eventservices?category=birthdays' },
    { label: 'Corporate', href: '/eventservices?category=corporate' },
    { label: 'Decor', href: '/eventservices?category=decor' },
    { label: 'Photography', href: '/eventservices?category=photography' },
    { label: 'Catering', href: '/eventservices?category=catering' },
  ]

  return (
    <>
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, background: 'rgba(250,247,242,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(180,105,14,0.14)', padding: '0 clamp(16px,4vw,40px)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Left: hamburger + logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setDrawerOpen(o => !o)} style={{ width: 32, height: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, flexShrink: 0 }}>
            <div style={{ width: 18, height: 1.5, background: '#B4690E', borderRadius: 2, transition: 'all 0.2s', transform: drawerOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <div style={{ width: 14, height: 1.5, background: '#9C8C7E', borderRadius: 2, transition: 'all 0.2s', opacity: drawerOpen ? 0 : 1 }} />
            <div style={{ width: 18, height: 1.5, background: '#B4690E', borderRadius: 2, transition: 'all 0.2s', transform: drawerOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>
          <Link href="/" style={{ fontFamily: "'Bebas Neue',serif", fontSize: 22, letterSpacing: '0.12em', color: '#B4690E', textDecoration: 'none', lineHeight: 1 }}>JAIYÉ</Link>
        </div>

        {/* Center links (desktop) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="nav-desktop-links">
          {navLink('/beautyservices', 'Beauty')}
          {navLink('/directory', 'Events')}
          {navLink('/style-calendar', 'Calendar')}
        </div>

        {/* Right: auth section */}
        {clerkAvailable ? <NavbarAuth /> : <NavbarNoAuth />}
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'rgba(26,22,18,0.45)', backdropFilter: 'blur(4px)' }} onClick={close} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 52, left: 0, bottom: 0, width: 290, zIndex: 195, background: '#FFFFFF', borderRight: '1px solid rgba(180,105,14,0.14)', overflowY: 'auto', display: 'flex', flexDirection: 'column', fontFamily: "'Manrope',sans-serif" }}>

            {/* Header */}
            <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #E5DDD4' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#B4690E', fontWeight: 700, marginBottom: 6 }}>Directory</div>
              <div style={{ fontFamily: "'Bebas Neue',serif", fontSize: 24, color: '#1A1612', letterSpacing: '0.08em' }}>JAIYÉ DIRECTORY</div>
            </div>

            <div style={{ flex: 1, padding: '12px 0' }}>

              {/* Home — plain link */}
              <button onClick={() => go('/')}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', fontSize: 13, color: isActive('/') ? '#B4690E' : '#6B6359', background: 'none', border: 'none', cursor: 'pointer', fontWeight: isActive('/') ? 700 : 500, borderLeft: isActive('/') ? '3px solid #B4690E' : '3px solid transparent', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Manrope',sans-serif" }}>
                Home
              </button>

              {/* Beauty Services — expandable */}
              <DrawerAccordion
                href="/beautyservices"
                label="Beauty Services"
                isActive={isActive('/beautyservices')}
                onNavigate={go}
                categories={beautyCategories}
              />

              {/* Event Services — expandable */}
              <DrawerAccordion
                href="/eventservices"
                label="Event Services"
                isActive={isActive('/eventservices')}
                onNavigate={go}
                categories={eventCategories}
              />

              {/* Remaining flat links */}
              {[
                { href: '/directory', label: 'All Vendors' },
                { href: '/style-calendar', label: 'Style Calendar' },
                { href: '/saved', label: 'Saved' },
              ].map(item => (
                <button key={item.href} onClick={() => go(item.href)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 20px', fontSize: 13, color: isActive(item.href) ? '#B4690E' : '#6B6359', background: 'none', border: 'none', cursor: 'pointer', fontWeight: isActive(item.href) ? 700 : 500, borderLeft: isActive(item.href) ? '3px solid #B4690E' : '3px solid transparent', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'all 0.15s', fontFamily: "'Manrope',sans-serif" }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`@media (max-width: 640px) { .nav-desktop-links { display: none !important; } }`}</style>
    </>
  )
}
