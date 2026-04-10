'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────
interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  city: string;
  location: string | null;
  instagram: string | null;
  phone: string | null;
  price_from: number | null;
  bio: string | null;
  verified: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  Hair: ['All', 'Braids', 'Wigs', 'Natural Hair', 'Weaves', 'Locs', 'Knotless', 'Faux Locs'],
  Makeup: ['All', 'Bridal MUA', 'Glam', 'Editorial', 'Airbrush'],
  Lashes: ['All', 'Extensions', 'Lash Lift', 'Strip Lashes'],
};

const CITIES = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'];

const CATEGORY_ICONS: Record<string, string> = {
  Hair: '💇🏾‍♀️',
  Makeup: '💄',
  Lashes: '✨',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPrice(price: number | null): string {
  if (!price) return 'Price on request';
  return `₦${price.toLocaleString()}`;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ServicesPage() {
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Hair');
  const [activeSubcategory, setActiveSubcategory] = useState('All');
  const [activeCity, setActiveCity] = useState('All');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Fetch services
  const fetchServices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('services')
      .select('*')
      .eq('category', activeCategory)
      .order('verified', { ascending: false })
      .order('name');

    if (activeSubcategory !== 'All') {
      query = query.eq('subcategory', activeSubcategory);
    }
    if (activeCity !== 'All') {
      query = query.eq('city', activeCity);
    }

    const { data } = await query;
    setServices(data || []);
    setLoading(false);
  }, [activeCategory, activeSubcategory, activeCity]);

  // Fetch saved service IDs
  const fetchSaved = useCallback(async () => {
    if (!user) { setSavedIds(new Set()); return; }
    const { data } = await supabase
      .from('saved_services')
      .select('service_id')
      .eq('user_id', user.id);
    setSavedIds(new Set((data || []).map((r: { service_id: string }) => r.service_id)));
  }, [user]);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  // Reset subcategory when category changes
  useEffect(() => { setActiveSubcategory('All'); }, [activeCategory]);

  // Toggle save
  const toggleSave = async (serviceId: string) => {
    if (!user) return;
    setSavingId(serviceId);
    const isSaved = savedIds.has(serviceId);
    if (isSaved) {
      await supabase
        .from('saved_services')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(serviceId); return n; });
    } else {
      await supabase
        .from('saved_services')
        .insert({ user_id: user.id, service_id: serviceId });
      setSavedIds(prev => new Set(prev).add(serviceId));
    }
    setSavingId(null);
  };

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-dark)',
        fontFamily: 'var(--font-jost)',
      }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--text-dark)',
          color: '#fff',
          padding: '56px 24px 48px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '13px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '12px',
          }}>
            Beauty & Personal Care
          </p>
          <h1 style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: '0 0 16px',
          }}>
            Find Your Glam
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}>
            Hair stylists, makeup artists and lash technicians across Nigeria
          </p>
        </div>

        {/* ── Category Tabs ─────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            gap: '0',
          }}>
            {Object.keys(CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '18px 28px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeCategory === cat
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-jost)',
                  fontSize: '15px',
                  fontWeight: activeCategory === cat ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 24px',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {/* Subcategory pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CATEGORIES[activeCategory].map(sub => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: activeSubcategory === sub ? 'var(--accent)' : 'var(--border)',
                    background: activeSubcategory === sub ? 'var(--accent)' : 'transparent',
                    color: activeSubcategory === sub ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-jost)',
                    fontWeight: activeSubcategory === sub ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* City pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                City:
              </span>
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: activeCity === city ? 'var(--gold)' : 'var(--border)',
                    background: activeCity === city ? 'rgba(180,83,9,0.08)' : 'transparent',
                    color: activeCity === city ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontFamily: 'var(--font-jost)',
                    fontWeight: activeCity === city ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Results ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Count */}
          {!loading && (
            <p style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '24px',
              letterSpacing: '0.5px',
            }}>
              {services.length} {services.length === 1 ? 'result' : 'results'}
              {activeSubcategory !== 'All' ? ` · ${activeSubcategory}` : ''}
              {activeCity !== 'All' ? ` · ${activeCity}` : ''}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  background: 'var(--card)',
                  borderRadius: '12px',
                  height: '200px',
                  opacity: 0.5,
                  animation: 'pulse 1.5s ease infinite',
                }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && services.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <p style={{ fontSize: '40px', marginBottom: '16px' }}>
                {CATEGORY_ICONS[activeCategory]}
              </p>
              <p style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '22px',
                marginBottom: '8px',
              }}>
                No results found
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                Try a different subcategory or city
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && services.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}>
              {services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSaved={savedIds.has(service.id)}
                  isSaving={savingId === service.id}
                  onToggleSave={() => toggleSave(service.id)}
                  isLoggedIn={!!user}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </>
  );
}

// ── Service Card ───────────────────────────────────────────────────────────
function ServiceCard({
  service,
  isSaved,
  isSaving,
  onToggleSave,
  isLoggedIn,
}: {
  service: Service;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: () => void;
  isLoggedIn: boolean;
}) {
  const SUBCATEGORY_COLORS: Record<string, string> = {
    Braids: '#7C3AED',
    Wigs: '#DB2777',
    'Natural Hair': '#059669',
    Weaves: '#D97706',
    Locs: '#92400E',
    Knotless: '#6D28D9',
    'Faux Locs': '#B45309',
    'Bridal MUA': '#BE185D',
    Glam: '#DC2626',
    Editorial: '#1D4ED8',
    Airbrush: '#0891B2',
    Extensions: '#7C3AED',
    'Lash Lift': '#0D9488',
    'Strip Lashes': '#9333EA',
  };

  const accentColor = SUBCATEGORY_COLORS[service.subcategory] || 'var(--accent)';

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Colour top stripe */}
      <div style={{ height: '4px', background: accentColor }} />

      <div style={{ padding: '20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <h3 style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-dark)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {service.name}
              </h3>
              {service.verified && (
                <span title="Verified" style={{ fontSize: '13px', flexShrink: 0 }}>✓</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '999px',
                background: `${accentColor}18`,
                color: accentColor,
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                {service.subcategory}
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={onToggleSave}
            disabled={isSaving || !isLoggedIn}
            title={!isLoggedIn ? 'Sign in to save' : isSaved ? 'Remove from saved' : 'Save'}
            style={{
              background: isSaved ? 'var(--accent)' : 'transparent',
              border: '1px solid',
              borderColor: isSaved ? 'var(--accent)' : 'var(--border)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isLoggedIn ? 'pointer' : 'default',
              opacity: isSaving ? 0.5 : 1,
              transition: 'all 0.15s ease',
              flexShrink: 0,
              marginLeft: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{isSaved ? '🤍' : '♡'}</span>
          </button>
        </div>

        {/* Location */}
        {(service.location || service.city) && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            margin: '0 0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span>📍</span>
            {[service.location, service.city].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Bio */}
        {service.bio && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '0 0 14px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {service.bio}
          </p>
        )}

        {/* Price */}
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-dark)',
          margin: '0 0 14px',
        }}>
          {formatPrice(service.price_from)}
          {service.price_from && (
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px' }}> from</span>
          )}
        </p>

        {/* Action links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {service.instagram && (
            
              href={`https://instagram.com/${service.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-jost)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }}
            >
              <span>📸</span> Instagram
            </a>
          )}
          {service.phone && (
            
              href={`tel:${service.phone}`}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-jost)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }}
            >
              <span>📞</span> Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
