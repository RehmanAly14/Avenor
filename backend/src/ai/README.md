# AI Module

This directory contains the AI agent infrastructure for the Avenor Autonomous DataOps Platform — the full pipeline that turns a free-text incident report into a diagnosed root cause, a validated remediation proposal, and (once a human approves it) a GitHub pull request.

## Architecture

```
ai/
├── providers/         # Swappable LLM provider abstraction (generateText/generateStructured)
├── tools/              # Provider-agnostic tools wrapping the Metadata Intelligence Engine
├── agents/
│   ├── planner/         # Resolves the reported asset, produces the task plan
│   ├── investigator/    # Deterministic root-cause tracing (multi-hop upstream walk)
│   ├── impact/           # Downstream impact categorization + risk level
│   ├── fixer/             # Deterministic, template-based fix proposals (PROPOSED only)
│   ├── validator/        # Deterministic safety gate — blocks destructive SQL, no LLM
│   └── documentation/    # Assembles the final incident knowledge record
├── orchestrator/       # Runs the investigation pipeline, persists state to DataIncident
└── index.js             # AI module entry point
```

GitHub PR creation lives outside this directory, in `src/integrations/github/` — it's an external integration, not an agent, and is only ever invoked after explicit human approval (see `src/modules/investigation/fix.service.js`).

## Pipeline

```
Planner -> Investigator -> Impact -> Fixer -> [human approval] -> GitHub PR -> Documentation
                                        ^
                                  Validator gates
                                  every fix here
```

`orchestrator.runPipeline({ investigationId, userId })` (driven by `POST /investigations/:id/run`) runs Planner → Investigator → Impact → Fixer → Documentation synchronously and persists each stage's output onto the `DataIncident` row (`stage`, `plan`, `evidence`, `impact`, `proposedFix`, `documentation`, `error`) as it completes — so `GET /investigations/:id/status` and `GET /investigations/:id/report` read the result back without recomputing anything, and a stage failure is caught and recorded as `InvestigationStage.FAILED` with a human-readable `error`, never thrown as a 500.

What happens next is **not** part of that pipeline — it's a separate, explicitly human-gated lifecycle tracked by `FixApprovalStatus` (`PROPOSED → VALIDATED → AWAITING_APPROVAL → APPROVED → PR_CREATED → RESOLVED`, or `REJECTED` at any point before a PR exists):

1. `POST /investigations/:id/fix/validate` runs the Validator agent — deterministic, no LLM.
2. `POST /investigations/:id/fix/approve` — the *only* thing that ever sets `APPROVED`. Nothing in the pipeline sets it automatically. This also triggers GitHub PR creation.
3. `POST /investigations/:id/fix/pr` — on-demand/retry PR creation, for when GitHub wasn't configured (or failed) at approval time.

Every transition — pipeline stage or fix-lifecycle step — is appended to the `IncidentEvent` timeline (`GET /investigations/:id/timeline`), which is what a frontend uses to render the whole autonomous process, not just its final state.

**No hallucination by design**: every factual claim (assets, schemas, lineage, owners, schema changes) comes from a tool call backed by Prisma. The optional AI provider is only ever asked to rephrase prose *around* already-computed facts (the Fixer's `explanation` and the Documentation agent's `summary`) — never to produce facts, and never to decide whether SQL is safe (that's the Validator's job, and it is 100% deterministic). Both prose spots have a template fallback used whenever no provider is configured or a provider call fails.

Since none of this pipeline knows or cares where a `MetadataLineage` row came from, the Investigator's upstream walk (below) works identically whether that lineage was entered by hand or, as of the PostgreSQL data source sync (`POST /datasources/:id/sync`, see the top-level `README.md`), discovered automatically from a real database's foreign keys and view dependencies — no agent code changed to make that true.

## Tool Layer

The `tools/` directory contains provider-agnostic functions that wrap the Metadata Intelligence Engine's services. Each tool accepts plain objects (including `userId` for workspace scoping) and returns structured JSON — no OpenAI/LangChain coupling.

- `metadataSearchTool` — search across assets, columns, owners, tags, domains
- `getAssetTool` — fetch a single metadata asset
- `getUpstreamLineageTool` — traverse upstream dependencies
- `getDownstreamLineageTool` — traverse downstream dependencies
- `impactAnalysisTool` — recursive impact analysis with depth tracking
- `schemaChangeTool` — compare two schema snapshots
- `getOwnerTool` — fetch owner and owned assets
- `getIncidentTool` — fetch incident and affected assets

## Agent Layer

- **Planner** (`agents/planner`) — resolves which asset an incident's free-text title/description refers to, via `metadataSearchTool` + deterministic name-overlap ranking (never queries Prisma directly). Returns `null` for `assetId` — rather than guessing — when nothing matches well enough.
- **Investigator** (`agents/investigator`) — runs the Investigation Engine (`src/modules/investigation`) on the reported asset. If that asset has no direct schema change of its own, it walks upstream (closest first) checking each ancestor's own schema history until it finds one — this is what lets "the dashboard is broken" resolve to "customer_status was removed from orders" several hops away.
- **Impact** (`agents/impact`) — reshapes downstream impact into `{dashboards, datasets, mlModels, pipelines}` counts and a `LOW`/`MEDIUM`/`HIGH` risk level. Reuses `impactAnalysisTool`; accepts a precomputed `affectedAssets` list to avoid a duplicate query when the Investigator already has one. Also exports `bucketAssetsByCategory`, reused by the Documentation agent so categorization logic lives in exactly one place.
- **Fixer** (`agents/fixer`) — deterministic, template-based fix proposals keyed on the detected schema-change type (`COLUMN_REMOVED`, `TYPE_CHANGED`, `NULLABLE_CHANGED`, `COLUMN_RENAMED`), including suggested dbt-style model/test files. Always returns `status: "PROPOSED"` — it never executes SQL or touches a database connection.
- **Validator** (`agents/validator`) — the safety gate. Pure, deterministic pattern/structure checks (`sqlValidator.js` + `safetyRules.js`): blocks `DROP DATABASE`/`DROP TABLE`/`DROP SCHEMA`/`TRUNCATE` and unrestricted `DELETE`/`UPDATE` outright, flags `ALTER TABLE ... DROP`/`GRANT`/`REVOKE` as high risk, and cross-checks that the SQL actually targets the asset and column the investigation found. **No LLM is ever asked to judge whether SQL is destructive.**
- **Documentation** (`agents/documentation`) — assembles the final knowledge record and stores it on `DataIncident.documentation`. Called once at the end of the pipeline, and again (via `orchestrator.refreshDocumentation`) whenever validation, approval, or PR creation add new information — so the record always reflects the incident's *current* state. Since DataHub has been removed, Avenor's own PostgreSQL database is the incident knowledge base.

## Provider Layer

`providers/` is a minimal, swappable abstraction — `generateText(prompt, opts)` / `generateStructured(prompt, opts)` / `isConfigured()` — selected via env:

```env
AI_PROVIDER=fireworks
AI_MODEL=accounts/fireworks/models/llama-v3p1-70b-instruct
FIREWORKS_API_KEY=...
```

`AI_PROVIDER` is empty by default, which means `isConfigured()` returns `false` and every agent falls back to its deterministic template — the pipeline (including validation, approval, and PR creation) is fully functional, testable, and demoable with zero external calls. Fireworks is implemented as the first (and currently only) provider, via a single `fetch` call against its OpenAI-compatible chat completions endpoint — no SDK dependency.

## Safety

- The Fixer never executes anything — every proposal is returned with `status: "PROPOSED"`.
- The Validator is deterministic and authoritative: an LLM being configured or not never changes whether a fix is blocked.
- `FixApprovalStatus.APPROVED` is set **only** by `POST /investigations/:id/fix/approve` — nothing in the pipeline sets it automatically, and a blocked (invalid) fix cannot reach `AWAITING_APPROVAL`.
- GitHub PR creation never merges, never pushes to the default branch directly, and if GitHub isn't configured it returns a clean `503` — approval still succeeds, and PR creation can be retried later via `POST /investigations/:id/fix/pr`.
- Nothing in this pipeline ever writes to a source/production database.
