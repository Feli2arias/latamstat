import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks } from "@/lib/databricks";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || "2024";

  try {
    const rows = await queryDatabricks(`
      SELECT
        c.country_name,
        c.iso3,
        AVG(c.value) as cpi_val,
        AVG(p.value) as poverty_val,
        prev_c.cpi_prev,
        prev_p.poverty_prev
      FROM workspace.default.cepal_final_dataset c
      JOIN workspace.default.cepal_final_dataset p
        ON c.iso3 = p.iso3 AND c.year_name = p.year_name
      LEFT JOIN (
        SELECT iso3, AVG(value) as cpi_prev
        FROM workspace.default.cepal_final_dataset
        WHERE indicator = 'CPI' AND year_name = ${Number(year) - 1}
        GROUP BY iso3
      ) prev_c ON c.iso3 = prev_c.iso3
      LEFT JOIN (
        SELECT iso3, AVG(value) as poverty_prev
        FROM workspace.default.cepal_final_dataset
        WHERE indicator = 'Poverty' AND year_name = ${Number(year) - 1}
        GROUP BY iso3
      ) prev_p ON c.iso3 = prev_p.iso3
      WHERE c.indicator = 'CPI'
        AND p.indicator = 'Poverty'
        AND c.year_name = ${year}
      GROUP BY c.country_name, c.iso3, prev_c.cpi_prev, prev_p.poverty_prev
      ORDER BY cpi_val DESC
    `);

    const data = rows.map((r, i) => {
      const cpi = Number(r.cpi_val);
      const poverty = Number(r.poverty_val);
      const cpiPrev = r.cpi_prev !== null ? Number(r.cpi_prev) : null;
      const povertyPrev = r.poverty_prev !== null ? Number(r.poverty_prev) : null;

      const cpiChange = cpiPrev ? (((cpi - cpiPrev) / Math.abs(cpiPrev)) * 100).toFixed(1) : null;
      const povertyChange = povertyPrev ? (((poverty - povertyPrev) / Math.abs(povertyPrev)) * 100).toFixed(1) : null;

      return {
        rank: i + 1,
        country: r.country_name,
        iso3: r.iso3,
        cpi: cpi.toFixed(3),
        poverty: poverty.toFixed(3),
        cpiChange,
        povertyChange,
      };
    });

    return NextResponse.json({ data, year });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch table data" }, { status: 500 });
  }
}
