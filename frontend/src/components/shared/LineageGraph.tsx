import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType, Position, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Database, AlertTriangle } from "lucide-react";
import type { LineageGraphEdge, LineageGraphNode } from "../../lib/api/types";

interface LineageGraphProps {
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
  rootCauseNodeId?: string;
  className?: string;
}

function toFlowNode(node: LineageGraphNode, isRootCause: boolean): Node {
  return {
    id: node.id,
    position: node.position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { label: node.data.label, isRootCause },
    type: "avenorAsset",
  };
}

function AssetNode({ data }: { data: { label: string; isRootCause?: boolean } }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium shadow-elevated ${
        data.isRootCause ? "border-danger/50 bg-danger-muted text-danger" : "border-border bg-surface-elevated text-text-primary"
      }`}
    >
      {data.isRootCause ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Database className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />}
      <span className="font-mono">{data.label}</span>
    </div>
  );
}

const nodeTypes = { avenorAsset: AssetNode };

export function LineageGraph({ nodes, edges, rootCauseNodeId, className }: LineageGraphProps) {
  const flowNodes = useMemo(() => nodes.map((n) => toFlowNode(n, n.id === rootCauseNodeId)), [nodes, rootCauseNodeId]);
  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: false,
        style: { stroke: "var(--color-border-strong)" },
        labelStyle: { fill: "var(--color-text-tertiary)", fontSize: 10 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-border-strong)" },
      })),
    [edges]
  );

  return (
    <div className={className} style={{ height: 420 }}>
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
      >
        <Background color="var(--color-border)" gap={20} />
        <Controls showInteractive={false} className="[&>button]:border-border [&>button]:bg-surface-elevated [&>button]:fill-text-primary" />
      </ReactFlow>
    </div>
  );
}
