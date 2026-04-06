import { NextRequest, NextResponse } from "next/server";
import { queryDatabricks, callDatabricksLLM, DB_SCHEMA } from "@/lib/databricks";

const SYSTEM_PROMPT = `Sos un asistente experto en datos socioeconómicos de América Latina y el Caribe.
Tenés acceso a una base de datos en Databricks con datos de CEPALSTAT para más de 30 países de la región.

${DB_SCHEMA}

Cuando el usuario hace una pregunta sobre datos, usá la herramienta query_databricks para obtener los datos reales.
Podés hacer múltiples consultas si necesitás comparar indicadores o países.
Respondé siempre en español, de forma concisa y clara.
Citá siempre el período y los países en tu respuesta.
Nunca inventes datos — si no tenés acceso, decilo claramente.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "query_databricks",
      description:
        "Ejecuta una consulta SQL en Databricks y devuelve resultados reales. Usá esta herramienta cuando necesités datos para responder.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description:
              "La consulta SQL a ejecutar. Siempre usá workspace.default.cepal_indicators como nombre de la tabla.",
          },
        },
        required: ["sql"],
      },
    },
  },
];

const MAX_ITERATIONS = 5;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const thread: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content: string | null;
      tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
      tool_call_id?: string;
    }> = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await callDatabricksLLM(thread, TOOLS);
      const choice = response.choices[0];
      const assistantMsg = choice.message;

      // Append assistant message to thread
      thread.push({
        role: "assistant",
        content: assistantMsg.content ?? null,
        ...(assistantMsg.tool_calls ? { tool_calls: assistantMsg.tool_calls } : {}),
      });

      // If no tool calls, the model is done — return the response
      if (choice.finish_reason !== "tool_calls" || !assistantMsg.tool_calls?.length) {
        return NextResponse.json({ response: assistantMsg.content ?? "" });
      }

      // Execute each tool call and append results
      for (const toolCall of assistantMsg.tool_calls) {
        let toolResult: string;

        if (toolCall.function.name === "query_databricks") {
          try {
            const { sql } = JSON.parse(toolCall.function.arguments) as { sql: string };
            const rows = await queryDatabricks(sql);
            toolResult = JSON.stringify(rows.slice(0, 50));
          } catch (e) {
            toolResult = `Error ejecutando la consulta: ${String(e)}`;
          }
        } else {
          toolResult = `Herramienta desconocida: ${toolCall.function.name}`;
        }

        thread.push({
          role: "tool",
          content: toolResult,
          tool_call_id: toolCall.id,
        });
      }
    }

    // Safety fallback: max iterations reached
    return NextResponse.json({
      response: "Alcancé el límite de consultas. Por favor reformulá la pregunta.",
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ response: `Error: ${msg}` }, { status: 500 });
  }
}
