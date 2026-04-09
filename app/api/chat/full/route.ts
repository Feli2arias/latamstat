import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks, callDatabricksLLM, DB_SCHEMA } from "@/lib/databricks";

export const maxDuration = 60;

const SYSTEM_PROMPT = `Sos una analista de datos socioeconómicos de América Latina especializada en política pública. Respondés en español rioplatense con análisis profundo y recomendaciones concretas. Saludá al usuario sin usar ningún nombre.

${DB_SCHEMA}

FORMATO DE RESPUESTA:
Respondé solo con texto. No generes bloques de código, JSON, markdown con triple backtick ni ningún tipo de estructura técnica. Si tenés datos numéricos, presentalos en el texto de forma clara.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_databricks",
      description: "Ejecuta SQL en Databricks. Usá LIMIT 30 máximo.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL contra workspace.default.cepal_indicators" },
        },
        required: ["sql"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    // Keep last 8 messages for context
    const recentMessages = messages.slice(-8);

    const contextNote = context
      ? `\n[Contexto del dashboard: indicador="${context.indicator}", países=${JSON.stringify(context.countries)}, años ${context.yearFrom}-${context.yearTo}]`
      : "";

    const thread: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content: string | null;
      tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
      tool_call_id?: string;
    }> = [
      { role: "system", content: SYSTEM_PROMPT + contextNote },
      ...recentMessages,
    ];

    for (let i = 0; i < 5; i++) {
      const response = await callDatabricksLLM(thread, TOOLS, 900);
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
            result = JSON.stringify(rows.slice(0, 30));
          } catch (e) {
            result = `Error: ${String(e)}`;
          }
        } else {
          result = "Herramienta no disponible";
        }
        thread.push({ role: "tool", content: result, tool_call_id: toolCall.id });
      }
    }

    return NextResponse.json({ response: "Límite de consultas alcanzado. Reformulá la pregunta." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ response: `Error: ${msg}` }, { status: 500 });
  }
}
