# src/ai/README.md

# AI Module (Reserved)

This directory is reserved for the Avenor AI subsystem.

## Planned Structure

```
ai/
├── agents/           # LangGraph agent definitions
│   ├── base.agent.js
│   └── research.agent.js
│
├── rag/              # Retrieval-Augmented Generation
│   ├── embeddings.js
│   ├── vectorStore.js
│   └── retriever.js
│
├── mcp/              # Model Context Protocol clients
│   └── mcp.client.js
│
├── tools/            # LangChain / LangGraph tools
│   └── datahub.tool.js
│
├── memory/           # Agent memory / state management
│   └── memory.store.js
│
└── index.js          # AI module entry point
```

## Integration Notes

- AI agents will be invoked via REST endpoints mounted at `/api/v1/agents`
- Agent sessions will be persisted in PostgreSQL via a future `AgentSession` Prisma model
- Vector search will connect to pgvector or a dedicated vector database
- DataHub integration will be added as an MCP tool

**Do not add any code to this directory** until the backend foundation is stable.
