import { batch, task } from "@trigger.dev/sdk/v3";

import { db } from "@/lib/db";
import { NodeRunStatus, WorkflowRunStatus } from "@/generated/prisma/enums";
import { getResolvedInputValue } from "@/lib/execution/node-inputs";
import {
  collectUpstreamNodeIds,
  getExecutionBatches,
} from "@/lib/editor/graph-utils";
import { workflowDocumentToFlow } from "@/lib/workflows/document";

import { cropImageTask } from "./crop-image";
import { extractFrameTask } from "./extract-frame";
import {
  type CropImageTaskPayload,
  executeWorkflowTaskPayloadSchema,
  type ExtractFrameTaskPayload,
  type LlmNodeTaskPayload,
  type MediaNodePayload,
  type RemoteNodeTaskResult,
  type TextNodePayload,
} from "../shared/contracts";
import { llmNodeTask } from "./llm-node";
import { mediaNodeTask } from "./media-node";
import { textNodeTask } from "./text-node";

type WorkflowBatchItem =
  | {
      id: typeof textNodeTask.id;
      payload: TextNodePayload;
    }
  | {
      id: typeof mediaNodeTask.id;
      payload: MediaNodePayload;
    }
  | {
      id: typeof cropImageTask.id;
      payload: CropImageTaskPayload;
    }
  | {
      id: typeof extractFrameTask.id;
      payload: ExtractFrameTaskPayload;
    }
  | {
      id: typeof llmNodeTask.id;
      payload: LlmNodeTaskPayload;
    };

function resolveIncludedNodeIds(
  scope: "full" | "selected" | "single",
  selectedNodeIds: string[],
  allNodeIds: string[],
  edges: ReturnType<typeof workflowDocumentToFlow>["edges"],
) {
  if (scope === "full") {
    return allNodeIds;
  }

  if (selectedNodeIds.length === 0) {
    return [];
  }

  return collectUpstreamNodeIds(selectedNodeIds, edges);
}

function createNodeRunData(input: {
  result: Omit<RemoteNodeTaskResult, "durationMs"> & { durationMs?: number };
  status: keyof typeof NodeRunStatus;
}) {
  const durationMs = input.result.durationMs ?? 0;
  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - durationMs);

  return {
    completedAt,
    durationMs,
    errorMessage: input.status === "FAILED" ? input.result.summary : null,
    inputSnapshotJson: {
      nodeTitle: input.result.nodeTitle,
      value: input.result.inputSummary ?? null,
    },
    nodeId: input.result.nodeId,
    nodeType: input.result.nodeType,
    outputSnapshotJson: {
      value: input.result.outputSummary ?? input.result.outputValue ?? null,
    },
    startedAt,
    status: NodeRunStatus[input.status],
  };
}

export const executeWorkflowTask = task({
  id: "execute-workflow-task",
  run: async (payload, params) => {
    const workflowStartedAt = Date.now();
    const input = executeWorkflowTaskPayloadSchema.parse(payload);
    const flow = workflowDocumentToFlow(input.document);
    const includedNodeIds = resolveIncludedNodeIds(
      input.scope,
      input.selectedNodeIds,
      flow.nodes.map((node) => node.id),
      flow.edges,
    );
    const includedNodeSet = new Set(includedNodeIds);
    const batches = getExecutionBatches(flow.nodes, flow.edges, includedNodeIds);
    const outputs = new Map<string, string | string[]>();
    const nodeRunCreates: Array<ReturnType<typeof createNodeRunData>> = [];
    let failedNodeCount = 0;

    await db.workflowRun.update({
      data: {
        startedAt: new Date(),
        status: WorkflowRunStatus.RUNNING,
        triggerRunId: params.ctx.run.id,
      },
      where: {
        id: input.workflowRunId,
      },
    });

    try {
      for (const batchNodeIds of batches) {
        const batchItems: WorkflowBatchItem[] = [];

        for (const nodeId of batchNodeIds) {
          const node = flow.nodes.find((entry) => entry.id === nodeId);

          if (!node) {
            continue;
          }

          const dependencyNodeIds = flow.edges
            .filter(
              (edge) => edge.target === node.id && includedNodeSet.has(edge.source),
            )
            .map((edge) => edge.source);

          const blockedByFailure = dependencyNodeIds.some(
            (dependencyId) =>
              nodeRunCreates.some(
                (run) =>
                  run.nodeId === dependencyId &&
                  run.status === NodeRunStatus.FAILED,
              ),
          );

          if (blockedByFailure) {
            failedNodeCount += 1;
            nodeRunCreates.push(
              createNodeRunData({
                result: {
                  inputSummary: `Waiting on: ${dependencyNodeIds.join(", ")}`,
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  nodeType: node.data.kind,
                  summary: "Skipped because an upstream dependency failed.",
                },
                status: "FAILED",
              }),
            );

            continue;
          }

          switch (node.data.kind) {
            case "text":
              batchItems.push({
                id: textNodeTask.id,
                payload: {
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  textValue: node.data.textValue ?? "",
                },
              });
              break;
            case "upload-image":
            case "upload-video":
              if (!node.data.mediaUrl && !node.data.mediaDataUrl) {
                failedNodeCount += 1;
                nodeRunCreates.push(
                  createNodeRunData({
                    result: {
                      inputSummary: "No persisted media reference was saved with this node.",
                      nodeId: node.id,
                      nodeTitle: node.data.title,
                      nodeType: node.data.kind,
                      summary: "Re-upload the media so Trigger.dev can access a stored asset URL.",
                    },
                    status: "FAILED",
                  }),
                );

                continue;
              }

              batchItems.push({
                id: mediaNodeTask.id,
                payload: {
                  mediaReference: node.data.mediaUrl ?? node.data.mediaDataUrl ?? "",
                  mediaMimeType: node.data.mediaMimeType,
                  mediaName: node.data.mediaName,
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  nodeType: node.data.kind,
                },
              });
              break;
            case "crop-image": {
              const imageUrl = getResolvedInputValue(
                node,
                "image_url",
                flow.edges,
                outputs,
              );

              if (!imageUrl || Array.isArray(imageUrl)) {
                failedNodeCount += 1;
                nodeRunCreates.push(
                  createNodeRunData({
                    result: {
                      inputSummary: "No image input was available for crop execution.",
                      nodeId: node.id,
                      nodeTitle: node.data.title,
                      nodeType: node.data.kind,
                      summary: "Crop Image requires an image input.",
                    },
                    status: "FAILED",
                  }),
                );

                continue;
              }

              batchItems.push({
                id: cropImageTask.id,
                payload: {
                  heightPercent: String(
                    getResolvedInputValue(
                      node,
                      "height_percent",
                      flow.edges,
                      outputs,
                    ) ?? node.data.heightPercent ?? "100",
                  ),
                  imageUrl,
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  widthPercent: String(
                    getResolvedInputValue(
                      node,
                      "width_percent",
                      flow.edges,
                      outputs,
                    ) ?? node.data.widthPercent ?? "100",
                  ),
                  xPercent: String(
                    getResolvedInputValue(
                      node,
                      "x_percent",
                      flow.edges,
                      outputs,
                    ) ?? node.data.xPercent ?? "0",
                  ),
                  yPercent: String(
                    getResolvedInputValue(
                      node,
                      "y_percent",
                      flow.edges,
                      outputs,
                    ) ?? node.data.yPercent ?? "0",
                  ),
                },
              });
              break;
            }
            case "extract-frame": {
              const videoUrl = getResolvedInputValue(
                node,
                "video_url",
                flow.edges,
                outputs,
              );

              if (!videoUrl || Array.isArray(videoUrl)) {
                failedNodeCount += 1;
                nodeRunCreates.push(
                  createNodeRunData({
                    result: {
                      inputSummary: "No video input was available for frame extraction.",
                      nodeId: node.id,
                      nodeTitle: node.data.title,
                      nodeType: node.data.kind,
                      summary: "Extract Frame requires a video input.",
                    },
                    status: "FAILED",
                  }),
                );

                continue;
              }

              batchItems.push({
                id: extractFrameTask.id,
                payload: {
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  timestamp: String(
                    getResolvedInputValue(
                      node,
                      "timestamp",
                      flow.edges,
                      outputs,
                    ) ?? node.data.timestampValue ?? "50%",
                  ),
                  videoUrl,
                },
              });
              break;
            }
            case "run-llm": {
              const userMessage = getResolvedInputValue(
                node,
                "user_message",
                flow.edges,
                outputs,
              );

              if (!userMessage || Array.isArray(userMessage)) {
                failedNodeCount += 1;
                nodeRunCreates.push(
                  createNodeRunData({
                    result: {
                      inputSummary: "No user_message input was available.",
                      nodeId: node.id,
                      nodeTitle: node.data.title,
                      nodeType: node.data.kind,
                      summary: "Run Any LLM requires a user message.",
                    },
                    status: "FAILED",
                  }),
                );

                continue;
              }

              const imageInputs = getResolvedInputValue(
                node,
                "images",
                flow.edges,
                outputs,
              );

              batchItems.push({
                id: llmNodeTask.id,
                payload: {
                  imageInputs: Array.isArray(imageInputs)
                    ? imageInputs
                    : imageInputs
                      ? [imageInputs]
                      : [],
                  modelId: node.data.modelId ?? "gemini-balanced",
                  nodeId: node.id,
                  nodeTitle: node.data.title,
                  systemPrompt: String(
                    getResolvedInputValue(
                      node,
                      "system_prompt",
                      flow.edges,
                      outputs,
                    ) ?? node.data.systemPromptValue ?? "",
                  ),
                  userMessage: String(userMessage),
                },
              });
              break;
            }
          }
        }

        if (batchItems.length === 0) {
          continue;
        }

        const batchResults = await batch.triggerAndWait<
          | typeof textNodeTask
          | typeof mediaNodeTask
          | typeof cropImageTask
          | typeof extractFrameTask
          | typeof llmNodeTask
        >(batchItems);

        for (const result of batchResults.runs) {
          if (!result.ok) {
            failedNodeCount += 1;
            const failedPayload = batchItems.find((item) => item.id === result.taskIdentifier);

            if (failedPayload) {
              nodeRunCreates.push(
                createNodeRunData({
                  result: {
                    inputSummary: "Trigger.dev child task failed.",
                    nodeId: (failedPayload.payload as { nodeId: string }).nodeId,
                    nodeTitle: (failedPayload.payload as { nodeTitle: string }).nodeTitle,
                    nodeType:
                      result.taskIdentifier === llmNodeTask.id
                        ? "run-llm"
                        : result.taskIdentifier === cropImageTask.id
                          ? "crop-image"
                          : result.taskIdentifier === extractFrameTask.id
                            ? "extract-frame"
                            : result.taskIdentifier === textNodeTask.id
                              ? "text"
                              : "upload-image",
                    summary:
                      result.error instanceof Error
                        ? result.error.message
                        : "Task execution failed.",
                  },
                  status: "FAILED",
                }),
              );
            }

            continue;
          }

          const output = result.output;

          if (output.outputValue !== undefined) {
            outputs.set(output.nodeId, output.outputValue);
          }

          nodeRunCreates.push(
            createNodeRunData({
              result: output,
              status: "SUCCESS",
            }),
          );
        }
      }

      await db.nodeRun.deleteMany({
        where: {
          workflowRunId: input.workflowRunId,
        },
      });

      if (nodeRunCreates.length > 0) {
        await db.nodeRun.createMany({
          data: nodeRunCreates.map((nodeRun) => ({
            ...nodeRun,
            workflowRunId: input.workflowRunId,
          })),
        });
      }

      await db.workflowRun.update({
        data: {
          completedAt: new Date(),
          durationMs: Date.now() - workflowStartedAt,
          errorMessage:
            failedNodeCount > 0
              ? `${failedNodeCount} node(s) failed during Trigger.dev execution.`
              : null,
          status:
            failedNodeCount > 0
              ? WorkflowRunStatus.FAILED
              : WorkflowRunStatus.SUCCESS,
        },
        where: {
          id: input.workflowRunId,
        },
      });

      return {
        failedNodeCount,
        workflowRunId: input.workflowRunId,
      };
    } catch (error) {
      await db.workflowRun.update({
        data: {
          completedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Trigger.dev workflow execution failed.",
          status: WorkflowRunStatus.FAILED,
        },
        where: {
          id: input.workflowRunId,
        },
      });

      throw error;
    }
  },
});
