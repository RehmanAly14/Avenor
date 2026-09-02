# AI Module

This directory contains the AI agent infrastructure for the Avenor Autonomous DataOps Platform.

## Architecture

```
ai/
├── tools/            # Provider-agnostic AI tools (metadata search, lineage, etc.)
├── agents/
│   ├── planner/      # Plans investigation strategy
│   ├── investigator/ # Runs deterministic metadata investigation
│   ├── impact/       # Performs impact analysis
│   ├── fixer/        # Generates fix recommendations
│   └── documentation/ # Generates documentation
├── orchestrator/     # Coordinates multi-agent workflows
└── index.js          # AI module entry point
```

## Tool Layer

The `tools/` directory contains provider-agnostic functions that wrap the Metadata Intelligence Engine's services. Each tool accepts plain objects and returns structured JSON — no OpenAI/LangChain coupling.

Tools available:
- `metadataSearchTool` — search across assets, columns, owners, tags, domains
- `getAssetTool` — fetch a single metadata asset
- `getUpstreamLineageTool` — traverse upstream dependencies
- `getDownstreamLineageTool` — traverse downstream dependencies
- `impactAnalysisTool` — recursive impact analysis with depth tracking
- `schemaChangeTool` — compare two schema snapshots
- `getOwnerTool` — fetch owner and owned assets
- `getIncidentTool` — fetch incident and affected assets

## Agent Layer

Agents are orchestrated via the `orchestrator/`. The first concrete agent is the **Investigation Agent**, which performs deterministic metadata investigation using the available tools.

AI framework integration (OpenAI, Anthropic, LangGraph) will be added when agents are implemented. This directory is reserved for that future work.

**Do not add production code here until the Metadata Intelligence Engine is stable.**
