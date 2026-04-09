"use client";

import { useEffect, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from "recharts";

interface ScatterPoint {
  country: string;
  iso3: string;
  cpi: number;
  poverty: number;
}

interface ScatterData {
  data: ScatterPoint[];
  correlation: string;
}

const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: ScatterPoint;
}) => {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#c0c1ff" fillOpacity={0.6} stroke="#8083ff" strokeWidth={1} />
      <text x={cx + 7} y={cy + 4} fontSize={8} fill="#c7c4d7">
        {payload.iso3}
      </text>
    </g>
  );
};

export default function ScatterPlot() {
  const [scatterData, setScatterData] = useState<ScatterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data/scatter?yearFrom=2010&yearTo=2026")
      .then((r) => r.json())
      .then((d) => { setScatterData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const correlation = scatterData?.correlation ?? "—";
  const corrNum = parseFloat(correlation);
  const corrLabel =
    isNaN(corrNum) ? "" :
    corrNum > 0.7 ? "relación positiva fuerte" :
    corrNum > 0.4 ? "relación positiva moderada" :
    corrNum < -0.7 ? "relación negativa fuerte" :
    "relación débil";

  return (
    <div className="col-span-4 bg-[#191b22] p-6 h-[420px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#e2e2eb]">
            Correlación CPI vs Pobreza
          </h3>
          <p className="text-[10px] text-[#c7c4d7]">Análisis transversal por país (2010–2026)</p>
        </div>
        <div className="bg-[#c0c1ff]/10 px-3 py-1 rounded">
          <span className="text-[10px] font-bold text-[#c0c1ff] tracking-widest uppercase">
            r = {correlation}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#c7c4d7] text-sm animate-pulse">Cargando datos...</div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33343b" />
              <XAxis
                dataKey="cpi"
                type="number"
                tick={{ fill: "#c7c4d7", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "#464554" }}
                name="CPI"
              >
                <Label value="CPI" offset={-5} position="insideBottom" fill="#908fa0" fontSize={10} />
              </XAxis>
              <YAxis
                dataKey="poverty"
                type="number"
                tick={{ fill: "#c7c4d7", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: "#464554" }}
                width={40}
                name="Pobreza"
              >
                <Label value="Pobreza" angle={-90} position="insideLeft" fill="#908fa0" fontSize={10} />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#373940",
                  border: "1px solid #464554",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: "#e2e2eb",
                }}
                formatter={(value, name) => [
                  typeof value === "number" ? value.toFixed(3) : value,
                  name === "cpi" ? "CPI" : "Pobreza",
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.country ?? ""}
              />
              <Scatter
                data={scatterData?.data ?? []}
                shape={<CustomDot />}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && corrLabel && (
        <p className="text-[10px] text-[#c7c4d7] italic mt-2">
          Correlación {correlation} — {corrLabel}
        </p>
      )}
    </div>
  );
}
