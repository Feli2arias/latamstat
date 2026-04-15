"use client";

import { useEffect, useRef, useState, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  ArrowUpRight, ArrowDownRight, Minus,
  Send, X, Maximize2, RotateCcw,
  BarChart2, Brain, Sparkles, Sun, Moon,
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
interface FullMessage { role: "user" | "assistant"; content: string }

// ─── Theme ────────────────────────────────────────────────────────────────────

interface Theme {
  id: "dark" | "accessible";
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderMid: string;
  borderFaint: string;
  text: string;
  textSub: string;
  textMuted: string;
  textDim: string;
  textFaint: string;
  textTiny: string;
  textInvisible: string;
  accent: string;
  accentHover: string;
  accentDark: string;
  accentBg: string;
  accentBgMed: string;
  accentBorder: string;
  accentBorderMid: string;
  blue: string;
  blueHover: string;
  green: string;
  red: string;
  kpiAccents: [string, string, string, string];
  chartColors: string[];
  modalShadow: string;
}

const DARK_THEME: Theme = {
  id: "dark",
  bg: "#09090f",
  surface: "#0b0b14",
  surfaceAlt: "#0e0e18",
  border: "#1a1a2e",
  borderMid: "#252535",
  borderFaint: "#111120",
  text: "#f0f0fa",
  textSub: "#e2e2eb",
  textMuted: "#8585a8",
  textDim: "#6a6a8a",
  textFaint: "#464554",
  textTiny: "#3a3a4e",
  textInvisible: "#2a2a3e",
  accent: "#ff6b35",
  accentHover: "#e55a2b",
  accentDark: "#d9541e",
  accentBg: "rgba(255,107,53,0.10)",
  accentBgMed: "rgba(255,107,53,0.15)",
  accentBorder: "rgba(255,107,53,0.20)",
  accentBorderMid: "rgba(255,107,53,0.30)",
  blue: "#4f8ef7",
  blueHover: "#7aabff",
  green: "#34d399",
  red: "#f87171",
  kpiAccents: ["#ff6b35", "#4f8ef7", "#f87171", "#34d399"],
  chartColors: ["#ff6b35", "#4f8ef7", "#c0c1ff", "#34d399", "#f472b6", "#fbbf24", "#a78bfa"],
  modalShadow: "0 0 80px rgba(79,142,247,0.1), 0 0 160px rgba(255,107,53,0.05)",
};

// Wong (2011) colorblind-safe palette — works for deuteranopia, protanopia, tritanopia
const ACCESSIBLE_THEME: Theme = {
  id: "accessible",
  bg: "#f4f7fb",
  surface: "#ffffff",
  surfaceAlt: "#edf1f7",
  border: "#dce3ed",
  borderMid: "#b8c4d2",
  borderFaint: "#e8edf4",
  text: "#0f172a",
  textSub: "#1e293b",
  textMuted: "#475569",
  textDim: "#64748b",
  textFaint: "#94a3b8",
  textTiny: "#b8c4d2",
  textInvisible: "#dce3ed",
  accent: "#0061c8",
  accentHover: "#004d9e",
  accentDark: "#003d7a",
  accentBg: "rgba(0,97,200,0.08)",
  accentBgMed: "rgba(0,97,200,0.12)",
  accentBorder: "rgba(0,97,200,0.20)",
  accentBorderMid: "rgba(0,97,200,0.30)",
  blue: "#0061c8",
  blueHover: "#004d9e",
  green: "#007a5e",
  red: "#b54708",
  kpiAccents: ["#0072B2", "#E69F00", "#009E73", "#D55E00"],
  chartColors: ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442"],
  modalShadow: "0 0 40px rgba(0,97,200,0.10), 0 4px 24px rgba(0,0,0,0.08)",
};

const ThemeContext = createContext<Theme>(DARK_THEME);
const useTheme = () => useContext(ThemeContext);

// ─── Constants ───────────────────────────────────────────────────────────────

const INDICATORS = [
  { name: "Annual CPI growth rate",           label: "Inflación (IPC)",      category: "Inflation"  },
  { name: "Population in poverty (national)", label: "Pobreza",              category: "Poverty"    },
  { name: "Gini index",                       label: "Desigualdad (Gini)",   category: "Inequality" },
  { name: "Unemployment rate",                label: "Desempleo",            category: "Labor"      },
  { name: "GDP per capita (PPP)",             label: "PIB per cápita",       category: "Economy"    },
  { name: "Public debt as % of GDP",          label: "Deuda pública",        category: "Fiscal"     },
  { name: "Life expectancy at birth",         label: "Esperanza de vida",    category: "Health"     },
  { name: "Infant mortality rate",            label: "Mortalidad infantil",  category: "Health"     },
  { name: "Literacy rate (15+ years)",        label: "Alfabetización",       category: "Education"  },
  { name: "Net foreign direct investment",    label: "Inversión extranjera", category: "Economy"    },
];

const ALL_COUNTRIES = [
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Dominican Republic", "Ecuador",
  "El Salvador", "Guatemala", "Haiti", "Honduras", "Mexico",
  "Nicaragua", "Panama", "Paraguay", "Peru", "Uruguay", "Venezuela",
];

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

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  const t = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl text-xs font-mono"
      style={{ background: t.surfaceAlt, border: `1px solid ${t.borderMid}` }}
    >
      <p className="mb-2" style={{ color: t.textMuted }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold" style={{ color: t.text }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
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
  const t = useTheme();
  const [hovered, setHovered] = useState(false);
  const trendNum = trend ? parseFloat(trend) : null;

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 cursor-default"
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? t.borderMid : t.border}`,
      }}
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
          <div className="h-2.5 rounded w-2/3" style={{ background: t.border }} />
          <div className="h-8 rounded w-1/2" style={{ background: t.border }} />
          <div className="h-2 rounded w-full" style={{ background: t.border }} />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <span
              className="text-[10px] font-mono font-semibold tracking-widest uppercase"
              style={{ color: t.textDim }}
            >
              {label}
            </span>
            {trendNum !== null && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-mono font-bold"
                style={{ color: trendNum > 0 ? t.red : trendNum < 0 ? t.green : t.textDim }}
              >
                {trendNum > 0 ? <ArrowUpRight className="w-3 h-3" /> : trendNum < 0 ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {trendNum > 0 ? "+" : ""}{trendNum.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: accent }}>{value}</div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono" style={{ color: t.textDim }}>{subLabel}</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: t.textMuted }}>{subValue}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quick AI Panel ───────────────────────────────────────────────────────────

function QuickAIPanel({ onOpenFull, indicator }: { onOpenFull: () => void; indicator: string }) {
  const t = useTheme();
  const [messages, setMessages] = useState<QuickMessage[]>([
    { role: "assistant", content: "Hola! Soy tu asistente de análisis. Haceme preguntas cortas sobre los datos de LATAM." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    <aside
      className="w-[280px] flex-shrink-0 h-full flex flex-col"
      style={{ background: t.surface, borderLeft: `1px solid ${t.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: t.accentBgMed }}
          >
            <Brain className="w-3.5 h-3.5" style={{ color: t.accent }} />
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: t.text }}>Asistente rápido</span>
        </div>
        <button
          onClick={onOpenFull}
          className="flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg transition-colors"
          style={{
            color: t.blue,
            border: `1px solid ${t.blue}33`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = t.blueHover; e.currentTarget.style.borderColor = `${t.blue}66`; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = t.blue; e.currentTarget.style.borderColor = `${t.blue}33`; }}
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
              className="max-w-[92%] text-[11px] leading-relaxed rounded-xl px-3 py-2 font-mono"
              style={
                msg.role === "user"
                  ? { background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.text }
                  : { background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub }
              }
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
            <div
              className="px-3 py-2 rounded-xl"
              style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}
            >
              <span className="flex gap-1.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: t.textMuted, animationDelay: `${d}ms` }}
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
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.textFaint }}>
            Sugerencias
          </span>
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="w-full text-left text-[10px] font-mono px-3 py-2 rounded-lg transition-all"
              style={{ color: t.textDim, border: `1px solid ${t.border}`, background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = t.textSub;
                e.currentTarget.style.borderColor = t.borderMid;
                e.currentTarget.style.background = t.surfaceAlt;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = t.textDim;
                e.currentTarget.style.borderColor = t.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Pregunta rápida..."
            rows={2}
            className="flex-1 rounded-xl px-3 py-2 text-[11px] font-mono resize-none focus:outline-none transition-colors"
            style={{
              background: t.surfaceAlt,
              border: `1px solid ${t.border}`,
              color: t.textSub,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${t.accent}80`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl disabled:opacity-30 transition-colors shrink-0"
            style={{ background: t.accent }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.accentHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = t.accent; }}
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
  onClose, context, messages, setMessages,
}: {
  onClose: () => void;
  context: { indicator: string; countries: string[]; yearFrom: number; yearTo: number };
  messages: FullMessage[];
  setMessages: React.Dispatch<React.SetStateAction<FullMessage[]>>;
}) {
  const t = useTheme();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
        className="relative w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          boxShadow: t.modalShadow,
        }}
      >
        {/* Top border glow */}
        <div
          className="absolute top-0 left-[20%] right-[20%] h-px"
          style={{ background: `linear-gradient(to right, transparent, ${t.blue}80, transparent)` }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})` }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold font-mono" style={{ color: t.text }}>Análisis IA completo</p>
              <p className="text-[10px] font-mono" style={{ color: t.textDim }}>
                {INDICATORS.find(i => i.name === context.indicator)?.label} · {context.countries.slice(0, 3).join(", ")}{context.countries.length > 3 ? ` +${context.countries.length - 3}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all"
            style={{ border: `1px solid ${t.border}`, color: t.textDim }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.borderMid; e.currentTarget.style.color = t.textSub; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textDim; }}
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
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ background: t.accentBgMed }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: t.accent }} />
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: t.accent }}>
                      LatamStat AI
                    </span>
                  </div>
                )}
                <div
                  className="text-sm leading-relaxed rounded-2xl px-4 py-3 font-mono"
                  style={
                    msg.role === "user"
                      ? { background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.text }
                      : { background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub, whiteSpace: "pre-wrap" }
                  }
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
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: t.accentBgMed }}>
                  <Sparkles className="w-3 h-3" style={{ color: t.accent }} />
                </div>
                <div className="px-4 py-3 rounded-2xl flex gap-1.5" style={{ background: t.surfaceAlt, border: `1px solid ${t.border}` }}>
                  {[0, 200, 400].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: t.accent, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 grid grid-cols-2 gap-2">
            {FULL_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-[11px] font-mono px-3 py-2.5 rounded-xl transition-all"
                style={{ color: t.textDim, border: `1px solid ${t.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.color = t.textSub; e.currentTarget.style.borderColor = t.borderMid; e.currentTarget.style.background = t.surfaceAlt; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.textDim; e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = "transparent"; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${t.border}` }}>
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Pedí un análisis profundo, comparación de países, recomendaciones de política..."
              rows={3}
              className="flex-1 rounded-2xl px-4 py-3 text-sm font-mono resize-none focus:outline-none transition-colors"
              style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${t.accent}80`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-xl disabled:opacity-30 transition-all hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                boxShadow: `0 4px 20px ${t.accentBg}`,
              }}
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
  const t = useTheme();

  const toggleCountry = (c: string) => {
    setCountries(countries.includes(c) ? countries.filter((x) => x !== c) : [...countries, c]);
  };

  return (
    <aside
      className="w-[220px] flex-shrink-0 h-full flex flex-col overflow-y-auto"
      style={{ background: t.surface, borderRight: `1px solid ${t.border}` }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${t.border}` }}>
        <Link href="/landing" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="LatamStat" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-sm font-bold" style={{ color: t.text }}>
            Latam<span style={{ color: t.accent }}>Stat</span>
          </span>
        </Link>
        <p className="text-[9px] font-mono mt-1.5 uppercase tracking-widest" style={{ color: t.textTiny }}>
          ULACIT × Databricks
        </p>
      </div>

      {/* Indicator selector */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: t.textFaint }}>
          Indicador
        </p>
        <div className="space-y-1">
          {INDICATORS.map((ind) => (
            <button
              key={ind.name}
              onClick={() => setIndicator(ind.name)}
              className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono transition-all"
              style={
                indicator === ind.name
                  ? { background: t.accentBg, border: `1px solid ${t.accentBorderMid}`, color: t.accent, fontWeight: 600 }
                  : { color: t.textDim, border: "1px solid transparent" }
              }
              onMouseEnter={(e) => {
                if (indicator !== ind.name) {
                  e.currentTarget.style.color = t.textSub;
                  e.currentTarget.style.background = t.surfaceAlt;
                }
              }}
              onMouseLeave={(e) => {
                if (indicator !== ind.name) {
                  e.currentTarget.style.color = t.textDim;
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Year range */}
      <div className="px-4 py-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <p className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: t.textFaint }}>
          Período
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
            className="w-full rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none transition-colors"
            style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${t.accent}60`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
          />
          <span className="text-xs font-mono" style={{ color: t.textFaint }}>—</span>
          <input
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
            className="w-full rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none transition-colors"
            style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, color: t.textSub }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${t.accent}60`; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
          />
        </div>
      </div>

      {/* Country selector */}
      <div className="px-4 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: t.textFaint }}>Países</p>
          <button
            onClick={() => setCountries(
              countries.length === availableCountries.length
                ? availableCountries.slice(0, 5)
                : availableCountries
            )}
            className="text-[9px] font-mono transition-colors"
            style={{ color: t.blue }}
            onMouseEnter={(e) => { e.currentTarget.style.color = t.blueHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = t.blue; }}
          >
            {countries.length === availableCountries.length ? "Reset" : "Todos"}
          </button>
        </div>
        {countriesLoading ? (
          <div className="py-4 text-center">
            <div className="text-[9px] font-mono" style={{ color: t.textFaint }}>Cargando países...</div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {availableCountries.map((c) => (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                style={{ color: countries.includes(c) ? t.textSub : t.textFaint }}
                onMouseEnter={(e) => { if (!countries.includes(c)) e.currentTarget.style.color = t.textDim; }}
                onMouseLeave={(e) => { if (!countries.includes(c)) e.currentTarget.style.color = t.textFaint; }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm border flex-shrink-0 transition-colors"
                  style={{
                    borderColor: countries.includes(c) ? t.accent : t.textInvisible,
                    background: countries.includes(c) ? t.accent : "transparent",
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

// ─── Theme Toggle Button ───────────────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const t = theme;
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
      style={{
        color: t.textDim,
        border: `1px solid ${t.border}`,
        background: t.surfaceAlt,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = t.textSub;
        e.currentTarget.style.borderColor = t.borderMid;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = t.textDim;
        e.currentTarget.style.borderColor = t.border;
      }}
      title={t.id === "dark" ? "Cambiar a modo accesible (daltónico)" : "Cambiar a modo oscuro"}
    >
      {t.id === "dark" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
      {t.id === "dark" ? "Accesible" : "Oscuro"}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [theme, setTheme] = useState<Theme>(DARK_THEME);
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
  const [fullChatMessages, setFullChatMessages] = useState<FullMessage[]>([
    {
      role: "assistant",
      content: "Hola, usuario. Tengo acceso completo a los datos de CEPALSTAT para toda la región. Podés pedirme análisis profundos, comparativas entre países, tendencias históricas o recomendaciones de política. También puedo generar gráficos automáticamente.",
    },
  ]);

  const t = theme;
  const indicatorLabel = INDICATORS.find(i => i.name === indicator)?.label ?? indicator;

  const toggleTheme = () => setTheme(prev => prev.id === "dark" ? ACCESSIBLE_THEME : DARK_THEME);

  useEffect(() => {
    setKpiLoading(true);
    fetch(`/api/data/kpis?indicator=${encodeURIComponent(indicator)}`)
      .then(r => r.json())
      .then((d: KPIData) => { setKpiData(d); setKpiLoading(false); })
      .catch(() => setKpiLoading(false));
  }, [indicator]);

  useEffect(() => {
    setCountriesLoading(true);
    fetch(`/api/data/countries?indicator=${encodeURIComponent(indicator)}`)
      .then((r) => r.json())
      .then((d: { countries: string[] }) => {
        const available = d.countries ?? ALL_COUNTRIES;
        setAvailableCountries(available);
        setCountries((prev) => {
          const valid = prev.filter((c) => available.includes(c));
          return valid.length > 0 ? valid : available.slice(0, 5);
        });
        setCountriesLoading(false);
      })
      .catch(() => { setAvailableCountries(ALL_COUNTRIES); setCountriesLoading(false); });
  }, [indicator]);

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
    <ThemeContext.Provider value={theme}>
      <div className="flex h-screen overflow-hidden" style={{ background: t.bg, fontFamily: "'Sora', sans-serif" }}>
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
          <header
            className="h-14 flex-shrink-0 flex items-center justify-between px-6"
            style={{ borderBottom: `1px solid ${t.border}` }}
          >
            <div>
              <h1 className="text-sm font-bold tracking-tight" style={{ color: t.text }}>{indicatorLabel}</h1>
              <p className="text-[10px] font-mono" style={{ color: t.textDim }}>
                {countries.length} países · {yearFrom}–{yearTo} · Datos CEPALSTAT
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
              <button
                onClick={() => { setIndicator("Annual CPI growth rate"); setCountries(["Argentina", "Brazil", "Mexico", "Chile", "Colombia"]); setYearFrom(2000); setYearTo(2024); }}
                className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all"
                style={{ color: t.textDim, border: `1px solid ${t.border}` }}
                onMouseEnter={(e) => { e.currentTarget.style.color = t.textSub; e.currentTarget.style.borderColor = t.borderMid; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = t.textDim; e.currentTarget.style.borderColor = t.border; }}
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                onClick={() => setFullChatOpen(true)}
                className="flex items-center gap-2 text-xs font-mono font-semibold px-4 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${t.accent}, ${t.accentDark})`,
                  color: "white",
                  boxShadow: `0 2px 16px ${t.accentBg}`,
                }}
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
                accent={t.kpiAccents[0]}
                trend={kpiData?.yoy}
                loading={kpiLoading}
              />
              <KPICard
                label="Año de referencia"
                value={kpiData?.year != null ? String(kpiData.year) : "—"}
                subLabel="Último dato disponible"
                subValue={indicatorLabel}
                accent={t.kpiAccents[1]}
                loading={kpiLoading}
              />
              <KPICard
                label="Valor más alto"
                value={kpiData?.top?.value ?? "—"}
                subLabel="País"
                subValue={kpiData?.top?.country ?? "—"}
                accent={t.kpiAccents[2]}
                loading={kpiLoading}
              />
              <KPICard
                label="Valor más bajo"
                value={kpiData?.bottom?.value ?? "—"}
                subLabel="País"
                subValue={kpiData?.bottom?.country ?? "—"}
                accent={t.kpiAccents[3]}
                loading={kpiLoading}
              />
            </div>

            {/* Time Series Chart */}
            <div className="rounded-2xl p-5" style={{ border: `1px solid ${t.border}`, background: t.surface }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-sm font-bold" style={{ color: t.text }}>Evolución histórica</p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: t.textDim }}>{indicatorLabel} · {yearFrom}–{yearTo}</p>
                </div>
                <BarChart2 className="w-4 h-4" style={{ color: t.textFaint }} />
              </div>

              {tsLoading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="space-y-2 w-full px-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-2 rounded animate-pulse"
                        style={{ background: t.border, width: `${60 + i * 10}%` }}
                      />
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
                      <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                      <XAxis
                        dataKey="year"
                        tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickLine={false}
                        axisLine={{ stroke: t.border }}
                      />
                      <YAxis
                        domain={yDomain}
                        tick={{ fill: t.textDim, fontSize: 10, fontFamily: "JetBrains Mono" }}
                        tickLine={false}
                        axisLine={{ stroke: t.border }}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: t.textMuted, paddingTop: 8 }}
                      />
                      {tsData.countries.map((country, i) => (
                        <Line
                          key={country}
                          type="monotone"
                          dataKey={country}
                          stroke={t.chartColors[i % t.chartColors.length]}
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
                    <BarChart2 className="w-8 h-8 mx-auto mb-2" style={{ color: t.border }} />
                    <p className="text-xs font-mono" style={{ color: t.textFaint }}>Sin datos para estos filtros</p>
                    <p className="text-[10px] font-mono mt-1" style={{ color: t.textInvisible }}>Ajustá el período o los países</p>
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
                return { country, color: t.chartColors[i % t.chartColors.length], avg, minP, maxP };
              }).filter((d): d is NonNullable<typeof d> => d !== null);

              if (tableData.length === 0) return null;

              const fmt = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2);

              return (
                <div className="flex gap-3 flex-col md:flex-row">
                  {/* Tabla 1: Promedio */}
                  <div className="rounded-2xl p-5 flex-1 min-w-0" style={{ border: `1px solid ${t.border}`, background: t.surface }}>
                    <p className="text-sm font-bold mb-1" style={{ color: t.text }}>Promedio del período</p>
                    <p className="text-[10px] font-mono mb-4" style={{ color: t.textDim }}>{indicatorLabel} · {yearFrom}–{yearTo}</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>País</th>
                          <th className="text-right text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...tableData].sort((a, b) => b.avg - a.avg).map(d => (
                          <tr key={d.country}>
                            <td className="py-2 text-[11px] font-mono" style={{ borderBottom: `1px solid ${t.borderFaint}` }}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ background: d.color }} />
                              <span style={{ color: t.textMuted }}>{d.country}</span>
                            </td>
                            <td className="py-2 text-[11px] font-mono text-right font-bold" style={{ color: d.color, borderBottom: `1px solid ${t.borderFaint}` }}>{fmt(d.avg)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tabla 2: Año mínimo */}
                  <div className="rounded-2xl p-5 flex-1 min-w-0" style={{ border: `1px solid ${t.border}`, background: t.surface }}>
                    <p className="text-sm font-bold mb-1" style={{ color: t.text }}>Año más bajo</p>
                    <p className="text-[10px] font-mono mb-4" style={{ color: t.textDim }}>{indicatorLabel} · valor mínimo registrado</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>País</th>
                          <th className="text-right text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>Año</th>
                          <th className="text-right text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...tableData].sort((a, b) => a.minP.value - b.minP.value).map(d => (
                          <tr key={d.country}>
                            <td className="py-2 text-[11px] font-mono" style={{ borderBottom: `1px solid ${t.borderFaint}` }}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: d.color }} />
                              <span style={{ color: t.textMuted }}>{d.country}</span>
                            </td>
                            <td className="py-2 text-[11px] font-mono text-right" style={{ color: t.green, borderBottom: `1px solid ${t.borderFaint}` }}>{d.minP.year}</td>
                            <td className="py-2 text-[11px] font-mono text-right font-bold" style={{ color: t.green, borderBottom: `1px solid ${t.borderFaint}` }}>{fmt(d.minP.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tabla 3: Año máximo */}
                  <div className="rounded-2xl p-5 flex-1 min-w-0" style={{ border: `1px solid ${t.border}`, background: t.surface }}>
                    <p className="text-sm font-bold mb-1" style={{ color: t.text }}>Año más alto</p>
                    <p className="text-[10px] font-mono mb-4" style={{ color: t.textDim }}>{indicatorLabel} · valor máximo registrado</p>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>País</th>
                          <th className="text-right text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>Año</th>
                          <th className="text-right text-[9px] font-mono uppercase tracking-widest pb-2" style={{ color: t.textFaint, borderBottom: `1px solid ${t.border}` }}>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...tableData].sort((a, b) => b.maxP.value - a.maxP.value).map(d => (
                          <tr key={d.country}>
                            <td className="py-2 text-[11px] font-mono" style={{ borderBottom: `1px solid ${t.borderFaint}` }}>
                              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: d.color }} />
                              <span style={{ color: t.textMuted }}>{d.country}</span>
                            </td>
                            <td className="py-2 text-[11px] font-mono text-right" style={{ color: t.red, borderBottom: `1px solid ${t.borderFaint}` }}>{d.maxP.year}</td>
                            <td className="py-2 text-[11px] font-mono text-right font-bold" style={{ color: t.red, borderBottom: `1px solid ${t.borderFaint}` }}>{fmt(d.maxP.value)}</td>
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
              <p className="text-[10px] font-mono" style={{ color: t.textInvisible }}>
                Fuente: CEPALSTAT · {kpiData?.count ?? "—"} países disponibles · Hackathon ULACIT × Databricks
              </p>
              <Link href="/landing">
                <span
                  className="text-[10px] font-mono transition-colors flex items-center gap-1"
                  style={{ color: t.textFaint }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = t.textMuted; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = t.textFaint; }}
                >
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
              messages={fullChatMessages}
              setMessages={setFullChatMessages}
            />
          )}
        </AnimatePresence>
      </div>
    </ThemeContext.Provider>
  );
}
