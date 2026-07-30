import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useSupabase } from "@/hooks/useSupabase";

/* ─────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────── */
const ACCENT = "#B4690E";
const manrope = "'Manrope', sans-serif";
const newsreader = "'Newsreader', Georgia, serif";

const TICKER_ITEMS = [
  "Nigerian Wedding Vendors",
  "Verified Artisans",
  "Bridal Beauty",
  "Hair Braiding Specialists",
  "Event Planners",
  "Makeup Artists",
  "Community Shortlists",
  "Lagos · Abuja · PH",
];

const HOW = [
  {
    icon: "✦",
    title: "Discover",
    body: "Browse hundreds of verified Nigerian wedding & beauty vendors. Filter by category, city, and what the community recommends.",
    ctas: [
      { label: "Browse Beauty Services →", href: "/beautyservices" },
      { label: "Browse Events →", href: "/directory" },
    ],
  },
  {
    icon: "♡",
    title: "Vouch & Verify",
    body: "Mark vendors you've used and recommend the ones you love. Real experiences from real brides in the community.",
    ctas: [
      { label: "Browse Beauty Services →", href: "/beautyservices" },
      { label: "Browse Events →", href: "/directory" },
    ],
  },
  {
    icon: "◎",
    title: "Save & Note",
    body: "Build your personal shortlist with private notes and budget quotes in Naira — your planning HQ.",
    ctas: [{ label: "View Saved →", href: "/saved" }],
  },
  {
    icon: "◈",
    title: "Follow Your Circle",
    body: "Follow people you trust to see who they've used, and would recommend for your day.",
    ctas: [{ label: "Find Friends →", href: "/saved" }],
  },
  {
    icon: "✓",
    title: "Book Directly",
    body: "Some vendors and artists offer direct booking links — go straight from discovery to booking.",
    ctas: [{ label: "Browse Beauty Services →", href: "/beautyservices" }],
  },
];

type SearchResults = {
  vendors: { id: string; name: string; location: string }[];
  services: { id: string; name: string; category: string }[];
};

/* ─────────────────────────────────────────────────────────
   Search hook
───────────────────────────────────────────────────────── */
function useSearchDropdown(
  query: string,
  supabase: ReturnType<typeof useSupabase>,
  setResults: (r: SearchResults) => void,
  setOpen: (o: boolean) => void,
  setLoading: (l: boolean) => void
) {
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ vendors: [], services: [] });
      setOpen(false);
      return;
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
}

/* ─────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────── */
function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  return (
    <div style={{ background: "#1A1208", overflow: "hidden", borderTop: "1px solid rgba(201,168,76,0.15)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
      <style>{`@keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "ticker-scroll 28s linear infinite" }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "10px 20px", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,239,228,0.55)", fontFamily: manrope }}>
            {t}
            <span style={{ color: ACCENT, opacity: 0.7 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ href, img, title, sub }: { href: string; img: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ position: "relative", borderRadius: 16, overflow: "hidden", display: "block", textDecoration: "none", flex: 1, minWidth: 0, aspectRatio: "4/3" }}>
      <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
        onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,7,3,0.78) 0%, rgba(10,7,3,0.1) 55%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, padding: "20px 20px 22px" }}>
        <div style={{ fontFamily: newsreader, fontWeight: 700, fontSize: "clamp(18px,2.5vw,22px)", color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontFamily: manrope, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{sub}</div>
      </div>
    </Link>
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

  useSearchDropdown(query, supabase, setResults, setSearchOpen, setSearchLoading);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mouseup", close);
    return () => document.removeEventListener("mouseup", close);
  }, []);

  const hasResults = results.vendors.length > 0 || results.services.length > 0;

  return (
    <div style={{ fontFamily: manrope, background: "#fff8f5", color: "#1C1917" }}>
      <style>{`
        .hero-search-input::placeholder { color: rgba(28,25,23,0.45); }
        .hero-search-input:focus { border-color: ${ACCENT} !important; outline: none; }
        .search-result-row:hover { background: rgba(180,105,14,0.06) !important; }
        .how-card-btn { transition: background 0.15s, color 0.15s; }
        .how-card-btn:hover { background: rgba(201,168,76,0.15) !important; color: #C9A84C !important; }
        @media (max-width: 640px) {
          .cat-grid { flex-direction: column !important; }
          .how-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-h1 { font-size: clamp(2.6rem, 12vw, 4rem) !important; }
        }
      `}</style>

      {/* ── HERO ───────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "72vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "clamp(40px,7vh,72px)" }}>
        {/* Photo background */}
        <img
          src="/pexels-heibbymarvel-4285539.jpg"
          alt="Hero"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
        />
        {/* Dark overlay — stronger at bottom for text legibility */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(170deg, rgba(10,7,3,0.45) 0%, rgba(10,7,3,0.82) 75%)" }} />

        {/* Top-left label */}
        <div style={{ position: "absolute", top: "clamp(72px,9vh,96px)", left: "clamp(20px,5vw,56px)", zIndex: 2 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(245,239,228,0.55)", fontWeight: 700, fontFamily: manrope }}>The Nigerian Beauty Services &amp; Events Edit</div>
        </div>

        {/* No.1 stamp */}
        <div style={{ position: "absolute", bottom: "clamp(40px,7vh,72px)", right: "clamp(20px,5vw,56px)", zIndex: 2, fontFamily: newsreader, fontSize: "clamp(2.4rem,6vw,4.5rem)", fontWeight: 700, color: "rgba(245,239,228,0.12)", lineHeight: 1, letterSpacing: "-0.02em", userSelect: "none" }}>
          No.1
        </div>

        {/* Main hero content */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px,5vw,56px)" }}>
          <h1 className="hero-h1" style={{ fontFamily: newsreader, fontWeight: 700, fontSize: "clamp(3rem,9vw,6rem)", lineHeight: 1.05, color: "#F5EFE4", margin: "0 0 16px", maxWidth: 640 }}>
            Reclaim<br />Your Glow.
          </h1>
          <p style={{ fontFamily: manrope, fontSize: "clamp(13px,2vw,15px)", color: "rgba(245,239,228,0.65)", maxWidth: 380, lineHeight: 1.65, margin: "0 0 32px", fontWeight: 400 }}>
            Discover the finest beauty services and event vendors in the Nigerian community.
          </p>

          {/* Search bar */}
          <div ref={searchRef} style={{ position: "relative", maxWidth: 520 }}>
            <div style={{ display: "flex", alignItems: "center", background: "#fff", borderRadius: 10, border: "1.5px solid rgba(28,25,23,0.12)", overflow: "hidden", transition: "border-color 0.2s" }}>
              <input
                className="hero-search-input"
                type="text"
                placeholder="Search vendors, services, locations…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (query.trim().length >= 2) setSearchOpen(true); }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "14px 16px", color: "#1C1917", fontFamily: manrope, background: "transparent" }}
              />
              <button
                onClick={() => { if (query.trim()) navigate("/directory?search=" + encodeURIComponent(query)); }}
                style={{ background: ACCENT, border: "none", padding: "0 18px", height: 48, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </button>
            </div>

            {/* Dropdown */}
            {searchOpen && hasResults && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1px solid rgba(28,25,23,0.1)", borderRadius: 10, overflow: "hidden", zIndex: 9999, boxShadow: "0 12px 40px rgba(0,0,0,0.14)" }}>
                {results.vendors.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, fontFamily: manrope }}>Vendors</div>
                    {results.vendors.map(v => (
                      <button key={v.id} className="search-result-row"
                        onClick={() => { setSearchOpen(false); setQuery(""); navigate("/directory?search=" + encodeURIComponent(v.name) + "&id=" + v.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid rgba(28,25,23,0.06)", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", fontFamily: manrope }}>{v.name}</span>
                        {v.location && <span style={{ fontSize: 11, color: "rgba(28,25,23,0.4)", fontFamily: manrope }}>{v.location}</span>}
                      </button>
                    ))}
                  </>
                )}
                {results.services.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#0D9488", fontWeight: 700, fontFamily: manrope }}>Services</div>
                    {results.services.map(s => (
                      <button key={s.id} className="search-result-row"
                        onClick={() => { setSearchOpen(false); setQuery(""); navigate("/beautyservices?cat=" + encodeURIComponent(s.category) + "&id=" + s.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid rgba(28,25,23,0.06)", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917", fontFamily: manrope }}>{s.name}</span>
                        <span style={{ fontSize: 11, color: "rgba(28,25,23,0.4)", fontFamily: manrope }}>{s.category}</span>
                      </button>
                    ))}
                  </>
                )}
                {searchLoading && <div style={{ padding: "12px 14px", fontSize: 12, color: "rgba(28,25,23,0.4)", fontFamily: manrope }}>Searching…</div>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────── */}
      <Ticker />

      {/* ── WHERE TO START ─────────────────────────────── */}
      <section style={{ background: "#fff8f5", padding: "clamp(52px,8vw,88px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 12, fontFamily: manrope }}>Curation</div>
          <h2 style={{ fontFamily: newsreader, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: "#1C1917", margin: "0 0 36px", lineHeight: 1.15 }}>
            Where would you<br />like to start?
          </h2>
          <div className="cat-grid" style={{ display: "flex", gap: 16 }}>
            <CategoryCard href="/beautyservices" img="/pexels-services.jpg" title="Beauty Services" sub="Hair, Makeup, Lashes &amp; more" />
            <CategoryCard href="/directory" img="/pexels-bridal.jpg" title="Events" sub="Planners, venues &amp; styling" />
          </div>
        </div>
      </section>

      {/* ── ARTISANS OF NOTE ───────────────────────────── */}
      <section style={{ background: "#fff8f5", padding: "0 clamp(20px,5vw,56px) clamp(52px,8vw,88px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 8, fontFamily: manrope }}>Featured</div>
              <h2 style={{ fontFamily: newsreader, fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontStyle: "italic", fontWeight: 700, color: "#1C1917", margin: 0, lineHeight: 1.15 }}>
                Artisans of Note
              </h2>
            </div>
            <Link href="/directory" style={{ fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: "none", fontFamily: manrope, letterSpacing: "0.06em", paddingBottom: 2, borderBottom: "1px solid " + ACCENT }}>View all</Link>
          </div>

          {/* Featured vendor card */}
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 4 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(28,25,23,0.08)", padding: "14px", minWidth: 220, maxWidth: 240, flexShrink: 0, boxShadow: "0 2px 8px rgba(28,25,23,0.06)" }}>
              <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12, height: 130 }}>
                <img src="/:kmari.jpg" alt="K.Mari" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 700, background: ACCENT + "18", color: ACCENT, padding: "2px 8px", borderRadius: 20, fontFamily: manrope, textTransform: "uppercase", letterSpacing: "0.08em" }}>Top Rated</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: "#EEF2FF", color: "#4338CA", padding: "2px 8px", borderRadius: 20, fontFamily: manrope }}>Just Joined</span>
              </div>
              <div style={{ fontFamily: newsreader, fontSize: 16, fontWeight: 700, color: "#1C1917", marginBottom: 4 }}>K.Mari</div>
              <div style={{ fontSize: 11, color: "rgba(28,25,23,0.5)", fontFamily: manrope, marginBottom: 10 }}>Makeup Artist</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {["Makeup", "Bridal"].map(t => (
                  <span key={t} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 20, border: "1px solid rgba(28,25,23,0.12)", color: "rgba(28,25,23,0.55)", fontFamily: manrope }}>{t}</span>
                ))}
              </div>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(28,25,23,0.4)", textDecoration: "none", fontFamily: manrope }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                @kmariartistry
              </a>
            </div>

            {/* More vendor placeholder cards */}
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, border: "1.5px dashed rgba(28,25,23,0.1)", padding: "14px", minWidth: 220, maxWidth: 240, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 220 }}>
                <div style={{ fontSize: 28, opacity: 0.15 }}>✦</div>
                <Link href="/directory" style={{ fontSize: 11, color: ACCENT, textDecoration: "none", fontFamily: manrope, fontWeight: 600 }}>Browse all vendors →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────── */}
      <section style={{ background: "#0D0A08", padding: "clamp(52px,8vw,88px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(201,168,76,0.6)", fontWeight: 700, marginBottom: 12, fontFamily: manrope }}>The Directory</div>
          <h2 style={{ fontFamily: newsreader, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: "#F5EFE4", margin: "0 0 48px", lineHeight: 1.15 }}>
            How it works
          </h2>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
            {HOW.map(h => (
              <div key={h.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontSize: 20, color: ACCENT }}>{h.icon}</span>
                <div style={{ fontFamily: manrope, fontSize: 13, fontWeight: 700, color: "#F5EFE4", letterSpacing: "0.01em" }}>{h.title}</div>
                <p style={{ fontFamily: manrope, fontSize: 12, color: "rgba(245,239,228,0.5)", lineHeight: 1.6, margin: 0 }}>{h.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                  {h.ctas.map(c => (
                    <Link key={c.href + c.label} href={c.href} className="how-card-btn"
                      style={{ display: "inline-block", fontSize: 10, fontWeight: 600, color: "rgba(201,168,76,0.7)", textDecoration: "none", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "5px 12px", fontFamily: manrope, transition: "all 0.15s" }}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ────────────────────────────────── */}
      <section style={{ background: "#fdf6ef", padding: "clamp(60px,9vw,96px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 40, color: ACCENT, opacity: 0.25, lineHeight: 1, marginBottom: 16, fontFamily: newsreader }}>&ldquo;</div>
          <p style={{ fontFamily: newsreader, fontStyle: "italic", fontSize: "clamp(1rem,2.5vw,1.25rem)", color: "#1C1917", lineHeight: 1.65, margin: "0 0 32px" }}>
            I finally found a space that allows me to discover new beauty providers. No longer keeping saved folders on Instagram and TikTok that I can never find
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: ACCENT + "22", border: "1.5px solid " + ACCENT + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: ACCENT, fontFamily: manrope }}>A</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1917", fontFamily: manrope }}>Amara O.</div>
              <div style={{ fontSize: 11, color: "rgba(28,25,23,0.45)", fontFamily: manrope }}>Community member</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer style={{ background: "#fff8f5", borderTop: "1px solid rgba(28,25,23,0.08)", padding: "36px clamp(20px,5vw,56px) 28px", textAlign: "center" }}>
        <div style={{ fontFamily: manrope, fontSize: 12, fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: "#1C1917", marginBottom: 20 }}>Jaiyé Directory</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(16px,4vw,32px)", marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Beauty Services", href: "/beautyservices" },
            { label: "Events", href: "/directory" },
            { label: "Community", href: "/saved" },
            { label: "Contact", href: "/" },
          ].map(l => (
            <Link key={l.href + l.label} href={l.href} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(28,25,23,0.45)", textDecoration: "none", fontFamily: manrope, transition: "color 0.15s" }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 10, color: "rgba(28,25,23,0.3)", fontFamily: manrope }}>&copy; 2025 Jaiyé Directory. All rights reserved.</div>
      </footer>
    </div>
  );
}
