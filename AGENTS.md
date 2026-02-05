# AGENTS.md

Instrucciones para agentes LLM que trabajen en este repositorio.

## Descripción del proyecto

Automono es una app local para autónomos españoles que extrae datos de facturas PDF desde Google Drive usando un LLM local. Stack: React 19 + React Router 7 (SPA) en frontend, Bun + Drizzle ORM + SQLite en backend.

## Arquitectura

### Frontend (`app/`)
- SPA con React Router 7 (SSR deshabilitado, ver `react-router.config.ts`)
- Estado del servidor gestionado con React Query (`@tanstack/react-query`)
- Todos los hooks de datos están en `app/hooks/use-invoices.ts`
- Cliente API centralizado en `app/lib/api.ts` — usa proxy de Vite en desarrollo (`/api` → `localhost:3001`)
- Componentes UI basados en Tailwind CSS (componentes reutilizables en `app/components/ui/`)
- Idioma de la UI: español

### Backend (`server/`)
- Runtime: Bun (no Node.js)
- Servidor HTTP vanilla con `Bun.serve()` en `server/index.ts`
- Router manual en `server/router.ts` — no usa ningún framework HTTP
- Base de datos: SQLite via Drizzle ORM (`server/db/`)
  - Schema: `server/db/schema.ts` (definiciones de tablas)
  - Conexión: `server/db/index.ts` (exporta instancia `db`)
  - Queries: `server/db/queries.ts` (todas las operaciones de BD)
- Las queries son **síncronas** (SQLite + Bun driver)
- Servicios en `server/services/`: drive (Google API), llm (LM Studio), pdf (extracción), prompts (construcción de prompts)

### Base de datos
- Archivo: `data/automono.db`
- ORM: Drizzle con driver `drizzle-orm/bun-sqlite`
- Schema push (sin migraciones): `npx drizzle-kit push`
- Config: `drizzle.config.ts`
- Las claves de columna en el schema usan **snake_case** (no camelCase) para mantener compatibilidad con el frontend

## Convenciones

### Código
- TypeScript estricto en todo el proyecto
- Las funciones de `queries.ts` son la única interfaz con la BD — no acceder a `db` directamente desde rutas o servicios
- Las firmas públicas de `queries.ts` usan snake_case en los parámetros de entrada (ej: `data.drive_file_id`) para coincidir con las columnas de la BD y la interfaz del frontend
- Los tipos `InvoiceRow` y `VendorPromptRow` se infieren del schema Drizzle (`typeof table.$inferSelect`)
- CORS habilitado en todas las respuestas API (ver `router.ts`)

### Rutas API
- Todas bajo `/api/`
- Handlers en `server/routes/*.ts`, cada uno exporta una función `handle*Routes(req, url)` que devuelve `Response | null`
- Si el handler devuelve `null`, el router pasa al siguiente

### Frontend
- Las rutas de React Router están en `app/routes/` con convención de nombres de archivo (file-based routing)
- Los datos se pasan por URL params y query strings, no por estado global
- Mutaciones con React Query invalidan las queries relevantes automáticamente

## Comandos

```bash
bun run dev          # Frontend (Vite :5173) + API (:3001) en paralelo
bun run dev:api      # Solo API server
bun run dev:spa      # Solo frontend
bun run build        # Build de producción (SPA)
bun run typecheck    # Chequeo de tipos
npx drizzle-kit push # Sincronizar schema con la BD
```

## Puntos a tener en cuenta

- La app está pensada para uso local — no hay autenticación de usuarios, solo OAuth con Google Drive
- El LLM corre local via LM Studio (API compatible con OpenAI en `http://localhost:1234/v1`)
- Las facturas se clasifican en dos tipos: `gastos` (compras) e `ingresos` (ventas/facturas emitidas), cada uno con campos de extracción diferentes
- Los vendor prompts permiten personalizar la extracción por proveedor (matching por nombre de subcarpeta o texto)
- En desarrollo, el frontend (Vite) corre en puerto 5173 y el API en 3001. El callback OAuth de Google redirige al 3001, y el server redirige al 5173
- El archivo `data/automono.db` contiene datos reales — no borrar ni hacer commit
