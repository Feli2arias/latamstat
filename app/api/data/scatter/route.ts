import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks } from "@/lib/databricks";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearFrom = searchParams.get("yearFrom") || "2010";
  const yearTo = searchParams.get("yearTo") || "2026";

  try {
    const rows = await queryDatabricks(`
      SELECT
        c.country_name,
        c.iso3,
        AVG(c.value) as cpi_avg,
        AVG(p.value) as poverty_avg
      FROM workspace.default.cepal_final_dataset c
      JOIN workspace.default.cepal_final_dataset p
        ON c.iso3 = p.iso3 AND c.year_name = p.year_name AND c.month_name = p.month_name
      WHERE c.indicator = 'CPI'
        AND p.indicator = 'Poverty'
        AND c.year_name BETWEEN ${yearFrom} AND ${yearTo}
      GROUP BY c.country_name, c.iso3
      HAVING AVG(c.value) IS NOT NULL AND AVG(p.value) IS NOT NULL
      ORDER BY cpi_avg DESC
    `);

    const data = rows.map((r) => ({
      country: r.country_name,
      iso3: r.iso3,
      cpi: Number(Number(r.cpi_avg).toFixed(3)),
      poverty: Number(Number(r.poverty_avg).toFixed(3)),
    }));

    // Calculate correlation
    const n = data.length;
    if (n > 1) {
      const meanX = data.reduce((s, d) => s + d.cpi, 0) / n;
      const meanY = data.reduce((s, d) => s + d.poverty, 0) / n;
      const num = data.reduce((s, d) => s + (d.cpi - meanX) * (d.poverty - meanY), 0);
      const den = Math.sqrt(
        data.reduce((s, d) => s + (d.cpi - meanX) ** 2, 0) *
        data.reduce((s, d) => s + (d.poverty - meanY) ** 2, 0)
      );
      const correlation = den !== 0 ? (num / den).toFixed(2) : "0.00";
      return NextResponse.json({ data, correlation });
    }

    return NextResponse.json({ data, correlation: "N/A" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch scatter data" }, { status: 500 });
  }
}
