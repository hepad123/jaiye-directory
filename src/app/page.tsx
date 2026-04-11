"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const UNSPLASH_HERO = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=80&auto=format&fit=crop";

const FEATURED_VENDORS = [
  {
    name: "Zapphaire Events",
    category: "Bridal & Events",
    location: "Lagos",
    tier: "Verified",
    cover: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80&auto=format&fit=crop",
    instagram: "zapphaire",
    rating: "4.9",
    reviews: 214,
    badge: "Top Rated",
  },
  {
    name: "Glam by Omoye",
    category: "Makeup",
    location: "Abuja",
    tier: "Premium",
    cover: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&auto=format&fit=crop",
    instagram: "glambyomoye",
    rating: "5.0",
    reviews: 189,
    badge: "Editors Pick",
  },
  {
    name: "Crown & Braids Co.",
    category: "Hair",
    location: "Lagos",
    tier: "Studio",
    cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop",
    instagram: "crownbraidsco",
    rating: "4.8",
    reviews: 97,
    badge: "Community Fave",
  },
];

const CATEGORIES = [
  {
    label: "Services",
    sub: "Hair, Makeup, Lashes & more",
    href: "/services",
    featured: false,
  },
  {
    label: "Bridal & Events",
    sub: "Planners, venues & styling",
    href: "/directory",
    featured: true,
  },
  {
    label: "Community",
    sub: "Reviews, shortlists & profiles",
    href: "/saved",
    featured: false,
    wide: true,
  },
];

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.opacity = "1";
            (e.target as HTMLElement).style.transform = "translateY(0)";
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const ServicesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.5 3-2 4l2 10H8l2-10C8.5 9 8 7.5 8 6a4 4 0 0 1 4-4z" />
  </svg>
);

const BridalIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21.7C5.4 15.5 2 11.3 2 8a6 6 0 0 1 10-4.5A6 6 0 0 1 22 8c0 3.3-3.4 7.5-10 13.7z" />
  </svg>
);

const CommunityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  "Services": <ServicesIcon />,
  "Bridal & Events": <BridalIcon />,
  "Community": <CommunityIcon />,
};

const StarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#D97706" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export default function HomePage() {
  useScrollReveal();
  const [searchVal, setSearchVal] = useState("");

  const revealBase: React.CSSProperties = {
    opacity: 0,
    transform: "translateY(28px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  };

  const revealDelay = (ms: number): React.CSSProperties => ({
    ...revealBase,
    transitionDelay: ms + "ms",
  });

  const tickerItems = [
    "Nigerian Wedding Vendors",
    "Verified Artisans",
    "Bridal Beauty",
    "Hair Braiding Specialists",
    "Event Planners",
    "Makeup Artists",
    "Community Shortlists",
  ];

  return (
    <div style={{ background: "#faf9f6", color: "#1C1917", fontFamily: "var(--font-jost, 'Jost', sans-serif)", overflowX: "hidden" }}>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "flex-end", paddingBottom: "3rem", overflow: "hidden" }}>
        <img
          src={UNSPLASH_HERO}
          alt="Editorial portrait"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "sepia(8%) brightness(0.88)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,10,5,0.82) 0%, rgba(15,10,5,0.38) 45%, transparent 100%)" }} />

        <div style={{ position: "absolute", top: "5.5rem", right: "1.5rem", writingMode: "vertical-rl", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jost, 'Jost', sans-serif)" }}>
          Jaiye Directory &mdash; Est. 2025
        </div>

        <div style={{ position: "relative", zIndex: 2, width: "100%", padding: "0 1.5rem", maxWidth: "680px" }}>
          <p data-reveal style={{ ...revealBase, fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#D97706", fontWeight: 600, marginBottom: "1rem" }}>
            The Nigerian Wedding & Beauty Edit
          </p>

          <h1 data-reveal style={{ ...revealDelay(100), fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "clamp(2.8rem, 8vw, 4.5rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}>
            Reclaim<br />Your Glow.
          </h1>

          <p data-reveal style={{ ...revealDelay(200), color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", lineHeight: 1.6, fontWeight: 300, marginBottom: "2rem", maxWidth: "400px" }}>
            Discover the finest beauty and wedding artisans in the Nigerian community.
          </p>

          <div data-reveal style={{ ...revealDelay(320), position: "relative", maxWidth: "520px" }}>
            <input
              type="text"
              placeholder="Search vendors, services, locations..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.96)", border: "none", borderRadius: "14px", padding: "1.1rem 5rem 1.1rem 1.4rem", fontSize: "0.95rem", color: "#1C1917", fontFamily: "var(--font-jost, 'Jost', sans-serif)", boxShadow: "0 8px 40px rgba(0,0,0,0.3)", outline: "none", boxSizing: "border-box" }}
            />
            <button style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", background: "#8d4b00", border: "none", borderRadius: "10px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <SearchIcon />
            </button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "2rem", right: "1.5rem", color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "4rem", fontWeight: 700, lineHeight: 1, userSelect: "none" }}>
          No.1
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: "#8d4b00", overflow: "hidden", padding: "0.75rem 0", whiteSpace: "nowrap" }}>
        <style>{`
          @keyframes jaiye-ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div style={{ display: "inline-flex", gap: "3rem", animation: "jaiye-ticker 28s linear infinite", fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i}>{t}<span style={{ margin: "0 1.5rem", opacity: 0.4 }}>&bull;</span></span>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <section style={{ padding: "5rem 1.5rem", background: "#faf9f6" }}>
        <div data-reveal style={revealBase}>
          <p style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#D97706", fontWeight: 700, marginBottom: "0.5rem" }}>
            Curation
          </p>
          <h2 style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "clamp(1.8rem, 5vw, 2.5rem)", fontWeight: 700, color: "#1C1917", letterSpacing: "-0.02em", marginBottom: "2.5rem", lineHeight: 1.15 }}>
            Where would you<br />like to start?
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "560px" }}>
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              data-reveal
              style={{
                ...revealDelay(i * 80),
                display: "flex",
                flexDirection: cat.wide ? "row" : "column",
                justifyContent: "space-between",
                alignItems: cat.wide ? "center" : undefined,
                gap: cat.wide ? "1.5rem" : undefined,
                padding: "1.5rem",
                borderRadius: "16px",
                background: cat.featured ? "#8d4b00" : "#F5F0E8",
                color: cat.featured ? "#ffffff" : "#1C1917",
                aspectRatio: cat.wide ? "auto" : "1 / 1",
                gridColumn: cat.wide ? "span 2" : "span 1",
                textDecoration: "none",
                minHeight: cat.wide ? "110px" : undefined,
                transition: "transform 0.2s ease",
              }}
            >
              <div style={{ color: cat.featured ? "rgba(255,255,255,0.85)" : "#B45309", flexShrink: 0, marginBottom: cat.wide ? 0 : "auto" }}>
                {ICONS[cat.label]}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.2rem", color: cat.featured ? "#ffffff" : "#1C1917" }}>
                  {cat.label}
                </p>
                <p style={{ fontSize: "11px", color: cat.featured ? "rgba(255,255,255,0.6)" : "#78716C", fontWeight: 500 }}>
                  {cat.sub}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ padding: "0 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ flex: 1, height: "1px", background: "#E8E3DC" }} />
        <span style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "1.1rem", color: "#D97706" }}>&#10022;</span>
        <div style={{ flex: 1, height: "1px", background: "#E8E3DC" }} />
      </div>

      {/* FEATURED VENDORS */}
      <section style={{ padding: "5rem 0" }}>
        <div data-reveal style={{ ...revealBase, padding: "0 1.5rem", display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <p style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#D97706", fontWeight: 700, marginBottom: "0.4rem" }}>Featured</p>
            <h2 style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 700, color: "#1C1917", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Artisans of Note
            </h2>
          </div>
          <Link href="/directory" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#8d4b00", textDecoration: "none", letterSpacing: "0.04em", borderBottom: "1.5px solid rgba(141,75,0,0.25)", paddingBottom: "2px", whiteSpace: "nowrap" }}>
            View all
          </Link>
        </div>

        <div style={{ display: "flex", overflowX: "auto", gap: "1.25rem", padding: "0.5rem 1.5rem 1.5rem", scrollbarWidth: "none" }}>
          {FEATURED_VENDORS.map((vendor, i) => (
            <div key={vendor.name} data-reveal style={{ ...revealDelay(i * 100), flexShrink: 0, width: "272px", background: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #F0EBE3" }}>
              <div style={{ position: "relative", height: "300px", overflow: "hidden" }}>
                <img
                  src={vendor.cover}
                  alt={vendor.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div style={{ position: "absolute", top: "0.9rem", left: "0.9rem", background: "rgba(255,255,255,0.92)", borderRadius: "999px", padding: "4px 12px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8d4b00" }}>
                  {vendor.badge}
                </div>
              </div>
              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "0.5rem" }}>
                  <StarIcon />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#1C1917" }}>{vendor.rating}</span>
                  <span style={{ fontSize: "11px", color: "#A8A29E" }}>({vendor.reviews} reviews)</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "1.1rem", fontWeight: 700, color: "#1C1917", marginBottom: "0.2rem" }}>
                  {vendor.name}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#78716C", marginBottom: "1rem" }}>{vendor.category}</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {[vendor.location, vendor.tier].map((tag) => (
                    <span key={tag} style={{ padding: "3px 10px", background: "#F5F0E8", borderRadius: "999px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#78716C" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section data-reveal style={{ ...revealBase, background: "#F5F0E8", padding: "5rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "4rem", color: "rgba(141,75,0,0.18)", lineHeight: 0.8, marginBottom: "1.5rem", userSelect: "none" }}>
            &ldquo;
          </div>
          <blockquote style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "clamp(1.2rem, 4vw, 1.5rem)", fontWeight: 400, color: "#1C1917", lineHeight: 1.5, marginBottom: "2rem", letterSpacing: "-0.01em", fontStyle: "italic" }}>
            I finally found a space that celebrates Nigerian beauty. The artisans here actually understand my hair and my vision for my big day.
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.85rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: "#ffffff", fontFamily: "var(--font-playfair, 'Fraunces', serif)", flexShrink: 0 }}>
              A
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1C1917", marginBottom: "2px" }}>Amara O.</p>
              <p style={{ fontSize: "11px", color: "#A8A29E", letterSpacing: "0.06em" }}>Verified Member</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1C1917", padding: "3.5rem 1.5rem", textAlign: "center" }}>
        <h4 style={{ fontFamily: "var(--font-playfair, 'Fraunces', serif)", fontSize: "1.4rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
          JAIYE DIRECTORY
        </h4>
        <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#D97706", marginBottom: "2rem" }}>
          Crafting Tradition
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {["Directory", "Services", "Community", "Contact"].map((link) => (
            <a key={link} href="#" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {link}
            </a>
          ))}
        </div>
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
          &copy; 2025 Jaiye Directory. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
