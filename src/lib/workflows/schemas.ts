import { z } from "zod";

const portDataKindSchema = z.enum(["text", "image", "video", "number"]);

const nodePortSchema = z.object({
  accepts: z.array(portDataKindSchema).optional(),
  id: z.string(),
  kind: portDataKindSchema,
  label: z.string(),
  multiple: z.boolean().optional(),
  required: z.boolean().optional(),
});

const workflowNodeDataSchema = z.object({
  accent: z.string(),
  description: z.string(),
  heightPercent: z.string().optional(),
  helperText: z.string().optional(),
  implemented: z.boolean(),
  inputPorts: z.array(nodePortSchema),
  kind: z.enum([
    "text",
    "upload-image",
    "upload-video",
    "run-llm",
    "crop-image",
    "extract-frame",
  ]),
  mediaAssetId: z.string().optional(),
  mediaName: z.string().optional(),
  mediaDataUrl: z.string().optional(),
  mediaMimeType: z.string().optional(),
  mediaUrl: z.string().optional(),
  modelId: z.string().optional(),
  outputPorts: z.array(nodePortSchema),
  previewUrl: z.string().optional(),
  resultText: z.string().optional(),
  systemPromptValue: z.string().optional(),
  textValue: z.string().optional(),
  timestampValue: z.string().optional(),
  title: z.string(),
  userMessageValue: z.string().optional(),
  widthPercent: z.string().optional(),
  xPercent: z.string().optional(),
  yPercent: z.string().optional(),
});

export const persistedWorkflowNodeSchema = z.object({
  data: workflowNodeDataSchema,
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  type: z.literal("workflow"),
});

export const persistedWorkflowEdgeSchema = z.object({
  animated: z.boolean().optional(),
  data: z
    .object({
      kind: portDataKindSchema,
    })
    .optional(),
  id: z.string(),
  source: z.string(),
  sourceHandle: z.string().nullable().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  target: z.string(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
});

export const workflowVersionSummarySchema = z.object({
  createdAtLabel: z.string(),
  id: z.string(),
  versionNumber: z.number().int().positive(),
});

export const nodeRunRecordSchema = z.object({
  dependencyNodeIds: z.array(z.string()).optional(),
  durationLabel: z.string(),
  durationMs: z.number().int().nonnegative(),
  errorMessage: z.string().optional(),
  id: z.string(),
  inputSummary: z.string().optional(),
  nodeId: z.string(),
  nodeTitle: z.string(),
  nodeType: z.string(),
  outputSummary: z.string().optional(),
  status: z.enum([
    "queued",
    "running",
    "success",
    "failed",
    "waiting",
    "skipped",
  ]),
  summary: z.string(),
});

export const workflowRunItemSchema = z.object({
  createdAtLabel: z.string(),
  createdAtMs: z.number().int().nonnegative(),
  durationLabel: z.string(),
  durationMs: z.number().int().nonnegative(),
  id: z.string(),
  nodeRuns: z.array(nodeRunRecordSchema),
  persistedSource: z.enum(["database", "local", "memory"]).optional(),
  scope: z.enum(["full", "selected", "single"]),
  selectedNodeIds: z.array(z.string()).optional(),
  status: z.enum(["queued", "running", "success", "failed"]),
  summary: z.string(),
});

export const workflowDocumentSchema = z.object({
  description: z.string().optional(),
  edges: z.array(persistedWorkflowEdgeSchema),
  name: z.string().min(1),
  nodes: z.array(persistedWorkflowNodeSchema),
  version: z.literal(1),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .nullable()
    .optional(),
});

export const editorHydrationPayloadSchema = z.object({
  document: workflowDocumentSchema,
  runHistory: z.array(workflowRunItemSchema),
  source: z.enum(["sample", "server", "local"]),
  versions: z.array(workflowVersionSummarySchema),
  workflowId: z.string().nullable(),
});

export const workflowSaveRequestSchema = z.object({
  createVersion: z.boolean().optional(),
  document: workflowDocumentSchema,
  source: z.enum(["autosave", "manual", "import", "reset"]).default("manual"),
  workflowId: z.string().optional(),
});

export const workflowSaveResponseSchema = z.object({
  savedAtMs: z.number().int().nonnegative(),
  versions: z.array(workflowVersionSummarySchema),
  workflowId: z.string(),
});

export const workflowRunPersistRequestSchema = z.object({
  run: workflowRunItemSchema,
  workflowId: z.string(),
});

export const remoteExecutionRequestSchema = z.object({
  document: workflowDocumentSchema,
  scope: z.enum(["full", "selected", "single"]),
  selectedNodeIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
});

export const remoteExecutionResponseSchema = z.object({
  queuedRun: workflowRunItemSchema,
  workflowId: z.string(),
});
