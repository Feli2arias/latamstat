const HOST = process.env.DATABRICKS_HOST!;
const TOKEN = process.env.DATABRICKS_TOKEN!;
const WAREHOUSE_ID = process.env.DATABRICKS_WAREHOUSE_ID!;

// ── LLM types ──────────────────────────────────────────────────────────────

interface ToolFunction {
  name: string;
  arguments: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: ToolFunction;
}

interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

export async function queryDatabricks(sql: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${HOST}/api/2.0/sql/statements`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      statement: sql,
      warehouse_id: WAREHOUSE_ID,
      wait_timeout: "30s",
    }),
  });

  if (!res.ok) throw new Error(`Databricks error: ${res.statusText}`);

  const json = await res.json();
  if (json.status?.state !== "SUCCEEDED") {
    throw new Error(`Query failed: ${JSON.stringify(json.status)}`);
  }

  const columns: string[] = json.manifest.schema.columns.map(
    (c: { name: string }) => c.name
  );
  const rows: unknown[][] = json.result?.data_array ?? [];

  return rows.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

export async function callDatabricksLLM(
  messages: LLMMessage[],
  tools: object[]
): Promise<LLMResponse> {
  const res = await fetch(
    `${HOST}/serving-endpoints/databricks-meta-llama-3-3-70b-instruct/invocations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
        temperature: 0.1,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Databricks LLM error ${res.status}: ${body}`);
  }

  return res.json() as Promise<LLMResponse>;
}

export const DB_SCHEMA = `
Tabla: workspace.default.cepal_indicators
Columnas:
  - iso3 (string): código ISO3 del país (ej: ARG, BRA, MEX, CHL)
  - country_name (string): nombre completo del país en inglés
  - year (int): año del dato
  - indicator_id (int): ID numérico del indicador en CEPALSTAT
  - indicator_name (string): nombre del indicador
  - category (string): Health | Economy | Fiscal | Inflation | Labor | Education | Poverty | Inequality
  - value (double): valor numérico del indicador
  - dimension_1 (string): dimensión adicional cuando aplica (ej: sexo, grupo de edad)
  - unit (string): unidad de medida

Indicadores disponibles (10 indicadores, 45.801 filas, años 1950–2025):
  - Life expectancy at birth         (category: Health,     ~17.667 filas, 1950–2100)
  - Infant mortality rate            (category: Health,     ~17.667 filas, 1950–2100)
  - Public debt as % of GDP          (category: Fiscal,     ~4.297 filas,  1990–2023)
  - Annual CPI growth rate           (category: Inflation,  ~1.487 filas,  1971–2025)
  - Net foreign direct investment    (category: Economy,    ~1.428 filas,  1980–2024)
  - Unemployment rate                (category: Labor,      ~1.072 filas,  2010–2024)
  - Literacy rate (15+ years)        (category: Education,  ~838 filas,    1970–2024)
  - Population in poverty            (category: Poverty,    ~554 filas,    1997–2025)
  - GDP per capita (PPP)             (category: Economy,    ~480 filas,    2017–2021)
  - Gini index                       (category: Inequality, ~311 filas,    2000–2024)

Países disponibles: todos los de América Latina y el Caribe (~33 países).
Filtrar por category para obtener indicadores relacionados.
Filtrar por indicator_name para un indicador específico.
Siempre usar el nombre completo: workspace.default.cepal_indicators
`;
