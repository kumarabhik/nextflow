import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  NodeRunStatus,
  WorkflowRunScope,
  WorkflowRunStatus,
} from "@/generated/prisma/enums";
import { formatDurationLabel, formatRunTimestampLabel } from "@/lib/execution/formatters";
import {
  createStarterEditorPayload,
  parseWorkflowDocument,
} from "@/lib/workflows/document";
import {
  workflowRunPersistRequestSchema,
  workflowSaveRequestSchema,
} from "@/lib/workflows/schemas";
import { isClerkConfigured, isDatabaseConfigured } from "@/lib/env";
import type {
  EditorHydrationPayload,
  NodeRunRecord,
  WorkflowRunItem,
  WorkflowVersionSummary,
} from "@/types/workflow";

function toJsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function mapWorkflowRunScope(scope: WorkflowRunItem["scope"]) {
  switch (scope) {
    case "full":
      return WorkflowRunScope.FULL;
    case "selected":
      return WorkflowRunScope.SELECTED;
    case "single":
      return WorkflowRunScope.SINGLE;
  }
}

function mapWorkflowRunStatus(status: WorkflowRunItem["status"]) {
  switch (status) {
    case "queued":
      return WorkflowRunStatus.QUEUED;
    case "running":
      return WorkflowRunStatus.RUNNING;
    case "success":
      return WorkflowRunStatus.SUCCESS;
    case "failed":
      return WorkflowRunStatus.FAILED;
  }
}

function mapNodeRunStatus(status: NodeRunRecord["status"]) {
  switch (status) {
    case "queued":
      return NodeRunStatus.PENDING;
    case "running":
      return NodeRunStatus.RUNNING;
    case "success":
      return NodeRunStatus.SUCCESS;
    case "failed":
      return NodeRunStatus.FAILED;
    case "skipped":
      return NodeRunStatus.SKIPPED;
    case "waiting":
      return NodeRunStatus.WAITING;
  }
}

async function resolveWorkflowActorId() {
  if (!isClerkConfigured) {
    return "demo-user";
  }

  const { userId } = await auth();
  return userId;
}

function mapVersionSummary(version: {
  createdAt: Date;
  id: string;
  versionNumber: number;
}): WorkflowVersionSummary {
  return {
    createdAtLabel: formatRunTimestampLabel(version.createdAt.getTime()),
    id: version.id,
    versionNumber: version.versionNumber,
  };
}

function parseNodeSummary(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    return (value as { value: string }).value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return undefined;
  }
}

function extractNodeTitle(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const title = (value as { nodeTitle?: unknown }).nodeTitle;
  return typeof title === "string" ? title : fallback;
}

function mapNodeRun(run: {
  completedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  id: string;
  inputSnapshotJson: unknown;
  nodeId: string;
  nodeType: string;
  outputSnapshotJson: unknown;
  status: string;
}): NodeRunRecord {
  const durationMs = run.durationMs ?? 0;

  return {
    durationLabel: formatDurationLabel(durationMs),
    durationMs,
    errorMessage: run.errorMessage ?? undefined,
    id: run.id,
    inputSummary: parseNodeSummary(run.inputSnapshotJson),
    nodeId: run.nodeId,
    nodeTitle: extractNodeTitle(run.inputSnapshotJson, run.nodeId),
    nodeType: run.nodeType,
    outputSummary: parseNodeSummary(run.outputSnapshotJson),
    status: run.status.toLowerCase() as NodeRunRecord["status"],
    summary:
      run.errorMessage ??
      (run.completedAt ? "Execution details persisted." : "Node still pending."),
  };
}

function mapWorkflowRun(run: {
  createdAt: Date;
  durationMs: number | null;
  id: string;
  nodeRuns: Array<{
    completedAt: Date | null;
    durationMs: number | null;
    errorMessage: string | null;
    id: string;
    inputSnapshotJson: unknown;
    nodeId: string;
    nodeType: string;
    outputSnapshotJson: unknown;
    status: string;
  }>;
  scope: string;
  selectedNodeIds: unknown;
  status: string;
  errorMessage: string | null;
}): WorkflowRunItem {
  const durationMs = run.durationMs ?? 0;
  const selectedNodeIds = Array.isArray(run.selectedNodeIds)
    ? run.selectedNodeIds.filter(
        (nodeId): nodeId is string => typeof nodeId === "string",
      )
    : undefined;

  return {
    createdAtLabel: formatRunTimestampLabel(run.createdAt.getTime()),
    createdAtMs: run.createdAt.getTime(),
    durationLabel: formatDurationLabel(durationMs),
    durationMs,
    id: run.id,
    nodeRuns: run.nodeRuns.map(mapNodeRun),
    persistedSource: "database",
    scope: run.scope.toLowerCase() as WorkflowRunItem["scope"],
    selectedNodeIds,
    status: run.status.toLowerCase() as WorkflowRunItem["status"],
    summary:
      run.errorMessage ??
      `Persisted ${run.nodeRuns.length} node record(s) for this run.`,
  };
}

export async function loadEditorHydrationPayload(): Promise<EditorHydrationPayload> {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return createStarterEditorPayload();
  }

  try {
    const workflow = await db.workflow.findFirst({
      include: {
        runs: {
          include: {
            nodeRuns: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 12,
        },
        versions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        userId: actorId,
      },
    });

    if (!workflow) {
      return createStarterEditorPayload();
    }

    return {
      document: parseWorkflowDocument(workflow.graphJson),
      runHistory: workflow.runs.map(mapWorkflowRun),
      source: "server",
      versions: workflow.versions.map(mapVersionSummary),
      workflowId: workflow.id,
    };
  } catch {
    return createStarterEditorPayload();
  }
}

export async function saveWorkflowDocument(rawInput: unknown) {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return null;
  }

  const input = workflowSaveRequestSchema.parse(rawInput);
  const savedAtMs = Date.now();

  try {
    const result = await db.$transaction(async (tx) => {
      const existing =
        input.workflowId
          ? await tx.workflow.findFirst({
              where: {
                id: input.workflowId,
                userId: actorId,
              },
            })
          : null;

      const workflow = existing
        ? await tx.workflow.update({
            data: {
              description: input.document.description ?? null,
              graphJson: toJsonValue(input.document),
              name: input.document.name,
              viewportJson: input.document.viewport
                ? toJsonValue(input.document.viewport)
                : Prisma.JsonNull,
            },
            where: {
              id: existing.id,
            },
          })
        : await tx.workflow.create({
            data: {
              description: input.document.description ?? null,
              graphJson: toJsonValue(input.document),
              latestVersionNumber: 1,
              name: input.document.name,
              status: "DRAFT",
              userId: actorId,
              viewportJson: input.document.viewport
                ? toJsonValue(input.document.viewport)
                : Prisma.JsonNull,
            },
          });

      await tx.editorSnapshot.create({
        data: {
          snapshotJson: toJsonValue(input.document),
          source: input.source,
          workflowId: workflow.id,
        },
      });

      if (!existing || input.createVersion) {
        const versionNumber = existing
          ? existing.latestVersionNumber + 1
          : workflow.latestVersionNumber;

        await tx.workflowVersion.create({
          data: {
            createdBy: actorId,
            graphJson: toJsonValue(input.document),
            versionNumber,
            workflowId: workflow.id,
          },
        });

        if (existing) {
          await tx.workflow.update({
            data: {
              latestVersionNumber: versionNumber,
            },
            where: {
              id: workflow.id,
            },
          });
        }
      }

      const versions = await tx.workflowVersion.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        where: {
          workflowId: workflow.id,
        },
      });

      return {
        savedAtMs,
        versions: versions.map(mapVersionSummary),
        workflowId: workflow.id,
      };
    });

    return result;
  } catch {
    return null;
  }
}

export async function persistWorkflowRun(rawInput: unknown) {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return false;
  }

  const input = workflowRunPersistRequestSchema.parse(rawInput);

  try {
    const workflow = await db.workflow.findFirst({
      where: {
        id: input.workflowId,
        userId: actorId,
      },
    });

    if (!workflow) {
      return false;
    }

    await db.workflowRun.create({
      data: {
        completedAt: new Date(input.run.createdAtMs + input.run.durationMs),
        durationMs: input.run.durationMs,
        errorMessage: input.run.status === "failed" ? input.run.summary : null,
        scope: mapWorkflowRunScope(input.run.scope),
        selectedNodeIds: input.run.selectedNodeIds
          ? toJsonValue(input.run.selectedNodeIds)
          : Prisma.JsonNull,
        startedAt: new Date(input.run.createdAtMs),
        status: mapWorkflowRunStatus(input.run.status),
        userId: actorId,
        workflowId: input.workflowId,
        nodeRuns: {
          create: input.run.nodeRuns.map((nodeRun) => ({
            completedAt: new Date(input.run.createdAtMs + nodeRun.durationMs),
            dependencyNodeIds: nodeRun.dependencyNodeIds
              ? toJsonValue(nodeRun.dependencyNodeIds)
              : Prisma.JsonNull,
            durationMs: nodeRun.durationMs,
            errorMessage: nodeRun.errorMessage ?? null,
            inputSnapshotJson: nodeRun.inputSummary
              ? toJsonValue({
                  nodeTitle: nodeRun.nodeTitle,
                  value: nodeRun.inputSummary,
                })
              : Prisma.JsonNull,
            nodeId: nodeRun.nodeId,
            nodeType: nodeRun.nodeType,
            outputSnapshotJson: nodeRun.outputSummary
              ? toJsonValue({
                  value: nodeRun.outputSummary,
                })
              : Prisma.JsonNull,
            startedAt: new Date(input.run.createdAtMs),
            status: mapNodeRunStatus(nodeRun.status),
          })),
        },
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function loadWorkflowRunHistory(workflowId: string) {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return [];
  }

  try {
    const runs = await db.workflowRun.findMany({
      include: {
        nodeRuns: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      where: {
        workflow: {
          userId: actorId,
        },
        workflowId,
      },
    });

    return runs.map(mapWorkflowRun);
  } catch {
    return [];
  }
}

export async function loadWorkflowVersionDocument(input: {
  versionId: string;
  workflowId?: string;
}) {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return null;
  }

  try {
    const version = await db.workflowVersion.findFirst({
      where: {
        id: input.versionId,
        workflow: {
          ...(input.workflowId ? { id: input.workflowId } : {}),
          userId: actorId,
        },
      },
    });

    if (!version) {
      return null;
    }

    return parseWorkflowDocument(version.graphJson);
  } catch {
    return null;
  }
}

export async function createQueuedWorkflowRun(input: {
  scope: WorkflowRunItem["scope"];
  selectedNodeIds?: string[];
  workflowId: string;
  workflowRunId: string;
}) {
  const actorId = await resolveWorkflowActorId();

  if (!actorId || !isDatabaseConfigured) {
    return null;
  }

  try {
    const workflow = await db.workflow.findFirst({
      where: {
        id: input.workflowId,
        userId: actorId,
      },
    });

    if (!workflow) {
      return null;
    }

    const createdAtMs = Date.now();

    await db.workflowRun.create({
      data: {
        id: input.workflowRunId,
        scope: mapWorkflowRunScope(input.scope),
        selectedNodeIds: input.selectedNodeIds
          ? toJsonValue(input.selectedNodeIds)
          : Prisma.JsonNull,
        status: WorkflowRunStatus.QUEUED,
        userId: actorId,
        workflowId: input.workflowId,
      },
    });

    return {
      createdAtLabel: formatRunTimestampLabel(createdAtMs),
      createdAtMs,
      durationLabel: "0.0s",
      durationMs: 0,
      id: input.workflowRunId,
      nodeRuns: [],
      persistedSource: "database" as const,
      scope: input.scope,
      selectedNodeIds: input.selectedNodeIds,
      status: "queued" as const,
      summary: "Trigger.dev execution dispatched.",
    };
  } catch {
    return null;
  }
}

export async function attachTriggerRunId(input: {
  triggerRunId: string;
  workflowRunId: string;
}) {
  if (!isDatabaseConfigured) {
    return false;
  }

  try {
    await db.workflowRun.update({
      data: {
        triggerRunId: input.triggerRunId,
      },
      where: {
        id: input.workflowRunId,
      },
    });

    return true;
  } catch {
    return false;
  }
}

export async function failWorkflowRunDispatch(input: {
  errorMessage: string;
  workflowRunId: string;
}) {
  if (!isDatabaseConfigured) {
    return false;
  }

  try {
    await db.workflowRun.update({
      data: {
        completedAt: new Date(),
        errorMessage: input.errorMessage,
        status: WorkflowRunStatus.FAILED,
      },
      where: {
        id: input.workflowRunId,
      },
    });

    return true;
  } catch {
    return false;
  }
}
