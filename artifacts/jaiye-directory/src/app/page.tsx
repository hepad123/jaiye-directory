/**
 * Jaiyé Directory — Homepage
 * Light editorial design: warm cream backgrounds, gold accents, Bebas Neue display.
 * All data fetched live from Supabase — no placeholder content.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useSupabase } from "@/hooks/useSupabase";

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens — warm cream / editorial light
───────────────────────────────────────────────────────────────────────────── */
const C = {
  bg:    "#FAF7F2",           // main page bg — warm cream
  bg2:   "#F2EDE4",           // alternate section bg
  cream: "#F5F0E6",           // hero-below bg (matches original)
  cream2:"#EDE8DD",
  black: "#0D0B08",           // hero dark bg
  black2:"#161410",           // ticker bg
  white: "#FDFAF6",
  text:  "#1A1612",           // warm near-black
  textM: "rgba(26,22,18,0.50)",
  textL: "rgba(26,22,18,0.30)",
  bdr:   "rgba(26,22,18,0.09)",
  gold:  "#B4690E",
  goldT: "rgba(180,105,14,0.10)",
  goldB: "rgba(180,105,14,0.22)",
  disp:  "'Bebas Neue', 'Arial Narrow', Arial, sans-serif",
  serif: "'Newsreader', Georgia, serif",
  ui:    "'Manrope', system-ui, sans-serif",
  ease:  [0.16, 1, 0.3, 1] as [number, number, number, number],
};

/* ─────────────────────────────────────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────────────────────────────────────── */
function ClipText({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
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

function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: C.ease, delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Stagger({ children, stagger = 0.09, style }: { children: React.ReactNode; stagger?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });
  return (
    <motion.div
      ref={ref}
      variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: 0.08 } } }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={style}
    >
      {children}
    </motion.div>
  );
}

const StaggerItem = motion.div;
const SI = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Eyebrow label
───────────────────────────────────────────────────────────────────────────── */
function Eyebrow({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 20, height: 1, background: C.gold, opacity: 0.7 }} />
      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.34em", textTransform: "uppercase", fontFamily: C.ui, color: C.gold }}>
        {text}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Marquee
───────────────────────────────────────────────────────────────────────────── */
function Marquee({ items, speed = 32, reverse = false, bg }: { items: string[]; speed?: number; reverse?: boolean; bg?: string }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", background: bg ?? C.bg2, borderTop: `1px solid ${C.bdr}`, borderBottom: `1px solid ${C.bdr}` }}>
      <motion.div
        style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "12px 22px", fontSize: 9, fontWeight: 700, letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: C.ui, color: C.textM }}>
            {t}
            <span style={{ color: C.gold, fontSize: 5, opacity: 0.6 }}>◆</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero search bar
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
  }, [query]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mouseup", fn);
    return () => document.removeEventListener("mouseup", fn);
  }, []);

  const has = results.vendors.length > 0 || results.services.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", maxWidth: 460, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", border: `1.5px solid ${C.bdr}`, borderRadius: 4, overflow: "hidden", background: C.white, boxShadow: "0 2px 16px rgba(26,22,18,0.06)", transition: "border-color 0.2s" }}>
        <input
          type="text"
          placeholder="Search vendors, services, locations…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && query.trim()) navigate(`/directory?search=${encodeURIComponent(query)}`); }}
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", padding: "14px 18px", fontSize: 13, color: C.text, fontFamily: C.ui }}
        />
        <button
          onClick={() => { if (query.trim()) navigate(`/directory?search=${encodeURIComponent(query)}`); }}
          style={{ background: C.gold, border: "none", height: 48, padding: "0 20px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", transition: "background 0.15s", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.background = "#C8842A")}
          onMouseLeave={e => (e.currentTarget.style.background = C.gold)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
      {open && has && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: C.white, borderRadius: 6, overflow: "hidden", zIndex: 9999, boxShadow: "0 20px 60px rgba(26,22,18,0.14)", border: `1px solid ${C.bdr}` }}>
          {results.vendors.map(v => (
            <button key={v.id}
              onClick={() => { setOpen(false); setQuery(""); navigate(`/directory?search=${encodeURIComponent(v.name)}&id=${v.id}`); }}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.bdr}`, cursor: "pointer", fontFamily: C.ui, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.goldT)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v.name}</span>
              {v.location && <span style={{ fontSize: 11, color: C.textM }}>{v.location}</span>}
            </button>
          ))}
          {results.services.map(s => (
            <button key={s.id}
              onClick={() => { setOpen(false); setQuery(""); navigate(`/beautyservices?cat=${encodeURIComponent(s.category)}&id=${s.id}`); }}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", padding: "11px 16px", background: "none", border: "none", borderBottom: `1px solid ${C.bdr}`, cursor: "pointer", fontFamily: C.ui, textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.goldT)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</span>
              <span style={{ fontSize: 11, color: C.textM }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Real platform stats hook
───────────────────────────────────────────────────────────────────────────── */
function usePlatformStats() {
  const supabase = useSupabase();
  const [stats, setStats] = useState({ vendors: 0, cities: 0, reviews: 0 });
  useEffect(() => {
    (async () => {
      try {
        // Use simple id selects — avoid { count: "exact" } which can fail with
        // certain Supabase RLS configurations. Count results in JS instead.
        const [vr, sr, locData] = await Promise.all([
          supabase.from("vendors").select("id"),
          supabase.from("services").select("id"),
          supabase.from("vendors").select("location"),   // vendors uses "location", not "city"
        ]);
        const totalVendors = (vr.data?.length ?? 0) + (sr.data?.length ?? 0);
        // Extract unique city names from the location string (e.g. "Lagos, Nigeria" → "Lagos")
        const cities = new Set(
          ((locData.data ?? []) as { location: string }[])
            .map(r => r.location?.split(",")[0]?.trim())
            .filter(Boolean)
        );
        setStats(prev => ({
          vendors: totalVendors || prev.vendors,
          cities:  cities.size  || prev.cities,
          reviews: prev.reviews,
        }));
      } catch {
        // Keep default values — stats are decorative, not critical
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return stats;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Where to start card
───────────────────────────────────────────────────────────────────────────── */
function WhereCard({ label, sub, img, href, cats }: { label: string; sub: string; img: string; href: string; cats: string[] }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", borderRadius: 2 }}>
        <img src={img} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hov ? "scale(1.05)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: hov ? "linear-gradient(to top, rgba(10,8,5,0.88) 0%, rgba(10,8,5,0.40) 60%)" : "linear-gradient(to top, rgba(10,8,5,0.72) 0%, rgba(10,8,5,0.18) 55%)", transition: "background 0.4s" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(20px,3vw,32px)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16, opacity: hov ? 1 : 0, transform: hov ? "translateY(0)" : "translateY(12px)", transition: "all 0.35s" }}>
            {cats.map(c => (
              <span key={c} style={{ fontSize: 8, padding: "3px 10px", border: "1px solid rgba(245,240,230,0.30)", borderRadius: 20, color: "rgba(245,240,230,0.75)", fontFamily: C.ui, fontWeight: 600, letterSpacing: "0.08em" }}>{c}</span>
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
   Artisan of Note — K Mari only, fetched from Supabase
───────────────────────────────────────────────────────────────────────────── */
// Matches the actual vendors table schema (no city / bio columns)
type Vendor = { id: string; name: string; category: string; location: string; instagram: string; notes: string };

function ArtisansSection() {
  const supabase = useSupabase();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    supabase.from("vendors")
      .select("id,name,category,location,instagram,notes")
      .ilike("name", "%K Mari%")
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (data) setVendor(data as Vendor);
      });
  }, []);

  return (
    <section style={{ background: C.bg, padding: "clamp(72px,10vw,112px) clamp(20px,4vw,52px)", borderTop: `1px solid ${C.bdr}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "clamp(36px,5vw,52px)", flexWrap: "wrap", gap: 16 }}>
          <div>
            <FadeUp delay={0}><Eyebrow text="Artisan of Note" /></FadeUp>
            <div style={{ marginTop: 12 }}>
              <ClipText delay={0.1}>
                <h2 style={{ fontFamily: C.disp, fontSize: "clamp(3rem,8vw,6.5rem)", letterSpacing: "0.04em", color: C.text, lineHeight: 0.92, margin: 0 }}>
                  K MARI
                </h2>
              </ClipText>
            </div>
          </div>
          <FadeUp delay={0.2} style={{ alignSelf: "flex-end" }}>
            <Link href="/beautyservices"
              style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none" }}
              onMouseEnter={e => { const l = e.currentTarget.querySelector(".al") as HTMLElement; if (l) l.style.width = "48px"; }}
              onMouseLeave={e => { const l = e.currentTarget.querySelector(".al") as HTMLElement; if (l) l.style.width = "24px"; }}
            >
              <div className="al" style={{ width: 24, height: 1, background: C.gold, transition: "width 0.3s ease" }} />
              <span style={{ fontFamily: C.ui, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: C.gold }}>VIEW ALL</span>
            </Link>
          </FadeUp>
        </div>

        {/* Featured card — wide editorial layout */}
        <FadeUp delay={0.15}>
          <Link href="/beautyservices" style={{ textDecoration: "none", display: "block" }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: `1px solid ${C.bdr}`, borderRadius: 2, overflow: "hidden", transition: "box-shadow 0.25s", boxShadow: hov ? "0 12px 48px rgba(26,22,18,0.10)" : "0 2px 12px rgba(26,22,18,0.05)" }}>
              {/* Image half */}
              <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
                <img src="/kmari.jpg" alt="K Mari"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", transition: "transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)", transform: hov ? "scale(1.04)" : "scale(1)" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,5,0.4) 0%, transparent 60%)" }} />
                <div style={{ position: "absolute", top: 16, left: 16, fontSize: 8, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", fontFamily: C.ui, color: C.gold }}>
                  {vendor?.category ?? "Entertainment"}
                </div>
              </div>
              {/* Text half */}
              <div style={{ background: C.white, padding: "clamp(28px,4vw,48px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
                <div style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: C.textL }}>Featured Artisan</div>
                <div style={{ fontFamily: C.disp, fontSize: "clamp(2rem,4vw,3.5rem)", letterSpacing: "0.04em", color: C.text, lineHeight: 0.95 }}>
                  {vendor?.name ?? "K Mari"}
                </div>
                {vendor?.location && (
                  <div style={{ fontFamily: C.ui, fontSize: 11, color: C.textM, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {vendor.location}
                  </div>
                )}
                {vendor?.notes && (
                  <p style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: "clamp(14px,1.4vw,17px)", color: C.textM, lineHeight: 1.75, margin: 0 }}>
                    {vendor.notes}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 }}>
                  <div style={{ width: hov ? 44 : 24, height: 1, background: C.gold, transition: "width 0.3s" }} />
                  <span style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.20em", textTransform: "uppercase", color: C.gold }}>VIEW PROFILE</span>
                </div>
              </div>
            </div>
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   How It Works
───────────────────────────────────────────────────────────────────────────── */
function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  const steps = [
    { n: "01", title: "DISCOVER",           body: "Browse hundreds of verified Nigerian beauty and wedding vendors. Filter by category, city, and what the community recommends." },
    { n: "02", title: "VOUCH & VERIFY",     body: "Mark vendors you've used and recommend the ones you love. Real experiences from real people in the community." },
    { n: "03", title: "SAVE & NOTE",        body: "Build your personal shortlist with private notes and Naira quotes — your planning headquarters in one place." },
    { n: "04", title: "FOLLOW YOUR CIRCLE", body: "Follow people you trust to see who they've used and would recommend for your milestone moments." },
    { n: "05", title: "BOOK DIRECTLY",      body: "Some vendors offer direct booking links — go straight from discovery to booking without any friction." },
  ];

  return (
    <section style={{ background: C.bg2, padding: "clamp(72px,10vw,112px) clamp(20px,4vw,52px)", borderTop: `1px solid ${C.bdr}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div ref={ref}>
          <FadeUp delay={0}><Eyebrow text="The Process" /></FadeUp>
          <div style={{ marginTop: 12, marginBottom: "clamp(40px,6vw,64px)" }}>
            <ClipText delay={0.1}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,6.5vw,5.5rem)", letterSpacing: "0.04em", color: C.text, lineHeight: 0.92, margin: 0 }}>HOW IT WORKS</h2>
            </ClipText>
          </div>
          <div style={{ borderTop: `1px solid ${C.bdr}` }}>
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: C.ease, delay: 0.1 * i + 0.2 }}
                style={{ display: "flex", alignItems: "flex-start", gap: "clamp(20px,5vw,60px)", padding: "clamp(22px,3vw,30px) 0", borderBottom: `1px solid ${C.bdr}` }}
              >
                <span style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", color: C.gold, flexShrink: 0, paddingTop: 7 }}>{s.n}</span>
                <div style={{ fontFamily: C.disp, fontSize: "clamp(1.6rem,3.5vw,2.8rem)", letterSpacing: "0.06em", color: C.text, lineHeight: 1, flexShrink: 0, width: "clamp(160px,28vw,300px)" }}>{s.title}</div>
                <p style={{ fontFamily: C.ui, fontSize: 13, color: C.textM, lineHeight: 1.7, maxWidth: 480, margin: 0, paddingTop: 6 }}>{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   What the Community Says — real reviews from Supabase
───────────────────────────────────────────────────────────────────────────── */
type Review = { comment: string; reviewer_name: string; vendor_name?: string; service_name?: string; type: "vendor" | "service" };

function TestimonialsSection() {
  const supabase = useSupabase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  useEffect(() => {
    (async () => {
      try {
        // vendor_reviews and service_reviews require a vendor_id / service_id
        // WHERE clause due to RLS (same as beautyservices + directory pages).
        // Step 1: fetch a handful of vendor IDs from the unlocked vendors table.
        const { data: vendors, error: vendorErr } = await supabase
          .from("vendors")
          .select("id,name")
          .limit(8);


        if (!vendors || vendors.length === 0) return;

        // Step 2: fetch up to 2 reviews per vendor (with the required filter)
        // then flatten, filter to reviews with real comment text, take first 3.
        const chunks = await Promise.all(
          vendors.map(v =>
            supabase
              .from("vendor_reviews")
              .select("*")
              .eq("vendor_id", v.id)
              .limit(2)
              .then(res => ({
                reviews: (res.data ?? []) as Array<{ comment: string | null; reviewer_name: string }>,
                vendorName: v.name as string,
              }))
          )
        );

        const combined: Review[] = chunks.flatMap(({ reviews, vendorName }) =>
          reviews.map(r => ({
            comment: r.comment ?? "",
            reviewer_name: r.reviewer_name,
            vendor_name: vendorName,
            type: "vendor" as const,
          }))
        );

        const sorted = combined.filter(r => r.comment && r.comment.length > 20);
        if (sorted.length > 0) setReviews(sorted.slice(0, 3));
      } catch {
        // Reviews are decorative — silently fall back to empty state
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While reviews load, show skeleton placeholders
  const display = reviews.length > 0 ? reviews : [];

  return (
    <section style={{ background: C.bg, borderTop: `1px solid ${C.bdr}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(64px,9vw,104px) clamp(20px,4vw,52px)" }}>
        <div ref={ref}>
          <FadeUp><Eyebrow text="Kind Words" /></FadeUp>
          <div style={{ marginTop: 12, marginBottom: "clamp(40px,6vw,60px)" }}>
            <ClipText delay={0.1}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,6.5vw,5.5rem)", letterSpacing: "0.04em", color: C.text, lineHeight: 0.92, margin: 0 }}>
                WHAT THE<br />COMMUNITY SAYS
              </h2>
            </ClipText>
          </div>
        </div>

        {display.length === 0 ? (
          // Skeleton while loading
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 2, padding: "clamp(24px,3vw,36px)", minHeight: 200 }}>
                <div style={{ height: 12, background: C.bg2, borderRadius: 2, marginBottom: 10, width: "85%" }} />
                <div style={{ height: 12, background: C.bg2, borderRadius: 2, marginBottom: 10, width: "70%" }} />
                <div style={{ height: 12, background: C.bg2, borderRadius: 2, marginBottom: 24, width: "60%" }} />
                <div style={{ height: 1, background: C.bdr, margin: "20px 0 12px" }} />
                <div style={{ height: 10, background: C.bg2, borderRadius: 2, width: "40%" }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            {display.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.75, ease: C.ease, delay: 0.12 * i + 0.15 }}
                style={{ background: C.white, border: `1px solid ${C.bdr}`, borderRadius: 2, padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24 }}
              >
                {/* Quote mark */}
                <div style={{ fontFamily: C.serif, fontSize: 48, color: C.goldB, lineHeight: 1, marginBottom: -16 }}>"</div>
                <blockquote style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: "clamp(0.9rem,1.6vw,1.05rem)", color: C.textM, lineHeight: 1.8, margin: 0 }}>
                  {q.comment}
                </blockquote>
                <div>
                  <div style={{ height: 1, background: C.goldB, marginBottom: 14 }} />
                  <div style={{ fontFamily: C.ui, fontSize: 12, fontWeight: 800, color: C.text, letterSpacing: "0.05em" }}>{q.reviewer_name}</div>
                  <div style={{ fontFamily: C.ui, fontSize: 10, color: C.textM, marginTop: 3, letterSpacing: "0.04em" }}>
                    {q.vendor_name ?? q.service_name ?? (q.type === "vendor" ? "Event Vendor" : "Beauty Service")}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Arrow text link (used in dark hero)
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

/* ─────────────────────────────────────────────────────────────────────────────
   CTA + Footer
───────────────────────────────────────────────────────────────────────────── */
function CtaFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const [hov, setHov] = useState(false);

  return (
    <section style={{ background: C.bg2, borderTop: `1px solid ${C.bdr}` }}>
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
                <div style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,8vw,7.5rem)", letterSpacing: "0.04em", lineHeight: 0.9, transition: "color 0.25s", color: hov ? C.gold : C.text }}>
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
              <span style={{ fontFamily: C.ui, fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: C.textM }}>LET'S TALK</span>
              <motion.div animate={{ width: hov ? 60 : 32 }} transition={{ duration: 0.3 }} style={{ height: 1, background: C.gold }} />
              <motion.div
                animate={{ background: hov ? C.gold : "rgba(180,105,14,0)" }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.goldB}`, display: "flex", alignItems: "center", justifyContent: "center" }}
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
          style={{ height: 1, background: C.bdr, margin: "clamp(36px,5vw,52px) 0", transformOrigin: "left" }}
        />

        {/* Footer nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}
        >
          <div style={{ fontFamily: C.disp, fontSize: "clamp(1rem,2.5vw,1.4rem)", letterSpacing: "0.14em", color: C.textL }}>JAIYÉ DIRECTORY</div>
          <div style={{ display: "flex", gap: "clamp(16px,3vw,32px)", flexWrap: "wrap" }}>
            {[{ l: "BEAUTY", h: "/beautyservices" }, { l: "EVENTS", h: "/directory" }, { l: "SAVED", h: "/saved" }, { l: "CALENDAR", h: "/style-calendar" }].map(lnk => (
              <Link key={lnk.h} href={lnk.h}
                style={{ fontFamily: C.ui, fontSize: 9, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: C.textL, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textL)}
              >
                {lnk.l}
              </Link>
            ))}
          </div>
          <span style={{ fontFamily: C.ui, fontSize: 10, color: C.textL }}>&copy; 2025 Jaiyé Directory</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const stats = usePlatformStats();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const heroImgY = useTransform(scrollY, [0, 700], [0, 110]);

  return (
    <div style={{ fontFamily: C.ui, background: C.bg, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          §1  HERO — Dark, full-bleed, "Reclaim Your Glow."
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ background: C.black, minHeight: "100svh", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        {/* Parallax hero image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <motion.img
            src="/pexels-heibbymarvel-4285539.jpg"
            alt="Hero"
            style={{ width: "100%", height: "115%", objectFit: "cover", objectPosition: "50% 20%", y: heroImgY, willChange: "transform" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,11,8,0.78) 0%, rgba(13,11,8,0.50) 40%, rgba(13,11,8,0.82) 100%)" }} />
        </div>

        {/* Top meta bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ position: "relative", zIndex: 1, padding: "0 clamp(20px,4vw,52px)", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(245,240,230,0.08)` }}>
          <span style={{ fontSize: 8, letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(245,240,230,0.35)", fontFamily: C.ui }}>Est. 2023 · Lagos, Nigeria</span>
          <span style={{ fontSize: 8, letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(245,240,230,0.35)", fontFamily: C.ui }}>The Nigerian Beauty &amp; Events Edit</span>
        </motion.div>

        {/* Main hero content */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "clamp(32px,5vw,56px) clamp(20px,4vw,52px) clamp(40px,6vw,68px)" }}>

          {/* No.1 editorial accent — top right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            style={{ position: "absolute", top: "clamp(20px,4vw,40px)", right: "clamp(20px,4vw,52px)", textAlign: "right" }}>
            <div style={{ fontFamily: C.disp, fontSize: "clamp(3rem,8vw,7rem)", color: "rgba(245,240,230,0.08)", letterSpacing: "0.06em", lineHeight: 1 }}>No.1</div>
          </motion.div>

          {/* Headline */}
          <div style={{ marginBottom: "clamp(20px,3vw,28px)" }}>
            <ClipText delay={0.15}>
              <h1 style={{ fontFamily: C.disp, fontSize: "clamp(5rem,15vw,14rem)", lineHeight: 0.88, letterSpacing: "0.02em", color: C.white, margin: 0 }}>RECLAIM</h1>
            </ClipText>
            <ClipText delay={0.28}>
              <h1 style={{ fontFamily: C.disp, fontSize: "clamp(5rem,15vw,14rem)", lineHeight: 0.88, letterSpacing: "0.02em", color: C.white, margin: 0 }}>YOUR</h1>
            </ClipText>
            <ClipText delay={0.41}>
              <h1 style={{ fontFamily: C.disp, fontSize: "clamp(5rem,15vw,14rem)", lineHeight: 0.88, letterSpacing: "0.02em", color: C.gold, margin: 0 }}>GLOW.</h1>
            </ClipText>
          </div>

          {/* Tagline + search + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: C.ease, delay: 0.58 }}
            style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 540 }}>
            <p style={{ fontFamily: C.serif, fontStyle: "italic", fontSize: "clamp(14px,1.8vw,18px)", color: "rgba(245,240,230,0.62)", lineHeight: 1.7, margin: 0 }}>
              Discover the finest beauty services and event vendors in the Nigerian community.
            </p>
            <HeroSearch />
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <ArrowLink href="/beautyservices" label="BROWSE BEAUTY" />
              <ArrowLink href="/directory" label="ALL VENDORS" faint />
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            style={{ display: "flex", gap: "clamp(24px,4vw,48px)", marginTop: "clamp(32px,5vw,52px)", paddingTop: 20, borderTop: `1px solid rgba(245,240,230,0.08)` }}>
            {[[`${stats.vendors || 500}+`, "VENDORS"], [`${stats.cities || 6}`, "CITIES"], ["900+", "REVIEWS"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: C.disp, fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: C.white, lineHeight: 1, letterSpacing: "0.04em" }}>{n}</div>
                <div style={{ fontSize: 8, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(245,240,230,0.3)", marginTop: 4, fontFamily: C.ui }}>{l}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §2  TICKER
      ══════════════════════════════════════════════════════════════════════ */}
      <Marquee
        items={["Nigerian Wedding Vendors", "Verified Artisans", "Bridal Beauty", "Hair Braiding Specialists", "Event Planners", "Makeup Artists", "Community Shortlists", "Lagos · Abuja · Port Harcourt"]}
        speed={34}
        bg={C.black2}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          §3  WHERE TO START
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: "clamp(64px,8vw,96px) clamp(20px,4vw,52px)", borderTop: `1px solid ${C.bdr}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "clamp(36px,5vw,52px)" }}>
            <FadeUp><Eyebrow text="Curation" /></FadeUp>
            <ClipText delay={0.12} style={{ marginTop: 10 }}>
              <h2 style={{ fontFamily: C.disp, fontSize: "clamp(2.4rem,7vw,6rem)", lineHeight: 0.9, letterSpacing: "0.04em", color: C.text, margin: 0 }}>
                WHERE WOULD YOU<br />LIKE TO START?
              </h2>
            </ClipText>
          </div>
          <Stagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
            <StaggerItem variants={SI}>
              <WhereCard label="BEAUTY" sub="SERVICES" img="/pexels-services.jpg" href="/beautyservices" cats={["Hair", "Makeup", "Lashes", "Nails", "Brows"]} />
            </StaggerItem>
            <StaggerItem variants={SI}>
              <WhereCard label="EVENTS" sub="& WEDDINGS" img="/pexels-bridal1.jpg" href="/directory" cats={["Weddings", "Birthdays", "Corporate", "Celebrations"]} />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          §4  ARTISAN OF NOTE — K Mari
      ══════════════════════════════════════════════════════════════════════ */}
      <ArtisansSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §5  SERVICES MARQUEE (reversed)
      ══════════════════════════════════════════════════════════════════════ */}
      <Marquee
        items={["Hair Braids", "Bridal MUA", "Lash Extensions", "Silk Press", "Airbrush Makeup", "Knotless Braids", "Wedding Photography", "Decor & Venue", "Catering", "Gele Tying", "Nail Art"]}
        speed={28}
        reverse
        bg={C.bg2}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          §6  HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §7  WHAT THE COMMUNITY SAYS — real Supabase reviews
      ══════════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ══════════════════════════════════════════════════════════════════════
          §8  WE'RE HERE + FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <CtaFooter />
    </div>
  );
}
