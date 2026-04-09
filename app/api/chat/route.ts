import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks, callDatabricksLLM } from "@/lib/databricks";

export const maxDuration = 60;

// Compact schema for quick chat — saves tokens
const QUICK_SCHEMA = `
Tabla: workspace.default.cepal_indicators
Columnas clave: iso3, country_name, year, indicator_name, category, value, unit
Indicadores (indicator_name exacto):
- "Annual CPI growth rate" (categoría: Inflation, años: 1971-2025)
- "Population in poverty" (categoría: Poverty, años: 1997-2025)
- "Gini index" (categoría: Inequality, años: 2000-2024)
- "GDP per capita (PPP)" (categoría: Economy, años: 2017-2021)
- "Unemployment rate" (categoría: Labor, años: 2010-2024)
- "Life expectancy at birth" (categoría: Health, años: 1950-2100)
- "Infant mortality rate" (categoría: Health, años: 1950-2100)
- "Public debt as % of GDP" (categoría: Fiscal, años: 1990-2023)
- "Literacy rate (15+ years)" (categoría: Education, años: 1970-2024)
- "Net foreign direct investment" (categoría: Economy, años: 1980-2024)
Países: ~33 países de América Latina y el Caribe. Siempre usá: workspace.default.cepal_indicators
`;

const SYSTEM_PROMPT = `Sos un asistente de datos socioeconómicos de América Latina. Respondé en máximo 4 oraciones cortas, en español rioplatense. Usá la herramienta query_databricks para consultar datos reales. Nunca inventes datos. Citá siempre el año y el país.

${QUICK_SCHEMA}`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_databricks",
      description: "Ejecuta SQL en Databricks. Usá LIMIT 20 siempre.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL a ejecutar contra workspace.default.cepal_indicators" },
        },
        required: ["sql"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Only keep last 6 messages to limit context size
    const recentMessages = messages.slice(-6);

    const thread: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content: string | null;
      tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
      tool_call_id?: string;
    }> = [{ role: "system", content: SYSTEM_PROMPT }, ...recentMessages];

    for (let i = 0; i < 4; i++) {
      const response = await callDatabricksLLM(thread, TOOLS, 400);
      const choice = response.choices[0];
      const msg = choice.message;

      thread.push({
        role: "assistant",
        content: msg.content ?? null,
        ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
      });

      if (choice.finish_reason !== "tool_calls" || !msg.tool_calls?.length) {
        return NextResponse.json({ response: msg.content ?? "" });
      }

      for (const toolCall of msg.tool_calls) {
        let result: string;
        if (toolCall.function.name === "query_databricks") {
          try {
            const { sql } = JSON.parse(toolCall.function.arguments) as { sql: string };
            const rows = await queryDatabricks(sql);
            result = JSON.stringify(rows.slice(0, 20));
          } catch (e) {
            result = `Error: ${String(e)}`;
          }
        } else {
          result = "Herramienta no disponible";
        }
        thread.push({ role: "tool", content: result, tool_call_id: toolCall.id });
      }
    }

    return NextResponse.json({ response: "Demasiadas consultas. Reformulá la pregunta." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ response: `Error: ${msg}` }, { status: 500 });
  }
}
