import { z } from "zod";

export { nodeRunRecordSchema, workflowRunItemSchema } from "@/lib/workflows/schemas";

export const workflowRunScopeSchema = z.enum(["full", "selected", "single"]);

export const nodeExecutionStatusSchema = z.enum([
  "idle",
  "queued",
  "running",
  "success",
  "failed",
  "waiting",
  "skipped",
]);

export const nodeOutputSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
]);

export const executionPlanBatchSchema = z.array(z.string());

export const executionPlanSchema = z.object({
  batches: z.array(executionPlanBatchSchema),
  includedNodeIds: z.array(z.string()),
  scope: workflowRunScopeSchema,
});
