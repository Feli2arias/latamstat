"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import createGlobe, { COBEOptions } from "cobe";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Database, TrendingUp, Zap, Scale, DollarSign, PieChart, TrendingDown, Users, Landmark, Ship, CreditCard, Star, Heart } from "lucide-react";
import clsx from "clsx";

function cn(...classes: (string | undefined | false | null)[]) {
  return clsx(...classes);
}

// ─── Fix scroll to top on load ────────────────────────────────────────────────
function useScrollTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);
}

// ─── Globe canvas ─────────────────────────────────────────────────────────────

function Globe({ className, config }: { className?: string; config?: Partial<COBEOptions> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interacting = useRef<number | null>(null);
  const movement = useRef(0);
  const phi = useRef(1.05);
  const rDelta = useRef(0);

  const defaultConfig: COBEOptions = {
    width: 800,
    height: 800,
    phi: 1.05,
    theta: 0.3,
    dark: 1,
    diffuse: 1.2,
    mapSamples: 20000,
    mapBrightness: 5,
    mapBaseBrightness: 0.05,
    baseColor: [0.06, 0.08, 0.18],
    markerColor: [1.0, 0.42, 0.21],
    glowColor: [0.18, 0.35, 0.9],
    markers: [],
    devicePixelRatio: 2,
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    let w = canvas.offsetWidth;
    const mergedConfig = { ...defaultConfig, ...config, width: w * 2, height: w * 2 };

    const globe = createGlobe(canvas, mergedConfig);

    let raf: number;
    const tick = () => {
      if (!interacting.current) phi.current += 0.0003;
      globe.update({ phi: phi.current + rDelta.current, width: w * 2, height: w * 2 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const resize = () => { w = canvas.offsetWidth; };
    window.addEventListener("resize", resize);
    setTimeout(() => { canvas.style.opacity = "1"; }, 200);
    return () => { cancelAnimationFrame(raf); globe.destroy(); window.removeEventListener("resize", resize); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("absolute inset-0 mx-auto aspect-square w-full max-w-[600px]", className)}>
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-[1500ms] [contain:layout_paint_size]"
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          interacting.current = e.clientX - movement.current;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          (e.target as HTMLCanvasElement).style.cursor = "grabbing";
        }}
        onPointerUp={(e) => {
          interacting.current = null;
          (e.target as HTMLCanvasElement).style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          interacting.current = null;
          (e.target as HTMLCanvasElement).style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (interacting.current !== null) {
            const d = e.clientX - interacting.current;
            movement.current = d;
            rDelta.current = d / 300;
          }
        }}
      />
    </div>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  "Argentina", "Brasil", "México", "Chile", "Colombia", "Perú", "Ecuador",
  "Bolivia", "Paraguay", "Uruguay", "Venezuela", "Costa Rica", "Honduras",
  "Índice Gini", "PIB per cápita", "Tasa de pobreza", "Inflación", "Desempleo",
  "Gasto público", "Exportaciones", "Deuda externa", "IDH",
];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <motion.div
        className="flex gap-4 whitespace-nowrap"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center text-xs font-mono text-[#8585a8] border border-[#1a1a2e] rounded-full px-4 py-1.5 bg-[#0d0d16] shrink-0"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-5">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between gap-8 px-5 py-3 rounded-2xl transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(9,9,15,0.85)"
            : "rgba(9,9,15,0.6)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled
            ? "0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 2px 16px rgba(0,0,0,0.2)",
          width: "min(720px, calc(100vw - 2rem))",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="LatamStat" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-[#f0f0fa]">
            Latam<span className="text-[#ff6b35]">Stat</span>
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Cobertura", href: "#globe" },
            { label: "Indicadores", href: "#indicadores" },
            { label: "Capacidades", href: "#features" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs font-mono font-medium text-[#8585a8] hover:text-[#e2e2eb] transition-colors tracking-wide"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link href="/dashboard" className="shrink-0">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #ff6b35 0%, #d9541e 100%)",
              color: "white",
              boxShadow: "0 2px 12px rgba(255,107,53,0.3)",
            }}
          >
            Dashboard
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </motion.div>
    </nav>
  );
}

// ─── Animated Hero ────────────────────────────────────────────────────────────

function AnimatedHero() {
  const [titleIndex, setTitleIndex] = useState(0);
  const titles = useMemo(() => ["desigualdad", "inflación", "pobreza", "deuda", "migración"], []);

  useEffect(() => {
    const id = setInterval(() => {
      setTitleIndex((i) => (i + 1) % titles.length);
    }, 2400);
    return () => clearInterval(id);
  }, [titles.length]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Glows */}
      <div className="absolute top-[25%] left-[8%] w-[500px] h-[500px] rounded-full bg-[#4f8ef7] opacity-[0.04] blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[5%] w-[450px] h-[450px] rounded-full bg-[#ff6b35] opacity-[0.05] blur-[110px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a2a3e] bg-[#0d0d16] text-xs font-mono text-[#c0c1ff] mb-10"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] animate-pulse" />
          Hackathon ULACIT × Databricks · Datos CEPAL oficiales
        </motion.div>

        {/* Title — three separate divs to avoid inline animation bugs */}
        <div
          className="font-bold text-center tracking-tight leading-none"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl text-[#f0f0fa] mb-2"
          >
            Entendé la
          </motion.div>

          {/* Rotating word — isolated, fixed height, no overflow on parent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="relative flex justify-center items-center overflow-hidden"
            style={{ height: "1.15em", fontSize: "clamp(3rem, 9vw, 5.5rem)" }}
          >
            {titles.map((title, i) => (
              <motion.span
                key={title}
                className="absolute font-bold"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #ff6b35 0%, #ffb347 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                initial={false}
                animate={
                  i === titleIndex
                    ? { y: 0, opacity: 1 }
                    : { y: titleIndex > i ? "-110%" : "110%", opacity: 0 }
                }
                transition={{ type: "spring", stiffness: 55, damping: 15 }}
              >
                {title}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl text-[#f0f0fa] mt-2"
          >
            de América Latina
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base md:text-lg text-[#8585a8] max-w-xl leading-relaxed mt-10 mb-12"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          45,801 registros históricos. 10 indicadores clave. 33 países.
          IA conversacional integrada. Datos oficiales de CEPALSTAT.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/dashboard">
            <button
              className="group flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-semibold font-mono text-white transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(255,107,53,0.4)]"
              style={{
                background: "linear-gradient(135deg, #ff6b35 0%, #d9541e 100%)",
                boxShadow: "0 0 24px rgba(255,107,53,0.3)",
              }}
            >
              Explorar el dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <a
            href="#globe"
            className="text-sm font-mono text-[#8585a8] hover:text-[#e2e2eb] transition-colors px-4 py-4 flex items-center gap-2"
          >
            Ver cobertura ↓
          </a>
        </motion.div>
      </div>

      {/* Scroll line */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
      >
        <div className="w-px h-12 bg-gradient-to-b from-[#ff6b35]/50 to-transparent mx-auto" />
      </motion.div>
    </section>
  );
}

// ─── Globe Feature Section (ruixenui style) ───────────────────────────────────

function GlobeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="globe" className="px-4 md:px-8 py-8" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="relative w-full mx-auto overflow-hidden rounded-3xl border border-[#1a1a2e] px-8 py-16 md:px-16 md:py-20 shadow-[0_0_80px_rgba(79,142,247,0.06)]"
        style={{ background: "linear-gradient(135deg, #0b0b14 0%, #0d0d1a 100%)" }}
      >
        {/* Top border glow */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#4f8ef7]/40 to-transparent" />

        <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
          {/* Text side */}
          <div className="z-10 max-w-lg text-left">
            <span className="inline-block font-mono text-xs text-[#8585a8] tracking-[0.2em] uppercase mb-4">
              Cobertura geográfica
            </span>
            <h2
              className="text-3xl md:text-5xl font-bold text-[#f0f0fa] leading-tight tracking-tight mb-6"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Toda América Latina
              <br />
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "#4f8ef7" }}>
                en un solo lugar
              </span>
            </h2>
            <p className="text-sm md:text-base text-[#8585a8] leading-relaxed mb-8" style={{ fontFamily: "'Sora', sans-serif" }}>
              Desde México hasta la Patagonia. 33 países, 14 ciudades marcadas,
              datos que abarcan más de 70 años de historia socioeconómica.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { v: "33", l: "países" },
                { v: "45k+", l: "registros" },
                { v: "70+", l: "años" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono text-2xl font-bold text-[#ff6b35]">{s.v}</div>
                  <div className="font-mono text-xs text-[#8585a8]">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/dashboard">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold font-mono text-[#f0f0fa] border border-[#2a2a3e] hover:border-[#4f8ef7]/50 transition-all duration-200 hover:bg-[#4f8ef7]/5"
                >
                  Explorar datos <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>

          {/* Globe side — matches ruixenui pattern: relative container, globe floats out */}
          <div className="relative h-[260px] w-full max-w-[480px] shrink-0">
            <Globe className="absolute -bottom-16 -right-20 scale-[1.35] md:-bottom-24 md:-right-28 md:scale-[1.5]" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Features Bento ───────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "IA conversacional",
    description: "Preguntá en español sobre cualquier indicador. La IA consulta Databricks y responde con contexto histórico.",
    accent: "#ff6b35",
    large: true,
  },
  {
    icon: BarChart3,
    title: "Visualizaciones interactivas",
    description: "Series de tiempo, comparativas y scatter plots con filtros dinámicos.",
    accent: "#4f8ef7",
    large: false,
  },
  {
    icon: Database,
    title: "45k+ registros CEPAL",
    description: "Datos oficiales en Databricks Unity Catalog.",
    accent: "#c0c1ff",
    large: false,
  },
  {
    icon: TrendingUp,
    title: "10 indicadores clave",
    description: "Gini, PIB, pobreza, inflación, desempleo y más.",
    accent: "#ff6b35",
    large: false,
  },
  {
    icon: Zap,
    title: "Tiempo real",
    description: "Consultas SQL sobre Databricks con latencia optimizada.",
    accent: "#4f8ef7",
    large: false,
  },
];

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="features" className="py-28 px-4 md:px-8" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-[#8585a8] tracking-[0.2em] uppercase block mb-4">Capacidades</span>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#f0f0fa] tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Todo lo que necesitás
            <br />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "#c0c1ff" }}>
              en un dashboard
            </span>
          </h2>
        </motion.div>

        {/* Top 2 featured + bottom 3 in a row */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.slice(0, 2).map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group relative rounded-2xl border border-[#1a1a2e] bg-[#0b0b14] p-8 overflow-hidden cursor-default transition-colors duration-300 hover:border-[#252535]"
                >
                  <div className="absolute top-0 left-[15%] right-[15%] h-px transition-opacity duration-300 opacity-40 group-hover:opacity-100"
                    style={{ background: `linear-gradient(to right, transparent, ${f.accent}90, transparent)` }} />
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}25` }}>
                      <Icon style={{ color: f.accent, width: 20, height: 20 }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#f0f0fa] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>{f.title}</h3>
                      <p className="text-sm text-[#6a6a8a] leading-relaxed" style={{ fontFamily: "'Sora', sans-serif" }}>{f.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEATURES.slice(2).map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.16 + i * 0.07 }}
                  className="group relative rounded-2xl border border-[#1a1a2e] bg-[#0b0b14] p-6 overflow-hidden cursor-default transition-colors duration-300 hover:border-[#252535]"
                >
                  <div className="absolute top-0 left-[15%] right-[15%] h-px transition-opacity duration-300 opacity-30 group-hover:opacity-80"
                    style={{ background: `linear-gradient(to right, transparent, ${f.accent}90, transparent)` }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}25` }}>
                    <Icon style={{ color: f.accent, width: 16, height: 16 }} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#e2e2eb] mb-1.5" style={{ fontFamily: "'Sora', sans-serif" }}>{f.title}</h3>
                  <p className="text-[13px] text-[#6a6a8a] leading-relaxed" style={{ fontFamily: "'Sora', sans-serif" }}>{f.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ to, label, suffix = "" }: { to: number; label: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 2000;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(step);
      else setVal(to);
    };
    requestAnimationFrame(step);
  }, [inView, to]);

  return (
    <div ref={ref} className="text-center">
      <div
        className="text-4xl md:text-5xl font-bold font-mono mb-2"
        style={{
          background: "linear-gradient(135deg, #f0f0fa 0%, #6a6a8a 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {val.toLocaleString("es")}{suffix}
      </div>
      <div className="text-xs font-mono text-[#6a6a8a] tracking-wide">{label}</div>
    </div>
  );
}

function StatsSection() {
  return (
    <section className="py-20 px-4 md:px-8 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1a1a2e] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#1a1a2e] to-transparent" />
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
        <AnimatedCounter to={45801} label="registros históricos" />
        <AnimatedCounter to={10} label="indicadores CEPAL" />
        <AnimatedCounter to={33} label="países cubiertos" />
        <AnimatedCounter to={70} label="años de datos" suffix="+" />
      </div>
    </section>
  );
}

// ─── Indicators ───────────────────────────────────────────────────────────────

const INDICATORS = [
  { name: "Índice Gini", desc: "Desigualdad de ingresos", icon: Scale, accent: "#c0c1ff" },
  { name: "PIB per cápita", desc: "Producto bruto por persona", icon: DollarSign, accent: "#4f8ef7" },
  { name: "Tasa de pobreza", desc: "Población bajo línea de pobreza", icon: PieChart, accent: "#ff6b35" },
  { name: "Inflación", desc: "Variación del IPC anual", icon: TrendingDown, accent: "#f7934f" },
  { name: "Desempleo", desc: "Tasa de desocupación", icon: Users, accent: "#c0c1ff" },
  { name: "Gasto social", desc: "% del PIB en gasto público social", icon: Landmark, accent: "#4f8ef7" },
  { name: "Exportaciones", desc: "Valor total exportado (USD)", icon: Ship, accent: "#ff6b35" },
  { name: "Deuda externa", desc: "% del PIB", icon: CreditCard, accent: "#f7934f" },
  { name: "IDH", desc: "Índice de Desarrollo Humano", icon: Star, accent: "#c0c1ff" },
  { name: "Mortalidad infantil", desc: "Por cada 1,000 nacidos vivos", icon: Heart, accent: "#ff6b35" },
];

function IndicatorsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="indicadores" className="py-28 px-4 md:px-8" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="font-mono text-xs text-[#8585a8] tracking-[0.2em] uppercase block mb-4">Indicadores disponibles</span>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#f0f0fa] tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            10 métricas que
            <br />
            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", color: "#ff6b35" }}>
              cuentan la historia real
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {INDICATORS.map((ind, i) => (
            <motion.div
              key={ind.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-[#1a1a2e] bg-[#0b0b14] hover:border-[#252535] hover:bg-[#0d0d18] transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${ind.accent}12`, border: `1px solid ${ind.accent}25` }}>
                <ind.icon style={{ color: ind.accent, width: 16, height: 16 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold text-[#e2e2eb] group-hover:text-white transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {ind.name}
                </div>
                <div className="text-xs text-[#6a6a8a] mt-0.5" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {ind.desc}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#2a2a3e] group-hover:text-[#6a6a8a] group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HandWritten circle SVG ───────────────────────────────────────────────────

function HandWrittenCircle({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  return (
    <span ref={ref} className="relative inline-block">
      <span
        className="relative z-10"
        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
      >
        {children}
      </span>
      <motion.svg
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "-8%",
          width: "116%",
          height: "140%",
          overflow: "visible",
        }}
        viewBox="0 0 320 90"
        fill="none"
        preserveAspectRatio="none"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <motion.path
          d="M 290 18 C 340 45, 295 78, 160 80 C 55 80, 18 60, 18 45 C 18 20, 65 10, 160 10 C 240 10, 285 22, 290 30"
          stroke="#ff6b35"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: {
              pathLength: 1,
              opacity: 1,
              transition: {
                pathLength: { duration: 2.5, ease: "easeInOut" as const },
                opacity: { duration: 0.3 },
              },
            },
          }}
        />
      </motion.svg>
    </span>
  );
}

// ─── Liquid Glass Button ──────────────────────────────────────────────────────

function LiquidGlassButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="glass-filter-cta" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.035" numOctaves="1" seed="3" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="55" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>

      <Link href={href}>
        <button
          className="relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full text-base font-semibold font-mono text-[#f0f0fa] cursor-pointer hover:scale-[1.04] transition-transform duration-300 group"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              "0 0 8px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.1), inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09), inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85), inset 1px 1px 1px -0.5px rgba(255,255,255,0.6), inset -1px -1px 1px -0.5px rgba(255,255,255,0.6), inset 0 0 6px 6px rgba(255,255,255,0.12), inset 0 0 2px 2px rgba(255,255,255,0.06), 0 0 50px rgba(255,107,53,0.15), 0 0 100px rgba(79,142,247,0.08)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full overflow-hidden -z-10"
            style={{ backdropFilter: 'blur(16px) url("#glass-filter-cta")' }}
          />
          {children}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </Link>
    </>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section className="relative py-40 px-4 md:px-8 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-[#ff6b35] opacity-[0.05] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full bg-[#4f8ef7] opacity-[0.04] blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1a1a2e] to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs text-[#6a6a8a] tracking-[0.2em] uppercase mb-6"
        >
          Hackathon ULACIT × Databricks 2026
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-[#f0f0fa] mb-8 leading-tight tracking-tight"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Los datos están.
          <br />
          <HandWrittenCircle>Empezá hoy.</HandWrittenCircle>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[#8585a8] text-base md:text-lg mb-14 max-w-md mx-auto leading-relaxed"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          Explorá 45,801 registros históricos de América Latina con IA integrada.
          Sin configuración. Ahora.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col items-center gap-4"
        >
          <LiquidGlassButton href="/dashboard">
            Abrir el dashboard
          </LiquidGlassButton>
          <span className="text-[11px] font-mono text-[#3a3a4e]">
            Datos oficiales CEPAL · Tecnología Databricks
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#1a1a2e] py-10 px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="LatamStat" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-sm font-bold text-[#f0f0fa]">
            Latam<span className="text-[#ff6b35]">Stat</span>
          </span>
        </div>
        <p className="text-[11px] font-mono text-[#3a3a4e] text-center">
          Hackathon ULACIT × Databricks · Datos: CEPALSTAT · Infraestructura: Databricks
        </p>
        <Link href="/dashboard">
          <span className="text-xs font-mono text-[#6a6a8a] hover:text-[#e2e2eb] transition-colors">
            Ir al dashboard →
          </span>
        </Link>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useScrollTop();

  return (
    <main className="bg-[#09090f] min-h-screen overflow-x-hidden">
      <Nav />
      <AnimatedHero />
      <div className="py-6 space-y-3">
        <Marquee />
        <Marquee reverse />
      </div>
      <GlobeSection />
      <StatsSection />
      <FeaturesSection />
      <IndicatorsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
