import type { WorkflowEdge, WorkflowNode } from "@/types/editor";

export type RunStatus = "queued" | "running" | "success" | "failed";

export type WorkflowRunScope = "full" | "selected" | "single";

export type NodeExecutionStatus =
  | "idle"
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "waiting"
  | "skipped";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "local" | "error";

export type PersistedWorkflowNode = Pick<
  WorkflowNode,
  "id" | "type" | "position" | "data"
>;

export type PersistedWorkflowEdge = Pick<
  WorkflowEdge,
  | "animated"
  | "data"
  | "id"
  | "source"
  | "sourceHandle"
  | "style"
  | "target"
  | "targetHandle"
  | "type"
>;

export type WorkflowDocument = {
  version: 1;
  name: string;
  description?: string;
  nodes: PersistedWorkflowNode[];
  edges: PersistedWorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  } | null;
};

export type WorkflowVersionSummary = {
  id: string;
  versionNumber: number;
  createdAtLabel: string;
};

export type EnvironmentStatus = {
  clerkConfigured: boolean;
  databaseConfigured: boolean;
  databasePlaceholder: boolean;
  geminiConfigured: boolean;
  issues: string[];
  remoteExecutionReady: boolean;
  triggerConfigured: boolean;
};

export type DatabaseHealth = {
  message: string;
  mode: "error" | "missing" | "placeholder" | "ready";
  ok: boolean;
};

export type BinaryHealth = {
  command: string;
  message: string;
  ok: boolean;
};

export type AuthHealth = {
  configured: boolean;
  message: string;
  signedIn: boolean;
};

export type EnvironmentHealthReport = {
  auth: AuthHealth;
  checkedAt: string;
  database: DatabaseHealth;
  environment: EnvironmentStatus;
  nextChecks: string[];
  runtime: {
    ffmpeg: BinaryHealth;
    ffprobe: BinaryHealth;
  };
};

export type WorkflowPersistenceSource = "database" | "local" | "memory";

export type NodeRunRecord = {
  id: string;
  nodeId: string;
  nodeTitle: string;
  nodeType: string;
  status: Exclude<NodeExecutionStatus, "idle">;
  summary: string;
  durationLabel: string;
  durationMs: number;
  dependencyNodeIds?: string[];
  errorMessage?: string;
  inputSummary?: string;
  outputSummary?: string;
};

export type WorkflowRunItem = {
  id: string;
  createdAtLabel: string;
  createdAtMs: number;
  status: RunStatus;
  durationLabel: string;
  durationMs: number;
  scope: WorkflowRunScope;
  summary: string;
  nodeRuns: NodeRunRecord[];
  persistedSource?: WorkflowPersistenceSource;
  selectedNodeIds?: string[];
};

export type EditorHydrationPayload = {
  workflowId: string | null;
  document: WorkflowDocument;
  runHistory: WorkflowRunItem[];
  source: "sample" | "server" | "local";
  versions: WorkflowVersionSummary[];
};

export type SaveRequest = {
  createVersion: boolean;
  reason: "autosave" | "manual" | "import" | "reset";
  token: number;
};

export type NodeRuntimeState = {
  durationMs?: number;
  errorMessage?: string;
  outputValue?: string | string[];
  startedAt?: number;
  status: NodeExecutionStatus;
  summary?: string;
};
