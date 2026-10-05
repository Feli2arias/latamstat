# LatamStat

Dashboard de indicadores socioeconómicos de América Latina y el Caribe, con datos de CEPALSTAT, consultas sobre Databricks y un asistente de IA que responde en español consultando los datos.

**Proyecto construido para un hackathon universitario: ULACIT x Databricks (Costa Rica).**

> **Aviso:** actualmente los servidores de Databricks que alojan los datos están apagados, por lo que la aplicación no carga datos en vivo. Para correrla hay que contar con un workspace de Databricks propio, con un SQL Warehouse y las tablas descritas más abajo.

## Funcionalidades

- **Landing** (`/`): presentación del proyecto con un globo 3D interactivo (cobe) y animaciones.
- **Dashboard** (`/dashboard`):
  - Selector de indicador (10 indicadores de CEPAL: inflación, pobreza, desigualdad, desempleo, deuda pública, esperanza de vida, entre otros), de países y de rango de años.
  - KPIs: año de referencia, valor más alto y valor más bajo.
  - Series de tiempo comparando países.
  - Pronóstico de 3 años por regresión lineal, activable desde el gráfico.
  - Exportación de la serie a CSV.
  - Tablas resumen por país: promedio del período, año más bajo y año más alto.
  - Tema oscuro y tema claro accesible para daltonismo.
- **Chat con IA**: panel rápido y modal de análisis completo. El modelo usa tool calling para generar y ejecutar SQL sobre Databricks, en un bucle de hasta 4 iteraciones, y responde citando país y año.
- **Componentes y endpoints adicionales** (presentes en el repo, aún no montados en el dashboard actual): dispersión de inflación vs. pobreza (`ScatterPlot`, `/api/data/scatter`) y tabla comparativa por país con variación interanual (`ComparisonTable`, `/api/data/table`).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Framer Motion, lucide-react
- Recharts (gráficos) y cobe (globo 3D)
- Databricks SQL Statement API sobre un SQL Warehouse
- LLM servido desde Databricks Foundation Model APIs: `databricks-meta-llama-3-3-70b-instruct`

## Datos

Las consultas apuntan a tablas en `workspace.default` del workspace de Databricks:

- `cepal_indicators`: indicadores CEPALSTAT (`iso3`, `country_name`, `year`, `indicator_id`, `indicator_name`, `category`, `value`, `dimension_1`, `unit`), unas 45.800 filas entre 1950 y 2025.
- `cepal_final_dataset`: dataset de inflación (CPI) y pobreza usado por los endpoints de dispersión y tabla comparativa (`iso3`, `country_name`, `indicator`, `year_name`, `value`).

Los datos no se incluyen en el repositorio: hay que cargarlos en tu propio workspace.

## Cómo correrlo localmente

Requisitos: Node.js 20.9 o superior y un workspace de Databricks con las tablas anteriores.

```bash
npm install
# crear .env.local con las variables de entorno de la sección siguiente
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Otros scripts: `npm run build`, `npm run start`, `npm run lint`.

## Variables de entorno

Se definen en `.env.local` (ignorado por git):

- `DATABRICKS_HOST`
- `DATABRICKS_TOKEN`
- `DATABRICKS_WAREHOUSE_ID`

## Estructura del proyecto

```
app/
  page.tsx              Landing con globo 3D
  dashboard/page.tsx    Dashboard (KPIs, series, pronóstico, CSV, chat)
  api/data/*            Endpoints de datos: kpis, countries, timeseries, scatter, table
  api/chat/             Chat rápido con tool calling
  api/chat/full/        Chat de análisis completo
components/             KPICards, TimeSeriesChart, ScatterPlot, ComparisonTable, AIChat
lib/databricks.ts       Cliente de SQL Warehouse y del LLM, esquema de datos
```

## Estado del proyecto

Prototipo desarrollado para el hackathon. No se mantiene activamente y, mientras los servidores de Databricks sigan apagados, la aplicación no muestra datos en vivo.
