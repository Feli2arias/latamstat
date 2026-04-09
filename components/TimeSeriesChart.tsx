"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#c0c1ff", "#ffb783", "#4ade80", "#fb923c", "#f472b6"];

const COUNTRIES = ["Argentina", "Brazil", "Mexico", "Chile", "Colombia"];
const INDICATOR_OPTIONS = ["CPI", "Poverty"];

interface ChartData {
  data: Record<string, number>[];
  countries: string[];
}

export default function TimeSeriesChart() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [indicator, setIndicator] = useState("CPI");
  const [selectedCountries, setSelectedCountries] = useState(COUNTRIES);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      countries: selectedCountries.join(","),
      yearFrom: "1990",
      yearTo: "2026",
      indicator,
    });
    fetch(`/api/data/timeseries?${params}`)
      .then((r) => r.json())
      .then((d) => { setChartData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [indicator, selectedCountries]);

  const toggleCountry = (c: string) => {
    setSelectedCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  return (
    <div className="col-span-8 bg-[#191b22] p-6 h-[420px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2e2eb]">
          Evolución Histórica
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0c0e14] rounded p-0.5 border border-[#464554]/20">
            {INDICATOR_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setIndicator(opt)}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-colors ${
                  indicator === opt
                    ? "bg-[#8083ff] text-white"
                    : "text-[#c7c4d7] hover:text-[#e2e2eb]"
                }`}
              >
                {opt === "CPI" ? "Inflación" : "Pobreza"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {COUNTRIES.map((c, i) => (
          <button
            key={c}
            onClick={() => toggleCountry(c)}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
              selectedCountries.includes(c)
                ? "border-transparent text-[#111319]"
                : "border-[#464554]/50 text-[#c7c4d7]"
            }`}
            style={selectedCountries.includes(c) ? { backgroundColor: COLORS[i] } : {}}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#c7c4d7] text-sm animate-pulse">Cargando datos...</div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData?.data ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33343b" />
              <XAxis
                dataKey="year"
                tick={{ fill: "#c7c4d7", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#464554" }}
              />
              <YAxis
                tick={{ fill: "#c7c4d7", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "#464554" }}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#373940",
                  border: "1px solid #464554",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: "#e2e2eb",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", color: "#c7c4d7" }}
              />
              {selectedCountries.map((country, i) => (
                <Line
                  key={country}
                  type="monotone"
                  dataKey={country}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
