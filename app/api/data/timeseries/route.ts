import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks } from "@/lib/databricks";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const indicator = searchParams.get("indicator") || "Annual CPI growth rate";
  const countries = searchParams.get("countries") || "Argentina,Brazil,Mexico,Chile,Colombia";
  const yearFrom = searchParams.get("yearFrom") || "2000";
  const yearTo = searchParams.get("yearTo") || "2024";

  const countryList = countries
    .split(",")
    .map((c) => `'${c.trim().replace(/'/g, "''")}'`)
    .join(",");

  try {
    const rows = await queryDatabricks(`
      SELECT country_name, year, AVG(value) as avg_value
      FROM workspace.default.cepal_indicators
      WHERE indicator_name = '${indicator.replace(/'/g, "''")}'
        AND country_name IN (${countryList})
        AND year BETWEEN ${yearFrom} AND ${yearTo}
        AND value IS NOT NULL
      GROUP BY country_name, year
      ORDER BY year ASC
    `);

    // Pivot: { year: 2000, Argentina: x, Brazil: y, ... }
    const yearMap: Record<number, Record<string, number>> = {};
    for (const row of rows) {
      const year = Number(row.year);
      const country = String(row.country_name);
      const val = Number(row.avg_value);
      if (!yearMap[year]) yearMap[year] = { year };
      yearMap[year][country] = parseFloat(val.toFixed(3));
    }

    const data = Object.values(yearMap).sort((a, b) => Number(a.year) - Number(b.year));
    const countryNames = countries.split(",").map((c) => c.trim());

    return NextResponse.json({ data, countries: countryNames, indicator });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch time series" }, { status: 500 });
  }
}
