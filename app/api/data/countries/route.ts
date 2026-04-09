import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks } from "@/lib/databricks";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const indicator = searchParams.get("indicator") || "Annual CPI growth rate";

  try {
    const rows = await queryDatabricks(`
      SELECT DISTINCT country_name
      FROM workspace.default.cepal_indicators
      WHERE indicator_name = '${indicator.replace(/'/g, "''")}'
        AND value IS NOT NULL
      ORDER BY country_name ASC
    `);

    const countries = rows.map((r) => String(r.country_name));
    return NextResponse.json({ countries });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}
