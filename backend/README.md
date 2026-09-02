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
│   │   └── workspaces/
│   │       ├── workspace.routes.js
│   │       ├── workspace.controller.js
│   │       ├── workspace.service.js
│   │       └── workspace.validation.js
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
│   ├── ai/                     # ← Reserved for AI agents (empty)
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
| Data sources | `POST/GET /datasources`, `GET/PATCH/DELETE /datasources/:id` |
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
