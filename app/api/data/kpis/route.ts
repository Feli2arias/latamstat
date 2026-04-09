import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks } from "@/lib/databricks";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const indicator = searchParams.get("indicator") || "Annual CPI growth rate";

  try {
    // Get latest year with data for this indicator
    const [latestYearRows] = await Promise.all([
      queryDatabricks(`
        SELECT MAX(year) as latest_year
        FROM workspace.default.cepal_indicators
        WHERE indicator_name = '${indicator.replace(/'/g, "''")}'
      `),
    ]);

    const latestYear = Number(latestYearRows[0]?.latest_year ?? 2023);
    const prevYear = latestYear - 1;

    const [currentRows, prevRows] = await Promise.all([
      queryDatabricks(`
        SELECT country_name, iso3, AVG(value) as avg_val
        FROM workspace.default.cepal_indicators
        WHERE indicator_name = '${indicator.replace(/'/g, "''")}'
          AND year = ${latestYear}
        GROUP BY country_name, iso3
        HAVING avg_val IS NOT NULL
        ORDER BY avg_val DESC
      `),
      queryDatabricks(`
        SELECT AVG(value) as median_val
        FROM workspace.default.cepal_indicators
        WHERE indicator_name = '${indicator.replace(/'/g, "''")}'
          AND year = ${prevYear}
      `),
    ]);

    if (!currentRows.length) {
      return NextResponse.json({ error: "No data" }, { status: 404 });
    }

    const values = currentRows.map((r) => Number(r.avg_val)).filter((v) => !isNaN(v));
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    const prevMedian = Number(prevRows[0]?.median_val ?? 0);
    const yoy = prevMedian > 0 ? (((median - prevMedian) / prevMedian) * 100).toFixed(1) : null;

    const top = currentRows[0];
    const bottom = currentRows[currentRows.length - 1];

    function fmt(n: number): string {
      if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + "B";
      if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + "M";
      if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
      return n.toFixed(2);
    }

    return NextResponse.json({
      indicator,
      year: latestYear,
      median: { value: fmt(median), raw: median },
      yoy,
      top: { country: String(top.country_name), value: fmt(Number(top.avg_val)) },
      bottom: { country: String(bottom.country_name), value: fmt(Number(bottom.avg_val)) },
      count: currentRows.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
  }
}
