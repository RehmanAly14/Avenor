# Avenor

> AI-assisted data incident investigation: from "the dashboard is broken" to a reviewed GitHub pull request.

Avenor connects to your PostgreSQL databases, builds a metadata catalog and lineage graph from the database's own system catalogs, and runs a multi-agent pipeline that traces a reported data incident to its root cause. It then measures the downstream impact, proposes a fix, and opens a pull request once a human approves it.

---

## Features

- **Data source sync**: connect a PostgreSQL database and discover its tables, views, materialized views, columns, and schema changes across every non-system schema.
- **Automatic lineage**: foreign keys and view dependencies are read from `pg_catalog` and turned into lineage edges. Avenor does not guess lineage it can't prove.
- **Metadata catalog**: search assets and manage their owners, tags, and domains.
- **Impact analysis**: a recursive, cycle-safe traversal finds the dashboards, ML models, and pipelines downstream of an asset.
- **Autonomous investigations**: you describe the incident in plain text. The Planner, Investigator, Impact, Fixer, Validator, and Documentation agents then resolve the affected asset, find the root cause, and write up the report.
- **Human-gated fixes**: every fix starts as a proposal. A validator blocks destructive changes, and nothing reaches GitHub until a person approves it.
- **GitHub integration**: an OAuth-connected repository per project, automatic PR creation, and webhook-driven resolution when the PR is merged.
- **Documents**: upload supporting files to a project or workspace.
- **Interactive UI**: dashboard, lineage graph explorer, investigation timeline, and fix review.

## How it works

```
PostgreSQL data source
        │  sync (information_schema + pg_catalog)
        ▼
Metadata catalog ── assets, schemas, columns, owners, tags, domains
        │
        ▼
Lineage engine ── upstream / downstream traversal
        │
        ▼
Investigation pipeline
  Planner → Investigator → Impact → Fixer → Validator → Documentation
        │
        ▼
Human approval ──► GitHub pull request ──► merged webhook ──► RESOLVED
```

The pipeline runs fully deterministically by default. Setting `AI_PROVIDER=fireworks` adds LLM-written explanations, but no stage depends on it.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, React Flow (`@xyflow/react`) + dagre, Radix UI, Recharts, Framer Motion |
| Backend | Node.js 20+, Express, Prisma ORM, Zod, JWT auth, Helmet, rate limiting |
| Database | PostgreSQL 14+ |
| AI (optional) | Fireworks AI (Llama 3.1 70B Instruct by default) |
| Integrations | GitHub OAuth App, REST API, and webhooks |

## Repository structure

```
Avenor/
├── backend/          # Express REST API, Prisma schema, AI agents, integrations
│   ├── prisma/       # schema.prisma, migrations, seed script
│   ├── src/
│   │   ├── ai/             # providers, tools, agents, orchestrator
│   │   ├── integrations/   # github/, postgres/ (introspection + lineage)
│   │   ├── modules/        # auth, users, projects, workspaces, datasources,
│   │   │                   # metadata, catalog, documents, metadata-intelligence,
│   │   │                   # investigation
│   │   └── ...
│   ├── test/
│   ├── Dockerfile
│   └── docker-compose.yml
└── frontend/         # React + Vite single-page app
    └── src/
        ├── pages/          # Dashboard, Data Sources, Metadata, Lineage,
        │                   # Investigations, GitHub, Documents, Settings, ...
        ├── components/     # UI kit, LineageGraph, route guards
        ├── lib/api/        # typed API client per backend module
        └── context/        # auth + workspace state
```

## Getting started

### Prerequisites

- Node.js 20 or newer, and npm 10 or newer
- PostgreSQL 14 or newer, or Docker

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then set DATABASE_URL, JWT_SECRET, DATA_ENCRYPTION_KEY
npm run db:generate
npm run db:migrate
npm run db:seed             # optional: creates admin@avenor.dev / Admin1234!
npm run dev
```

The API listens on `PORT` (default `5000`) under `/api/v1`. Check it with `GET /api/v1/health`.

To run PostgreSQL and the API in Docker instead:

```bash
cd backend
docker compose up --build
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env` that points at the backend:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> If `VITE_API_URL` is unset, the frontend falls back to `http://localhost:3001/api/v1`. Make sure it matches the backend's `PORT`.

```bash
npm run dev
```

Open http://localhost:5173. Port `5173` is already in the backend's default `CORS_ORIGINS`.

## Configuration

Required backend variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Avenor's own database |
| `JWT_SECRET` | Signs authentication tokens |
| `DATA_ENCRYPTION_KEY` | AES-256-GCM key for stored data source credentials (required in production) |

Optional features:

| Feature | Variables |
|---|---|
| LLM-enriched reports | `AI_PROVIDER=fireworks`, `AI_MODEL`, `FIREWORKS_API_KEY` |
| GitHub OAuth connection | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI` |
| PR-merged webhook | `GITHUB_WEBHOOK_SECRET` |
| Global PR fallback | `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_DEFAULT_BRANCH` |

The [backend README](backend/README.md#environment-variables) has the full list.

## Typical workflow

1. Register or log in, then create a **workspace** and a **project**.
2. Add a **PostgreSQL data source** and click **Sync**. Assets and lineage appear in the catalog.
3. Explore the **Lineage** graph and run **impact analysis** on any asset.
4. Open an **investigation** with a plain-text description, for example "Monthly revenue dashboard broke after yesterday's deploy".
5. Run the pipeline and review the root cause, evidence, impact, and proposed fix.
6. **Validate** and then **approve** the fix. Avenor opens a pull request on the connected repository.
7. Merge the PR on GitHub. The webhook marks the incident **resolved**.

## Scripts

| Location | Command | Description |
|---|---|---|
| backend | `npm run dev` | Start the API with file watching |
| backend | `npm start` | Start the API |
| backend | `npm test` | Run the Node test suite |
| backend | `npm run db:migrate` | Create and apply a migration |
| backend | `npm run db:studio` | Open Prisma Studio |
| backend | `npm run db:seed` | Seed development data |
| frontend | `npm run dev` | Start the Vite dev server |
| frontend | `npm run build` | Build for production into `dist/` |
| frontend | `npm run lint` | Lint with oxlint |

## Safety model

- The investigation pipeline never executes SQL, writes to a source database, merges code, or deploys.
- Data source sync only reads from the source database.
- A fix the validator blocks can never be approved. This is enforced on the server.
- `PR_CREATED` is not the same as resolved. An incident is only marked resolved after GitHub confirms the merge.

## Further documentation

- [Backend README](backend/README.md): architecture, the full API reference, and design decisions
- [AI layer](backend/src/ai/README.md): agents, tools, providers, and safety
- [GitHub integration](backend/src/integrations/github/README.md): OAuth setup, webhooks, and the security model

## Known limitations

- Only PostgreSQL data sources are supported. MySQL is accepted by the schema but rejected at connection time.
- Dropping a table from a source database does not remove its asset or lineage edges on the next sync.
- `POST /investigations/:id/run` runs synchronously and can take a while.
- GitHub features stay unavailable until an OAuth App is configured.
