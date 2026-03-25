"use client";

import { useRef, useState } from "react";
import {
  Clock3,
  Command,
  Download,
  ListFilter,
  Play,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Undo2,
  Upload,
} from "lucide-react";

import { formatSavedAtLabel } from "@/lib/execution/formatters";
import { parseWorkflowDocument } from "@/lib/workflows/document";
import { useEditorStore } from "@/stores/editor-store";
import type { EnvironmentStatus } from "@/types/workflow";

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

type EditorTopbarProps = {
  environmentStatus: EnvironmentStatus;
};

export function EditorTopbar({ environmentStatus }: EditorTopbarProps) {
  const activeRun = useEditorStore((state) => state.activeRun);
  const buildWorkflowDocument = useEditorStore(
    (state) => state.buildWorkflowDocument,
  );
  const canRedo = useEditorStore((state) => state.canRedo);
  const canUndo = useEditorStore((state) => state.canUndo);
  const importWorkflowDocument = useEditorStore(
    (state) => state.importWorkflowDocument,
  );
  const isExecuting = useEditorStore((state) => state.isExecuting);
  const lastSavedAtMs = useEditorStore((state) => state.lastSavedAtMs);
  const nodes = useEditorStore((state) => state.nodes);
  const openCommandPalette = useEditorStore((state) => state.openCommandPalette);
  const redo = useEditorStore((state) => state.redo);
  const requestSave = useEditorStore((state) => state.requestSave);
  const resetStarterFlow = useEditorStore((state) => state.resetStarterFlow);
  const restoreWorkflowVersion = useEditorStore(
    (state) => state.restoreWorkflowVersion,
  );
  const retryLatestFailedRun = useEditorStore(
    (state) => state.retryLatestFailedRun,
  );
  const runSingleNode = useEditorStore((state) => state.runSingleNode);
  const runHistory = useEditorStore((state) => state.runHistory);
  const runFullWorkflow = useEditorStore((state) => state.runFullWorkflow);
  const runSelectedWorkflow = useEditorStore((state) => state.runSelectedWorkflow);
  const saveMessage = useEditorStore((state) => state.saveMessage);
  const saveState = useEditorStore((state) => state.saveState);
  const undo = useEditorStore((state) => state.undo);
  const workflowName = useEditorStore((state) => state.workflowName);
  const workflowVersions = useEditorStore((state) => state.workflowVersions);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoringVersion, setIsRestoringVersion] = useState(false);

  const selectedNodeCount = nodes.filter((node) => node.selected).length;
  const latestVersion = workflowVersions[0] ?? null;
  const latestFailedRun = runHistory.find(
    (run) =>
      run.status === "failed" &&
      run.nodeRuns.some((nodeRun) => nodeRun.status === "failed"),
  );

  const saveStateStyles: Record<typeof saveState, string> = {
    dirty: "border-amber-400/20 bg-amber-400/10 text-amber-100",
    error: "border-red-400/20 bg-red-400/10 text-red-100",
    idle: "border-white/10 bg-white/5 text-slate-300",
    local: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100",
    saved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    saving: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  };

  const environmentReady =
    environmentStatus.remoteExecutionReady && environmentStatus.clerkConfigured;

  const toolbarGroupClass =
    "flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 shadow-xl shadow-black/10 backdrop-blur-md";
  const neutralButtonClass =
    "rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-300";
  const runButtonClass =
    "rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-400/15 to-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-500/10 transition-all hover:border-cyan-400/40 hover:from-cyan-400/20 hover:to-cyan-400/15 hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-gradient-to-b from-[#0f1117]/98 to-[#0b0d11]/95 backdrop-blur-xl depth-shadow">
      <input
        ref={fileInputRef}
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          try {
            const raw = await file.text();
            const document = parseWorkflowDocument(JSON.parse(raw));
            importWorkflowDocument(document);
          } catch {
            window.alert("That file is not a valid NextFlow workflow export.");
          } finally {
            event.target.value = "";
          }
        }}
        type="file"
      />

      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="group relative">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-300 to-emerald-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-300 opacity-0 blur-lg transition-opacity group-hover:opacity-40" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/80">
                NextFlow
              </p>
              <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                Automation Bar
              </span>
              <span
                className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] ${saveStateStyles[saveState]}`}
              >
                {saveState}
              </span>
            </div>
            <h1 className="truncate text-base font-semibold text-white">
              {workflowName}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-400">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${
              environmentReady
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                : "border-amber-400/20 bg-amber-400/10 text-amber-100"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                environmentReady ? "bg-emerald-300" : "bg-amber-300"
              }`}
            />
            {environmentReady ? "Live stack" : "Setup needed"}
          </span>
          <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] lg:inline-flex">
            {activeRun
              ? `${activeRun.scope} run live`
              : `${saveMessage}${lastSavedAtMs ? ` / ${formatSavedAtLabel(lastSavedAtMs)}` : ""}`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] bg-gradient-to-b from-white/[0.01] to-transparent px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className={toolbarGroupClass}>
            <button
              className={neutralButtonClass}
              disabled={isExecuting || !canUndo}
              onClick={undo}
              type="button"
            >
              <Undo2 className="mr-2 inline h-4 w-4" />
              Undo
            </button>
            <button
              className={neutralButtonClass}
              disabled={isExecuting || !canRedo}
              onClick={redo}
              type="button"
            >
              <Redo2 className="mr-2 inline h-4 w-4" />
              Redo
            </button>
            <button
              className={neutralButtonClass}
              onClick={openCommandPalette}
              type="button"
            >
              <Command className="mr-2 inline h-4 w-4" />
              Command
            </button>
          </div>

          <div className={toolbarGroupClass}>
            <button
              className={neutralButtonClass}
              onClick={() => requestSave({ createVersion: false, reason: "manual" })}
              type="button"
            >
              <Save className="mr-2 inline h-4 w-4" />
              Save
            </button>
            <button
              className={neutralButtonClass}
              onClick={() => requestSave({ createVersion: true, reason: "manual" })}
              type="button"
            >
              <Clock3 className="mr-2 inline h-4 w-4" />
              Version
            </button>
            <button
              className={neutralButtonClass}
              disabled={isExecuting || isRestoringVersion || !latestVersion}
              onClick={() => {
                if (!latestVersion) {
                  return;
                }

                setIsRestoringVersion(true);
                void restoreWorkflowVersion(
                  latestVersion.id,
                  `version ${latestVersion.versionNumber}`,
                ).finally(() => {
                  setIsRestoringVersion(false);
                });
              }}
              type="button"
            >
              <RotateCcw className="mr-2 inline h-4 w-4" />
              {isRestoringVersion ? "Restoring..." : "Restore"}
            </button>
            <button
              className={neutralButtonClass}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload className="mr-2 inline h-4 w-4" />
              Import
            </button>
            <button
              className={neutralButtonClass}
              onClick={() => {
                const workflowDocument = buildWorkflowDocument();
                const blob = new Blob([JSON.stringify(workflowDocument, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const anchor = window.document.createElement("a");

                anchor.href = url;
                anchor.download = `${sanitizeFileName(workflowDocument.name)}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}
              type="button"
            >
              <Download className="mr-2 inline h-4 w-4" />
              Export
            </button>
          </div>

          <div className={toolbarGroupClass}>
            <button
              className={neutralButtonClass}
              disabled={isExecuting}
              onClick={resetStarterFlow}
              type="button"
            >
              <RotateCcw className="mr-2 inline h-4 w-4" />
              Reset
            </button>
            <button
              className={neutralButtonClass}
              disabled={isExecuting || !latestFailedRun}
              onClick={() => void retryLatestFailedRun()}
              type="button"
            >
              <RefreshCw className="mr-2 inline h-4 w-4" />
              Retry
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {selectedNodeCount === 0
              ? "No selection"
              : `${selectedNodeCount} selected`}
          </span>
          <div className={`${toolbarGroupClass} border-cyan-300/15 bg-cyan-300/[0.04]`}>
            <button
              className={runButtonClass}
              disabled={isExecuting || selectedNodeCount !== 1}
              onClick={() => void runSingleNode()}
              type="button"
            >
              <Play className="mr-2 inline h-4 w-4" />
              Node
            </button>
            <button
              className={runButtonClass}
              disabled={isExecuting || selectedNodeCount < 2}
              onClick={() => void runSelectedWorkflow()}
              type="button"
            >
              <ListFilter className="mr-2 inline h-4 w-4" />
              Selected
            </button>
            <button
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:scale-105 disabled:cursor-not-allowed disabled:from-cyan-300/70 disabled:to-cyan-200/70 disabled:shadow-cyan-500/10"
              disabled={isExecuting}
              onClick={() => void runFullWorkflow()}
              type="button"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Play className="h-4 w-4" />
                {isExecuting ? "Running..." : "Run"}
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 transition-transform group-hover:translate-x-full" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
