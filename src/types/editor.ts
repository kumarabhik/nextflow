import type { Connection, Edge, Node, XYPosition } from "@xyflow/react";

import type { QuickNodeType } from "@/lib/editor/node-catalog";

export type PortDataKind = "text" | "image" | "video" | "number";

export type NodePort = {
  id: string;
  label: string;
  kind: PortDataKind;
  accepts?: PortDataKind[];
  required?: boolean;
  multiple?: boolean;
};

export type WorkflowNodeData = {
  kind: QuickNodeType;
  title: string;
  description: string;
  accent: string;
  implemented: boolean;
  isExpanded?: boolean;
  inputPorts: NodePort[];
  outputPorts: NodePort[];
  textValue?: string;
  helperText?: string;
  mediaAssetId?: string;
  mediaName?: string;
  mediaDataUrl?: string;
  mediaMimeType?: string;
  mediaUrl?: string;
  previewUrl?: string;
  modelId?: string;
  systemPromptValue?: string;
  userMessageValue?: string;
  resultText?: string;
  xPercent?: string;
  yPercent?: string;
  widthPercent?: string;
  heightPercent?: string;
  timestampValue?: string;
};

export type WorkflowNode = Node<WorkflowNodeData, "workflow">;

export type WorkflowEdgeData = {
  kind: PortDataKind;
};

export type WorkflowEdge = Edge<WorkflowEdgeData>;

export type WorkflowConnection = Connection;

export type StarterFlow = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type NewNodeOptions = {
  id?: string;
  position: XYPosition;
  title?: string;
  isExpanded?: boolean;
  textValue?: string;
  mediaAssetId?: string;
  mediaName?: string;
  mediaDataUrl?: string;
  mediaMimeType?: string;
  mediaUrl?: string;
  previewUrl?: string;
  helperText?: string;
  modelId?: string;
  systemPromptValue?: string;
  userMessageValue?: string;
  resultText?: string;
  xPercent?: string;
  yPercent?: string;
  widthPercent?: string;
  heightPercent?: string;
  timestampValue?: string;
};
