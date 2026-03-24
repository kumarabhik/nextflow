"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock3,
  Command,
  ListFilter,
  Play,
  Redo2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Undo2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

type PaletteAction = {
  description: string;
  disabled?: boolean;
  icon: typeof Play;
  id: string;
  keywords: string[];
  label: string;
  shortcut: string;
  run: () => void | Promise<void>;
};

export function EditorCommandPalette() {
  const canRedo = useEditorStore((state) => state.canRedo);
  const canUndo = useEditorStore((state) => state.canUndo);
  const closeCommandPalette = useEditorStore((state) => state.closeCommandPalette);
  const isCommandPaletteOpen = useEditorStore(
    (state) => state.isCommandPaletteOpen,
  );
  const isExecuting = useEditorStore((state) => state.isExecuting);
  const nodes = useEditorStore((state) => state.nodes);
  const redo = useEditorStore((state) => state.redo);
  const requestSave = useEditorStore((state) => state.requestSave);
  const resetStarterFlow = useEditorStore((state) => state.resetStarterFlow);
  const restoreWorkflowVersion = useEditorStore(
    (state) => state.restoreWorkflowVersion,
  );
  const retryLatestFailedRun = useEditorStore(
    (state) => state.retryLatestFailedRun,
  );
  const runHistory = useEditorStore((state) => state.runHistory);
  const runFullWorkflow = useEditorStore((state) => state.runFullWorkflow);
  const runSingleNode = useEditorStore((state) => state.runSingleNode);
  const runSelectedWorkflow = useEditorStore(
    (state) => state.runSelectedWorkflow,
  );
  const undo = useEditorStore((state) => state.undo);
  const workflowVersions = useEditorStore((state) => state.workflowVersions);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNodeCount = nodes.filter((node) => node.selected).length;
  const latestVersion = workflowVersions[0] ?? null;
  const latestFailedRun = runHistory.find(
    (run) =>
      run.status === "failed" &&
      run.nodeRuns.some((nodeRun) => nodeRun.status === "failed"),
  );
  const versionActions: PaletteAction[] = workflowVersions.slice(0, 5).map(
    (version) => ({
      description: `Restore saved version ${version.versionNumber} from ${version.createdAtLabel}.`,
      disabled: isExecuting,
      icon: Clock3,
      id: `restore-version-${version.id}`,
      keywords: [
        "restore",
        "version",
        "snapshot",
        "recovery",
        version.createdAtLabel.toLowerCase(),
      ],
      label: `Restore v${version.versionNumber} (${version.createdAtLabel})`,
      shortcut: "-",
      run: () =>
        restoreWorkflowVersion(version.id, `version ${version.versionNumber}`),
    }),
  );

  const actions: PaletteAction[] = [
    {
      description: "Dispatch the entire workflow graph.",
      disabled: isExecuting,
      icon: Play,
      id: "run-full",
      keywords: ["workflow", "run", "execute", "full"],
      label: "Run Workflow",
      shortcut: "Ctrl Enter",
      run: () => void runFullWorkflow(),
    },
    {
      description: "Run one selected node together with the upstream inputs it depends on.",
      disabled: isExecuting || selectedNodeCount !== 1,
      icon: Play,
      id: "run-single",
      keywords: ["single", "node", "execute", "path"],
      label: selectedNodeCount === 1 ? "Run Node" : "Run Node (select 1)",
      shortcut: "Ctrl Alt Enter",
      run: () => void runSingleNode(),
    },
    {
      description: "Run only the selected node group and its dependencies.",
      disabled: isExecuting || selectedNodeCount < 2,
      icon: ListFilter,
      id: "run-selected",
      keywords: ["selected", "partial", "nodes", "execute"],
      label:
        selectedNodeCount > 1
          ? `Run Selected (${selectedNodeCount})`
          : "Run Selected (select 2+)",
      shortcut: "Ctrl Shift Enter",
      run: () => void runSelectedWorkflow(),
    },
    {
      description: "Save the current draft without creating a new version.",
      icon: Save,
      id: "save-draft",
      keywords: ["save", "draft", "persist"],
      label: "Save Draft",
      shortcut: "Ctrl S",
      run: () => requestSave({ createVersion: false, reason: "manual" }),
    },
    {
      description: "Create a numbered version snapshot for restore points later.",
      icon: Clock3,
      id: "save-version",
      keywords: ["save", "version", "snapshot"],
      label: "Save Version",
      shortcut: "Ctrl Shift S",
      run: () => requestSave({ createVersion: true, reason: "manual" }),
    },
    {
      description: "Undo the latest workflow graph or node configuration change.",
      disabled: isExecuting || !canUndo,
      icon: Undo2,
      id: "undo",
      keywords: ["undo", "history", "back"],
      label: "Undo",
      shortcut: "Ctrl Z",
      run: undo,
    },
    {
      description: "Redo the last undone workflow change.",
      disabled: isExecuting || !canRedo,
      icon: Redo2,
      id: "redo",
      keywords: ["redo", "history", "forward"],
      label: "Redo",
      shortcut: "Ctrl Shift Z",
      run: redo,
    },
    {
      description: "Reload the built-in grading sample workflow.",
      disabled: isExecuting,
      icon: RotateCcw,
      id: "reset-sample",
      keywords: ["reset", "sample", "starter"],
      label: "Reset Sample Workflow",
      shortcut: "-",
      run: resetStarterFlow,
    },
    {
      description: latestVersion
        ? `Restore saved version ${latestVersion.versionNumber} into the current draft.`
        : "No saved version is available yet.",
      disabled: isExecuting || !latestVersion,
      icon: RotateCcw,
      id: "restore-latest-version",
      keywords: ["restore", "version", "snapshot", "recovery"],
      label: latestVersion
        ? `Restore Version ${latestVersion.versionNumber}`
        : "Restore Latest Version",
      shortcut: "-",
      run: () =>
        latestVersion
          ? restoreWorkflowVersion(
              latestVersion.id,
              `version ${latestVersion.versionNumber}`,
            )
          : undefined,
    },
    ...versionActions,
    {
      description: latestFailedRun
        ? `Retry the failed nodes from ${latestFailedRun.id}.`
        : "No failed run is available yet.",
      disabled: isExecuting || !latestFailedRun,
      icon: RefreshCw,
      id: "retry-failed-run",
      keywords: ["retry", "failed", "run", "replay"],
      label: latestFailedRun ? `Retry ${latestFailedRun.id}` : "Retry Failed Run",
      shortcut: "-",
      run: () => void retryLatestFailedRun(),
    },
  ];

  const filteredActions = actions.filter((action) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      action.label.toLowerCase().includes(normalizedQuery) ||
      action.description.toLowerCase().includes(normalizedQuery) ||
      action.keywords.some((keyword) => keyword.includes(normalizedQuery))
    );
  });
  const resolvedActiveIndex =
    filteredActions.length === 0
      ? 0
      : Math.min(activeIndex, filteredActions.length - 1);

  const closePalette = () => {
    setQuery("");
    setActiveIndex(0);
    closeCommandPalette();
  };

  useEffect(() => {
    if (!isCommandPaletteOpen) {
      return;
    }

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#040507]/70 px-4 py-16 backdrop-blur-sm"
      onClick={closePalette}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0e1118] shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePalette();
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) =>
              filteredActions.length === 0
                ? 0
                : (current + 1) % filteredActions.length,
            );
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) =>
              filteredActions.length === 0
                ? 0
                : (current - 1 + filteredActions.length) % filteredActions.length,
            );
            return;
          }

          if (event.key === "Enter") {
            const action = filteredActions[resolvedActiveIndex];

            if (!action || action.disabled) {
              return;
            }

            event.preventDefault();
            closePalette();
            void action.run();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-100">
            <Command className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">
              Command menu
            </p>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b0e13] px-3 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                ref={inputRef}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions, runs, saves, undo..."
                value={query}
              />
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filteredActions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              No command matched that search.
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredActions.map((action, index) => {
                const Icon = action.icon;

                return (
                  <li key={action.id}>
                    <button
                      className={cn(
                        "flex w-full items-center justify-between rounded-3xl border px-4 py-3 text-left transition",
                        index === resolvedActiveIndex
                          ? "border-cyan-300/25 bg-cyan-300/[0.08]"
                          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]",
                        action.disabled && "cursor-not-allowed opacity-45",
                      )}
                      disabled={action.disabled}
                      onClick={() => {
                        closePalette();
                        void action.run();
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      type="button"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#121622] text-cyan-100">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {action.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        {action.shortcut}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
