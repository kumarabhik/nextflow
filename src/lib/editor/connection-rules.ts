import { MarkerType } from "@xyflow/react";

import { getInputPort, getPortKind } from "@/lib/editor/node-factory";
import type {
  PortDataKind,
  WorkflowConnection,
  WorkflowEdge,
  WorkflowNode,
} from "@/types/editor";

const edgeColorByKind: Record<PortDataKind, string> = {
  image: "rgba(245, 158, 11, 0.95)",
  number: "rgba(52, 211, 153, 0.95)",
  text: "rgba(103, 232, 249, 0.95)",
  video: "rgba(244, 114, 182, 0.95)",
};

function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  edges: WorkflowEdge[],
): boolean {
  const adjacency = new Map<string, string[]>();

  for (const edge of edges) {
    const existing = adjacency.get(edge.source) ?? [];
    existing.push(edge.target);
    adjacency.set(edge.source, existing);
  }

  const next = adjacency.get(sourceId) ?? [];
  next.push(targetId);
  adjacency.set(sourceId, next);

  const stack = [targetId];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || seen.has(current)) {
      continue;
    }

    if (current === sourceId) {
      return true;
    }

    seen.add(current);

    for (const child of adjacency.get(current) ?? []) {
      stack.push(child);
    }
  }

  return false;
}

export function isValidEditorConnection(
  connection: WorkflowConnection | WorkflowEdge,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): boolean {
  if (
    !connection.source ||
    !connection.target ||
    !connection.sourceHandle ||
    !connection.targetHandle
  ) {
    return false;
  }

  if (connection.source === connection.target) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);
  const targetNode = nodes.find((node) => node.id === connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  const sourceKind = getPortKind(sourceNode, connection.sourceHandle, "output");
  const targetPort = getInputPort(targetNode, connection.targetHandle);

  if (!sourceKind || !targetPort) {
    return false;
  }

  const hasDuplicateConnection = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.target === connection.target &&
      edge.targetHandle === connection.targetHandle,
  );

  if (hasDuplicateConnection) {
    return false;
  }

  const hasTargetHandleTaken = edges.some(
    (edge) =>
      edge.target === connection.target &&
      edge.targetHandle === connection.targetHandle,
  );

  if (hasTargetHandleTaken && !targetPort.multiple) {
    return false;
  }

  const acceptedKinds = targetPort.accepts ?? [targetPort.kind];

  if (!acceptedKinds.includes(sourceKind)) {
    return false;
  }

  if (wouldCreateCycle(connection.source, connection.target, edges)) {
    return false;
  }

  return true;
}

export function createWorkflowEdge(
  connection: WorkflowConnection,
  nodes: WorkflowNode[],
): WorkflowEdge | null {
  if (
    !connection.source ||
    !connection.target ||
    !connection.sourceHandle ||
    !connection.targetHandle
  ) {
    return null;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);

  if (!sourceNode) {
    return null;
  }

  const sourceKind = getPortKind(sourceNode, connection.sourceHandle, "output");

  if (!sourceKind) {
    return null;
  }

  const color = edgeColorByKind[sourceKind];

  return {
    id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
    source: connection.source,
    sourceHandle: connection.sourceHandle,
    target: connection.target,
    targetHandle: connection.targetHandle,
    type: "smoothstep",
    animated: true,
    data: {
      kind: sourceKind,
    },
    style: {
      stroke: color,
      strokeWidth: 2.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color,
    },
  };
}
