import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSupabase } from "@/hooks/useSupabase";

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Makeup",           emoji: "💄", href: "/beautyservices?cat=Makeup",          col: "#A855F7" },
  { label: "Hair & Gele",      emoji: "💅", href: "/beautyservices?cat=Hair%20%26%20Gele", col: "#EC4899" },
  { label: "Photography",      emoji: "📷", href: "/directory?cat=Photography",           col: "#3B82F6" },
  { label: "Event Planning",   emoji: "📋", href: "/directory?cat=Event%20Planning",      col: "#10B981" },
  { label: "Outfits & Styling",emoji: "👗", href: "/beautyservices?cat=Styling",          col: "#F59E0B" },
  { label: "Decor & Venue",    emoji: "🏛️", href: "/directory?cat=Decor%20%26%20Venue",   col: "#EF4444" },
  { label: "Videography",      emoji: "🎬", href: "/directory?cat=Videography%20%26%20Content", col: "#6366F1" },
  { label: "Catering",         emoji: "🍽️", href: "/directory?cat=Catering",             col: "#14B8A6" },
];

const HOW = [
  { n: "01", title: "DISCOVER",         body: "Browse hundreds of verified Nigerian wedding & beauty vendors. Filter by category, city, and what the community recommends." },
  { n: "02", title: "VOUCH & VERIFY",   body: "Mark vendors you've used and recommend the ones you love. Real experiences from real brides in the community." },
  { n: "03", title: "SAVE & NOTE",      body: "Build your personal shortlist with private notes and budget quotes in Naira — your planning HQ." },
  { n: "04", title: "FOLLOW YOUR CIRCLE", body: "Follow friends you trust to see who they've used and would recommend for your big day." },
];

const TICKER = [
  "Nigerian Wedding Vendors", "Bridal Beauty", "Hair Specialists", "Makeup Artists",
  "Event Planners", "Verified Artisans", "Community Shortlists", "Lagos · Abuja · PH",
];

type SearchResults = { vendors: { id: string; name: string; location: string }[]; services: { id: string; name: string; category: string }[] };

/* ─────────────────────────────────────────────────────────
   Hooks
───────────────────────────────────────────────────────── */
function useSearchDropdown(
  query: string,
  supabase: ReturnType<typeof useSupabase>,
  setResults: (r: SearchResults) => void,
  setOpen: (o: boolean) => void,
  setLoading: (l: boolean) => void
) {
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults({ vendors: [], services: [] }); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const q = query.toLowerCase();
      const [vr, sr] = await Promise.all([
        supabase.from("vendors").select("id, name, location").ilike("name", "%" + q + "%").limit(5),
        supabase.from("services").select("id, name, category").ilike("name", "%" + q + "%").limit(5),
      ]);
      setResults({ vendors: vr.data || [], services: sr.data || [] });
      setOpen(true);
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "translateY(0)";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, borderRight: "1px solid rgba(201,168,76,0.2)", paddingRight: "clamp(16px,4vw,40px)", marginRight: "clamp(16px,4vw,40px)" }}>
      <span style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2.2rem,5vw,3.2rem)", color: "#C9A84C", lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,239,228,0.45)", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
export default function HomePage() {
  useScrollReveal();
  const supabase = useSupabase();
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ vendors: [], services: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useSearchDropdown(query, supabase, setResults, setSearchOpen, setSearchLoading);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mouseup", close);
    return () => document.removeEventListener("mouseup", close);
  }, []);

  const rv: React.CSSProperties = { opacity: 0, transform: "translateY(28px)", transition: "opacity 0.7s ease, transform 0.7s ease" };
  const rvd = (ms: number): React.CSSProperties => ({ ...rv, transitionDelay: ms + "ms" });

  const hasResults = results.vendors.length > 0 || results.services.length > 0;

  return (
    <div style={{ background: "#0D0A08", color: "#F5EFE4", fontFamily: "'Manrope', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .hero-btn { transition: background 0.18s, color 0.18s, transform 0.18s; }
        .hero-btn:hover { transform: translateY(-1px); }
        .cat-card { transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease; cursor: pointer; }
        .cat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        .search-result-row:hover { background: rgba(201,168,76,0.06) !important; }
        @media (min-width:768px) { .hero-h1 { font-size: 6.5rem !important; } }
        @media (min-width:1200px) { .hero-h1 { font-size: 8.5rem !important; } }
        @media (max-width:480px) { .stats-row { flex-direction: column; gap: 16px !important; } .stats-row > div { border-right: none !important; border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 16px !important; margin-bottom: 0 !important; padding-right: 0 !important; margin-right: 0 !important; } }
        .how-card:hover .how-num { color: #C9A84C !important; }
      `}</style>

      {/* ── HERO ───────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100svh", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "clamp(48px,8vh,88px)" }}>

        {/* Background texture / gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0D0A08 0%, #1A1208 55%, #0D0A08 100%)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(201,168,76,0.07) 0%, transparent 70%)", zIndex: 1 }} />

        {/* Decorative grid lines */}
        <div style={{ position: "absolute", top: 0, left: "50%", bottom: 0, width: 1, background: "rgba(201,168,76,0.04)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: 0, left: "25%", bottom: 0, width: 1, background: "rgba(201,168,76,0.03)", zIndex: 1 }} />
        <div style={{ position: "absolute", top: 0, right: "25%", bottom: 0, width: 1, background: "rgba(201,168,76,0.03)", zIndex: 1 }} />

        {/* Issue tag top-left */}
        <div style={{ position: "absolute", top: "clamp(64px,8vh,88px)", left: "clamp(20px,5vw,64px)", zIndex: 2, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(201,168,76,0.6)", fontWeight: 700 }}>Issue No. 001</div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,239,228,0.25)" }}>Est. 2025 · Lagos</div>
        </div>

        {/* Edition tag top-right */}
        <div style={{ position: "absolute", top: "clamp(64px,8vh,88px)", right: "clamp(20px,5vw,64px)", zIndex: 2, writingMode: "vertical-rl", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(245,239,228,0.2)" }}>
          Jaiyé Directory — Nigerian Vendor Edit
        </div>

        {/* Main hero content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px,5vw,64px)" }}>

          {/* Kicker */}
          <p data-reveal style={{ ...rv, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 24 }}>
            The Nigerian Beauty &amp; Events Edit
          </p>

          {/* Headline — Bebas Neue all-caps */}
          <h1 className="hero-h1" data-reveal style={{ ...rvd(80), fontFamily: "'Bebas Neue', serif", fontSize: "clamp(4.2rem,12vw,7rem)", fontWeight: 400, lineHeight: 0.92, letterSpacing: "0.01em", color: "#F5EFE4", marginBottom: 0, textTransform: "uppercase" }}>
            FIND YOUR
          </h1>
          <h1 className="hero-h1" data-reveal style={{ ...rvd(140), fontFamily: "'Bebas Neue', serif", fontSize: "clamp(4.2rem,12vw,7rem)", fontWeight: 400, lineHeight: 0.92, letterSpacing: "0.01em", color: "#C9A84C", marginBottom: 24, textTransform: "uppercase" }}>
            PERFECT VENDOR
          </h1>

          {/* Subheadline */}
          <p data-reveal style={{ ...rvd(200), fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1rem,2.5vw,1.3rem)", color: "rgba(245,239,228,0.6)", maxWidth: 480, lineHeight: 1.55, marginBottom: 40 }}>
            Discover, compare, and save the finest wedding &amp; beauty vendors in the Nigerian community.
          </p>

          {/* Search bar */}
          <div data-reveal ref={searchRef} style={{ ...rvd(280), position: "relative", maxWidth: 560, marginBottom: 56 }}>
            <input
              type="text"
              placeholder="Search vendors, makeup artists, planners…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.trim().length >= 2) setSearchOpen(true); }}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(201,168,76,0.3)", borderRadius: 12, padding: "16px 58px 16px 20px", fontSize: 14, color: "#F5EFE4", fontFamily: "'Manrope', sans-serif", fontWeight: 500, outline: "none", backdropFilter: "blur(12px)", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocusCapture={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; }}
              onBlurCapture={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
            />
            <button
              onClick={() => { if (query.trim()) navigate("/directory?search=" + encodeURIComponent(query)); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#C9A84C", border: "none", borderRadius: 8, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#0D0A08" }}
            >
              <SearchIcon />
            </button>
            {searchOpen && hasResults && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#1A1410", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, overflow: "hidden", zIndex: 9999, boxShadow: "0 16px 48px rgba(0,0,0,0.7)" }}>
                {results.vendors.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px 4px", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Vendors</div>
                    {results.vendors.map((v) => (
                      <button key={v.id} className="search-result-row" onClick={() => { setSearchOpen(false); setQuery(""); navigate("/directory?search=" + encodeURIComponent(v.name) + "&id=" + v.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5EFE4" }}>{v.name}</span>
                        {v.location && <span style={{ fontSize: 11, color: "rgba(245,239,228,0.4)" }}>{v.location}</span>}
                      </button>
                    ))}
                  </>
                )}
                {results.services.length > 0 && (
                  <>
                    <div style={{ padding: "8px 16px 4px", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#14B8A6", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Services</div>
                    {results.services.map((s) => (
                      <button key={s.id} className="search-result-row" onClick={() => { setSearchOpen(false); setQuery(""); navigate("/beautyservices?cat=" + encodeURIComponent(s.category) + "&id=" + s.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F5EFE4" }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: "rgba(245,239,228,0.4)" }}>{s.category}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="stats-row" data-reveal style={{ ...rvd(360), display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: 0 }}>
            <StatPill value="500+" label="Vendors" />
            <StatPill value="6" label="Categories" />
            <StatPill value="900+" label="Community Members" />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2.2rem,5vw,3.2rem)", color: "#C9A84C", lineHeight: 1 }}>Lagos · Abuja</span>
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,239,228,0.45)", fontWeight: 600 }}>Cities Covered</span>
            </div>
          </div>
        </div>

        {/* Bottom border line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(to right, transparent 0%, rgba(201,168,76,0.2) 20%, rgba(201,168,76,0.2) 80%, transparent 100%)", zIndex: 2 }} />
      </section>

      {/* ── TICKER ─────────────────────────────────── */}
      <div style={{ background: "#C9A84C", overflow: "hidden", padding: "12px 0", whiteSpace: "nowrap", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", gap: "2.5rem", animation: "ticker 32s linear infinite", fontFamily: "'Bebas Neue', serif", fontSize: "clamp(0.95rem,2vw,1.15rem)", letterSpacing: "0.1em", color: "#0D0A08" }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i}>{t}<span style={{ margin: "0 1.25rem", opacity: 0.4 }}>✦</span></span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ─────────────────────────────── */}
      <section style={{ padding: "clamp(60px,10vw,100px) clamp(20px,5vw,64px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section heading */}
          <div data-reveal style={{ ...rv, display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 12 }}>Browse Categories</p>
              <h2 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2.8rem,6vw,4.5rem)", fontWeight: 400, color: "#F5EFE4", lineHeight: 0.95, letterSpacing: "0.01em", textTransform: "uppercase" }}>
                WHERE WOULD YOU<br />LIKE TO START?
              </h2>
            </div>
            <Link href="/directory" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", border: "1.5px solid rgba(201,168,76,0.35)", borderRadius: 8, color: "#C9A84C", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", fontWeight: 700, transition: "all 0.18s", fontFamily: "'Manrope', sans-serif" }}>
              All Vendors <span style={{ fontSize: 16 }}>→</span>
            </Link>
          </div>

          {/* 4×2 card grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {CATEGORIES.map((cat, i) => (
              <Link key={cat.label} href={cat.href} data-reveal style={{ ...rvd(i * 50), textDecoration: "none" }}>
                <div className="cat-card" style={{ background: "#1A1410", border: "1.5px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "28px 20px", display: "flex", flexDirection: "column", gap: 12, height: 140, position: "relative", overflow: "hidden" }}>
                  {/* colour accent bar top */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: cat.col, borderRadius: "16px 16px 0 0", opacity: 0.7 }} />
                  {/* Emoji */}
                  <span style={{ fontSize: 28, lineHeight: 1 }}>{cat.emoji}</span>
                  {/* Label */}
                  <div>
                    <p style={{ fontFamily: "'Bebas Neue', serif", fontSize: "1.2rem", letterSpacing: "0.05em", color: "#F5EFE4", lineHeight: 1, textTransform: "uppercase" }}>{cat.label}</p>
                  </div>
                  {/* Arrow */}
                  <div style={{ position: "absolute", bottom: 16, right: 16, width: 28, height: 28, borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#C9A84C", fontSize: 13 }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (dark mid) ──────────────── */}
      <section style={{ background: "#0A0805", padding: "clamp(60px,10vw,100px) clamp(20px,5vw,64px)", borderTop: "1px solid rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div data-reveal style={{ ...rv, marginBottom: 56 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 12 }}>How It Works</p>
            <h2 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2.8rem,6vw,4.5rem)", fontWeight: 400, lineHeight: 0.95, letterSpacing: "0.01em", color: "#F5EFE4", textTransform: "uppercase" }}>
              YOUR VENDOR JOURNEY
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, border: "1px solid rgba(201,168,76,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {HOW.map((step, i) => (
              <div key={step.n} data-reveal className="how-card" style={{ ...rvd(i * 80), padding: "36px 28px", background: "#0D0A08", borderRight: i < HOW.length - 1 ? "1px solid rgba(201,168,76,0.08)" : "none", display: "flex", flexDirection: "column", gap: 16, cursor: "default", transition: "background 0.22s" }}>
                <span className="how-num" style={{ fontFamily: "'Bebas Neue', serif", fontSize: "3rem", color: "rgba(201,168,76,0.2)", lineHeight: 1, transition: "color 0.22s" }}>{step.n}</span>
                <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "1.4rem", letterSpacing: "0.04em", color: "#F5EFE4", textTransform: "uppercase", lineHeight: 1 }}>{step.title}</h3>
                <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "0.95rem", color: "rgba(245,239,228,0.5)", lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE STRIP ───────────────────────── */}
      <section style={{ padding: "clamp(60px,8vw,88px) clamp(20px,5vw,64px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Beauty card */}
          <Link href="/beautyservices" style={{ textDecoration: "none" }}>
            <div data-reveal className="cat-card" style={{ ...rv, background: "#1A0E12", border: "1.5px solid rgba(236,72,153,0.15)", borderRadius: 20, padding: "clamp(32px,5vw,56px) clamp(24px,4vw,40px)", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }} />
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#EC4899", fontWeight: 700, marginBottom: 16 }}>Services</p>
                <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2rem,4.5vw,3.2rem)", color: "#F5EFE4", lineHeight: 0.95, textTransform: "uppercase" }}>BEAUTY &amp;<br />STYLING</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "#EC4899", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Explore Services</span>
                <span style={{ color: "#EC4899", fontSize: 16 }}>→</span>
              </div>
            </div>
          </Link>

          {/* Events card */}
          <Link href="/directory" style={{ textDecoration: "none" }}>
            <div data-reveal className="cat-card" style={{ ...rvd(80), background: "#0E1420", border: "1.5px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "clamp(32px,5vw,56px) clamp(24px,4vw,40px)", minHeight: 240, display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
              <div>
                <p style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "#6366F1", fontWeight: 700, marginBottom: 16 }}>Directory</p>
                <h3 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2rem,4.5vw,3.2rem)", color: "#F5EFE4", lineHeight: 0.95, textTransform: "uppercase" }}>WEDDING &amp;<br />EVENTS</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: "#6366F1", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>Browse Vendors</span>
                <span style={{ color: "#6366F1", fontSize: 16 }}>→</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ── COMMUNITY PROOF ─────────────────────── */}
      <section style={{ background: "#0A0805", padding: "clamp(60px,10vw,100px) clamp(20px,5vw,64px)", borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div data-reveal style={{ ...rv, display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700 }}>Community</p>
            <h2 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(2.8rem,6vw,4.5rem)", fontWeight: 400, lineHeight: 0.95, color: "#F5EFE4", textTransform: "uppercase" }}>
              BUILT BY BRIDES,<br />FOR BRIDES
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { q: "Finally! A place where I can see real reviews from Nigerian brides who've actually hired these vendors — not just pretty Instagram pages.", author: "Adaeze O.", city: "Lagos" },
              { q: "I built my entire shortlist for my wedding on Jaiyé. My maid of honour and I saved the same vendors independently — it confirmed we had great taste.", author: "Chiamaka N.", city: "Abuja" },
              { q: "The budget tracker in Naira is everything. No more converting from dollars. Just real prices from real vendors.", author: "Folake B.", city: "Port Harcourt" },
            ].map((t, i) => (
              <div key={i} data-reveal style={{ ...rvd(i * 80), background: "#1A1410", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 16, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#C9A84C", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "0.95rem", color: "rgba(245,239,228,0.7)", lineHeight: 1.7, flex: 1 }}>"{t.q}"</p>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#F5EFE4" }}>{t.author}</p>
                  <p style={{ fontSize: 11, color: "rgba(245,239,228,0.35)", marginTop: 2 }}>{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH CTA ───────────────────────── */}
      <section style={{ position: "relative", background: "#C9A84C", padding: "clamp(64px,10vw,100px) clamp(20px,5vw,64px)", overflow: "hidden" }}>
        {/* Decorative background text */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontFamily: "'Bebas Neue', serif", fontSize: "clamp(6rem,18vw,14rem)", color: "rgba(0,0,0,0.06)", whiteSpace: "nowrap", letterSpacing: "0.02em", userSelect: "none", pointerEvents: "none" }}>JAIYÉ</div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 28 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(13,10,8,0.55)", fontWeight: 700 }}>Ready?</p>
          <h2 style={{ fontFamily: "'Bebas Neue', serif", fontSize: "clamp(3rem,8vw,6.5rem)", color: "#0D0A08", lineHeight: 0.95, letterSpacing: "0.01em", textTransform: "uppercase" }}>
            MORE THAN JUST<br />A DIRECTORY
          </h2>
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "clamp(1rem,2vw,1.2rem)", color: "rgba(13,10,8,0.65)", maxWidth: 520, lineHeight: 1.6 }}>
            Join the community of Nigerian brides and clients who discover, vouch, and plan together.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/beautyservices" style={{ display: "inline-block", padding: "14px 32px", background: "#0D0A08", color: "#C9A84C", borderRadius: 10, textDecoration: "none", fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", transition: "transform 0.18s" }}>
              Browse Beauty
            </Link>
            <Link href="/directory" style={{ display: "inline-block", padding: "14px 32px", background: "transparent", color: "#0D0A08", border: "2px solid rgba(13,10,8,0.3)", borderRadius: 10, textDecoration: "none", fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────── */}
      <footer style={{ background: "#080604", borderTop: "1px solid rgba(201,168,76,0.1)", padding: "clamp(40px,6vw,60px) clamp(20px,5vw,64px) clamp(24px,4vw,40px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontFamily: "'Bebas Neue', serif", fontSize: "2rem", color: "#C9A84C", letterSpacing: "0.1em" }}>JAIYÉ</div>
            <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "0.9rem", color: "rgba(245,239,228,0.4)", lineHeight: 1.7, maxWidth: 280 }}>
              The go-to Nigerian wedding & beauty vendor discovery platform. Trusted by the community.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>Platform</p>
            {[["Beauty Services", "/beautyservices"], ["Events Directory", "/directory"], ["Saved Vendors", "/saved"], ["Style Calendar", "/style-calendar"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "rgba(245,239,228,0.5)", textDecoration: "none", transition: "color 0.15s", fontFamily: "'Manrope', sans-serif" }}>{label}</Link>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 700, marginBottom: 8 }}>Account</p>
            {[["Sign In", "/sign-in"], ["Sign Up", "/sign-up"], ["My Profile", "/profile/edit"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: 13, color: "rgba(245,239,228,0.5)", textDecoration: "none", fontFamily: "'Manrope', sans-serif" }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: 11, color: "rgba(245,239,228,0.2)", fontFamily: "'Manrope', sans-serif" }}>© 2025 Jaiyé Directory. All rights reserved.</p>
          <p style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: "0.8rem", color: "rgba(201,168,76,0.4)" }}>Connecting brides to the finest Nigerian talent.</p>
        </div>
      </footer>
    </div>
  );
}
