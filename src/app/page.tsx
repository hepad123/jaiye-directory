'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

interface Vendor {
  id: number
  category: string
  name: string
  services: string | null
  location: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  website: string | null
  discount_code: string | null
  price_from: string | null
  rating: number | null
  notes: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  'Event Planning': '#7B4EA6',
  'Styling': '#B5294E',
  'Fashion & Wedding Dress': '#C4922A',
  'Makeup': '#E8639A',
  'Hair & Gele': '#3B82A0',
  'Photography': '#2D6A4F',
  'Videography & Content': '#1C3A5E',
  'Decor & Venue': '#8B5E3C',
  'Catering-Cake-Food': '#C25B2A',
  'Entertainment': '#4B3F72',
  'Furniture & Rentals': '#6B7280',
  'Accessories': '#9D4E6E',
  'Flowers': '#4A7C59',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#B5294E'
}

function getInstagramHandle(instagram: string | null): string | null {
  if (!instagram) return null
  return instagram.replace(/^@/, '').trim()
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const color = getCategoryColor(vendor.category)
  const igHandle = getInstagramHandle(vendor.instagram)

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: '4px', backgroundColor: color }} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {/* Category badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span
            style={{
              backgroundColor: color + '18',
              color: color,
              border: `1px solid ${color}30`,
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {vendor.category}
          </span>
          {vendor.rating && (
            <span style={{ color: '#D4A853', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              ★ {vendor.rating}
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontSize: '22px',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {vendor.name}
        </h3>

        {/* Services */}
        {vendor.services && (
          <p
            className="line-clamp-2"
            style={{
              fontSize: '13px',
              color: '#555',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {vendor.services}
          </p>
        )}

        {/* Location */}
        {vendor.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '14px' }}>📍</span>
            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>{vendor.location}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop: '1px solid #f0ebe4', margin: '2px 0' }} />

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              style={{ fontSize: '13px', color: '#444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>📞</span>
              <span>{vendor.phone}</span>
            </a>
          )}
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              style={{ fontSize: '13px', color: '#B5294E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>✉️</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.email}</span>
            </a>
          )}
          {vendor.website && (
            <a
              href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#B5294E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>🌐</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
            </a>
          )}
          {igHandle && (
            <a
              href={`https://instagram.com/${igHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#C2185B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <span>📸</span>
              <span>@{igHandle}</span>
            </a>
          )}
        </div>

        {/* Discount code */}
        {vendor.discount_code && vendor.discount_code.trim() !== '' && (
          <div
            style={{
              backgroundColor: '#FDF6EE',
              border: '1px dashed #D4A853',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>🏷️</span>
            <div>
              <div style={{ fontSize: '10px', color: '#9a7832', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Discount Code
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#D4A853', letterSpacing: '0.05em' }}>
                {vendor.discount_code}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {vendor.notes && vendor.notes.trim() !== '' && (
          <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            {vendor.notes}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View on Instagram button */}
        {igHandle && (
          <a
            href={`https://instagram.com/${igHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              backgroundColor: '#B5294E',
              color: '#ffffff',
              borderRadius: '10px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.03em',
              marginTop: '4px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#9b1f3f'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#B5294E'
            }}
          >
            View on Instagram ↗
          </a>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    async function fetchVendors() {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name')

      if (!error && data) {
        setVendors(data)
      }
      setLoading(false)
    }
    fetchVendors()
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(vendors.map(v => v.category))).sort()
    return ['All', ...cats]
  }, [vendors])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return vendors.filter(v => {
      const matchesSearch =
        !q ||
        v.name.toLowerCase().includes(q) ||
        (v.services ?? '').toLowerCase().includes(q) ||
        (v.instagram ?? '').toLowerCase().includes(q) ||
        (v.notes ?? '').toLowerCase().includes(q)

      const matchesCategory = activeCategory === 'All' || v.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [vendors, search, activeCategory])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF6EE' }}>
      {/* Hero */}
      <header
        style={{
          background: 'linear-gradient(135deg, #1a0a10 0%, #3d0f20 50%, #5c1a30 100%)',
          padding: '64px 24px 56px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: 'rgba(212,168,83,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-40px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(181,41,78,0.12)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: '760px', margin: '0 auto' }}>
          {/* Gold ornament */}
          <div style={{ color: '#D4A853', fontSize: '20px', letterSpacing: '0.3em', marginBottom: '16px', opacity: 0.8 }}>
            ✦ ✦ ✦
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-cormorant), Georgia, serif',
              fontSize: 'clamp(48px, 8vw, 80px)',
              fontWeight: 600,
              color: '#ffffff',
              margin: '0 0 4px',
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            Jaiye Directory
          </h1>

          <div
            style={{
              width: '80px',
              height: '2px',
              backgroundColor: '#D4A853',
              margin: '20px auto',
              borderRadius: '2px',
            }}
          />

          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 'clamp(15px, 2.5vw, 19px)',
              color: 'rgba(255,255,255,0.75)',
              margin: '0 auto 8px',
              fontWeight: 300,
              letterSpacing: '0.04em',
            }}
          >
            Your guide to the best Nigerian wedding vendors
          </p>
        </div>
      </header>

      {/* Sticky filter bar */}
      <div
        style={{
          backgroundColor: '#FDF6EE',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          padding: '20px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '16px',
                color: '#aaa',
                pointerEvents: 'none',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, service, Instagram..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: '12px',
                border: '1.5px solid rgba(181,41,78,0.2)',
                backgroundColor: '#ffffff',
                fontSize: '15px',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                color: '#1a1a1a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = '#B5294E'
              }}
              onBlur={e => {
                ;(e.currentTarget as HTMLInputElement).style.borderColor = 'rgba(181,41,78,0.2)'
              }}
            />
          </div>

          {/* Category pills */}
          <div
            className="scrollbar-hide"
            style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}
          >
            {categories.map(cat => {
              const isActive = cat === activeCategory
              const color = cat === 'All' ? '#B5294E' : getCategoryColor(cat)
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    flexShrink: 0,
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: `1.5px solid ${isActive ? color : 'rgba(0,0,0,0.12)'}`,
                    backgroundColor: isActive ? color : '#ffffff',
                    color: isActive ? '#ffffff' : '#555',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    transition: 'all 0.15s ease',
                    letterSpacing: '0.01em',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>
        {/* Count */}
        <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p
            style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: '14px',
              color: '#888',
              margin: 0,
            }}
          >
            {loading ? (
              'Loading vendors...'
            ) : (
              <>
                Showing{' '}
                <strong style={{ color: '#B5294E' }}>{filtered.length}</strong>
                {' '}of{' '}
                <strong style={{ color: '#1a1a1a' }}>{vendors.length}</strong>
                {' '}vendors
              </>
            )}
          </p>
          {activeCategory !== 'All' && (
            <button
              onClick={() => { setActiveCategory('All'); setSearch('') }}
              style={{
                fontSize: '12px',
                color: '#B5294E',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
                textDecoration: 'underline',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  height: '320px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌺</div>
            <h3
              style={{
                fontFamily: 'var(--font-cormorant), Georgia, serif',
                fontSize: '28px',
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 8px',
              }}
            >
              No vendors found
            </h3>
            <p style={{ fontSize: '15px', color: '#888', margin: '0 0 24px' }}>
              Try adjusting your search or category filter
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('All') }}
              style={{
                backgroundColor: '#B5294E',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-dm-sans), sans-serif',
              }}
            >
              Show all vendors
            </button>
          </div>
        )}

        {/* Vendor grid */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {filtered.map(vendor => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(0,0,0,0.07)',
          padding: '32px 24px',
          textAlign: 'center',
          backgroundColor: '#FDF6EE',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            fontSize: '18px',
            color: '#B5294E',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          Made with ♥ for Nigerian brides
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @media (max-width: 640px) {
          .vendor-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .vendor-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
