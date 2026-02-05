# Automono

Local tool for freelancers that automates the extraction and management of invoice data from PDFs stored in Google Drive, using a local LLM (LM Studio).

## What it does

1. **Syncs invoices** from a Google Drive folder organized by quarters
2. **Extracts text** from PDFs automatically
3. **Processes with local AI** (LM Studio) to extract structured fields (date, vendor, tax base, VAT, total, etc.)
4. **Review and edit** extracted data through a web interface
5. **Manage vendors and clients** with custom extraction prompts
6. **Create manual financial movements** (income/expenses) for non-invoice transactions
7. **Exports to TSV** for pasting directly into spreadsheets

## Tech stack

- **Frontend**: React 19, React Router 7 (SPA), React Query, Tailwind CSS
- **Backend**: Bun, Drizzle ORM, SQLite
- **Services**: Google Drive API (OAuth2), LM Studio (OpenAI-compatible API), pdf-parse

## Project structure

```
app/                  # React frontend (SPA)
  routes/             # Pages: home, invoices, movements, drive, vendors, clients, settings
  components/         # UI components (InvoiceTable, MovementTable, VendorManager, etc.)
  hooks/              # React Query hooks
  lib/                # API client, utilities
server/               # Bun backend
  routes/             # API endpoints (auth, drive, invoices, vendors, movements)
  services/           # Business logic (drive, llm, pdf, prompts)
  db/                 # Drizzle ORM schema, queries, connection
data/                 # SQLite database (automono.db)
drizzle.config.ts     # Drizzle Kit configuration
```

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [LM Studio](https://lmstudio.ai) running locally with a loaded model
- Google Cloud OAuth credentials (Google Drive API enabled)

## Setup

```bash
# Install dependencies
bun install

# Sync database schema
npx drizzle-kit push

# Development (SPA + API in parallel)
bun run dev

# API server only
bun run dev:api

# Frontend only
bun run dev:spa
```

## Initial configuration

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Drive API**
3. Create **OAuth 2.0** credentials (Web application) with redirect URI: `http://localhost:3001/api/auth/callback`
4. Add your email as a test user in the OAuth consent screen
5. Open `http://localhost:5173/settings` in your browser
6. Enter Client ID, Client Secret, and root Drive folder ID
7. Save and click "Connect Google Drive"
8. Configure the LM Studio URL (default: `http://localhost:1234/v1`)

## Expected Google Drive structure

```
Root folder/
  2025 - trimestre 1/
    gastos/
      vendor-a/
        invoice1.pdf
        invoice2.pdf
      invoice3.pdf
    ingresos/
      invoice4.pdf
  2025 - trimestre 2/
    ...
```

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/settings` | Get configuration |
| POST | `/api/settings` | Save configuration |
| GET | `/api/auth/status` | Google connection status |
| GET | `/api/auth/login` | Get OAuth login URL |
| GET | `/api/auth/callback` | Google OAuth callback |
| GET | `/api/drive/folders` | List root folders (quarters) |
| GET | `/api/drive/folder?id=X` | List folder contents |
| POST | `/api/drive/sync` | Sync PDFs from a folder |
| GET | `/api/invoices/trimestres` | Quarters with statistics |
| GET | `/api/invoices?trimestre=X&type=Y` | Invoices by quarter |
| GET | `/api/invoices/:id` | Invoice details |
| PATCH | `/api/invoices/:id` | Edit extracted data |
| POST | `/api/invoices/process` | Process invoice with LLM |
| POST | `/api/invoices/process-batch` | Process batch of invoices |
| GET | `/api/vendors` | List vendors |
| POST | `/api/vendors` | Create vendor |
| PATCH | `/api/vendors/:id` | Update vendor |
| DELETE | `/api/vendors/:id` | Delete vendor |
| GET | `/api/movements` | List movements |
| POST | `/api/movements` | Create movement |
| GET | `/api/movements/:id` | Movement details |
| PATCH | `/api/movements/:id` | Update movement |
| DELETE | `/api/movements/:id` | Delete movement |

## Production

```bash
bun run build
bun run start
```

This compiles the SPA and serves it from the same API server on port 3001.
