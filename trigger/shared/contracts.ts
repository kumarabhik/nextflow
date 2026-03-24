import { z } from "zod";

import { workflowDocumentSchema } from "@/lib/workflows/schemas";

export const remoteNodeTaskResultSchema = z.object({
  dataPatch: z.record(z.string(), z.string()).optional(),
  durationMs: z.number().int().nonnegative().default(0),
  inputSummary: z.string().optional(),
  nodeId: z.string(),
  nodeTitle: z.string(),
  nodeType: z.string(),
  outputSummary: z.string().optional(),
  outputValue: z.union([z.string(), z.array(z.string())]).optional(),
  summary: z.string(),
});

export const textNodePayloadSchema = z.object({
  nodeId: z.string(),
  nodeTitle: z.string(),
  textValue: z.string().default(""),
});

export const mediaNodePayloadSchema = z.object({
  mediaReference: z.string(),
  mediaMimeType: z.string().optional(),
  mediaName: z.string().optional(),
  nodeId: z.string(),
  nodeTitle: z.string(),
  nodeType: z.enum(["upload-image", "upload-video"]),
});

export const cropImageTaskPayloadSchema = z.object({
  heightPercent: z.string().default("100"),
  imageUrl: z.string(),
  nodeId: z.string(),
  nodeTitle: z.string(),
  widthPercent: z.string().default("100"),
  xPercent: z.string().default("0"),
  yPercent: z.string().default("0"),
});

export const extractFrameTaskPayloadSchema = z.object({
  nodeId: z.string(),
  nodeTitle: z.string(),
  timestamp: z.string().default("50%"),
  videoUrl: z.string(),
});

export const llmNodeTaskPayloadSchema = z.object({
  imageInputs: z.array(z.string()).default([]),
  modelId: z.string().default("gemini-balanced"),
  nodeId: z.string(),
  nodeTitle: z.string(),
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1),
});

export const executeWorkflowTaskPayloadSchema = z.object({
  document: workflowDocumentSchema,
  scope: z.enum(["full", "selected", "single"]),
  selectedNodeIds: z.array(z.string()).default([]),
  workflowId: z.string(),
  workflowRunId: z.string(),
});

export type CropImageTaskPayload = z.infer<typeof cropImageTaskPayloadSchema>;
export type ExecuteWorkflowTaskPayload = z.infer<
  typeof executeWorkflowTaskPayloadSchema
>;
export type ExtractFrameTaskPayload = z.infer<
  typeof extractFrameTaskPayloadSchema
>;
export type LlmNodeTaskPayload = z.infer<typeof llmNodeTaskPayloadSchema>;
export type MediaNodePayload = z.infer<typeof mediaNodePayloadSchema>;
export type RemoteNodeTaskResult = z.infer<typeof remoteNodeTaskResultSchema>;
export type TextNodePayload = z.infer<typeof textNodePayloadSchema>;
