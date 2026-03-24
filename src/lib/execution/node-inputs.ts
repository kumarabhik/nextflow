import type { WorkflowEdge, WorkflowNode } from "@/types/editor";

type NodeOutputValue = string | string[];

function getManualInputValue(node: WorkflowNode, handleId: string): string | undefined {
  switch (node.data.kind) {
    case "crop-image": {
      if (handleId === "x_percent") return node.data.xPercent;
      if (handleId === "y_percent") return node.data.yPercent;
      if (handleId === "width_percent") return node.data.widthPercent;
      if (handleId === "height_percent") return node.data.heightPercent;
      return undefined;
    }
    case "extract-frame":
      return handleId === "timestamp" ? node.data.timestampValue : undefined;
    case "run-llm": {
      if (handleId === "system_prompt") return node.data.systemPromptValue;
      if (handleId === "user_message") return node.data.userMessageValue;
      return undefined;
    }
    default:
      return undefined;
  }
}

export function getResolvedInputValue(
  node: WorkflowNode,
  handleId: string,
  edges: WorkflowEdge[],
  outputs: Map<string, NodeOutputValue>,
) {
  const incomingEdges = edges.filter(
    (edge) => edge.target === node.id && edge.targetHandle === handleId,
  );
  const port = node.data.inputPorts.find((input) => input.id === handleId);

  if (incomingEdges.length === 0) {
    return getManualInputValue(node, handleId);
  }

  const values = incomingEdges
    .map((edge) => outputs.get(edge.source))
    .filter((value): value is NodeOutputValue => value !== undefined);

  if (port?.multiple) {
    return values.flatMap((value) => (Array.isArray(value) ? value : [value]));
  }

  const first = values[0];
  return Array.isArray(first) ? first[0] : first;
}
