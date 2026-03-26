"use client";

import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { create } from "zustand";

import { formatRunTimestampLabel } from "@/lib/execution/formatters";
import {
  buildExecutionPlan,
  createNodeRunRecord,
  createWorkflowRunItem,
  simulateNodeExecution,
} from "@/lib/execution/local-simulator";
import { getIncomingEdges } from "@/lib/editor/graph-utils";
import { createWorkflowEdge, isValidEditorConnection } from "@/lib/editor/connection-rules";
import { createWorkflowNode } from "@/lib/editor/node-factory";
import type { QuickNodeType } from "@/lib/editor/node-catalog";
import {
  loadLocalVersionDocument,
  saveLocalRunHistory,
} from "@/lib/workflows/browser-storage";
import {
  dispatchRemoteExecution,
  fetchWorkflowVersionDocument,
  persistRunRemotely,
} from "@/lib/workflows/client";
import {
  createStarterEditorPayload,
  createWorkflowDocument,
  getWorkflowDocumentHash,
  workflowDocumentToFlow,
} from "@/lib/workflows/document";
import type {
  WorkflowConnection,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeData,
} from "@/types/editor";
import type {
  EditorHydrationPayload,
  NodeRuntimeState,
  SaveRequest,
  SaveState,
  WorkflowDocument,
  WorkflowRunItem,
  WorkflowRunScope,
  WorkflowVersionSummary,
} from "@/types/workflow";

type EditorStore = {
  activeRun: WorkflowRunItem | null;
  addNode: (kind: QuickNodeType, position?: { x: number; y: number }) => void;
  buildWorkflowDocument: () => WorkflowDocument;
  canRedo: boolean;
  canUndo: boolean;
  closeCommandPalette: () => void;
  consumeSaveRequest: (token: number) => void;
  deleteNode: (nodeId: string) => void;
  edges: WorkflowEdge[];
  getIncomingConnectionCount: (nodeId: string, handleId: string) => number;
  getSelectedNodeIds: () => string[];
  hydrateEditor: (payload: EditorHydrationPayload) => void;
  importWorkflowDocument: (document: WorkflowDocument) => void;
  isExecuting: boolean;
  isHydrated: boolean;
  isInputConnected: (nodeId: string, handleId: string) => boolean;
  isCommandPaletteOpen: boolean;
  lastPersistedHash: string;
  lastSavedAtMs: number | null;
  markLocalBackupSaved: (input: { hash: string; savedAtMs: number }) => void;
  markLocalVersionSaved: (input: {
    hash: string;
    savedAtMs: number;
    version: WorkflowVersionSummary;
  }) => void;
  markSaveError: (message: string) => void;
  markSaving: () => void;
  markWorkflowSaved: (input: {
    hash: string;
    savedAtMs: number;
    source: SaveState;
    versions?: WorkflowVersionSummary[];
    workflowId: string | null;
  }) => void;
  nodeRuntime: Record<string, NodeRuntimeState>;
  nodes: WorkflowNode[];
  onConnect: (connection: WorkflowConnection) => void;
  onEdgesChange: (
    changes: Parameters<typeof applyEdgeChanges<WorkflowEdge>>[0],
  ) => void;
  onNodesChange: (
    changes: Parameters<typeof applyNodeChanges<WorkflowNode>>[0],
  ) => void;
  openCommandPalette: () => void;
  pendingSaveRequest: SaveRequest | null;
  redo: () => void;
  replaceRunHistory: (runHistory: WorkflowRunItem[]) => void;
  requestSave: (input: Pick<SaveRequest, "createVersion" | "reason">) => void;
  resetStarterFlow: () => void;
  restoreWorkflowVersion: (
    versionId: string,
    versionLabel: string,
  ) => Promise<void>;
  retryLatestFailedRun: () => Promise<void>;
  runFullWorkflow: () => Promise<void>;
  runHistory: WorkflowRunItem[];
  runSingleNode: () => Promise<void>;
  runSelectedWorkflow: () => Promise<void>;
  redoStack: WorkflowDocument[];
  saveMessage: string;
  saveState: SaveState;
  source: EditorHydrationPayload["source"];
  toggleCommandPalette: () => void;
  toggleNodeExpanded: (nodeId: string, isExpanded?: boolean) => void;
  undo: () => void;
  undoStack: WorkflowDocument[];
  updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
  workflowDescription: string;
  workflowId: string | null;
  workflowName: string;
  workflowVersions: WorkflowVersionSummary[];
};

const starterPayload = createStarterEditorPayload();
const starterFlow = workflowDocumentToFlow(starterPayload.document);
const starterHash = getWorkflowDocumentHash(starterPayload.document);
const MAX_EDITOR_HISTORY = 40;

function createIdleRuntime(nodes: WorkflowNode[]) {
  return Object.fromEntries(
    nodes.map((node) => [node.id, { status: "idle" } satisfies NodeRuntimeState]),
  ) as Record<string, NodeRuntimeState>;
}

function buildRuntimeFromRun(
  nodes: WorkflowNode[],
  run: WorkflowRunItem | null,
  fallback?: Record<string, NodeRuntimeState>,
) {
  const runtime = createIdleRuntime(nodes);

  if (!run) {
    return runtime;
  }

  for (const nodeRun of run.nodeRuns) {
    runtime[nodeRun.nodeId] = {
      durationMs: nodeRun.durationMs,
      errorMessage: nodeRun.errorMessage,
      outputValue: nodeRun.outputSummary,
      status: nodeRun.status,
      summary: nodeRun.summary,
    };
  }

  if (fallback) {
    for (const node of nodes) {
      if (
        runtime[node.id].status === "idle" &&
        fallback[node.id] &&
        (fallback[node.id].status === "queued" || fallback[node.id].status === "running")
      ) {
        runtime[node.id] = fallback[node.id];
      }
    }
  }

  return runtime;
}

function snapshotDocumentFromState(state: {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  workflowDescription: string;
  workflowName: string;
}) {
  return createWorkflowDocument({
    description: state.workflowDescription,
    edges: state.edges,
    name: state.workflowName,
    nodes: state.nodes,
  });
}

function createHistoryState(
  currentDocument: WorkflowDocument,
  undoStack: WorkflowDocument[],
) {
  const lastDocument = undoStack[undoStack.length - 1];
  const nextUndoStack =
    lastDocument &&
    getWorkflowDocumentHash(lastDocument) === getWorkflowDocumentHash(currentDocument)
      ? undoStack
      : [...undoStack, currentDocument].slice(-MAX_EDITOR_HISTORY);

  return {
    canRedo: false,
    canUndo: nextUndoStack.length > 0,
    redoStack: [] as WorkflowDocument[],
    undoStack: nextUndoStack,
  };
}

function restoreDocumentState(document: WorkflowDocument) {
  const flow = workflowDocumentToFlow(document);

  return {
    activeRun: null,
    edges: flow.edges,
    isExecuting: false,
    nodeRuntime: createIdleRuntime(flow.nodes),
    nodes: flow.nodes,
    workflowDescription: document.description ?? "",
    workflowName: document.name,
  };
}

function shouldRecordNodeHistory(
  changes: Parameters<typeof applyNodeChanges<WorkflowNode>>[0],
) {
  return changes.some((change) => {
    if (change.type === "select") {
      return false;
    }

    if (change.type === "position") {
      return !("dragging" in change) || !change.dragging;
    }

    return true;
  });
}

function mergeRuntimeForExistingNodes(
  nodes: WorkflowNode[],
  runtime: Record<string, NodeRuntimeState>,
) {
  return Object.fromEntries(
    nodes.map((node) => [node.id, runtime[node.id] ?? { status: "idle" }]),
  ) as Record<string, NodeRuntimeState>;
}

function createDirtyState(message = "Unsaved workflow changes.") {
  return {
    saveMessage: message,
    saveState: "dirty" as const,
  };
}

function createExecutionQueuedMessage(scope: WorkflowRunScope) {
  switch (scope) {
    case "full":
      return "Full workflow queued in Trigger.dev.";
    case "selected":
      return "Selected node group queued in Trigger.dev.";
    case "single":
      return "Single-node path queued in Trigger.dev.";
  }
}

function createLocalExecutionMessage(scope: WorkflowRunScope, hasFailures: boolean) {
  const scopeLabel =
    scope === "full"
      ? "workflow"
      : scope === "selected"
        ? "selected node group"
        : "single-node path";

  return hasFailures
    ? `Local ${scopeLabel} execution finished with failures.`
    : `Local ${scopeLabel} execution finished successfully.`;
}

async function persistCompletedRun(run: WorkflowRunItem) {
  const state = useEditorStore.getState();

  if (!state.workflowId) {
    const localized = state.runHistory.map((item) =>
      item.id === run.id ? { ...item, persistedSource: "local" as const } : item,
    );

    saveLocalRunHistory(localized);
    useEditorStore.setState({
      runHistory: localized,
    });
    return;
  }

  try {
    await persistRunRemotely({
      run,
      workflowId: state.workflowId,
    });

    const persisted = useEditorStore.getState().runHistory.map((item) =>
      item.id === run.id ? { ...item, persistedSource: "database" as const } : item,
    );

    saveLocalRunHistory(persisted);
    useEditorStore.setState({
      runHistory: persisted,
    });
  } catch {
    const localized = useEditorStore.getState().runHistory.map((item) =>
      item.id === run.id ? { ...item, persistedSource: "local" as const } : item,
    );

    saveLocalRunHistory(localized);
    useEditorStore.setState({
      runHistory: localized,
    });
  }
}

function resolveExecutionTarget(
  requestedScope: "full" | "selected" | "single",
  explicitSelectedNodeIds?: string[],
) {
  const state = useEditorStore.getState();
  const selectedNodeIds = explicitSelectedNodeIds ?? state.getSelectedNodeIds();

  if (requestedScope === "selected" && selectedNodeIds.length === 0) {
    return null;
  }

  if (requestedScope === "single" && selectedNodeIds.length !== 1) {
    return null;
  }

  const effectiveScope: WorkflowRunScope =
    requestedScope === "selected"
      ? selectedNodeIds.length === 1
        ? "single"
        : "selected"
      : requestedScope;

  const planningNodes =
    explicitSelectedNodeIds && requestedScope !== "full"
      ? state.nodes.map((node) => ({
          ...node,
          selected: explicitSelectedNodeIds.includes(node.id),
        }))
      : state.nodes;

  const plan = buildExecutionPlan({
    edges: state.edges,
    nodes: planningNodes,
    scope: effectiveScope,
  });

  if (plan.includedNodeIds.length === 0) {
    return null;
  }

  return {
    effectiveScope,
    plan,
    selectedNodeIds,
    state,
  };
}

async function executeScopeLocally(
  requestedScope: "full" | "selected" | "single",
  explicitSelectedNodeIds?: string[],
) {
  const target = resolveExecutionTarget(requestedScope, explicitSelectedNodeIds);

  if (!target) {
    return;
  }

  const { effectiveScope, plan, selectedNodeIds, state } = target;

  const runId = `run_${Date.now().toString().slice(-6)}`;
  const runStartedAt = Date.now();
  const includedNodeSet = new Set(plan.includedNodeIds);
  const outputs = new Map<string, string | string[]>();
  const runtime = createIdleRuntime(state.nodes);
  const runRecords = [] as WorkflowRunItem["nodeRuns"];

  for (const nodeId of plan.includedNodeIds) {
    runtime[nodeId] = {
      status: "queued",
      summary: "Queued for execution.",
    };
  }

  useEditorStore.setState({
    activeRun: createWorkflowRunItem({
      createdAtLabel: formatRunTimestampLabel(runStartedAt),
      createdAtMs: runStartedAt,
      durationLabel: "0.0s",
      durationMs: 0,
      id: runId,
      nodeRuns: [],
      scope: effectiveScope,
      selectedNodeIds: effectiveScope === "full" ? undefined : selectedNodeIds,
      status: "running",
      summary: "Planning execution...",
    }),
    isExecuting: true,
    nodeRuntime: runtime,
  });

  for (const batch of plan.batches) {
    const currentState = useEditorStore.getState();
    const batchNodes = batch
      .map((nodeId) => currentState.nodes.find((node) => node.id === nodeId))
      .filter((node): node is WorkflowNode => Boolean(node));

    const nextRuntime = { ...useEditorStore.getState().nodeRuntime };

    for (const node of batchNodes) {
      nextRuntime[node.id] = {
        ...nextRuntime[node.id],
        startedAt: Date.now(),
        status: "running",
        summary: "Executing current batch...",
      };
    }

    useEditorStore.setState((existing) => ({
      activeRun: existing.activeRun
        ? {
            ...existing.activeRun,
            summary: `Running batch of ${batchNodes.length} node(s)...`,
          }
        : null,
      nodeRuntime: nextRuntime,
    }));

    const results = await Promise.all(
      batchNodes.map(async (node) => {
        const upstreamEdges = getIncomingEdges(node.id, currentState.edges).filter(
          (edge) => includedNodeSet.has(edge.source),
        );
        const dependencyNodeIds = upstreamEdges.map((edge) => edge.source);
        const blockedByFailure = dependencyNodeIds.some(
          (dependencyId) =>
            useEditorStore.getState().nodeRuntime[dependencyId]?.status === "failed",
        );

        if (blockedByFailure) {
          return {
            dependencyNodeIds,
            node,
            result: {
              dependencyNodeIds,
              durationMs: 0,
              errorMessage: "Skipped because an upstream dependency failed.",
              inputSummary: `Waiting on: ${dependencyNodeIds.join(", ")}`,
              status: "failed" as const,
              summary: "Skipped because an upstream dependency failed.",
            },
          };
        }

        const result = await simulateNodeExecution({
          edges: currentState.edges,
          node,
          outputs,
        });

        return {
          dependencyNodeIds,
          node,
          result: {
            ...result,
            dependencyNodeIds,
          },
        };
      }),
    );

    const patchedNodes = [...useEditorStore.getState().nodes];
    const runtimeAfterBatch = { ...useEditorStore.getState().nodeRuntime };

    for (const { node, result } of results) {
      if (result.outputValue !== undefined && result.status === "success") {
        outputs.set(node.id, result.outputValue);
      }

      if (result.dataPatch) {
        const nodeIndex = patchedNodes.findIndex((entry) => entry.id === node.id);

        if (nodeIndex >= 0) {
          patchedNodes[nodeIndex] = {
            ...patchedNodes[nodeIndex],
            data: {
              ...patchedNodes[nodeIndex].data,
              ...result.dataPatch,
            },
          };
        }
      }

      runtimeAfterBatch[node.id] = {
        durationMs: result.durationMs,
        errorMessage: result.errorMessage,
        outputValue: result.outputValue,
        status: result.status,
        summary: result.summary,
      };

      runRecords.push(
        createNodeRunRecord({
          durationMs: result.durationMs,
          node,
          result,
        }),
      );
    }

    useEditorStore.setState((existing) => ({
      activeRun: existing.activeRun
        ? {
            ...existing.activeRun,
            nodeRuns: [...runRecords],
            summary: `Completed ${runRecords.length} node run(s) so far.`,
          }
        : null,
      nodeRuntime: runtimeAfterBatch,
      nodes: patchedNodes,
    }));
  }

  const runFinishedAt = Date.now();
  const durationMs = runFinishedAt - runStartedAt;
  const hasFailures = runRecords.some((record) => record.status === "failed");
  const completedRun = createWorkflowRunItem({
    createdAtLabel: formatRunTimestampLabel(runStartedAt),
    createdAtMs: runStartedAt,
    durationLabel: `${(durationMs / 1000).toFixed(1)}s`,
    durationMs,
    id: runId,
    nodeRuns: runRecords,
    persistedSource: "memory",
    scope: effectiveScope,
    selectedNodeIds: effectiveScope === "full" ? undefined : selectedNodeIds,
    status: hasFailures ? "failed" : "success",
    summary: hasFailures
      ? `Execution finished with ${runRecords.filter((record) => record.status === "failed").length} failed node(s).`
      : `Execution finished successfully across ${plan.batches.length} batch(es).`,
  });

  useEditorStore.setState((existing) => ({
    activeRun: null,
    isExecuting: false,
    nodeRuntime: buildRuntimeFromRun(existing.nodes, completedRun, existing.nodeRuntime),
    runHistory: [completedRun, ...existing.runHistory].slice(0, 12),
    saveMessage: createLocalExecutionMessage(effectiveScope, hasFailures),
  }));

  void persistCompletedRun(completedRun);
}

async function executeScope(
  requestedScope: "full" | "selected" | "single",
  explicitSelectedNodeIds?: string[],
) {
  const target = resolveExecutionTarget(requestedScope, explicitSelectedNodeIds);

  if (!target) {
    return;
  }

  const { effectiveScope, plan, selectedNodeIds, state } = target;

  const queuedRuntime = { ...state.nodeRuntime };

  for (const nodeId of plan.includedNodeIds) {
    queuedRuntime[nodeId] = {
      status: "queued",
      summary: "Queued for Trigger.dev execution.",
    };
  }

  try {
    const result = await dispatchRemoteExecution({
      document: state.buildWorkflowDocument(),
      scope: effectiveScope,
      selectedNodeIds:
        effectiveScope === "full" ? undefined : selectedNodeIds,
      workflowId: state.workflowId ?? undefined,
    });

    useEditorStore.setState((existing) => ({
      activeRun: {
        ...result.queuedRun,
        persistedSource: "database" as const,
      },
      isExecuting: true,
      nodeRuntime: queuedRuntime,
      runHistory: [
        {
          ...result.queuedRun,
          persistedSource: "database" as const,
        },
        ...existing.runHistory.filter((run) => run.id !== result.queuedRun.id),
      ].slice(0, 12),
      saveMessage: createExecutionQueuedMessage(effectiveScope),
      workflowId: result.workflowId,
    }));

    return;
  } catch {
    useEditorStore.setState({
      saveMessage:
        "Remote execution was unavailable, so NextFlow fell back to the local simulator.",
      saveState: "local",
    });
    await executeScopeLocally(requestedScope, explicitSelectedNodeIds);
  }
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeRun: null,
  canRedo: false,
  canUndo: false,
  addNode: (kind, position) => {
    const state = get();
    const { nodeRuntime, nodes } = state;
    const nextIndex = nodes.length + 1;
    const newNode = createWorkflowNode(kind, {
      position:
        position ?? {
          x: 140 + (nextIndex % 3) * 70,
          y: 120 + nextIndex * 42,
        },
    });
    const nextNodes = [
      ...nodes.map((node) => ({
        ...node,
        selected: false,
      })),
      {
        ...newNode,
        selected: true,
      },
    ];

    set({
      ...createDirtyState(`Added ${newNode.data.title}.`),
      ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
      isCommandPaletteOpen: false,
      nodeRuntime: {
        ...nodeRuntime,
        [newNode.id]: { status: "idle" },
      },
      nodes: nextNodes,
    });
  },
  buildWorkflowDocument: () => {
    const state = get();

    return snapshotDocumentFromState(state);
  },
  closeCommandPalette: () => {
    set({
      isCommandPaletteOpen: false,
    });
  },
  consumeSaveRequest: (token) => {
    const request = get().pendingSaveRequest;

    if (!request || request.token !== token) {
      return;
    }

    set({
      pendingSaveRequest: null,
    });
  },
  deleteNode: (nodeId) => {
    const state = get();
    const nextNodes = state.nodes.filter((node) => node.id !== nodeId);
    const nextEdges = state.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    );

    set({
      ...createDirtyState("Node deleted."),
      ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
      edges: nextEdges,
      nodeRuntime: mergeRuntimeForExistingNodes(nextNodes, state.nodeRuntime),
      nodes: nextNodes,
    });
  },
  edges: starterFlow.edges,
  getIncomingConnectionCount: (nodeId, handleId) => {
    return get().edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === handleId,
    ).length;
  },
  getSelectedNodeIds: () => {
    return get()
      .nodes.filter((node) => node.selected)
      .map((node) => node.id);
  },
  hydrateEditor: (payload) => {
    set({
      ...restoreDocumentState(payload.document),
      canRedo: false,
      canUndo: false,
      isHydrated: true,
      isCommandPaletteOpen: false,
      lastSavedAtMs: null,
      lastPersistedHash: getWorkflowDocumentHash(payload.document),
      pendingSaveRequest: null,
      redoStack: [],
      runHistory: payload.runHistory,
      saveMessage:
        payload.source === "server"
          ? "Remote workflow loaded."
          : payload.source === "local"
            ? "Recovered local draft backup."
            : "Starter sample loaded.",
      saveState:
        payload.source === "server"
          ? "saved"
          : payload.source === "local"
            ? "local"
            : "idle",
      source: payload.source,
      undoStack: [],
      workflowId: payload.workflowId,
      workflowVersions: payload.versions,
    });
  },
  importWorkflowDocument: (document) => {
    set({
      ...createDirtyState("Imported workflow JSON into a fresh draft."),
      ...restoreDocumentState(document),
      canRedo: false,
      canUndo: false,
      isCommandPaletteOpen: false,
      lastSavedAtMs: null,
      redoStack: [],
      runHistory: [],
      source: "local",
      undoStack: [],
      workflowId: null,
      workflowVersions: [],
    });
  },
  isExecuting: false,
  isHydrated: false,
  isInputConnected: (nodeId, handleId) => {
    return get().edges.some(
      (edge) => edge.target === nodeId && edge.targetHandle === handleId,
    );
  },
  isCommandPaletteOpen: false,
  lastPersistedHash: starterHash,
  lastSavedAtMs: null,
  markLocalBackupSaved: ({ hash, savedAtMs }) => {
    set({
      lastPersistedHash: hash,
      lastSavedAtMs: savedAtMs,
      saveMessage: "Saved locally. Remote persistence is unavailable right now.",
      saveState: "local",
      source: "local",
    });
  },
  markLocalVersionSaved: ({ hash, savedAtMs, version }) => {
    set((state) => ({
      lastPersistedHash: hash,
      lastSavedAtMs: savedAtMs,
      saveMessage: `Saved version ${version.versionNumber} locally.`,
      saveState: "local",
      source: "local",
      workflowVersions: [
        version,
        ...state.workflowVersions.filter((entry) => entry.id !== version.id),
      ].slice(0, 8),
    }));
  },
  markSaveError: (message) => {
    set({
      saveMessage: message,
      saveState: "error",
    });
  },
  markSaving: () => {
    set({
      saveMessage: "Saving workflow...",
      saveState: "saving",
    });
  },
  markWorkflowSaved: ({ hash, savedAtMs, source, versions, workflowId }) => {
    set((state) => ({
      lastPersistedHash: hash,
      lastSavedAtMs: savedAtMs,
      saveMessage:
        source === "saved"
          ? "Remote draft saved."
          : "Saved locally. Remote persistence is unavailable right now.",
      saveState: source,
      source: source === "saved" ? "server" : state.source,
      workflowId,
      workflowVersions: versions ?? state.workflowVersions,
    }));
  },
  nodeRuntime: createIdleRuntime(starterFlow.nodes),
  nodes: starterFlow.nodes,
  onConnect: (connection) => {
    const state = get();
    const { nodes, edges } = state;

    if (!isValidEditorConnection(connection, nodes, edges)) {
      return;
    }

    const nextEdge = createWorkflowEdge(connection, nodes);

    if (!nextEdge) {
      return;
    }

    set({
      ...createDirtyState("Connection added."),
      ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
      edges: [...edges, nextEdge],
    });
  },
  onEdgesChange: (changes) => {
    const meaningfulChange = changes.some((change) => change.type !== "select");

    set((state) => ({
      ...(meaningfulChange
        ? {
            ...createDirtyState("Workflow edges updated."),
            ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
          }
        : {}),
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },
  onNodesChange: (changes) => {
    set((state) => {
      const nextNodes = applyNodeChanges(changes, state.nodes);
      const meaningfulChange = shouldRecordNodeHistory(changes);

      return {
        ...(meaningfulChange
          ? {
              ...createDirtyState("Workflow nodes updated."),
              ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
            }
          : {}),
        nodeRuntime: mergeRuntimeForExistingNodes(nextNodes, state.nodeRuntime),
        nodes: nextNodes,
      };
    });
  },
  openCommandPalette: () => {
    set({
      isCommandPaletteOpen: true,
    });
  },
  pendingSaveRequest: null,
  redo: () => {
    const state = get();

    if (state.isExecuting || state.redoStack.length === 0) {
      return;
    }

    const nextDocument = state.redoStack[state.redoStack.length - 1];
    const currentDocument = snapshotDocumentFromState(state);
    const nextUndoStack = [...state.undoStack, currentDocument].slice(
      -MAX_EDITOR_HISTORY,
    );
    const nextRedoStack = state.redoStack.slice(0, -1);

    set({
      ...createDirtyState("Redid workflow change."),
      ...restoreDocumentState(nextDocument),
      canRedo: nextRedoStack.length > 0,
      canUndo: nextUndoStack.length > 0,
      isCommandPaletteOpen: false,
      redoStack: nextRedoStack,
      undoStack: nextUndoStack,
    });
  },
  replaceRunHistory: (runHistory) => {
    set((state) => {
      const matchingActiveRun = state.activeRun
        ? runHistory.find((run) => run.id === state.activeRun?.id) ?? null
        : null;
      const fallbackInflightRun =
        matchingActiveRun ??
        runHistory.find((run) => run.status === "queued" || run.status === "running") ??
        null;
      const nextActiveRun =
        fallbackInflightRun &&
        (fallbackInflightRun.status === "queued" ||
          fallbackInflightRun.status === "running")
          ? fallbackInflightRun
          : null;
      const runtimeSource = matchingActiveRun ?? nextActiveRun ?? runHistory[0] ?? null;

      return {
        activeRun: nextActiveRun,
        isExecuting: Boolean(nextActiveRun),
        nodeRuntime: runtimeSource
          ? buildRuntimeFromRun(state.nodes, runtimeSource, state.nodeRuntime)
          : createIdleRuntime(state.nodes),
        runHistory,
      };
    });
  },
  requestSave: ({ createVersion, reason }) => {
    set({
      pendingSaveRequest: {
        createVersion,
        reason,
        token: Date.now(),
      },
    });
  },
  resetStarterFlow: () => {
    const state = get();

    set({
      ...createDirtyState("Reset back to the grading sample workflow."),
      ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
      ...restoreDocumentState(starterPayload.document),
      isCommandPaletteOpen: false,
      lastSavedAtMs: null,
      runHistory: [],
      workflowDescription:
        starterPayload.document.description ?? "Starter workflow reset.",
      workflowName: starterPayload.document.name,
    });
  },
  restoreWorkflowVersion: async (versionId, versionLabel) => {
    const state = get();
    const localDocument = loadLocalVersionDocument(versionId);

    let document = localDocument;

    if (!document) {
      try {
        document = await fetchWorkflowVersionDocument({
          versionId,
          workflowId: state.workflowId ?? undefined,
        });
      } catch {
        set({
          saveMessage: "Unable to restore that saved version right now.",
          saveState: "error",
        });
        return;
      }
    }

    if (!document) {
      set({
        saveMessage: "Unable to restore that saved version right now.",
        saveState: "error",
      });
      return;
    }

    set((current) => ({
      ...createDirtyState(`Restored ${versionLabel} into the current draft.`),
      ...createHistoryState(
        snapshotDocumentFromState(current),
        current.undoStack,
      ),
      ...restoreDocumentState(document),
      isCommandPaletteOpen: false,
      runHistory: current.runHistory,
      workflowId: current.workflowId,
      workflowVersions: current.workflowVersions,
    }));
  },
  retryLatestFailedRun: async () => {
    if (get().isExecuting) {
      return;
    }

    const failedRun = get().runHistory.find(
      (run) =>
        run.status === "failed" &&
        run.nodeRuns.some((nodeRun) => nodeRun.status === "failed"),
    );

    if (!failedRun) {
      set({
        saveMessage: "No failed run is available to retry.",
        saveState: "error",
      });
      return;
    }

    const failedNodeIds = Array.from(
      new Set(
        failedRun.nodeRuns
          .filter((nodeRun) => nodeRun.status === "failed")
          .map((nodeRun) => nodeRun.nodeId),
      ),
    );

    if (failedNodeIds.length === 0) {
      set({
        saveMessage: "The latest failed run did not contain retryable nodes.",
        saveState: "error",
      });
      return;
    }

    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        selected: failedNodeIds.includes(node.id),
      })),
      saveMessage: `Retrying ${failedNodeIds.length} failed node(s) from ${failedRun.id}.`,
    }));

    await executeScope("selected", failedNodeIds);
  },
  runFullWorkflow: async () => {
    if (get().isExecuting) {
      return;
    }

    await executeScope("full");
  },
  runHistory: [],
  runSingleNode: async () => {
    if (get().isExecuting) {
      return;
    }

    const selectedNodeCount = get().getSelectedNodeIds().length;

    if (selectedNodeCount !== 1) {
      set({
        saveMessage: "Select exactly one node to run a single-node path.",
        saveState: "error",
      });
      return;
    }

    await executeScope("single");
  },
  runSelectedWorkflow: async () => {
    if (get().isExecuting) {
      return;
    }

    const selectedNodeCount = get().getSelectedNodeIds().length;

    if (selectedNodeCount < 2) {
      set({
        saveMessage:
          "Select two or more nodes to run a selected group. Use Run node for a single target.",
        saveState: "error",
      });
      return;
    }

    await executeScope("selected");
  },
  redoStack: [],
  saveMessage: "Starter sample loaded.",
  saveState: "idle",
  source: starterPayload.source,
  toggleCommandPalette: () => {
    set((state) => ({
      isCommandPaletteOpen: !state.isCommandPaletteOpen,
    }));
  },
  toggleNodeExpanded: (nodeId, isExpanded) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                isExpanded:
                  isExpanded === undefined ? !node.data.isExpanded : isExpanded,
              },
            }
          : node,
      ),
    }));
  },
  undo: () => {
    const state = get();

    if (state.isExecuting || state.undoStack.length === 0) {
      return;
    }

    const previousDocument = state.undoStack[state.undoStack.length - 1];
    const currentDocument = snapshotDocumentFromState(state);
    const nextUndoStack = state.undoStack.slice(0, -1);
    const nextRedoStack = [...state.redoStack, currentDocument].slice(
      -MAX_EDITOR_HISTORY,
    );

    set({
      ...createDirtyState("Undid workflow change."),
      ...restoreDocumentState(previousDocument),
      canRedo: nextRedoStack.length > 0,
      canUndo: nextUndoStack.length > 0,
      isCommandPaletteOpen: false,
      redoStack: nextRedoStack,
      undoStack: nextUndoStack,
    });
  },
  undoStack: [],
  updateNodeData: (nodeId, patch) => {
    set((state) => ({
      ...createDirtyState("Node configuration updated."),
      ...createHistoryState(snapshotDocumentFromState(state), state.undoStack),
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...patch,
              },
            }
          : node,
      ),
    }));
  },
  workflowDescription:
    starterPayload.document.description ?? "Starter workflow description",
  workflowId: starterPayload.workflowId,
  workflowName: starterPayload.document.name,
  workflowVersions: starterPayload.versions,
}));
