# Avenor Backend

> Production-grade REST API for the Avenor multi-agent AI platform.
> Built with Node.js, Express.js, PostgreSQL, and Prisma ORM.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Server](#running-the-server)
- [Database](#database)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [Architectural Decisions](#architectural-decisions)

---

## Architecture Overview

```
Client (HTTP)
     │
     ▼
Express Middleware Stack
  ├── Helmet (security headers)
  ├── CORS
  ├── Morgan (logging)
  ├── Rate Limiter
  └── Body Parser
     │
     ▼
Route Layer  (src/routes/index.js)
     │
     ▼
Module Router  (e.g. src/modules/auth/auth.routes.js)
  └── Validation Middleware (Zod)
  └── Auth Middleware (JWT)
     │
     ▼
Controller   (HTTP in, HTTP out only)
     │
     ▼
Service      (all business logic lives here)
     │
     ▼
Prisma ORM
     │
     ▼
PostgreSQL
```

### Avenor Metadata Intelligence Engine

Avenor originally targeted DataHub as its metadata/catalog layer. DataHub's local Docker stack (Kafka, Zookeeper, Elasticsearch, MySQL, GMS, frontend — 6+ containers) was too heavy for this project's development environment, so it has been replaced end-to-end with a PostgreSQL-backed **Metadata Intelligence Engine**: no extra infrastructure, same Prisma database the rest of the API already uses.

```
PostgreSQL
     │  MetadataAsset / MetadataSchema / MetadataColumn
     │  MetadataOwner / MetadataTag / MetadataDomain
     ▼
Metadata Layer            (src/modules/metadata, src/modules/catalog)
     │  MetadataLineage — recursive CTEs, cycle-safe traversal
     ▼
Lineage Engine             (src/modules/metadata-intelligence)
     │  downstream traversal + asset-type categorization
     ▼
Impact Analysis            (src/modules/metadata-intelligence)
     │  DataIncident + deterministic root-cause/recommendation engine
     ▼
Investigation Engine       (src/modules/investigation)
     │  provider-agnostic tool interface
     ▼
AI Agents                  (src/ai — tools/, agents/, orchestrator/)
```

Every layer above is queried through Prisma against the same PostgreSQL database — there is no separate metadata store, search index, or message broker to run or keep in sync.

---

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.js              # Centralised env validation (fail-fast)
│   │   └── prisma.js           # Singleton Prisma client
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── error.middleware.js  # Global error handler + 404
│   │   └── validate.middleware.js # Zod request validation factory
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   └── user.validation.js
│   │   │
│   │   ├── projects/
│   │   │   ├── project.routes.js
│   │   │   ├── project.controller.js
│   │   │   ├── project.service.js
│   │   │   └── project.validation.js
│   │   │
│   │   ├── workspaces/
│   │   │   ├── workspace.routes.js
│   │   │   ├── workspace.controller.js
│   │   │   ├── workspace.service.js
│   │   │   └── workspace.validation.js
│   │   │
│   │   ├── metadata-intelligence/     # Lineage, impact analysis, search, schema diff
│   │   │   ├── metadata-intelligence.routes.js
│   │   │   ├── metadata-intelligence.controller.js
│   │   │   ├── metadata-intelligence.service.js
│   │   │   ├── metadata-intelligence.validation.js
│   │   │   └── schema-change.service.js
│   │   │
│   │   └── investigation/             # Investigation engine + fix approval lifecycle
│   │       ├── investigation.routes.js
│   │       ├── investigation.controller.js
│   │       ├── investigation.service.js
│   │       ├── investigation.validation.js
│   │       ├── fix.service.js           # Fix approval state machine (validate/approve/reject)
│   │       └── incident-event.service.js # Append-only IncidentEvent timeline
│   │
│   ├── integrations/
│   │   └── github/                            # See src/integrations/github/README.md
│   │       ├── github.client.js                 # Raw REST v3 fetch wrapper, no SDK, {token,owner,repo} ctx
│   │       ├── github.service.js                # createIncidentPullRequest — the fix/PR flow
│   │       ├── github.controller.js / .routes.js  # POST /investigations/:id/fix/pr
│   │       ├── github.types.js
│   │       ├── github.oauth.js                  # OAuth App: authorize URL, code exchange, profile/repos
│   │       ├── github.webhook.js                # HMAC signature verification + pull_request handling
│   │       ├── github-connection.service.js     # Connect/callback/status/account/repositories/select/disconnect
│   │       ├── github-connection.controller.js / .routes.js  # Mounted at /github
│   │       └── github-connection.validation.js
│   │
│   ├── routes/
│   │   └── index.js            # Central route registry
│   │
│   ├── utils/
│   │   ├── AppError.js         # Custom operational error class
│   │   ├── asyncHandler.js     # Wraps async handlers → next(err)
│   │   ├── hash.js             # bcrypt password utilities
│   │   ├── jwt.js              # Token sign/verify/extract
│   │   ├── response.js         # Uniform JSON response helpers
│   │   └── slug.js             # URL-safe slug generation
│   │
│   ├── constants/
│   │   ├── http.js             # HTTP status codes as named constants
│   │   └── messages.js         # All API response messages (i18n-ready)
│   │
│   ├── database/
│   │   └── index.js            # DB connect/disconnect lifecycle
│   │
│   ├── ai/                     # AI agent infrastructure (see src/ai/README.md)
│   │   ├── providers/            # Swappable LLM abstraction (Fireworks; optional)
│   │   ├── tools/                # Provider-agnostic tools wrapping the Intelligence Engine
│   │   ├── agents/                # planner/ investigator/ impact/ fixer/ validator/ documentation/
│   │   ├── orchestrator/         # Runs the pipeline, persists state, builds the report
│   │   └── README.md
│   │
│   ├── app.js                  # Express app factory
│   └── server.js               # Entry point + graceful shutdown
│
├── prisma/
│   ├── schema.prisma           # Database models
│   └── seed.js                 # Dev seed data
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Prerequisites

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 14
- **npm** >= 10

---

## Setup

### 1. Clone and install

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/avenor_dev?schema=public"
JWT_SECRET=your-secret-here
```

### 3. Generate Prisma client

```bash
npm run db:generate
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. (Optional) Seed the database

```bash
npm run db:seed
```

Creates:
- User: `admin@avenor.dev` / `Admin1234!`
- Project: `avenor-demo`

---

## Running the Server

### Development (with file watching)

```bash
npm run dev
```

### Production

```bash
npm start
```

---

## Database

### Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Generate Prisma client after schema changes |
| `npm run db:migrate` | Create and apply a new migration (dev) |
| `npm run db:migrate:prod` | Apply pending migrations (production) |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run db:seed` | Seed development data |
| `npm run db:reset` | Drop and recreate the database |

---

## API Reference

**Base URL:** `http://localhost:5000/api/v1`

**Response format (success):**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

**Response format (error):**
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

**Authentication:** All protected routes require:
```
Authorization: Bearer <token>
```

---

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service & DB health check |

---

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new account |
| `POST` | `/auth/login` | Public | Log in, receive JWT |
| `GET` | `/auth/me` | Private | Get own profile |
| `POST` | `/auth/logout` | Private | Stateless logout |

**Register body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

**Login body:**
```json
{
  "email": "jane@example.com",
  "password": "SecurePass1"
}
```

---

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/me` | Private | Get own profile |
| `PATCH` | `/users/me` | Private | Update name or avatar |
| `DELETE` | `/users/me` | Private | Delete own account |

**Update body (all fields optional):**
```json
{
  "name": "Jane Smith",
  "avatar": "https://example.com/avatar.png"
}
```

---

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/projects?page=1&limit=20` | Private | List own projects |
| `POST` | `/projects` | Private | Create a project |
| `GET` | `/projects/:slug` | Private | Get project by slug |
| `PATCH` | `/projects/:slug` | Private | Update a project |
| `DELETE` | `/projects/:slug` | Private | Delete a project |

**Create body:**
```json
{
  "name": "My AI Project",
  "description": "A research automation project",
  "slug": "my-ai-project"
}
```

---

### Workspaces

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/workspaces?page=1&limit=20` | Private | List own workspaces |
| `POST` | `/workspaces` | Private | Create a workspace |
| `GET` | `/workspaces/:slug` | Private | Get workspace by slug |
| `PATCH` | `/workspaces/:slug` | Private | Update a workspace |
| `DELETE` | `/workspaces/:slug` | Private | Delete a workspace |

### Phase 3 data foundation

All endpoints below are private and use the same response envelope as the rest of the API.

| Module | Endpoints |
|---|---|
| Data sources | `POST/GET /datasources`, `GET/PATCH/DELETE /datasources/:id`, `POST /datasources/:id/sync` |
| Metadata | `POST/GET /metadata/assets`, `GET/PATCH/DELETE /metadata/assets/:id`; CRUD for `/metadata/owners`, `/metadata/tags`, and `/metadata/domains` |
| Catalog | `GET /catalog/assets`, `GET /catalog/search`, `GET /catalog/:id` |
| Documents | `POST /documents/upload`, `GET /documents`, `GET/DELETE /documents/:id` |

`POST /documents/upload` consumes `multipart/form-data` with a `file` field plus `projectId` and `workspaceId` text fields. Files are stored beneath `storage/documents`, which is intentionally excluded from source control.

Catalog and metadata list endpoints accept `page` and `limit`. Catalog additionally supports `q`, `tag`, `owner`, `sortBy` (`name`, `createdAt`, `updatedAt`) and `sortOrder`.

### Data model additions

Phase 3 introduces `DataSource`, `MetadataAsset`, `MetadataSchema`, `MetadataColumn`, `MetadataOwner`, `MetadataTag`, `MetadataDomain`, and `Document`. Assets retain source, ownership, tagging, domain, schema, and column relationships.

```
Project + Workspace
  ├─ DataSource ── MetadataAsset ── MetadataSchema ── MetadataColumn
  ├─ MetadataOwner ──< asset owners
  ├─ MetadataTag ────< asset tags
  ├─ MetadataDomain ─< assets
  └─ Document
```

### PostgreSQL data source sync & lineage discovery

`POST /datasources` live-tests the connection before saving (PostgreSQL only — MySQL is accepted by the schema for future use but rejected with a clear error today, since there's no driver wired up for it yet). `POST /datasources/:id/sync` then connects for real and reconciles two things into the metadata catalog, read-only, from PostgreSQL's own system catalogs — never from guessing:

**What's automatically discovered:**
- Tables, views, and materialized views, across every non-system schema (not just `public`) — `information_schema` for tables/views, `pg_catalog` directly for materialized views (which `information_schema` doesn't expose at all).
- Columns and types for all three, and a new `MetadataSchema` snapshot only when a relation's columns actually changed since the last sync — this is what gives schema-change detection real history instead of hand-seeded fixtures.
- **Foreign keys** — `orders.customer_id → customers.id` becomes a `customers → orders` lineage edge (`READS_FROM`). Read via `pg_constraint`/`pg_attribute` with `unnest(conkey, confkey) WITH ORDINALITY`, not `information_schema.constraint_column_usage`, whose own documentation notes it doesn't reliably preserve column order for composite (multi-column) foreign keys.
- **View and materialized-view dependencies** — `orders → revenue_model` (a view built on `orders`), `revenue_model → monthly_revenue` (a materialized view built on that view), become `DERIVED_FROM` lineage edges. Read via `pg_depend`/`pg_rewrite` — every view and materialized view carries an internal rewrite rule, and Postgres records that rule's dependency on each relation it reads. Verified empirically against a real database with both a plain view and a materialized view stacked on top of each other before being relied on here.

**What is deliberately NOT invented:** PostgreSQL's catalogs only prove *structural* dependencies (an FK constraint exists; a view's defining query reads a table). They say nothing about *analytical* lineage — e.g. that a `dbt` model transforms `orders` into `revenue_model` when that relationship lives in application/orchestration code rather than a real Postgres object. Avenor does not fabricate that. Future lineage providers (a `dbt manifest.json` reader, a SQL parser, query-history mining, AI inference over table/column names) are expected to feed the same `MetadataLineage` table — `src/integrations/postgres/postgres.lineage.js`'s `introspectLineage()` returns a database-independent `{source, target, relationshipType, discoveryMethod, confidence, metadata}` shape specifically so persistence (in `datasource.service.js`) never needs to know it came from PostgreSQL specifically.

**Direction convention** (load-bearing — matches `traverseUpstream`/`traverseDownstream` in `metadata-intelligence.service.js`, not this task's own illustrative examples): `sourceAssetId` is always the upstream/cause side, `targetAssetId` the downstream/effect side, regardless of `relationshipType`'s label. A foreign key's source is the *referenced* table; a view dependency's source is the *base* relation.

**Sync is idempotent and self-healing:** re-running sync against an unchanged database creates zero duplicate rows (`@@unique([sourceAssetId, targetAssetId, relationshipType])`, upserted). If a foreign key or view is later dropped from the real database, the next sync removes the corresponding `MetadataLineage` row automatically — but *only* rows this same PostgreSQL sync mechanism created (tagged `metadata: {provider: "POSTGRESQL", discoveryMethod: ...}`) between two assets that belong to *this* data source. Manually created lineage, and lineage from any future provider, is never touched. Two data sources never get cross-linked — lineage resolution only ever looks at the relations discovered in the current sync's own result.

Schema introspection and lineage introspection fail independently: a sync summary always reports both, and a lineage failure (e.g. a restricted role that can query `information_schema` but not `pg_catalog`) doesn't roll back a successful schema sync:

```json
{
  "tablesScanned": 5, "assetsCreated": 5, "assetsUpdated": 0, "schemaChangesDetected": 0,
  "lineageDiscovered": 3, "lineageCreated": 3, "lineageRemoved": 0, "lineageError": null
}
```

**Known limitation:** if a table is dropped from the source database entirely (not just a constraint on it), lineage edges that referenced it are not retroactively cleaned up, since the stale-removal pass only considers relations present in the *current* sync's asset list. The stray `MetadataAsset` itself is also never deleted by sync today (sync only creates/updates). Re-syncing after dropping a table is a case worth revisiting before this goes further than a hackathon build.

### Avenor Metadata Intelligence Engine

All endpoints below are private and use the same response envelope as the rest of the API.

| Module | Endpoints |
|---|---|
| Lineage | `POST /metadata/lineage`, `GET /metadata/lineage/:assetId`, `GET /metadata/lineage/:assetId/upstream`, `GET /metadata/lineage/:assetId/downstream`, `GET /metadata/lineage/:assetId/graph` |
| Impact analysis | `GET /metadata/impact/:assetId` |
| Metadata search | `GET /metadata/intelligence/search?q=` |
| Schema comparison | `POST /metadata/schema/compare` |
| Investigations | `POST /investigations`, `GET /investigations`, `GET /investigations/:id`, `POST /investigations/:id/analyze` |

**Create a lineage edge:**
```json
POST /metadata/lineage
{
  "sourceAssetId": "b2b1...",
  "targetAssetId": "c3d4...",
  "relationshipType": "DOWNSTREAM",
  "confidence": 0.95,
  "metadata": { "source": "dbt", "detectedBy": "manual" }
}
```
`sourceAssetId` and `targetAssetId` must differ (rejected with `422`) and must resolve to assets in the same project/workspace. Duplicate `(source, target, relationshipType)` triples are rejected with `409` by the underlying unique constraint.

**Lineage graph (React Flow-ready):**
```json
GET /metadata/lineage/:assetId/graph
→ { "data": { "nodes": [{ "id": "...", "position": { "x": 0, "y": 0 }, "data": { "label": "orders", "depth": 0 } }], "edges": [{ "id": "...", "source": "...", "target": "...", "label": "DOWNSTREAM" }] } }
```

**Impact analysis:**
```json
GET /metadata/impact/:assetId
→ { "data": { "asset": {}, "affectedAssets": [{ "id": "...", "name": "revenue_dashboard", "depth": 3 }], "affectedDashboards": [], "affectedModels": [], "affectedPipelines": [], "totalImpact": 3 } }
```
Traversal is a single recursive SQL query (no N+1), guards against cycles with a path check, and caps at depth 25 as a hard safety net.

**Schema comparison** accepts either two `MetadataSchema` ids or two raw column snapshots:
```json
POST /metadata/schema/compare
{ "oldColumns": [{ "name": "customer_status", "dataType": "VARCHAR" }], "newColumns": [] }
→ { "data": { "changes": [{ "type": "COLUMN_REMOVED", "column": "customer_status", "severity": "HIGH" }] } }
```
Detected change types: `COLUMN_ADDED`, `COLUMN_REMOVED`, `COLUMN_RENAMED` (heuristic: same data type + similar name), `TYPE_CHANGED`, `NULLABLE_CHANGED`.

**Investigations** are stored as `DataIncident` rows. `POST /investigations` opens one (`status: "OPEN"`); `POST /investigations/:id/analyze` runs the deterministic investigation engine (loads the asset, its schema, upstream/downstream lineage, owners, recent schema changes, and impact analysis) and returns:
```json
{
  "incident": {},
  "rootAsset": {},
  "rootCauseCandidates": [],
  "schemaChanges": [],
  "upstreamAssets": [],
  "downstreamAssets": [],
  "affectedAssets": [],
  "owners": [],
  "recommendations": []
}
```
This is deterministic metadata reasoning — no LLM call. It is the tool the Investigation Agent (`src/ai/agents/investigator`) calls into.

### Autonomous Investigation Pipeline (Phase 2)

`POST /investigations/:id/analyze` (above) is the manual, single-hop mode — you supply the asset. `POST /investigations/:id/run` is the **autonomous** mode: given just the incident's `title`/`description`, it resolves the affected asset, traces root cause across the lineage graph (walking upstream past the reported asset if needed), analyzes impact, proposes a fix, and generates documentation — end to end, synchronously, in one call.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/investigations/:id/run` | Runs the full pipeline (Planner → Investigator → Impact → Fixer → Documentation) and returns the final stage |
| `GET` | `/investigations/:id/status` | Reads back the persisted `stage`/`status`/`error` — no recomputation |
| `GET` | `/investigations/:id/report` | Reads back the full structured report — no recomputation |

```json
POST /api/v1/investigations
{ "title": "Monthly Revenue dashboard is broken", "description": "Started failing after yesterday's deployment.", "workspaceId": "...", "projectId": "..." }

POST /api/v1/investigations/:id/run
→ { "data": { "investigationId": "...", "status": "COMPLETED", "error": null } }

GET /api/v1/investigations/:id/report
→ {
  "data": {
    "complete": true,
    "stage": "COMPLETED",
    "rootCause": { "type": "COLUMN_REMOVED", "column": "customer_status", "confidence": 0.85, "description": "..." },
    "evidence": [{ "asset": "orders", "finding": "Column \"customer_status\" was removed from the schema." }],
    "lineage": ["raw_orders", "orders", "revenue_model", "monthly_revenue", "revenue_dashboard"],
    "impact": { "summary": { "totalAffected": 3 }, "categories": { "dashboards": 1, "mlModels": 2, "pipelines": 0, "datasets": 0 }, "risk": "HIGH" },
    "proposedFix": { "status": "PROPOSED", "fixType": "COLUMN_REMOVED", "summary": "...", "sql": "...", "tests": [], "files": [], "risk": "HIGH" },
    "validation": { "valid": true, "risk": "LOW", "warnings": [], "blocked": false },
    "github": { "branch": "...", "prNumber": 42, "prUrl": "..." },
    "documentation": { "rootCause": "...", "resolution": { "status": "...", "timestamp": "..." }, "recommendations": [] },
    "timeline": [{ "type": "INVESTIGATION_STARTED", "message": "...", "createdAt": "..." }],
    "recommendation": "Avenor identified ... A pull request is ready for review: ..."
  }
}
```

`InvestigationStage` moves `PENDING → PLANNING → INVESTIGATING → ANALYZING_IMPACT → GENERATING_FIX → DOCUMENTING → COMPLETED`, or `FAILED` with a human-readable `error` if any stage throws (e.g. the Planner can't resolve an asset from the given text). Every stage's output is persisted on the `DataIncident` row as it completes.

**Safety:** every proposed fix is returned with `status: "PROPOSED"`. Nothing in this pipeline executes SQL, writes to a source database, merges code, or deploys — see `src/ai/README.md#safety`.

### Fix Approval & GitHub PR (Phase 3)

The pipeline above only ever produces a **proposal**. Turning it into a pull request is a separate, explicitly human-gated lifecycle tracked by `FixApprovalStatus`:

```
PROPOSED → (VALIDATED →) AWAITING_APPROVAL → APPROVED → PR_CREATED → RESOLVED
                                                  ↘ REJECTED (any point before a PR exists)
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/investigations/:id/fix` | The proposed fix, its approval status, validation result, and GitHub PR info (if any) |
| `POST` | `/investigations/:id/fix/validate` | Runs the deterministic Validator agent; advances to `AWAITING_APPROVAL` if safe, stays `PROPOSED` (blocked) if not |
| `POST` | `/investigations/:id/fix/approve` | **The only thing that ever sets `APPROVED`.** Also attempts GitHub PR creation immediately afterward |
| `POST` | `/investigations/:id/fix/reject` | `{ "reason"?: "..." }` — rejects a fix that hasn't reached `PR_CREATED` yet |
| `POST` | `/investigations/:id/fix/pr` | On-demand/retry PR creation (e.g. if GitHub wasn't connected or failed at approval time) |
| `GET` | `/investigations/:id/timeline` | Ordered `IncidentEvent` log of everything the pipeline (and reviewers) did |

A blocked fix (destructive SQL, wrong target asset, etc.) can never reach `AWAITING_APPROVAL`, and therefore can never be approved — `POST /fix/validate` is a hard gate, enforced server-side, not just a UI affordance.

`PR_CREATED` means a pull request is open and reviewable — it is **not** the same as resolved. `RESOLVED` is only ever set once GitHub's webhook confirms the PR was actually merged (see below); if GitHub isn't connected for the project (and no global fallback is set), `POST /fix/approve` still succeeds (the fix is `APPROVED`) but returns a `githubError` note instead of crashing, and `POST /fix/pr` can be retried once a repository is connected.

### GitHub Connection (Phase 4A)

Credentials belong to the user/integration layer, not to any one investigation:

```
User → GitHubConnection (OAuth-connected account) → GitHubRepository → Project
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/github/connect` | Private | Returns `{ url }` — a GitHub OAuth authorize URL bound to a fresh, single-use, 10-minute state |
| `GET` | `/github/callback` | Public* | GitHub redirects here after authorization; validates state, exchanges the code, stores the connection |
| `GET` | `/github/status` | Private | `{ connected, githubLogin, connectedAt }` |
| `GET` | `/github/account` | Private | Live GitHub profile for the connected account |
| `GET` | `/github/repositories` | Private | Live-discovers and normalizes accessible repositories |
| `POST` | `/github/repositories/:id/select` | Private | `{ "projectId": "..." }` — links a repository to a project you own |
| `DELETE` | `/github/connection` | Private | Disconnects GitHub (all connections for this user) |
| `POST` | `/github/webhook` | Public* | GitHub `pull_request` events — signature-verified, not JWT-authenticated |

\* Public here means "no JWT" — `/callback` is protected by its one-time OAuth `state`, and `/webhook` by an HMAC signature (`GITHUB_WEBHOOK_SECRET`). See `src/integrations/github/README.md` for the full security model, local setup, and why this is an OAuth App rather than a full GitHub App.

Once a project has a repository connected, `POST /investigations/:id/fix/approve` and `/fix/pr` use that connection's token automatically — no per-investigation configuration. A project with nothing connected falls back to the legacy global `GITHUB_TOKEN`/`GITHUB_OWNER`/`GITHUB_REPO` env vars from Phase 3.

A merged pull request (via the webhook) moves the incident to `FixApprovalStatus.RESOLVED` and `DataIncidentStatus.RESOLVED`, and logs `GITHUB_PR_MERGED` + `INCIDENT_RESOLVED` on the timeline; a closed-without-merge PR logs `GITHUB_PR_CLOSED` without resolving anything.

### AI layer

`src/ai/` hosts the provider-agnostic tool functions (`metadataSearchTool`, `getAssetTool`, `getUpstreamLineageTool`, `getDownstreamLineageTool`, `impactAnalysisTool`, `schemaChangeTool`, `getOwnerTool`, `getIncidentTool`), the Planner/Investigator/Impact/Fixer/Validator/Documentation agents, the orchestrator, and a swappable LLM provider abstraction (`AI_PROVIDER=fireworks`, optional — the pipeline, including validation and approval, is fully deterministic with it unset). Not exposed over HTTP directly; driven through `/investigations/:id/run` and `/investigations/:id/fix/*`. See `src/ai/README.md`.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `5000` | HTTP server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT access token lifetime |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window per IP |
| `BCRYPT_ROUNDS` | No | `12` | bcrypt work factor |
| `AI_PROVIDER` | No | *(empty)* | `fireworks` to enable AI-enriched agent prose; unset runs the investigation pipeline fully deterministically |
| `AI_MODEL` | No | `accounts/fireworks/models/llama-v3p1-70b-instruct` | Model id passed to the provider |
| `FIREWORKS_API_KEY` | No | — | Required only when `AI_PROVIDER=fireworks` |
| `GITHUB_TOKEN` | No | — | Required for `/fix/approve` and `/fix/pr` to actually open a PR; both endpoints degrade to a clean `503` without it |
| `GITHUB_OWNER` | No | — | Repository owner/org for PR creation |
| `GITHUB_REPO` | No | — | Repository name for PR creation |
| `GITHUB_DEFAULT_BRANCH` | No | `main` | Base branch PRs are opened against when a project has no repository connected |
| `GITHUB_CLIENT_ID` | No | — | GitHub OAuth App client id — enables `GET /github/connect` |
| `GITHUB_CLIENT_SECRET` | No | — | GitHub OAuth App client secret |
| `GITHUB_REDIRECT_URI` | No | derived from the request | Must exactly match the OAuth App's registered callback URL in production |
| `GITHUB_WEBHOOK_SECRET` | No | — | Enables `POST /github/webhook` signature verification |

---

### Start with Docker Compose (includes PostgreSQL)

```bash
docker compose up --build
```

### Production build only

```bash
docker build -t avenor-backend .
docker run -p 5000:5000 --env-file .env avenor-backend
```

---

## Architectural Decisions

### Why ES Modules (`"type": "module"`)?
ES Modules are the Node.js standard. They enable top-level `await`, work natively with modern tooling, and align with browser JS — critical for long-term maintainability.

### Why `config/env.js` instead of direct `process.env`?
Centralised env validation fails the process at startup if a required variable is missing. This surfaces configuration errors immediately rather than causing mysterious runtime failures.

### Why `AppError` + global error middleware?
Throwing `AppError` anywhere in the stack — service, middleware, anywhere — produces a consistent JSON response. Developer errors (programming mistakes) are caught separately and never expose stack traces to clients.

### Why Zod over Joi or express-validator?
Zod is TypeScript-native (excellent JSDoc inference), produces precise error paths, strips unknown fields automatically, and is the de facto standard in modern Node.js stacks.

### Why separate `app.js` and `server.js`?
`app.js` creates the Express app without binding a port. This makes it importable in tests without side effects. `server.js` handles the infrastructure: port binding, DB connection, and graceful shutdown signals.

### Why service layers?
Business logic in services is testable without HTTP. Any developer can test `authService.registerUser()` directly. If we add a WebSocket or gRPC transport later, it reuses the same service — no duplication.

### Why `asyncHandler`?
Eliminates boilerplate `try/catch` from every async controller. All errors flow to the global middleware. Controllers become 3–5 lines of intentional code.

### Why Prisma over raw SQL or Sequelize?
Prisma's schema-first approach makes the data model the single source of truth. The generated client is fully typed (even in JS via JSDoc inference). Migrations are version-controlled alongside code.

### Why UUIDs instead of auto-increment integers?
UUIDs are safe to expose in URLs and APIs — sequential integers leak business metrics (number of users, number of projects). UUIDs also make multi-region database sharding trivial in the future.

### Why bcryptjs over bcrypt?
`bcryptjs` is a pure-JavaScript implementation that requires no native build tools (Python, node-gyp, Visual Studio Build Tools). This dramatically simplifies Docker builds and CI pipelines.

### Why slugs instead of IDs in URLs?
`/projects/my-research-project` is more readable, bookmarkable, and SEO-friendly than `/projects/a3f4-...`. Slugs have unique constraints in the DB and are immutable once set (to prevent broken links).
