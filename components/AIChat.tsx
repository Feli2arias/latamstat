"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Qué país tuvo mayor inflación en 2023?",
  "Evolución de pobreza en Argentina desde 2010",
  "Comparar CPI de Brasil y México",
  "¿Cuál es la tendencia de pobreza en el Caribe?",
];

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy tu asistente de análisis socioeconómico LATAM. Puedo responder preguntas sobre inflación y pobreza en 40 países de la región desde 1980 hasta 2026. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error al conectar con el asistente. Verificá la API key." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-[#191b22] border-l border-[#33343b] z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#33343b] flex items-center justify-between bg-[#191b22]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#c0c1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
            smart_toy
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-[#e2e2eb]">Asistente IA</span>
          <span className="text-[9px] bg-[#8083ff]/20 text-[#c0c1ff] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
            Beta
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`text-xs p-3 rounded-lg max-w-[92%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#33343b] text-[#c7c4d7] border border-[#464554]/20"
                  : "bg-[#c0c1ff]/5 text-[#e2e2eb] border border-[#c0c1ff]/20"
              }`}
            >
              {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={j} className="font-bold text-white">{part.slice(2, -2)}</strong>
                  : <span key={j}>{part}</span>
              )}
            </div>
            <span className={`text-[9px] uppercase tracking-widest mt-1 ${msg.role === "user" ? "mr-1 text-[#908fa0]" : "ml-1 text-[#c0c1ff]"}`}>
              {msg.role === "user" ? "Vos" : "LatamStat AI"}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="bg-[#c0c1ff]/5 border border-[#c0c1ff]/20 text-xs p-3 rounded-lg">
              <span className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-col gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-[#908fa0] font-bold">Sugerencias</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[10px] text-left bg-[#1e1f26] border border-[#464554]/50 text-[#c7c4d7] hover:text-[#e2e2eb] hover:border-[#c0c1ff]/40 px-3 py-2 rounded transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-[#191b22] border-t border-[#33343b]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="w-full bg-[#0c0e14] border border-[#464554] text-[11px] rounded-lg p-3 pr-10 focus:outline-none focus:border-[#c0c1ff] resize-none placeholder:text-[#908fa0] text-[#e2e2eb]"
            placeholder="Preguntame sobre los datos..."
            rows={2}
          />
          <button
            onClick={() => send(input)}
            disabled={loading}
            className="absolute right-2 bottom-2 text-[#c0c1ff] disabled:opacity-40"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => send("Dame un resumen ejecutivo de la situación actual de LATAM")}
            className="text-[9px] font-bold bg-[#33343b] px-2 py-1 rounded border border-[#464554]/50 text-[#c7c4d7] hover:text-[#e2e2eb]"
          >
            Resumen Ejecutivo
          </button>
          <button
            onClick={() => send("¿Cuál es la proyección de pobreza para 2025-2026?")}
            className="text-[9px] font-bold bg-[#33343b] px-2 py-1 rounded border border-[#464554]/50 text-[#c7c4d7] hover:text-[#e2e2eb]"
          >
            Proyectar 2026
          </button>
        </div>
      </div>
    </aside>
  );
}
