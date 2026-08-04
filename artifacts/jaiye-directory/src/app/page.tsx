import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSupabase } from "@/hooks/useSupabase";

/* ─────────────────────────────────────────────────────────
   Brand tokens — single source of truth, matches index.css
───────────────────────────────────────────────────────── */
const G = {
  gold:        "#B4690E",
  goldLight:   "#C8842A",
  goldDim:     "rgba(180,105,14,0.12)",
  goldBorder:  "rgba(180,105,14,0.22)",
  bg:          "#0D0A08",
  bgCard:      "#1A1208",
  cream:       "#FDFAF6",
  creamMid:    "#F5EFE8",
  creamDark:   "#EDE5D8",
  text:        "#F5EFE4",
  textMuted:   "rgba(245,239,228,0.42)",
  textDark:    "#1C1917",
  textSubdued: "#57534E",
  serif:       "'Newsreader', Georgia, serif",
  ui:          "'Manrope', system-ui, sans-serif",
  display:     "'Bebas Neue', serif",
};

/* ─────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  "Nigerian Wedding Vendors",
  "Verified Artisans",
  "Bridal Beauty",
  "Hair Braiding Specialists",
  "Event Planners",
  "Makeup Artists",
  "Community Shortlists",
  "Lagos · Abuja · Port Harcourt",
];

const HOW = [
  { n: "01", icon: "✦", title: "Discover", body: "Browse hundreds of verified Nigerian wedding and beauty vendors. Filter by category, city, and what the community recommends.", ctas: [{ label: "Browse Beauty →", href: "/beautyservices" }, { label: "Browse Events →", href: "/directory" }] },
  { n: "02", icon: "◎", title: "Vouch & Verify", body: "Mark vendors you've used and recommend the ones you love. Real experiences from real brides in the community.", ctas: [{ label: "Browse Beauty →", href: "/beautyservices" }] },
  { n: "03", icon: "♡", title: "Save & Note", body: "Build your personal shortlist with private notes and budget quotes in Naira — your planning HQ.", ctas: [{ label: "View Saved →", href: "/saved" }] },
  { n: "04", icon: "◈", title: "Follow Your Circle", body: "Follow people you trust to see who they've used and recommend for your day.", ctas: [{ label: "Find Friends →", href: "/saved" }] },
  { n: "05", icon: "✓", title: "Book Directly", body: "Some vendors and artists offer direct booking links — go straight from discovery to booking.", ctas: [{ label: "Browse Beauty →", href: "/beautyservices" }] },
];

/* ─────────────────────────────────────────────────────────
   Search hook
───────────────────────────────────────────────────────── */
type SearchResults = {
  vendors: { id: string; name: string; location: string }[];
  services: { id: string; name: string; category: string }[];
};
function useSearchDropdown(query: string, supabase: ReturnType<typeof useSupabase>, cb: (r: SearchResults, open: boolean, loading: boolean) => void) {
  useEffect(() => {
    if (!query.trim() || query.length < 2) { cb({ vendors: [], services: [] }, false, false); return; }
    const t = setTimeout(async () => {
      cb({ vendors: [], services: [] }, true, true);
      const q = query.toLowerCase();
      const [vr, sr] = await Promise.all([
        supabase.from("vendors").select("id,name,location").ilike("name", `%${q}%`).limit(5),
        supabase.from("services").select("id,name,category").ilike("name", `%${q}%`).limit(5),
      ]);
      cb({ vendors: vr.data ?? [], services: sr.data ?? [] }, true, false);
    }, 280);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
}

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div style={{ background: "#1A1208", overflow: "hidden", borderTop: `1px solid ${G.goldBorder}`, borderBottom: `1px solid ${G.goldBorder}` }}>
      <style>{`@keyframes tk { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "tk 30s linear infinite" }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "11px 18px", fontSize: 9, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", color: G.textMuted, fontFamily: G.ui }}>
            {t}
            <span style={{ color: G.gold, opacity: 0.6, fontSize: 7 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ href, img, eyebrow, title, sub, align = "left" }: { href: string; img: string; eyebrow: string; title: string; sub: string; align?: "left" | "right" }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href} style={{ position: "relative", display: "block", textDecoration: "none", flex: 1, minWidth: 0, borderRadius: 16, overflow: "hidden", aspectRatio: "3/4" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hov ? "scale(1.06)" : "scale(1)" }} />
      {/* Gradient overlay — stronger at bottom */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,7,3,0.88) 0%, rgba(10,7,3,0.35) 50%, transparent 100%)" }} />
      {/* Hover tint */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(180,105,14,0.08)`, opacity: hov ? 1 : 0, transition: "opacity 0.3s" }} />
      {/* Content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 22px 26px", textAlign: align as "left" | "right" }}>
        <div style={{ fontSize: 8, letterSpacing: "0.32em", textTransform: "uppercase", color: G.gold, fontWeight: 700, fontFamily: G.ui, marginBottom: 8 }}>{eyebrow}</div>
        <div style={{ fontFamily: G.serif, fontWeight: 700, fontSize: "clamp(1.4rem,2.8vw,1.9rem)", color: "#fff", lineHeight: 1.15, marginBottom: 5 }}>{title}</div>
        <div style={{ fontFamily: G.ui, fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{sub}</div>
        {/* Arrow indicator */}
        <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: G.gold, fontFamily: G.ui, opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(4px)", transition: "all 0.3s" }}>
          Explore <span>→</span>
        </div>
      </div>
    </Link>
  );
}

function SectionLabel({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 8, letterSpacing: "0.32em", textTransform: "uppercase", color: G.gold, fontWeight: 700, fontFamily: G.ui }}>{text}</span>
      <div style={{ flex: 1, height: "1px", background: light ? G.goldBorder : `rgba(180,105,14,0.18)`, maxWidth: 60 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main
───────────────────────────────────────────────────────── */
export default function HomePage() {
  const supabase = useSupabase();
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ vendors: [], services: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useSearchDropdown(query, supabase, (r, open, loading) => { setResults(r); setSearchOpen(open); setSearchLoading(loading); });

  useEffect(() => {
    const close = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener("mouseup", close);
    return () => document.removeEventListener("mouseup", close);
  }, []);

  const hasResults = results.vendors.length > 0 || results.services.length > 0;

  return (
    <div style={{ fontFamily: G.ui, background: G.cream, color: G.textDark }}>
      <style>{`
        body { background: ${G.bg}; }
        .srch-input::placeholder { color: rgba(28,25,23,0.38); }
        .srch-input:focus { outline: none; }
        .srch-wrap:focus-within { border-color: ${G.gold} !important; box-shadow: 0 0 0 3px rgba(180,105,14,0.10); }
        .srch-row:hover { background: rgba(180,105,14,0.06) !important; }
        .how-btn:hover { background: rgba(180,105,14,0.18) !important; color: ${G.goldLight} !important; }
        .nav-pill:hover { color: ${G.textDark} !important; }
        @media (max-width: 700px) {
          .cat-flex { flex-direction: column !important; gap: 12px !important; }
          .cat-flex > * { aspect-ratio: 4/3 !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .how-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "72vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {/* Photo */}
        <img src="/pexels-heibbymarvel-4285539.jpg" alt="" aria-hidden="true"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }} />
        {/* Gradient — dark bottom for text, lighter top for photo */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(175deg, rgba(10,7,3,0.30) 0%, rgba(10,7,3,0.68) 55%, rgba(10,7,3,0.92) 100%)" }} />
        {/* Grain texture via SVG filter */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", pointerEvents: "none" }} />

        {/* Top label */}
        <div style={{ position: "absolute", top: "clamp(68px,9vh,88px)", left: "clamp(20px,5vw,56px)", zIndex: 2 }}>
          <span style={{ fontSize: 8, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(245,239,228,0.45)", fontWeight: 700, fontFamily: G.ui }}>The Nigerian Beauty Services &amp; Events Edit</span>
        </div>

        {/* Issue number */}
        <div style={{ position: "absolute", bottom: "clamp(36px,6vh,60px)", right: "clamp(20px,5vw,56px)", zIndex: 2, fontFamily: G.serif, fontSize: "clamp(2.5rem,7vw,5.5rem)", fontWeight: 700, color: "rgba(245,239,228,0.07)", lineHeight: 1, userSelect: "none", letterSpacing: "-0.03em" }}>No.1</div>

        {/* Main content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px,5vw,56px) clamp(36px,6vh,60px)" }}>
          <h1 style={{ fontFamily: G.serif, fontWeight: 700, fontSize: "clamp(3.2rem,9.5vw,6.5rem)", lineHeight: 1.02, color: "#F5EFE4", margin: "0 0 18px", maxWidth: 700, letterSpacing: "-0.01em" }}>
            Reclaim<br />Your Glow.
          </h1>
          <p style={{ fontFamily: G.ui, fontSize: "clamp(13px,1.8vw,15px)", color: "rgba(245,239,228,0.60)", maxWidth: 360, lineHeight: 1.70, margin: "0 0 30px", fontWeight: 400 }}>
            Discover the finest beauty services and event vendors in the Nigerian community.
          </p>

          {/* Search */}
          <div ref={searchRef} style={{ position: "relative", maxWidth: 500 }}>
            <div className="srch-wrap" style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, border: "1.5px solid rgba(28,25,23,0.10)", overflow: "visible", transition: "border-color 0.2s, box-shadow 0.2s" }}>
              <input className="srch-input" type="text" placeholder="Search vendors, services, locations…" value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (query.trim().length >= 2) setSearchOpen(true); }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, padding: "14px 16px", color: G.textDark, fontFamily: G.ui, background: "transparent", minWidth: 0 }} />
              <button onClick={() => { if (query.trim()) navigate(`/directory?search=${encodeURIComponent(query)}`); }}
                style={{ background: G.gold, border: "none", padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0, transition: "background 0.18s", borderRadius: "0 8px 8px 0" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = G.goldLight; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = G.gold; }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
            </div>

            {/* Dropdown */}
            {searchOpen && (hasResults || searchLoading) && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid rgba(28,25,23,0.09)", borderRadius: 10, overflow: "hidden", zIndex: 9999, boxShadow: "0 16px 48px rgba(0,0,0,0.14)", fontFamily: G.ui }}>
                {searchLoading && <div style={{ padding: "14px 16px", fontSize: 12, color: G.textSubdued }}>Searching…</div>}
                {results.vendors.length > 0 && (
                  <>
                    <div style={{ padding: "9px 16px 4px", fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: G.gold, fontWeight: 700 }}>Vendors</div>
                    {results.vendors.map(v => (
                      <button key={v.id} className="srch-row"
                        onClick={() => { setSearchOpen(false); setQuery(""); navigate(`/directory?search=${encodeURIComponent(v.name)}&id=${v.id}`); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(28,25,23,0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: G.textDark }}>{v.name}</span>
                        {v.location && <span style={{ fontSize: 11, color: G.textSubdued }}>{v.location}</span>}
                      </button>
                    ))}
                  </>
                )}
                {results.services.length > 0 && (
                  <>
                    <div style={{ padding: "9px 16px 4px", fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "#0D9488", fontWeight: 700 }}>Services</div>
                    {results.services.map(s => (
                      <button key={s.id} className="srch-row"
                        onClick={() => { setSearchOpen(false); setQuery(""); navigate(`/beautyservices?cat=${encodeURIComponent(s.category)}&id=${s.id}`); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(28,25,23,0.05)", cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: G.textDark }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: G.textSubdued }}>{s.category}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────── */}
      <Ticker />

      {/* ── WHERE TO START ─────────────────────────────── */}
      <section style={{ background: G.cream, padding: "clamp(52px,8vw,88px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <SectionLabel text="Curation" />
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: G.serif, fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: G.textDark, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
              Where would you<br />like to start?
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link href="/beautyservices" style={{ fontSize: 11, fontWeight: 600, color: G.gold, textDecoration: "none", fontFamily: G.ui, border: `1px solid ${G.goldBorder}`, padding: "7px 14px", borderRadius: 20, transition: "all 0.15s" }}>Beauty Services</Link>
              <Link href="/directory" style={{ fontSize: 11, fontWeight: 600, color: G.gold, textDecoration: "none", fontFamily: G.ui, border: `1px solid ${G.goldBorder}`, padding: "7px 14px", borderRadius: 20, transition: "all 0.15s" }}>Events</Link>
            </div>
          </div>
          <div className="cat-flex" style={{ display: "flex", gap: 16, height: "clamp(380px,50vw,520px)" }}>
            <CategoryCard href="/beautyservices" img="/pexels-services.jpg" eyebrow="Beauty" title="Beauty Services" sub="Hair · Makeup · Lashes & more" />
            <CategoryCard href="/directory"      img="/pexels-bridal.jpg"   eyebrow="Events" title="Events & Weddings" sub="Planners · Venues · Styling" align="right" />
          </div>
        </div>
      </section>

      {/* ── ARTISANS OF NOTE ───────────────────────────── */}
      <section style={{ background: G.creamMid, padding: "0 clamp(20px,5vw,56px) clamp(52px,8vw,88px)", borderTop: `1px solid ${G.creamDark}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", paddingTop: "clamp(40px,6vw,64px)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <SectionLabel text="Featured" />
              <h2 style={{ fontFamily: G.serif, fontStyle: "italic", fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, color: G.textDark, margin: 0, lineHeight: 1.1 }}>
                Artisans of Note
              </h2>
            </div>
            <Link href="/directory" style={{ fontSize: 11, fontWeight: 700, color: G.gold, textDecoration: "none", fontFamily: G.ui, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5, borderBottom: `1px solid ${G.gold}`, paddingBottom: 1 }}>
              View all <span>→</span>
            </Link>
          </div>

          {/* Vendor cards */}
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }} className="hide-scrollbar">
            {/* K.Mari featured card */}
            <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${G.creamDark}`, overflow: "hidden", minWidth: 210, maxWidth: 230, flexShrink: 0, boxShadow: "0 1px 4px rgba(28,25,23,0.07)" }}>
              <div style={{ height: 150, overflow: "hidden", position: "relative" }}>
                <img src="/:kmari.jpg" alt="K.Mari" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, background: G.gold, color: "#fff", padding: "3px 8px", borderRadius: 20, fontFamily: G.ui, letterSpacing: "0.06em", textTransform: "uppercase" }}>Top Rated</span>
                </div>
              </div>
              <div style={{ padding: "14px 14px 16px" }}>
                <div style={{ fontFamily: G.serif, fontSize: 16, fontWeight: 700, color: G.textDark, marginBottom: 3 }}>K.Mari</div>
                <div style={{ fontSize: 11, color: G.textSubdued, fontFamily: G.ui, marginBottom: 10 }}>Makeup Artist · Lagos</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                  {["Makeup", "Bridal"].map(t => (
                    <span key={t} style={{ fontSize: 9, padding: "3px 10px", borderRadius: 20, border: `1px solid ${G.creamDark}`, color: G.textSubdued, fontFamily: G.ui, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
                <a href="https://instagram.com/kmariartistry" target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: G.textSubdued, textDecoration: "none", fontFamily: G.ui }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                  @kmariartistry
                </a>
              </div>
            </div>

            {/* Placeholder cards */}
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: `1.5px dashed ${G.creamDark}`, minWidth: 210, maxWidth: 230, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 240 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: G.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: G.gold }}>✦</div>
                <Link href="/directory" style={{ fontSize: 11, color: G.gold, textDecoration: "none", fontFamily: G.ui, fontWeight: 700 }}>Browse vendors →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section style={{ background: G.bg, padding: "clamp(52px,8vw,88px) clamp(20px,5vw,56px)", position: "relative", overflow: "hidden" }}>
        {/* Subtle background glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: `radial-gradient(circle, rgba(180,105,14,0.06) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1140, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 52, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: "0.32em", textTransform: "uppercase", color: `rgba(180,105,14,0.6)`, fontWeight: 700, fontFamily: G.ui, marginBottom: 12 }}>The Directory</div>
              <h2 style={{ fontFamily: G.serif, fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 700, color: G.text, lineHeight: 1.12 }}>How it works</h2>
            </div>
            <Link href="/directory" style={{ fontSize: 11, fontWeight: 700, color: G.gold, textDecoration: "none", fontFamily: G.ui, border: `1px solid ${G.goldBorder}`, padding: "8px 16px", borderRadius: 20 }}>
              Start exploring →
            </Link>
          </div>

          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, borderTop: `1px solid rgba(180,105,14,0.12)` }}>
            {HOW.map((h, idx) => (
              <div key={h.n} style={{ padding: "32px 20px 28px", borderRight: idx < 4 ? `1px solid rgba(180,105,14,0.10)` : "none", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: `rgba(180,105,14,0.45)`, fontFamily: G.ui }}>{h.n}</span>
                  <span style={{ fontSize: 18, color: G.gold, opacity: 0.7 }}>{h.icon}</span>
                </div>
                <div style={{ fontFamily: G.ui, fontSize: 13, fontWeight: 700, color: G.text, letterSpacing: "0.01em" }}>{h.title}</div>
                <p style={{ fontFamily: G.ui, fontSize: 11.5, color: `rgba(245,239,228,0.46)`, lineHeight: 1.65, margin: 0, flex: 1 }}>{h.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  {h.ctas.map(c => (
                    <Link key={c.label} href={c.href} className="how-btn"
                      style={{ display: "inline-block", fontSize: 9, fontWeight: 700, color: `rgba(180,105,14,0.65)`, textDecoration: "none", border: `1px solid rgba(180,105,14,0.18)`, borderRadius: 20, padding: "5px 12px", fontFamily: G.ui, letterSpacing: "0.05em", transition: "all 0.15s" }}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────── */}
      <section style={{ background: G.gold, padding: "clamp(24px,4vw,36px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 20 }}>
          {[["500+", "Verified vendors"], ["6", "Cities covered"], ["900+", "Community reviews"], ["Lagos · Abuja", "& growing"]].map(([n, l]) => (
            <div key={n} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: G.serif, fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{n}</div>
              <div style={{ fontFamily: G.ui, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.70)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ────────────────────────────────── */}
      <section style={{ background: G.creamMid, padding: "clamp(64px,10vw,100px) clamp(20px,5vw,56px)", borderTop: `1px solid ${G.creamDark}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          {/* Decorative quote mark */}
          <div style={{ fontFamily: G.serif, fontSize: "5rem", lineHeight: 0.6, color: G.gold, opacity: 0.18, marginBottom: 28, userSelect: "none" }}>"</div>
          <blockquote style={{ fontFamily: G.serif, fontStyle: "italic", fontSize: "clamp(1.05rem,2.6vw,1.32rem)", color: G.textDark, lineHeight: 1.68, margin: "0 0 36px", fontWeight: 400 }}>
            I finally found a space that allows me to discover new beauty providers. No longer keeping saved folders on Instagram and TikTok that I can never find.
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: G.goldDim, border: `1.5px solid ${G.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: G.gold, fontFamily: G.ui }}>A</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: G.textDark, fontFamily: G.ui }}>Amara O.</div>
              <div style={{ fontSize: 10, color: G.textSubdued, fontFamily: G.ui, letterSpacing: "0.04em" }}>Community member</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ───────────────────────────────────── */}
      <section style={{ background: G.bgCard, padding: "clamp(44px,7vw,72px) clamp(20px,5vw,56px)", borderTop: `1px solid ${G.goldBorder}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: G.serif, fontSize: "clamp(1.3rem,3vw,2rem)", fontWeight: 700, color: G.text, marginBottom: 8 }}>Ready to find your vendors?</h3>
            <p style={{ fontFamily: G.ui, fontSize: 13, color: G.textMuted, lineHeight: 1.6 }}>Browse the full directory or explore beauty services.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/beautyservices" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#fff", background: G.gold, textDecoration: "none", fontFamily: G.ui, padding: "11px 22px", borderRadius: 8, letterSpacing: "0.04em", transition: "background 0.15s" }}>
              Browse Beauty
            </Link>
            <Link href="/directory" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: G.gold, background: "transparent", textDecoration: "none", fontFamily: G.ui, padding: "11px 22px", borderRadius: 8, border: `1px solid ${G.goldBorder}`, letterSpacing: "0.04em", transition: "all 0.15s" }}>
              All Vendors
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer style={{ background: G.bg, borderTop: `1px solid rgba(180,105,14,0.12)`, padding: "40px clamp(20px,5vw,56px) 28px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 24 }}>
            {/* Brand */}
            <div>
              <div style={{ fontFamily: G.display, fontSize: 20, letterSpacing: "0.14em", color: G.text, marginBottom: 8 }}>JAIYÉ</div>
              <p style={{ fontFamily: G.ui, fontSize: 12, color: G.textMuted, lineHeight: 1.6, maxWidth: 240 }}>The Nigerian beauty services &amp; events edit. Discover. Vouch. Book.</p>
            </div>
            {/* Links */}
            <div style={{ display: "flex", gap: "clamp(24px,5vw,56px)", flexWrap: "wrap" }}>
              {[
                { heading: "Directory", links: [{ label: "Beauty Services", href: "/beautyservices" }, { label: "Events", href: "/directory" }, { label: "All Vendors", href: "/directory" }] },
                { heading: "Account", links: [{ label: "Sign In", href: "/" }, { label: "Saved Vendors", href: "/saved" }, { label: "Style Calendar", href: "/style-calendar" }] },
              ].map(col => (
                <div key={col.heading}>
                  <div style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: G.gold, fontWeight: 700, fontFamily: G.ui, marginBottom: 12 }}>{col.heading}</div>
                  {col.links.map(l => (
                    <Link key={l.href + l.label} href={l.href} style={{ display: "block", fontSize: 12, color: G.textMuted, textDecoration: "none", fontFamily: G.ui, marginBottom: 8, transition: "color 0.15s" }}>{l.label}</Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 10, color: G.textMuted, fontFamily: G.ui }}>&copy; 2025 Jaiyé Directory. All rights reserved.</span>
            <div style={{ display: "flex", gap: 16 }}>
              {["Privacy", "Terms"].map(t => (
                <span key={t} style={{ fontSize: 10, color: G.textMuted, fontFamily: G.ui, cursor: "pointer" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
