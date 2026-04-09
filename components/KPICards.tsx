"use client";

import { useEffect, useState } from "react";

interface KPIData {
  cpi: { value: string; year: number; yoy: string | null };
  poverty: { value: string; year: number; yoy: string | null };
  topCpi: { country: string; value: string; year: number };
  topPoverty: { country: string; value: string; year: number };
}

function TrendBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const num = parseFloat(value);
  const isUp = num > 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 ${isUp ? "text-[#ff6b6b]" : "text-[#4ade80]"}`}>
      <span className="material-symbols-outlined text-sm">{isUp ? "trending_up" : "trending_down"}</span>
      {isUp ? "+" : ""}{value}%
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="col-span-3 bg-[#191b22] p-5 border-l-4 border-[#33343b] animate-pulse">
      <div className="h-3 bg-[#33343b] rounded w-2/3 mb-3" />
      <div className="h-8 bg-[#33343b] rounded w-1/2 mb-4" />
      <div className="h-1 bg-[#33343b] rounded w-full" />
    </div>
  );
}

export default function KPICards() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/kpis")
      .then((r) => r.json())
      .then((d) => {
        if (d?.cpi && d?.poverty) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="col-span-3 bg-[#191b22] p-5 border-l-4 border-[#c0c1ff]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#c7c4d7] font-bold">
            IPC Promedio Región
          </span>
          <TrendBadge value={data.cpi.yoy} />
        </div>
        <div className="text-3xl font-mono font-bold text-[#e2e2eb]">{data.cpi.value}</div>
        <div className="mt-1 text-[10px] text-[#c7c4d7]">Año {data.cpi.year}</div>
        <div className="mt-3 h-1 w-full bg-[#33343b] overflow-hidden">
          <div className="h-full bg-[#c0c1ff] w-4/5" />
        </div>
      </div>

      <div className="col-span-3 bg-[#191b22] p-5 border-l-4 border-[#ffb783]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#c7c4d7] font-bold">
            Pobreza Promedio Región
          </span>
          <TrendBadge value={data.poverty.yoy} />
        </div>
        <div className="text-3xl font-mono font-bold text-[#e2e2eb]">{data.poverty.value}</div>
        <div className="mt-1 text-[10px] text-[#c7c4d7]">Año {data.poverty.year}</div>
        <div className="mt-3 h-1 w-full bg-[#33343b] overflow-hidden">
          <div className="h-full bg-[#ffb783] w-2/5" />
        </div>
      </div>

      <div className="col-span-3 bg-[#191b22] p-5 border-l-4 border-[#908fa0]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#c7c4d7] font-bold">
            Mayor Inflación (Región)
          </span>
          <span className="text-[11px] text-[#c7c4d7]">{String(data.topCpi.country)}</span>
        </div>
        <div className="text-3xl font-mono font-bold text-[#e2e2eb]">{data.topCpi.value}</div>
        <div className="mt-1 text-[10px] text-[#c7c4d7] italic">Año {String(data.topCpi.year)}</div>
      </div>

      <div className="col-span-3 bg-[#191b22] p-5 border-l-4 border-[#464554]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[#c7c4d7] font-bold">
            Mayor Pobreza (Región)
          </span>
          <span className="text-[11px] text-[#c7c4d7]">{String(data.topPoverty.country)}</span>
        </div>
        <div className="text-3xl font-mono font-bold text-[#e2e2eb]">{data.topPoverty.value}</div>
        <div className="mt-1 text-[10px] text-[#c7c4d7] italic">Año {String(data.topPoverty.year)}</div>
      </div>
    </>
  );
}
