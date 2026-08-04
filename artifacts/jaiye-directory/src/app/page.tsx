/**
 * Jaiyé Directory — Homepage
 * Visual system inspired by O-K Consulting: editorial, high-contrast,
 * heavy-caps typography, cream/black rhythm, Framer Motion animations.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useSupabase } from "@/hooks/useSupabase";

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────────────────── */
const C = {
  cream:   "#F5F0E6",
  cream2:  "#EDE8DD",
  black:   "#0D0B08",
  black2:  "#161410",
  white:   "#FDFAF6",
  gold:    "#B4690E",
  goldLt:  "rgba(180,105,14,0.14)",
  goldBrd: "rgba(180,105,14,0.22)",
  muted:   "#6B6560",
  disp:    "'Bebas Neue', 'Arial Narrow', Arial, sans-serif",
  serif:   "'Newsreader', Georgia, serif",
  ui:      "'Manrope', system-ui, sans-serif",
  ease:    [0.16, 1, 0.3, 1] as [number,number,number,number],
};

/* ─────────────────────────────────────────────────────────────────────────────
   Reusable animation components
───────────────────────────────────────────────────────────────────────────── */

/** Text that slides up from overflow:hidden container on scroll */
function ClipText({
  children,
  delay = 0,
  style,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  return (
    <div ref={ref} style={{ overflow: "hidden", ...style }}>
      <motion.div
        initial={{ y: "108%" }}
        animate={inView ? { y: 0 } : {}}
        transition={{ duration: 0.9, ease: C.ease, delay }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Fade + slide-up on scroll */
function FadeUp({
  children,
  delay = 0,
  style,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: C.ease, delay }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger wrapper — applies stagger to direct motion children */
function Stagger({
  children,
  stagger = 0.08,
  style,
}: {
  children: React.ReactNode;
  stagger?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: 0.1 } } }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** Single stagger child */
const StaggerItem = motion.div;
const STAGGER_ITEM = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: C.ease } },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Infinite Marquee
───────────────────────────────────────────────────────────────────────────── */
function Marquee({
  items,
  speed = 32,
  reverse = false,
  separator = "◆",
  textColor,
  borderTop = true,
  borderBot = true,
  bg,
}: {
  items: string[];
  speed?: number;
  reverse?: boolean;
  separator?: string;
  textColor?: string;
  borderTop?: boolean;
  borderBot?: boolean;
  bg?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow: "hidden",
      background: bg,
      borderTop: borderTop ? `1px solid rgba(180,105,14,0.12)` : undefined,
      borderBottom: borderBot ? `1px solid rgba(180,105,14,0.12)` : undefined,
    }}>
      <motion.div
        style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((t, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 14,
            padding: "12px 22px",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.28em",
            textTransform: "uppercase", fontFamily: C.ui,
            color: textColor ?? "rgba(245,240,230,0.38)",
          }}>
            {t}
            <span style={{ color: C.gold, fontSize: 5, opacity: 0.8 }}>{separator}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Eyebrow label
───────────────────────────────────────────────────────────────────────────── */
function Eyebrow({ text, light = false }: { text: string; light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 20, height: 1, background: C.gold, opacity: 0.7 }} />
      <span style={{
        fontSize: 8, fontWeight: 800, letterSpacing: "0.34em",
        textTransform: "uppercase", fontFamily: C.ui,
        color: light ? C.gold : C.gold,
      }}>{text}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Search bar (used in hero)
───────────────────────────────────────────────────────────────────────────── */
function HeroSearch() {
  const supabase = useSupabase();
  const [, navigate] = useLocation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ vendors: { id: string; name: string; location: string }[]; services: { id: string; name: string; category: string }[] }>({ vendors: [], services: [] });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults({ vendors: [], services: [] }); setOpen(false); return; }
    const t = setTimeout(async () => {
      const q = query.toLowerCase();
      const [vr, sr] = await Promise.all([
        supabase.from("vendors").select("id,name,location").ilike("name", `%${q}%`).limit(5),
        supabase.from("services").select("id,name,category").ilike("name", `%${q}%`).limit(5),
      ]);
      setResults({ vendors: vr.data ?? [], services: sr.data ?? [] });
      setOpen(true);
    }, 260);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mouseup", fn);
    return () => document.removeEventListener("mouseup", fn);
  }, []);

  const has = results.vendors.length > 0 || results.services.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", maxWidth: 480, width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center",
        border: `1px solid rgba(245,240,230,0.18)`,
        borderRadius: 4, overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)",
        transition: "border-color 0.2s",
      }}
        onFocus={() => { if (query.length >= 2) setOpen(true); }}
      >
        <input
          type="text"
          placeholder="Search vendors, services, locations…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            padding: "14px 18px", fontSize: 13, color: C.white,
            fontFamily: C.ui,
          }}
        />
        <button
          onClick={() => { if (query.trim()) navigate(`/directory?search=${encodeURIComponent(query)}`); }}
          style={{
            background: C.gold, border: "none", height: 48, padding: "0 20px",
            cursor: "pointer", color: "#fff", display: "flex", alignItems: "center",
            transition: "background 0.15s", flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C8842A")}
          onMouseLeave={e => (e.currentTarget.style.background = C.gold)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      {open && has && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "#fff", borderRadius: 6, overflow: "hidden", zIndex: 9999,
          boxShadow: "0 20px 60px rgba(0,0,0,0.20)", border: "1px solid rgba(0,0,0,0.06)",
        }}>
          {results.vendors.map(v => (
            <button key={v.id}
              onClick={() => { setOpen(false); setQuery(""); navigate(`/directory?search=${encodeURIComponent(v.name)}&id=${v.id}`); }}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", fontFamily: C.ui, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(180,105,14,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>{v.name}</span>
              {v.location && <span style={{ fontSize: 11, color: C.muted }}>{v.location}</span>}
            </button>
          ))}
          {results.services.map(s => (
            <button key={s.id}
              onClick={() => { setOpen(false); setQuery(""); navigate(`/beautyservices?cat=${encodeURIComponent(s.category)}&id=${s.id}`); }}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", fontFamily: C.ui, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(180,105,14,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.black }}>{s.name}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Artisans of Note — fetched from Supabase
───────────────────────────────────────────────────────────────────────────── */
type Vendor = { id: string; name: string; category: string; location: string; city: string; bio: string; instagram: string; usedCount: number; recCount: number; };

function ArtisansSection() {
  const supabase = useSupabase();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true, margin: "0px 0px -80px 0px" });

  useEffect(() => {
    supabase.from("vendors")
      .select("id,name,category,location,city,bio,instagram,usedCount:used_count,recCount:rec_count")
      .order("rec_count", { ascending: false })
      .limit(4)
      .then(({ data }) => { if (data) setVendors(data as Vendor[]); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fallback placeholder cards while loading
  const display: Partial<Vendor>[] = vendors.length
    ? vendors
    : [
        { id: "1", name: "Adaeze Beauty Studio", category: "MAKEUP",  city: "Lagos",       bio: "Bridal & editorial makeup for the modern Nigerian woman.", recCount: 47 },
        { id: "2", name: "Kemi Braids",          category: "HAIR",    city: "Abuja",       bio: "Specialist in protective styles, knotless and box braids.", recCount: 38 },
        { id: "3", name: "Elegance Events Co.",  category: "EVENTS",  city: "Port Harcourt", bio: "Luxury event planning with an eye for refined detail.",    recCount: 31 },
        { id: "4", name: "Glam by Tola",         category: "LASHES",  city: "Lagos",       bio: "Lash extensions and lifts trusted by 300+ clients.",        recCount: 26 },
      ];

  return (
    <section style={{ background: C.black, padding: "clamp(72px,10vw,112px) clamp(20px,4vw,52px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div ref={titleRef} style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "clamp(40px,6vw,60px)", flexWrap: "wrap", gap: 16 }}>
          <div>
            <FadeUp delay={0}>
              <Eyebrow text="Featured" />
            </FadeUp>
            <div style={{ marginTop: 12 }}>
              <ClipText delay={0.1}>
                <h2 style={{ fontFamily: C.disp, fontSize: "clamp(3rem,8vw,6.5rem)", letterSpacing: "0.04em", color: C.white, lineHeight: 0.92, margin: 0 }}>
                  ARTISANS<br />OF NOTE
                </h2>
              </ClipText>
            </div>
          </div>
          <FadeUp delay={0.2} style={{ alignSelf: "flex-end" }}>
            <Link href="/beautyservices" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}
              onMouseEnter={e => { const l = e.currentTarget.querySelector(".al") as HTMLElement; if (l) l.style.width = "48px"; }}
              onMouseLeave={e => { const l = e.currentTarget.querySelector(".al") as HTMLElement; if (l) l.style.width = "24px"; }}
            >
              <div className="al" style={{ width: 24, height: 1, background: C.gold, transition: "width 0.3s ease" }} />
              <span style={{ fontFamily: C.ui, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold }}>VIEW ALL</span>
            </Link>
          </FadeUp>
        </div>

        {/* Cards */}
        <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2 }}>
          {display.map((v, i) => (
            <StaggerItem key={v.id} variants={STAGGER_ITEM}>
              <ArtisanCard v={v} i={i} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function ArtisanCard({ v, i }: { v: Partial<Vendor>; i: number }) {
  const [hov, setHov] = useState(false);
  const photos = ["/pexels-heibbymarvel-4285539.jpg", "/pexels-services.jpg", "/pexels-bridal.jpg", "/pexels-directory-hero.jpg"];
  return (
    <Link href={`/beautyservices`} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ border: `1px solid rgba(245,240,230,0.07)`, background: hov ? "#1A1714" : "#110E0B", transition: "background 0.25s", padding: "0 0 24px" }}>
        {/* Photo */}
        <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
          <img src={photos[i % photos.length]} alt={v.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hov ? "scale(1.06)" : "scale(1)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,5,0.6) 0%, transparent 50%)" }} />
          {/* Category badge */}
          <div style={{ position: "absolute", top: 14, left: 14, fontSize: 8, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: C.ui, color: C.gold }}>
            {v.category}
          </div>
        </div>
        {/* Info */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ fontFamily: C.disp, fontSize: "clamp(1.2rem,2.5vw,1.7rem)", letterSpacing: "0.06em", color: C.white, lineHeight: 1, marginBottom: 8 }}>{v.name}</div>
          <div style={{ fontFamily: C.ui, fontSize: 11, color: "rgba(245,240,230,0.4)", marginBottom: 10 }}>{v.city}</div>
          {v.bio && (
            <p style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: 13, color: "rgba(245,240,230,0.55)", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {v.bio}
            </p>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {v.recCount != null && (
              <div style={{ fontFamily: C.ui, fontSize: 10, color: C.gold }}>
                <span style={{ fontWeight: 800 }}>{v.recCount}</span>
                <span style={{ marginLeft: 4, opacity: 0.6 }}>rec</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Mosaic panel (hero image grid)
───────────────────────────────────────────────────────────────────────────── */
function MosaicPanel({ img, label, sub, borderRight, delay }: { img: string; label: string; sub: string; borderRight: boolean; delay: number }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: C.ease, delay }}
      style={{ position: "relative", overflow: "hidden", borderRight: borderRight ? `1px solid rgba(245,240,230,0.07)` : undefined }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <img
        src={img} alt={label}
        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", transition: "transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hov ? "scale(1.05)" : "scale(1)", display: "block" }}
      />
      <div style={{ position: "absolute", inset: 0, background: hov ? "linear-gradient(to top, rgba(13,11,8,0.85) 0%, rgba(13,11,8,0.30) 60%)" : "linear-gradient(to top, rgba(13,11,8,0.65) 0%, rgba(13,11,8,0.15) 55%)", transition: "background 0.5s" }} />
      <div style={{ position: "absolute", bottom: "clamp(16px,2.5vw,28px)", left: "clamp(16px,2.5vw,28px)", right: 8 }}>
        <div style={{ fontFamily: C.disp, fontSize: "clamp(1.1rem,2.8vw,2rem)", letterSpacing: "0.06em", color: C.white, lineHeight: 0.95, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 8, letterSpacing: "0.22em", color: "rgba(245,240,230,0.42)", fontFamily: C.ui, textTransform: "uppercase" }}>{sub}</div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <div style={{ fontFamily: C.ui, background: C.black, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          §1  HERO — O-K Consulting grid structure, Jaiyé dark edition
          Top grid (3 cells) ➜ 3-panel mosaic ➜ Headline + stats band
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ background: C.black, borderBottom: `1px solid rgba(245,240,230,0.07)` }}>

        {/* ── Top grid: 3 cells divided by thin lines ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", borderBottom: `1px solid rgba(245,240,230,0.07)` }}>

          {/* Cell 1 — Brand name stacked */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: C.ease, delay: 0.1 }}
            style={{ padding: "clamp(28px,4vw,52px)", borderRight: `1px solid rgba(245,240,230,0.07)` }}
          >
            <div style={{ fontFamily: C.disp, fontSize: "clamp(3rem,7.5vw,7rem)", lineHeight: 0.86, letterSpacing: "0.02em", color: C.white }}>
              JAIYÉ<br />DIRECTORY
            </div>
            <div style={{ marginTop: 18, fontSize: 8, letterSpacing: "0.30em", color: "rgba(245,240,230,0.28)", textTransform: "uppercase", fontFamily: C.ui }}>Est. 2023 · Lagos, Nigeria</div>
          </motion.div>

          {/* Cell 2 — Badge + tagline + search */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: C.ease, delay: 0.25 }}
            style={{ padding: "clamp(28px,4vw,52px)", borderRight: `1px solid rgba(245,240,230,0.07)`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 28 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ width: 58, height: 58, borderRadius: "50%", border: `1px solid rgba(180,105,14,0.40)`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: C.disp, fontSize: 10, color: C.gold, letterSpacing: "0.04em", textAlign: "center", lineHeight: 1.2 }}>500+<br />VENDORS</div>
              </div>
              <p style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: "clamp(13px,1.4vw,16px)", color: "rgba(245,240,230,0.55)", lineHeight: 1.75, margin: 0 }}>
                We believe the right stylist or vendor makes your moment unforgettable — and that finding them should take minutes, not months.
              </p>
            </div>
            <HeroSearch />
          </motion.div>

          {/* Cell 3 — CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: C.ease, delay: 0.4 }}
            style={{ padding: "clamp(28px,4vw,52px) clamp(24px,3vw,44px)", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 160 }}
          >
            <ArrowLink href="/beautyservices" label="BROWSE BEAUTY" />
            <ArrowLink href="/directory" label="ALL VENDORS" faint />
          </motion.div>
        </div>

        {/* ── 3-panel image mosaic ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 0.85fr", height: "clamp(320px,48vw,580px)" }}>
          <MosaicPanel img="/pexels-heibbymarvel-4285539.jpg" label="BEAUTY SERVICES"  sub="Hair · Makeup · Lashes · Nails" borderRight delay={0.35} />
          <MosaicPanel img="/pexels-bridal1.jpg"              label="EVENT VENDORS"    sub="Weddings · Celebrations · Corporate" borderRight delay={0.48} />
          <MosaicPanel img="/pexels-directory-hero.jpg"       label="YOUR SHORTLIST"  sub="Save · Compare · Book" borderRight={false} delay={0.61} />
        </div>

        {/* ── "RECLAIM YOUR GLOW." bottom headline band ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: C.ease, delay: 0.65 }}
          style={{ padding: "clamp(20px,3vw,36px) clamp(20px,4vw,52px)", borderTop: `1px solid rgba(245,240,230,0.07)`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}
        >
          <div style={{ fontFamily: C.disp, fontSize: "clamp(2rem,6vw,5.5rem)", letterSpacing: "0.03em", color: C.white, lineHeight: 0.9 }}>
            RECLAIM YOUR <span style={{ color: C.gold }}>GLOW.</span>
          </div>
          <div style={{ display: "flex", gap: "clamp(28px,4.5vw,56px)", alignItems: "flex-start" }}>
            {[["500+", "VENDORS"], ["6", "CITIES"], ["900+", "REVIEWS"]].map(([n, l]) => (
              <div key={n}>
                <div style={{ fontFamily: C.disp, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: C.white, lineHeight: 1, letterSpacing: "0.04em" }}>{n}</div>
                <div style={{ fontSize: 8, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(245,240,230,0.28)", marginTop: 4, fontFamily: C.ui }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2  TICKER / MARQUEE #1
      ══════════════════════════════════════════════════════════════════════ */}
      <Marquee
        items={["Nigerian Wedding Vendors", "Verified Artisans", "Bridal Beauty", "Hair Braiding Specialists", "Event Planners", "Makeup Artists", "Community Shortlists", "Lagos · Abuja · Port Harcourt"]}
        speed={34}
        bg={C.black2}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          §3  WHERE TO START — two cinematic full-height cards
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.black2, padding: "clamp(64px,8vw,96px) clamp(20px,4vw,52px)", borderTop: "1px solid rgba(245,240,230,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
            <FadeUp><Eyebrow text="Curation" /></FadeUp>
            <ClipText delay={0.12} style={{ marginTop: 10 }}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,7vw,6rem)", lineHeight: 0.9, letterSpacing: "0.04em", color: C.white, margin: 0 }}>
                WHERE WOULD YOU<br />LIKE TO START?
              </h2>
            </ClipText>
          </div>

          {/* Two cards */}
          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {[
              { label: "BEAUTY", sub: "SERVICES", img: "/pexels-services.jpg",        href: "/beautyservices", cats: ["Hair", "Makeup", "Lashes", "Nails", "Brows"] },
              { label: "EVENTS", sub: "& WEDDINGS", img: "/pexels-bridal1.jpg",       href: "/directory",      cats: ["Weddings", "Birthdays", "Corporate", "Celebrations"] },
            ].map(c => (
              <StaggerItem key={c.label} variants={STAGGER_ITEM}>
                <WhereCard {...c} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §4  ARTISANS OF NOTE
      ══════════════════════════════════════════════════════════════════════ */}
      <ArtisansSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §5  SERVICES MARQUEE #2 (reversed direction)
      ══════════════════════════════════════════════════════════════════════ */}
      <Marquee
        items={["Hair Braids", "Bridal MUA", "Lash Extensions", "Silk Press", "Airbrush Makeup", "Knotless Braids", "Wedding Photography", "Decor & Venue", "Catering", "Gele Tying", "Nail Art"]}
        speed={28}
        reverse
        bg={C.black2}
        textColor="rgba(245,240,230,0.30)"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          §6  HOW IT WORKS — dark bg, O-K Consulting numbered list style
      ══════════════════════════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §7  TESTIMONIALS — "Kind Words"
      ══════════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §8  CTA BAND + FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <CtaFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Where to Start card
───────────────────────────────────────────────────────────────────────────── */
function WhereCard({ label, sub, img, href, cats }: { label: string; sub: string; img: string; href: string; cats: string[] }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", borderRadius: 2 }}>
        <img src={img} alt={label} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)",
          transform: hov ? "scale(1.05)" : "scale(1)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: hov
            ? "linear-gradient(to top, rgba(10,8,5,0.88) 0%, rgba(10,8,5,0.45) 60%)"
            : "linear-gradient(to top, rgba(10,8,5,0.72) 0%, rgba(10,8,5,0.20) 55%)",
          transition: "background 0.4s",
        }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(20px,3vw,32px)" }}>
          {/* Category chips — slide in on hover */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16, opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(12px)", transition: "all 0.35s" }}>
            {cats.map(c => (
              <span key={c} style={{ fontSize: 8, padding: "3px 10px", border: `1px solid rgba(245,240,230,0.30)`, borderRadius: 20, color: "rgba(245,240,230,0.75)", fontFamily: C.ui, fontWeight: 600, letterSpacing: "0.08em" }}>{c}</span>
            ))}
          </div>
          <div style={{ fontFamily: C.ui, fontSize: 8, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>{sub}</div>
          <div style={{ fontFamily: C.disp, fontSize: "clamp(2.2rem,5vw,4rem)", letterSpacing: "0.06em", color: "#fff", lineHeight: 0.95 }}>{label}</div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, opacity: hov ? 1 : 0, transform: hov ? "translateX(0)" : "translateX(-12px)", transition: "all 0.35s 0.05s" }}>
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>EXPLORE</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   How It Works
───────────────────────────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const steps = [
    { n: "01", title: "DISCOVER",        body: "Browse hundreds of verified Nigerian beauty and wedding vendors. Filter by category, city, and what the community recommends." },
    { n: "02", title: "VOUCH & VERIFY",  body: "Mark vendors you've used and recommend the ones you love. Real experiences from real people in the community." },
    { n: "03", title: "SAVE & NOTE",     body: "Build your personal shortlist with private notes and Naira quotes — your planning headquarters in one place." },
    { n: "04", title: "FOLLOW YOUR CIRCLE", body: "Follow people you trust to see who they've used and would recommend for your milestone moments." },
    { n: "05", title: "BOOK DIRECTLY",   body: "Some vendors offer direct booking links — go straight from discovery to booking without any friction." },
  ];

  return (
    <section style={{ background: C.black, padding: "clamp(72px,10vw,112px) clamp(20px,4vw,52px)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div ref={ref}>
          <FadeUp delay={0}><Eyebrow text="The Process" /></FadeUp>
          <div style={{ marginTop: 12, marginBottom: "clamp(40px,6vw,64px)" }}>
            <ClipText delay={0.1}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,6.5vw,5.5rem)", letterSpacing: "0.04em", color: C.white, lineHeight: 0.92, margin: 0 }}>HOW IT WORKS</h2>
            </ClipText>
          </div>

          <div style={{ borderTop: `1px solid rgba(245,240,230,0.08)` }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: C.ease, delay: 0.1 * i + 0.2 }}
                style={{
                  display: "flex", alignItems: "flex-start",
                  gap: "clamp(20px,5vw,60px)",
                  padding: "clamp(22px,3vw,30px) 0",
                  borderBottom: `1px solid rgba(245,240,230,0.08)`,
                }}
              >
                <span style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: C.gold, flexShrink: 0, paddingTop: 7 }}>{s.n}</span>
                <div style={{ fontFamily: C.disp, fontSize: "clamp(1.6rem,3.5vw,2.8rem)", letterSpacing: "0.06em", color: C.white, lineHeight: 1, flexShrink: 0, width: "clamp(160px,28vw,300px)" }}>{s.title}</div>
                <p style={{ fontFamily: C.ui, fontSize: 13, color: "rgba(245,240,230,0.45)", lineHeight: 1.7, maxWidth: 480, margin: 0, paddingTop: 6 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Testimonials
───────────────────────────────────────────────────────────────────────────── */
function TestimonialsSection() {
  const quotes = [
    { name: "Amara O.",  role: "Bride · Lagos",         img: "/pexels-heibbymarvel-4285539.jpg", quote: "I finally found a space that allows me to discover new beauty providers. No longer keeping saved folders on Instagram and TikTok that I can never find. Jaiyé is the one tab I always have open." },
    { name: "Chisom N.", role: "Event Planner · Abuja", img: "/pexels-bridal1.jpg",              quote: "The vendor directory is genuinely useful — I can recommend it to every client. The community reviews are honest and the shortlist feature saves me hours every week." },
    { name: "Temi A.",   role: "MUA · Port Harcourt",   img: "/pexels-services.jpg",             quote: "As a beauty provider, being on Jaiyé has connected me with brides who actually want my style. The community vouching system builds trust in a way Instagram just can't." },
  ];

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  return (
    <section style={{ background: C.black2, borderTop: "1px solid rgba(245,240,230,0.06)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(64px,9vw,104px) clamp(20px,4vw,52px)" }}>
        <div ref={ref}>
          <FadeUp><Eyebrow text="Kind Words" /></FadeUp>
          <div style={{ marginTop: 12, marginBottom: "clamp(40px,6vw,60px)" }}>
            <ClipText delay={0.1}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,6.5vw,5.5rem)", letterSpacing: "0.04em", color: C.white, lineHeight: 0.92, margin: 0 }}>
                WHAT THE<br />COMMUNITY SAYS
              </h2>
            </ClipText>
          </div>
        </div>

        {/* Photo grid + quotes — O-K Consulting style */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
          {quotes.map((q, i) => (
            <motion.div
              key={q.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, ease: C.ease, delay: 0.12 * i + 0.15 }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              {/* Photo */}
              <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
                <img src={q.img} alt={q.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,11,8,0.55) 0%, transparent 60%)" }} />
              </div>
              {/* Quote card */}
              <div style={{ background: "#110E0B", border: "1px solid rgba(245,240,230,0.06)", borderTop: "none", padding: "clamp(20px,3vw,32px)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 20 }}>
                <blockquote style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: "clamp(0.9rem,1.6vw,1.1rem)", color: "rgba(245,240,230,0.72)", lineHeight: 1.75, margin: 0 }}>
                  "{q.quote}"
                </blockquote>
                <div>
                  <div style={{ height: 1, background: `rgba(180,105,14,0.22)`, marginBottom: 14 }} />
                  <div style={{ fontFamily: C.ui, fontSize: 12, fontWeight: 800, color: C.white, letterSpacing: "0.05em" }}>{q.name}</div>
                  <div style={{ fontFamily: C.ui, fontSize: 10, color: "rgba(245,240,230,0.35)", marginTop: 3, letterSpacing: "0.05em" }}>{q.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CTA Band + Footer — "WE'RE HERE · LET'S TALK" style
───────────────────────────────────────────────────────────────────────────── */
function CtaFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const [hov, setHov] = useState(false);

  return (
    <section style={{ background: C.black, borderTop: `1px solid rgba(245,240,230,0.06)` }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(60px,9vw,100px) clamp(20px,4vw,52px) clamp(40px,6vw,60px)" }}>
        {/* CTA link */}
        <Link href="/directory" style={{ textDecoration: "none", display: "block" }}
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
            <div style={{ overflow: "hidden" }}>
              <motion.div
                initial={{ y: "105%" }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.9, ease: C.ease, delay: 0 }}
              >
                <div style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,8vw,7.5rem)", letterSpacing: "0.04em", lineHeight: 0.9, transition: "color 0.25s", color: hov ? C.gold : C.white }}>
                  WE'RE HERE
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.75, ease: C.ease, delay: 0.25 }}
              style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}
            >
              <span style={{ fontFamily: C.ui, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,240,230,0.4)" }}>LET'S TALK</span>
              <motion.div
                animate={{ width: hov ? 60 : 32 }}
                transition={{ duration: 0.3 }}
                style={{ height: 1, background: C.gold }}
              />
              <motion.div
                animate={{ background: hov ? C.gold : "rgba(0,0,0,0)" }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid rgba(180,105,14,0.30)`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov ? "#fff" : C.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </motion.div>
            </motion.div>
          </div>
        </Link>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, ease: C.ease, delay: 0.35 }}
          style={{ height: 1, background: "rgba(245,240,230,0.06)", margin: "clamp(36px,5vw,52px) 0", transformOrigin: "left" }}
        />

        {/* Footer nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}
        >
          <div style={{ fontFamily: C.disp, fontSize: "clamp(1rem,2.5vw,1.4rem)", letterSpacing: "0.14em", color: "rgba(245,240,230,0.25)" }}>JAIYÉ DIRECTORY</div>
          <div style={{ display: "flex", gap: "clamp(16px,3vw,32px)", flexWrap: "wrap" }}>
            {[{ l: "BEAUTY", h: "/beautyservices" }, { l: "EVENTS", h: "/directory" }, { l: "SAVED", h: "/saved" }, { l: "CALENDAR", h: "/style-calendar" }].map(lnk => (
              <Link key={lnk.h} href={lnk.h}
                style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,240,230,0.28)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,230,0.28)")}
              >
                {lnk.l}
              </Link>
            ))}
          </div>
          <span style={{ fontFamily: C.ui, fontSize: 10, color: "rgba(245,240,230,0.20)" }}>&copy; 2025 Jaiyé Directory</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared: arrow text link
───────────────────────────────────────────────────────────────────────────── */
function ArrowLink({ href, label, faint = false }: { href: string; label: string; faint?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <motion.div animate={{ width: hov ? 44 : 22 }} transition={{ duration: 0.28 }}
        style={{ height: 1, background: faint ? "rgba(245,240,230,0.22)" : C.gold }} />
      <span style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: faint ? "rgba(245,240,230,0.38)" : C.gold }}>
        {label}
      </span>
    </Link>
  );
}
