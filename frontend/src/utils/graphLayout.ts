import dagre from "@dagrejs/dagre";
import type { LineageGraphNode, LineageGraphEdge } from "../lib/api/types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 48;

/**
 * Left-to-right layered auto-layout for a lineage graph. Backend-supplied
 * `position`/`depth` values are a simple linear chain — this replaces them
 * with a real DAG layout via dagre so branching lineage doesn't overlap.
 */
export function layoutLineageGraph(nodes: LineageGraphNode[], edges: LineageGraphEdge[]): LineageGraphNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 32, ranksep: 90 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return { ...node, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } };
  });
}

/** BFS over an undirected view of the graph — used for lineage "focus mode" to highlight a node's full upstream + downstream path. */
export function reachableFrom(nodeId: string, edges: LineageGraphEdge[]): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push(edge.target);
    adjacency.get(edge.target)!.push(edge.source);
  }

  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return visited;
}
