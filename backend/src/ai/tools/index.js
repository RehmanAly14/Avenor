// src/ai/tools/index.js
// Aggregated tool registry for the future agent/orchestrator layer.
// Every tool takes a single plain object (including `userId` for
// workspace scoping) and returns plain JSON — no provider SDK types
// leak in here, so this registry can be handed to any LLM tool-calling
// interface (OpenAI, Anthropic, LangGraph, ...) unchanged.

export { metadataSearchTool } from "./metadataSearchTool.js";
export { getAssetTool } from "./getAssetTool.js";
export { getUpstreamLineageTool } from "./getUpstreamLineageTool.js";
export { getDownstreamLineageTool } from "./getDownstreamLineageTool.js";
export { impactAnalysisTool } from "./impactAnalysisTool.js";
export { schemaChangeTool } from "./schemaChangeTool.js";
export { getOwnerTool } from "./getOwnerTool.js";
export { getIncidentTool } from "./getIncidentTool.js";
