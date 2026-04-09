"use client";

import { useEffect, useState } from "react";

interface TableRow {
  rank: number;
  country: string;
  iso3: string;
  cpi: string;
  poverty: string;
  cpiChange: string | null;
  povertyChange: string | null;
}

function ChangeBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-[#908fa0]">—</span>;
  const num = parseFloat(value);
  const isUp = num > 0;
  return (
    <span className={`flex items-center justify-end gap-0.5 ${isUp ? "text-[#ff6b6b]" : "text-[#4ade80]"}`}>
      <span className="material-symbols-outlined text-sm">{isUp ? "trending_up" : "trending_down"}</span>
    </span>
  );
}

export default function ComparisonTable() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState("2024");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/table?year=${year}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year]);

  return (
    <div className="col-span-12 bg-[#191b22] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2e2eb]">
          Comparativa de Indicadores por País
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#c7c4d7] uppercase tracking-widest">Año</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-[#0c0e14] border border-[#464554]/50 text-[#e2e2eb] text-xs rounded px-2 py-1 focus:outline-none focus:border-[#c0c1ff]"
          >
            {[2026,2025,2024,2023,2022,2020,2018,2015,2010,2005,2000].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-[#33343b]/40 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[320px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[#191b22]">
              <tr className="text-[10px] uppercase tracking-widest text-[#c7c4d7] border-b border-[#464554]/30">
                <th className="pb-3 font-bold w-8">#</th>
                <th className="pb-3 font-bold">País</th>
                <th className="pb-3 font-bold">Inflación (CPI)</th>
                <th className="pb-3 font-bold">Pobreza</th>
                <th className="pb-3 font-bold text-right">Tendencia CPI</th>
                <th className="pb-3 font-bold text-right">Tendencia Pob.</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {rows.map((row) => (
                <tr
                  key={row.iso3}
                  className="hover:bg-[#33343b]/30 transition-colors border-t border-[#464554]/10"
                >
                  <td className="py-3 text-[#908fa0] font-mono">{row.rank}</td>
                  <td className="py-3 font-bold text-[#e2e2eb]">{String(row.country)}</td>
                  <td className="py-3 font-mono text-[#c0c1ff]">{row.cpi}</td>
                  <td className="py-3 font-mono text-[#ffb783]">{row.poverty}</td>
                  <td className="py-3 text-right">
                    <ChangeBadge value={row.cpiChange} />
                  </td>
                  <td className="py-3 text-right">
                    <ChangeBadge value={row.povertyChange} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#908fa0] text-xs">
                    Sin datos disponibles para {year}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
