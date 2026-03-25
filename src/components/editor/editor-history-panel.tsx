"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  Database,
  PlayCircle,
  TriangleAlert,
} from "lucide-react";

import { useEditorStore } from "@/stores/editor-store";
import type { NodeRunRecord, WorkflowRunItem } from "@/types/workflow";

const runStatusStyles: Record<WorkflowRunItem["status"], string> = {
  failed: "border-red-400/20 bg-red-400/10 text-red-100",
  queued: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  running: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
};

const nodeStatusStyles: Record<NodeRunRecord["status"], string> = {
  failed: "text-red-200",
  queued: "text-cyan-100",
  running: "text-amber-100",
  skipped: "text-slate-400",
  success: "text-emerald-100",
  waiting: "text-violet-100",
};

export function EditorHistoryPanel() {
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const activeRun = useEditorStore((state) => state.activeRun);
  const runHistory = useEditorStore((state) => state.runHistory);
  const runs = activeRun
    ? [activeRun, ...runHistory.filter((run) => run.id !== activeRun.id)]
    : runHistory;

  return (
    <aside className="nextflow-panel-surface flex max-h-[48vh] w-full shrink-0 flex-col border-t border-white/[0.06] xl:max-h-none xl:h-full xl:w-full xl:max-w-none xl:border-t-0 xl:border-l">
      <div className="border-b border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent px-4 py-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-300/80">
          <PlayCircle className="h-3 w-3" />
          Run Inspector
        </div>
        <h2 className="mt-3 text-lg font-semibold text-white">Runs</h2>
        <p className="mt-1 text-xs text-slate-500">
          Inspect outputs, timings, and failures
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {runs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-5 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
              <PlayCircle className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">
              No runs yet. Use <span className="font-medium text-white">Run</span> to populate this panel.
            </p>
          </div>
        ) : null}

        {runs.map((run) => {
          const isExpanded = expandedRunId === run.id;

          return (
            <article
              key={run.id}
              className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent transition-all hover:border-white/10"
            >
              <button
                className="w-full p-4 text-left transition-colors hover:bg-white/[0.02]"
                onClick={() =>
                  setExpandedRunId((current) => (current === run.id ? null : run.id))
                }
                type="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{run.id}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {run.createdAtLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {run.persistedSource ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-slate-400">
                        <Database className="h-3 w-3" />
                        {run.persistedSource}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${runStatusStyles[run.status]}`}
                    >
                      {run.status}
                    </span>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-1">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-cyan-400/70" />
                    {run.durationLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    <PlayCircle className="h-3.5 w-3.5 text-cyan-400/70" />
                    {run.scope}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{run.summary}</p>
              </button>

              <div className="border-t border-white/[0.04] bg-gradient-to-b from-white/[0.01] to-transparent p-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-cyan-400/15 bg-cyan-400/8 px-3 py-1.5 text-xs text-cyan-300/80">
                  <TriangleAlert className="h-3.5 w-3.5" />
                  {run.nodeRuns.length} node event(s) captured
                </div>

                {isExpanded ? (
                  <ul className="space-y-2.5">
                    {run.nodeRuns.map((nodeRun) => (
                      <li
                        key={nodeRun.id}
                        className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:border-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-sm font-medium text-white">
                              {nodeRun.nodeTitle}
                            </span>
                            <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-500">
                              {nodeRun.nodeType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${nodeStatusStyles[nodeRun.status]}`}
                            >
                              {nodeRun.status}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {nodeRun.durationLabel}
                            </p>
                          </div>
                        </div>

                        <p className="mt-2.5 text-sm leading-relaxed text-slate-400">
                          {nodeRun.summary}
                        </p>

                        {nodeRun.inputSummary ? (
                          <div className="mt-3 rounded-xl border border-white/[0.05] bg-[#0d0f15] p-3">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                              Inputs
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                              {nodeRun.inputSummary}
                            </p>
                          </div>
                        ) : null}

                        {nodeRun.outputSummary ? (
                          <div className="mt-3 rounded-xl border border-white/[0.05] bg-[#0d0f15] p-3">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                              Outputs
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
                              {nodeRun.outputSummary}
                            </p>
                          </div>
                        ) : null}

                        {nodeRun.dependencyNodeIds?.length ? (
                          <p className="mt-3 text-xs text-slate-500">
                            Dependencies: {nodeRun.dependencyNodeIds.join(", ")}
                          </p>
                        ) : null}

                        {nodeRun.errorMessage ? (
                          <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm leading-relaxed text-red-200">
                            {nodeRun.errorMessage}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    {run.nodeRuns.slice(0, 3).map((nodeRun) => (
                      <li
                        key={nodeRun.id}
                        className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {nodeRun.nodeTitle}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            / {nodeRun.nodeType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {nodeRun.durationLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
