import { createStarterFlow } from "@/lib/editor/node-factory";
import { editorHydrationPayloadSchema, workflowDocumentSchema } from "@/lib/workflows/schemas";
import type {
  EditorHydrationPayload,
  PersistedWorkflowEdge,
  PersistedWorkflowNode,
  WorkflowDocument,
} from "@/types/workflow";
import type { WorkflowEdge, WorkflowNode } from "@/types/editor";

export const DEFAULT_WORKFLOW_NAME = "Product Marketing Kit Generator";
export const DEFAULT_WORKFLOW_DESCRIPTION =
  "A Krea-style multimodal workflow demonstrating all six required node types.";

export function createWorkflowDocument(input: {
  description?: string;
  edges: WorkflowEdge[];
  name?: string;
  nodes: WorkflowNode[];
  viewport?: WorkflowDocument["viewport"];
}): WorkflowDocument {
  return workflowDocumentSchema.parse({
    description: input.description ?? DEFAULT_WORKFLOW_DESCRIPTION,
    edges: input.edges.map<PersistedWorkflowEdge>((edge) => ({
      animated: edge.animated,
      data: edge.data,
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      style: edge.style,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
      type: edge.type,
    })),
    name: input.name ?? DEFAULT_WORKFLOW_NAME,
    nodes: input.nodes.map<PersistedWorkflowNode>((node) => ({
      data: {
        ...node.data,
        isExpanded: undefined,
        previewUrl:
          node.data.kind === "upload-image" || node.data.kind === "upload-video"
            ? (node.data.mediaUrl ??
              node.data.mediaDataUrl ??
              node.data.previewUrl)
            : node.data.previewUrl,
      },
      id: node.id,
      position: node.position,
      type: "workflow",
    })),
    version: 1,
    viewport: input.viewport ?? null,
  });
}

export function workflowDocumentToFlow(document: WorkflowDocument) {
  return {
    edges: document.edges.map<WorkflowEdge>((edge) => ({
      ...edge,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
    })),
    nodes: document.nodes.map<WorkflowNode>((node) => ({
      ...node,
      data: {
        ...node.data,
        isExpanded: false,
        previewUrl:
          node.data.previewUrl ??
          (node.data.kind === "upload-image" || node.data.kind === "upload-video"
            ? (node.data.mediaUrl ?? node.data.mediaDataUrl)
            : undefined),
      },
      selected: false,
    })),
    viewport: document.viewport ?? null,
  };
}

export function getWorkflowDocumentHash(document: WorkflowDocument) {
  return JSON.stringify(document);
}

export function parseWorkflowDocument(raw: unknown) {
  return workflowDocumentSchema.parse(raw);
}

export function parseEditorHydrationPayload(raw: unknown) {
  return editorHydrationPayloadSchema.parse(raw);
}

export function createStarterEditorPayload(): EditorHydrationPayload {
  const starter = createStarterFlow();

  return {
    document: createWorkflowDocument({
      description: DEFAULT_WORKFLOW_DESCRIPTION,
      edges: starter.edges,
      name: DEFAULT_WORKFLOW_NAME,
      nodes: starter.nodes,
    }),
    runHistory: [],
    source: "sample",
    versions: [],
    workflowId: null,
  };
}
