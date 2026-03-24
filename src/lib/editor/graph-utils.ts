import type { WorkflowEdge, WorkflowNode } from "@/types/editor";

export function getIncomingEdges(nodeId: string, edges: WorkflowEdge[]) {
  return edges.filter((edge) => edge.target === nodeId);
}

export function getOutgoingEdges(nodeId: string, edges: WorkflowEdge[]) {
  return edges.filter((edge) => edge.source === nodeId);
}

export function collectUpstreamNodeIds(
  targetNodeIds: string[],
  edges: WorkflowEdge[],
): string[] {
  const visited = new Set(targetNodeIds);
  const stack = [...targetNodeIds];

  while (stack.length > 0) {
    const currentId = stack.pop();

    if (!currentId) {
      continue;
    }

    for (const edge of getIncomingEdges(currentId, edges)) {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        stack.push(edge.source);
      }
    }
  }

  return Array.from(visited);
}

export function resolveExecutionNodeIds(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  scope: "full" | "selected" | "single",
): string[] {
  if (scope === "full") {
    return nodes.map((node) => node.id);
  }

  const selectedNodeIds = nodes
    .filter((node) => node.selected)
    .map((node) => node.id);

  if (selectedNodeIds.length === 0) {
    return [];
  }

  if (scope === "single") {
    return collectUpstreamNodeIds([selectedNodeIds[0]], edges);
  }

  return collectUpstreamNodeIds(selectedNodeIds, edges);
}

export function getExecutionBatches(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  includedNodeIds: string[],
): string[][] {
  const included = new Set(includedNodeIds);
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();

  for (const nodeId of includedNodeIds) {
    indegree.set(nodeId, 0);
    outgoing.set(nodeId, []);
  }

  for (const edge of edges) {
    if (!included.has(edge.source) || !included.has(edge.target)) {
      continue;
    }

    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }

  let frontier = includedNodeIds.filter((nodeId) => (indegree.get(nodeId) ?? 0) === 0);
  const batches: string[][] = [];

  while (frontier.length > 0) {
    batches.push(frontier);
    const nextFrontier: string[] = [];

    for (const nodeId of frontier) {
      for (const targetId of outgoing.get(nodeId) ?? []) {
        const nextDegree = (indegree.get(targetId) ?? 0) - 1;
        indegree.set(targetId, nextDegree);

        if (nextDegree === 0) {
          nextFrontier.push(targetId);
        }
      }
    }

    frontier = nextFrontier;
  }

  return batches;
}
