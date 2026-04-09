"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Minus,
  TrendingUp, Send, X, Maximize2, ChevronDown, RotateCcw,
  BarChart2, Brain, Sparkles,
} from "lucide-react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIData {
  indicator: string;
  year: number;
  median: { value: string; raw: number };
  yoy: string | null;
  top: { country: string; value: string };
  bottom: { country: string; value: string };
  count: number;
}

interface TimeseriesData {
  data: Record<string, number>[];
  countries: string[];
  indicator: string;
}

interface QuickMessage { role: "user" | "assistant"; content: string }

interface FullMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INDICATORS = [
  { name: "Annual CPI growth rate",        label: "Inflación (IPC)",          category: "Inflation" },
  { name: "Population in poverty (national)", label: "Pobreza",                category: "Poverty" },
  { name: "Gini index",                    label: "Desigualdad (Gini)",       category: "Inequality" },
  { name: "Unemployment rate",             label: "Desempleo",                category: "Labor" },
  { name: "GDP per capita (PPP)",          label: "PIB per cápita",           category: "Economy" },
  { name: "Public debt as % of GDP",       label: "Deuda pública",            category: "Fiscal" },
  { name: "Life expectancy at birth",      label: "Esperanza de vida",        category: "Health" },
  { name: "Infant mortality rate",         label: "Mortalidad infantil",      category: "Health" },
  { name: "Literacy rate (15+ years)",     label: "Alfabetización",           category: "Education" },
  { name: "Net foreign direct investment", label: "Inversión extranjera",     category: "Economy" },
];

const ALL_COUNTRIES = [
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Dominican Republic", "Ecuador",
  "El Salvador", "Guatemala", "Haiti", "Honduras", "Mexico",
  "Nicaragua", "Panama", "Paraguay", "Peru", "Uruguay", "Venezuela",
];

const CHART_COLORS = ["#ff6b35", "#4f8ef7", "#c0c1ff", "#34d399", "#f472b6", "#fbbf24", "#a78bfa"];

const QUICK_SUGGESTIONS = [
  "¿Qué país tiene más desigualdad hoy?",
  "Tendencia de pobreza en Argentina",
  "Comparar inflación LATAM 2023",
  "Resumen ejecutivo de la región",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return clsx(...classes);
}


// ─── Chart tooltip ────────────────────────────────────────────────────────────

function DarkTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0e0e18] border border-[#252535] rounded-xl px-4 py-3 shadow-xl text-xs font-mono">
      <p className="text-[#8585a8] mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold text-[#f0f0fa]">{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, subLabel, subValue, accent, trend, loading,
}: {
  label: string; value: string; subLabel: string; subValue: string;
  accent: string; trend?: string | null; loading?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const trendNum = trend ? parseFloat(trend) : null;

  return (
    <div
      className="relative rounded-2xl border border-[#1a1a2e] bg-[#0b0b14] p-5 overflow-hidden transition-all duration-300 cursor-default"
      style={{ borderColor: hovered ? "#252535" : "#1a1a2e" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top border glow */}
      <div
        className="absolute top-0 left-[15%] right-[15%] h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, transparent, ${accent}80, transparent)`,
          opacity: hovered ? 1 : 0.4,
        }}
      />
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-400"
        style={{
          background: `radial-gradient(300px circle at 50% 0%, ${accent}0d, transparent 60%)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-2.5 bg-[#1a1a2e] rounded w-2/3" />
          <div className="h-8 bg-[#1a1a2e] rounded w-1/2" />
          <div className="h-2 bg-[#1a1a2e] rounded w-full" />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold text-[#6a6a8a] tracking-widest uppercase">{label}</span>
            {trendNum !== null && (
              <span className={cn(
                "flex items-center gap-0.5 text-[10px] font-mono font-bold",
                trendNum > 0 ? "text-[#f87171]" : trendNum < 0 ? "text-[#34d399]" : "text-[#6a6a8a]"
              )}>
                {trendNum > 0 ? <ArrowUpRight className="w-3 h-3" /> : trendNum < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {trendNum > 0 ? "+" : ""}{trendNum.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: accent }}>{value}</div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#6a6a8a]">{subLabel}</span>
            <span className="text-[10px] font-mono font-semibold text-[#8585a8]">{subValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Quick AI Panel ───────────────────────────────────────────────────────────

function QuickAIPanel({
  onOpenFull,
  indicator,
}: {
  onOpenFull: () => void;
  indicator: string;
}) {
  const [messages, setMessages] = useState<QuickMessage[]>([
    { role: "assistant", content: "Hola! Soy tu asistente de análisis. Haceme preguntas cortas sobre los datos de LATAM." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: QuickMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json() as { response: string };
      setMessages([...updated, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  return (
    <aside className="w-[280px] flex-shrink-0 h-full bg-[#0b0b14] border-l border-[#1a1a2e] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.15)" }}>
            <Brain className="w-3.5 h-3.5 text-[#ff6b35]" />
          </div>
          <span className="text-xs font-mono font-bold text-[#f0f0fa] tracking-wide">Asistente rápido</span>
        </div>
        <button
          onClick={onOpenFull}
          className="flex items-center gap-1 text-[10px] font-mono text-[#4f8ef7] hover:text-[#7aabff] transition-colors px-2 py-1 rounded-lg border border-[#4f8ef7]/20 hover:border-[#4f8ef7]/40"
        >
          <Maximize2 className="w-3 h-3" />
          Chat completo
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[92%] text-[11px] leading-relaxed rounded-xl px-3 py-2 font-mono",
                msg.role === "user"
                  ? "bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#f0f0fa]"
                  : "bg-[#1a1a2e] border border-[#252535] text-[#e2e2eb]"
              )}
            >
              {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={j}>{part.slice(2, -2)}</strong>
                  : <span key={j}>{part}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#252535] px-3 py-2 rounded-xl">
              <span className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-[#8585a8] animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 space-y-1.5">
          <span className="text-[9px] font-mono text-[#464554] uppercase tracking-widest">Sugerencias</span>
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="w-full text-left text-[10px] font-mono text-[#6a6a8a] hover:text-[#e2e2eb] border border-[#1a1a2e] hover:border-[#252535] bg-transparent hover:bg-[#0e0e18] px-3 py-2 rounded-lg transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#1a1a2e]">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Pregunta rápida..."
            rows={2}
            className="flex-1 bg-[#0e0e18] border border-[#1a1a2e] focus:border-[#ff6b35]/50 rounded-xl px-3 py-2 text-[11px] font-mono text-[#e2e2eb] placeholder:text-[#464554] resize-none focus:outline-none transition-colors"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-[#ff6b35] disabled:opacity-30 hover:bg-[#e55a2b] transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Full Chat Modal ───────────────────────────────────────────────────────────

function FullChatModal({
  onClose,
  context,
}: {
  onClose: () => void;
  context: { indicator: string; countries: string[]; yearFrom: number; yearTo: number };
}) {
  const [messages, setMessages] = useState<FullMessage[]>([
    {
      role: "assistant",
      content: `Hola, Ana. Tengo acceso completo a los datos de CEPALSTAT para toda la región. Podés pedirme análisis profundos, comparativas entre países, tendencias históricas o recomendaciones de política para **${INDICATORS.find(i => i.name === context.indicator)?.label ?? context.indicator}**. También puedo generar gráficos automáticamente.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: FullMessage = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      const data = await res.json() as { response: string };
      setMessages([...updated, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([...updated, { role: "assistant", content: "Error de conexión. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, context]);

  const FULL_SUGGESTIONS = [
    `Análisis completo de ${INDICATORS.find(i => i.name === context.indicator)?.label} en LATAM`,
    "Comparar los 5 países con mejor y peor desempeño en 2023",
    "¿Qué países necesitan intervención urgente de política pública?",
    "Tendencia regional de los últimos 10 años con proyección",
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl h-[85vh] bg-[#09090f] border border-[#1a1a2e] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ boxShadow: "0 0 80px rgba(79,142,247,0.1), 0 0 160px rgba(255,107,53,0.05)" }}
      >
        {/* Top border glow */}
        <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#4f8ef7]/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a2e] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ff6b35, #d9541e)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono text-[#f0f0fa]">Análisis IA completo</p>
              <p className="text-[10px] font-mono text-[#6a6a8a]">
                {INDICATORS.find(i => i.name === context.indicator)?.label} · {context.countries.slice(0, 3).join(", ")}{context.countries.length > 3 ? ` +${context.countries.length - 3}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#1a1a2e] hover:border-[#252535] text-[#6a6a8a] hover:text-[#e2e2eb] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%]", msg.role === "user" ? "" : "w-full")}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.15)" }}>
                      <Sparkles className="w-3 h-3 text-[#ff6b35]" />
                    </div>
                    <span className="text-[10px] font-mono text-[#ff6b35] font-semibold uppercase tracking-widest">LatamStat AI</span>
                  </div>
                )}
                <div
                  className={cn(
                    "text-sm leading-relaxed rounded-2xl px-4 py-3 font-mono",
                    msg.role === "user"
                      ? "bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#f0f0fa]"
                      : "bg-[#0e0e18] border border-[#1a1a2e] text-[#e2e2eb] whitespace-pre-wrap"
                  )}
                >
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={j}>{part.slice(2, -2)}</strong>
                      : <span key={j}>{part}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,107,53,0.15)" }}>
                  <Sparkles className="w-3 h-3 text-[#ff6b35]" />
                </div>
                <div className="bg-[#0e0e18] border border-[#1a1a2e] px-4 py-3 rounded-2xl flex gap-1.5">
                  {[0, 200, 400].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#ff6b35] animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (first message only) */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 grid grid-cols-2 gap-2">
            {FULL_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-[11px] font-mono text-[#6a6a8a] hover:text-[#e2e2eb] border border-[#1a1a2e] hover:border-[#252535] hover:bg-[#0e0e18] px-3 py-2.5 rounded-xl transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-6 pt-3 border-t border-[#1a1a2e] flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Pedí un análisis profundo, comparación de países, recomendaciones de política..."
              rows={3}
              className="flex-1 bg-[#0e0e18] border border-[#1a1a2e] focus:border-[#ff6b35]/50 rounded-2xl px-4 py-3 text-sm font-mono text-[#e2e2eb] placeholder:text-[#3a3a4e] resize-none focus:outline-none transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-xl disabled:opacity-30 transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #ff6b35, #d9541e)", boxShadow: "0 4px 20px rgba(255,107,53,0.25)" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  indicator, setIndicator,
  countries, setCountries,
  yearFrom, setYearFrom,
  yearTo, setYearTo,
  availableCountries,
  countriesLoading,
}: {
  indicator: string; setIndicator: (v: string) => void;
  countries: string[]; setCountries: (v: string[]) => void;
  yearFrom: number; setYearFrom: (v: number) => void;
  yearTo: number; setYearTo: (v: number) => void;
  availableCountries: string[];
  countriesLoading: boolean;
}) {
  const toggleCountry = (c: string) => {
    setCountries(countries.includes(c) ? countries.filter((x) => x !== c) : [...countries, c]);
  };

  return (
    <aside className="w-[220px] flex-shrink-0 h-full bg-[#0b0b14] border-r border-[#1a1a2e] flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1a2e]">
        <Link href="/landing" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0"
          >
            <img src="/logo.png" alt="LatamStat" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-sm font-bold text-[#f0f0fa]">
            Latam<span className="text-[#ff6b35]">Stat</span>
          </span>
        </Link>
        <p className="text-[9px] font-mono text-[#3a3a4e] mt-1.5 uppercase tracking-widest">ULACIT × Databricks</p>
      </div>

      {/* Indicator selector */}
      <div className="px-4 py-4 border-b border-[#1a1a2e]">
        <p className="text-[9px] font-mono text-[#464554] uppercase tracking-widest mb-3">Indicador</p>
        <div className="space-y-1">
          {INDICATORS.map((ind) => (
            <button
              key={ind.name}
              onClick={() => setIndicator(ind.name)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono transition-all",
                indicator === ind.name
                  ? "bg-[#ff6b35]/10 border border-[#ff6b35]/30 text-[#ff6b35] font-semibold"
                  : "text-[#6a6a8a] hover:text-[#e2e2eb] hover:bg-[#0e0e18]"
              )}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Year range */}
      <div className="px-4 py-4 border-b border-[#1a1a2e]">
        <p className="text-[9px] font-mono text-[#464554] uppercase tracking-widest mb-3">Período</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
            className="w-full bg-[#0e0e18] border border-[#1a1a2e] rounded-lg px-2 py-1.5 text-[11px] font-mono text-[#e2e2eb] focus:outline-none focus:border-[#ff6b35]/40"
          />
          <span className="text-[#464554] text-xs font-mono">—</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
            className="w-full bg-[#0e0e18] border border-[#1a1a2e] rounded-lg px-2 py-1.5 text-[11px] font-mono text-[#e2e2eb] focus:outline-none focus:border-[#ff6b35]/40"
          />
        </div>
      </div>

      {/* Country selector */}
      <div className="px-4 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-mono text-[#464554] uppercase tracking-widest">Países</p>
          <button
            onClick={() => setCountries(
              countries.length === availableCountries.length
                ? availableCountries.slice(0, 5)
                : availableCountries
            )}
            className="text-[9px] font-mono text-[#4f8ef7] hover:text-[#7aabff] transition-colors"
          >
            {countries.length === availableCountries.length ? "Reset" : "Todos"}
          </button>
        </div>
        {countriesLoading ? (
          <div className="py-4 text-center">
            <div className="text-[9px] font-mono text-[#464554]">Cargando países...</div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {availableCountries.map((c) => (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all",
                  countries.includes(c) ? "text-[#e2e2eb]" : "text-[#464554] hover:text-[#6a6a8a]"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm border flex-shrink-0 transition-colors"
                  style={{
                    borderColor: countries.includes(c) ? "#ff6b35" : "#2a2a3e",
                    background: countries.includes(c) ? "#ff6b35" : "transparent",
                  }}
                />
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [indicator, setIndicator] = useState("Annual CPI growth rate");
  const [countries, setCountries] = useState(["Brazil", "Mexico", "Chile", "Colombia"]);
  const [availableCountries, setAvailableCountries] = useState<string[]>(ALL_COUNTRIES);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [yearFrom, setYearFrom] = useState(2000);
  const [yearTo, setYearTo] = useState(2024);

  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [tsData, setTsData] = useState<TimeseriesData | null>(null);
  const [tsLoading, setTsLoading] = useState(true);

  const [fullChatOpen, setFullChatOpen] = useState(false);

  const indicatorLabel = INDICATORS.find(i => i.name === indicator)?.label ?? indicator;

  // Fetch KPIs when indicator changes
  useEffect(() => {
    setKpiLoading(true);
    fetch(`/api/data/kpis?indicator=${encodeURIComponent(indicator)}`)
      .then(r => r.json())
      .then((d: KPIData) => { setKpiData(d); setKpiLoading(false); })
      .catch(() => setKpiLoading(false));
  }, [indicator]);

  // Fetch available countries when indicator changes
  useEffect(() => {
    setCountriesLoading(true);
    fetch(`/api/data/countries?indicator=${encodeURIComponent(indicator)}`)
      .then((r) => r.json())
      .then((d: { countries: string[] }) => {
        const available = d.countries ?? ALL_COUNTRIES;
        setAvailableCountries(available);
        // Keep selected countries that exist in new indicator, fallback to first 5
        setCountries((prev) => {
          const valid = prev.filter((c) => available.includes(c));
          return valid.length > 0 ? valid : available.slice(0, 5);
        });
        setCountriesLoading(false);
      })
      .catch(() => {
        setAvailableCountries(ALL_COUNTRIES);
        setCountriesLoading(false);
      });
  }, [indicator]);

  // Fetch timeseries when filters change (debounced)
  useEffect(() => {
    if (!countries.length) return;
    const timer = setTimeout(() => {
      setTsLoading(true);
      const params = new URLSearchParams({
        indicator,
        countries: countries.join(","),
        yearFrom: String(yearFrom),
        yearTo: String(yearTo),
      });
      fetch(`/api/data/timeseries?${params}`)
        .then(r => r.json())
        .then((d: TimeseriesData) => { setTsData(d); setTsLoading(false); })
        .catch(() => setTsLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [indicator, countries, yearFrom, yearTo]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#09090f", fontFamily: "'Sora', sans-serif" }}>
      <Sidebar
        indicator={indicator} setIndicator={setIndicator}
        countries={countries} setCountries={setCountries}
        yearFrom={yearFrom} setYearFrom={setYearFrom}
        yearTo={yearTo} setYearTo={setYearTo}
        availableCountries={availableCountries}
        countriesLoading={countriesLoading}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#1a1a2e]">
          <div>
            <h1 className="text-sm font-bold text-[#f0f0fa] tracking-tight">{indicatorLabel}</h1>
            <p className="text-[10px] font-mono text-[#6a6a8a]">
              {countries.length} países · {yearFrom}–{yearTo} · Datos CEPALSTAT
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIndicator("Annual CPI growth rate"); setCountries(["Argentina", "Brazil", "Mexico", "Chile", "Colombia"]); setYearFrom(2000); setYearTo(2024); }}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[#6a6a8a] hover:text-[#e2e2eb] border border-[#1a1a2e] hover:border-[#252535] px-3 py-1.5 rounded-lg transition-all"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={() => setFullChatOpen(true)}
              className="flex items-center gap-2 text-xs font-mono font-semibold px-4 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #ff6b35, #d9541e)", color: "white", boxShadow: "0 2px 16px rgba(255,107,53,0.25)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Análisis completo
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <KPICard
              label="Mediana regional"
              value={kpiData?.median?.value ?? "—"}
              subLabel={`Año ${kpiData?.year ?? "…"}`}
              subValue={`${kpiData?.count ?? "—"} países`}
              accent="#ff6b35"
              trend={kpiData?.yoy}
              loading={kpiLoading}
            />
            <KPICard
              label="Año de referencia"
              value={kpiData?.year != null ? String(kpiData.year) : "—"}
              subLabel="Último dato disponible"
              subValue={indicatorLabel}
              accent="#4f8ef7"
              loading={kpiLoading}
            />
            <KPICard
              label="Valor más alto"
              value={kpiData?.top?.value ?? "—"}
              subLabel="País"
              subValue={kpiData?.top?.country ?? "—"}
              accent="#f87171"
              loading={kpiLoading}
            />
            <KPICard
              label="Valor más bajo"
              value={kpiData?.bottom?.value ?? "—"}
              subLabel="País"
              subValue={kpiData?.bottom?.country ?? "—"}
              accent="#34d399"
              loading={kpiLoading}
            />
          </div>

          {/* Time Series Chart */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0b0b14] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-bold text-[#f0f0fa]">Evolución histórica</p>
                <p className="text-[10px] font-mono text-[#6a6a8a] mt-0.5">{indicatorLabel} · {yearFrom}–{yearTo}</p>
              </div>
              <BarChart2 className="w-4 h-4 text-[#464554]" />
            </div>

            {tsLoading ? (
              <div className="h-[280px] flex items-center justify-center">
                <div className="space-y-2 w-full px-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-2 bg-[#1a1a2e] rounded animate-pulse" style={{ width: `${60 + i * 10}%` }} />
                  ))}
                </div>
              </div>
            ) : tsData?.data?.length ? (() => {
              const allValues: number[] = [];
              for (const row of tsData.data) {
                for (const country of tsData.countries) {
                  const v = row[country];
                  if (typeof v === "number" && !isNaN(v)) allValues.push(v);
                }
              }
              const minVal = Math.min(...allValues);
              const maxVal = Math.max(...allValues);
              const padding = (maxVal - minVal) * 0.15 || maxVal * 0.05;
              const yDomain: [number, number] = [
                parseFloat((Math.max(0, minVal - padding)).toFixed(3)),
                parseFloat((maxVal + padding).toFixed(3)),
              ];
              return (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={tsData.data} margin={{ top: 4, right: 20, left: -10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: "#6a6a8a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      tickLine={false}
                      axisLine={{ stroke: "#1a1a2e" }}
                    />
                    <YAxis
                      domain={yDomain}
                      tick={{ fill: "#6a6a8a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                      tickLine={false}
                      axisLine={{ stroke: "#1a1a2e" }}
                    />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#8585a8", paddingTop: 8 }}
                    />
                    {tsData.countries.map((country, i) => (
                      <Line
                        key={country}
                        type="monotone"
                        dataKey={country}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart2 className="w-8 h-8 text-[#1a1a2e] mx-auto mb-2" />
                  <p className="text-xs font-mono text-[#464554]">Sin datos para estos filtros</p>
                  <p className="text-[10px] font-mono text-[#2a2a3e] mt-1">Ajustá el período o los países</p>
                </div>
              </div>
            )}
          </div>

          {/* Summary tables */}
          {tsData?.data && tsData.data.length > 0 && (() => {
            const tableData = tsData.countries.map((country, i) => {
              const points = tsData.data
                .filter(row => typeof row[country] === "number" && !isNaN(row[country] as number))
                .map(row => ({ year: Number(row.year), value: row[country] as number }));
              if (points.length === 0) return null;
              const avg = points.reduce((s, p) => s + p.value, 0) / points.length;
              const minP = points.reduce((a, b) => b.value < a.value ? b : a);
              const maxP = points.reduce((a, b) => b.value > a.value ? b : a);
              return { country, color: CHART_COLORS[i % CHART_COLORS.length], avg, minP, maxP };
            }).filter((d): d is NonNullable<typeof d> => d !== null);

            if (tableData.length === 0) return null;

            const fmt = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);

            const tableClass = "rounded-2xl border border-[#1a1a2e] bg-[#0b0b14] p-5 flex-1 min-w-0";
            const thClass = "text-left text-[9px] font-mono text-[#464554] uppercase tracking-widest pb-2 border-b border-[#1a1a2e]";
            const tdClass = "py-2 text-[11px] font-mono border-b border-[#111120]";

            return (
              <div className="flex gap-3 flex-col md:flex-row">
                {/* Tabla 1: Promedio */}
                <div className={tableClass}>
                  <p className="text-sm font-bold text-[#f0f0fa] mb-1">Promedio del período</p>
                  <p className="text-[10px] font-mono text-[#6a6a8a] mb-4">{indicatorLabel} · {yearFrom}–{yearTo}</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thClass}>País</th>
                        <th className={`${thClass} text-right`}>Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tableData].sort((a, b) => b.avg - a.avg).map(d => (
                        <tr key={d.country}>
                          <td className={tdClass}>
                            <span className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ background: d.color }} />
                            <span className="text-[#c0c0d0]">{d.country}</span>
                          </td>
                          <td className={`${tdClass} text-right font-bold`} style={{ color: d.color }}>{fmt(d.avg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tabla 2: Año mínimo */}
                <div className={tableClass}>
                  <p className="text-sm font-bold text-[#f0f0fa] mb-1">Año más bajo</p>
                  <p className="text-[10px] font-mono text-[#6a6a8a] mb-4">{indicatorLabel} · valor mínimo registrado</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thClass}>País</th>
                        <th className={`${thClass} text-right`}>Año</th>
                        <th className={`${thClass} text-right`}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tableData].sort((a, b) => a.minP.value - b.minP.value).map(d => (
                        <tr key={d.country}>
                          <td className={tdClass}>
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: d.color }} />
                            <span className="text-[#c0c0d0]">{d.country}</span>
                          </td>
                          <td className={`${tdClass} text-right text-[#34d399]`}>{d.minP.year}</td>
                          <td className={`${tdClass} text-right font-bold text-[#34d399]`}>{fmt(d.minP.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tabla 3: Año máximo */}
                <div className={tableClass}>
                  <p className="text-sm font-bold text-[#f0f0fa] mb-1">Año más alto</p>
                  <p className="text-[10px] font-mono text-[#6a6a8a] mb-4">{indicatorLabel} · valor máximo registrado</p>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className={thClass}>País</th>
                        <th className={`${thClass} text-right`}>Año</th>
                        <th className={`${thClass} text-right`}>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...tableData].sort((a, b) => b.maxP.value - a.maxP.value).map(d => (
                        <tr key={d.country}>
                          <td className={tdClass}>
                            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: d.color }} />
                            <span className="text-[#c0c0d0]">{d.country}</span>
                          </td>
                          <td className={`${tdClass} text-right text-[#f87171]`}>{d.maxP.year}</td>
                          <td className={`${tdClass} text-right font-bold text-[#f87171]`}>{fmt(d.maxP.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-[10px] font-mono text-[#2a2a3e]">
              Fuente: CEPALSTAT · {kpiData?.count ?? "—"} países disponibles · Hackathon ULACIT × Databricks
            </p>
            <Link href="/landing">
              <span className="text-[10px] font-mono text-[#464554] hover:text-[#8585a8] transition-colors flex items-center gap-1">
                ← Inicio
              </span>
            </Link>
          </div>
        </main>
      </div>

      {/* Quick AI Panel */}
      <QuickAIPanel
        onOpenFull={() => setFullChatOpen(true)}
        indicator={indicator}
      />

      {/* Full Chat Modal */}
      <AnimatePresence>
        {fullChatOpen && (
          <FullChatModal
            onClose={() => setFullChatOpen(false)}
            context={{ indicator, countries, yearFrom, yearTo }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
