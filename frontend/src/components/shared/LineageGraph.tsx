import { useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, MarkerType, Position, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, Eye, Layers, BarChart3, Cpu, Workflow, Box, AlertTriangle } from "lucide-react";
import type { LineageGraphEdge, LineageGraphNode } from "../../lib/api/types";
import { layoutLineageGraph, reachableFrom } from "../../utils/graphLayout";
import { cn } from "../../utils/cn";

interface LineageGraphProps {
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
  rootCauseNodeId?: string;
  focusNodeId?: string;
  className?: string;
  height?: number;
  autoLayout?: boolean;
  minimap?: boolean;
  onNodeClick?: (nodeId: string) => void;
}

const ASSET_TYPE_META: Record<string, { icon: typeof Database; label: string }> = {
  TABLE: { icon: Database, label: "Table" },
  VIEW: { icon: Eye, label: "View" },
  MATERIALIZED_VIEW: { icon: Layers, label: "Materialized view" },
  DASHBOARD: { icon: BarChart3, label: "Dashboard" },
  MODEL: { icon: Cpu, label: "Model" },
  PIPELINE: { icon: Workflow, label: "Pipeline" },
};

function metaFor(assetType?: string) {
  if (!assetType) return { icon: Box, label: "Asset" };
  const upper = assetType.toUpperCase();
  return ASSET_TYPE_META[upper] ?? { icon: Box, label: assetType };
}

export const LINEAGE_LEGEND_ITEMS = [
  { icon: Database, label: "Table" },
  { icon: Eye, label: "View" },
  { icon: Layers, label: "Materialized view" },
  { icon: Box, label: "Other asset" },
];

function toFlowNode(node: LineageGraphNode, isRootCause: boolean, dimmed: boolean, isFocus: boolean): Node {
  return {
    id: node.id,
    position: node.position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { label: node.data.label, assetType: node.data.assetType, isRootCause, dimmed, isFocus },
    type: "avenorAsset",
  };
}

function AssetNode({ data }: { data: { label: string; assetType?: string; isRootCause?: boolean; dimmed?: boolean; isFocus?: boolean } }) {
  const { icon: Icon, label: typeLabel } = metaFor(data.assetType);
  return (
    <div
      title={typeLabel}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-elevated transition-opacity",
        data.isRootCause
          ? "border-danger/50 bg-danger-muted text-danger"
          : data.isFocus
            ? "border-accent bg-accent-muted text-text-primary ring-2 ring-accent/30"
            : "border-border bg-surface-elevated text-text-primary",
        data.dimmed && "opacity-30"
      )}
    >
      {data.isRootCause ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Icon className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />}
      <span className="font-mono">{data.label}</span>
    </div>
  );
}

const nodeTypes = { avenorAsset: AssetNode };

export function LineageGraph({ nodes, edges, rootCauseNodeId, focusNodeId, className, height = 420, autoLayout, minimap, onNodeClick }: LineageGraphProps) {
  const positionedNodes = useMemo(() => (autoLayout ? layoutLineageGraph(nodes, edges) : nodes), [nodes, edges, autoLayout]);
  const focusSet = useMemo(() => (focusNodeId ? reachableFrom(focusNodeId, edges) : null), [focusNodeId, edges]);

  const flowNodes = useMemo(
    () =>
      positionedNodes.map((n) => toFlowNode(n, n.id === rootCauseNodeId, Boolean(focusSet && !focusSet.has(n.id)), n.id === focusNodeId)),
    [positionedNodes, rootCauseNodeId, focusSet, focusNodeId]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => {
        const onPath = focusSet ? focusSet.has(e.source) && focusSet.has(e.target) : true;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: Boolean(focusNodeId) && onPath,
          style: { stroke: onPath ? "var(--color-accent)" : "var(--color-border-strong)", opacity: onPath ? 1 : 0.3 },
          labelStyle: { fill: "var(--color-text-tertiary)", fontSize: 10 },
          markerEnd: { type: MarkerType.ArrowClosed, color: onPath ? "var(--color-accent)" : "var(--color-border-strong)" },
        };
      }),
    [edges, focusSet, focusNodeId]
  );

  return (
    <div className={className} style={{ height }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        onNodeClick={onNodeClick ? (_, node) => onNodeClick(node.id) : undefined}
      >
        <Background color="var(--color-border)" gap={20} />
        <Controls showInteractive={false} className="[&>button]:border-border [&>button]:bg-surface-elevated [&>button]:fill-text-primary" />
        {minimap && (
          <MiniMap
            pannable
            zoomable
            className="bg-surface-elevated! border! border-border!"
            maskColor="rgba(21, 24, 30, 0.06)"
            nodeColor="var(--color-border-strong)"
          />
        )}
      </ReactFlow>
    </div>
  );
}
