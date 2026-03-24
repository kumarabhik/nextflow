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
    <aside className="nextflow-panel-surface flex max-h-[48vh] w-full shrink-0 flex-col border-t border-white/10 xl:max-h-none xl:h-full xl:w-full xl:max-w-none xl:border-t-0 xl:border-l">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">
          Run Inspector
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Runs</h2>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          Inspect outputs, timings, and failures
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {runs.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm leading-6 text-slate-400">
            No runs yet. Use <span className="text-slate-200">Run</span> to populate this panel.
          </div>
        ) : null}

        {runs.map((run) => {
          const isExpanded = expandedRunId === run.id;

          return (
            <article
              key={run.id}
              className="rounded-[24px] border border-white/10 bg-white/[0.03] p-3.5"
            >
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpandedRunId((current) => (current === run.id ? null : run.id))
                }
                type="button"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{run.id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {run.createdAtLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {run.persistedSource ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        <Database className="h-3 w-3" />
                        {run.persistedSource}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${runStatusStyles[run.status]}`}
                    >
                      {run.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {run.durationLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 capitalize">
                    <PlayCircle className="h-4 w-4" />
                    {run.scope}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">{run.summary}</p>
              </button>

              <div className="mt-3 rounded-2xl border border-white/8 bg-[#0f1117] p-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 text-slate-200">
                  <TriangleAlert className="h-4 w-4 text-cyan-300" />
                  {run.nodeRuns.length} node event(s) captured in this run.
                </div>

                {isExpanded ? (
                  <ul className="mt-3 space-y-3">
                    {run.nodeRuns.map((nodeRun) => (
                      <li
                        key={nodeRun.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-sm font-medium text-white">
                              {nodeRun.nodeTitle}
                            </span>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {nodeRun.nodeType}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-xs font-semibold uppercase tracking-[0.18em] ${nodeStatusStyles[nodeRun.status]}`}
                            >
                              {nodeRun.status}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                              {nodeRun.durationLabel}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {nodeRun.summary}
                        </p>

                        {nodeRun.inputSummary ? (
                          <div className="mt-3 rounded-2xl border border-white/8 bg-[#131620] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              Inputs
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                              {nodeRun.inputSummary}
                            </p>
                          </div>
                        ) : null}

                        {nodeRun.outputSummary ? (
                          <div className="mt-3 rounded-2xl border border-white/8 bg-[#131620] px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                              Outputs
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                              {nodeRun.outputSummary}
                            </p>
                          </div>
                        ) : null}

                        {nodeRun.dependencyNodeIds?.length ? (
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                            Dependencies: {nodeRun.dependencyNodeIds.join(", ")}
                          </p>
                        ) : null}

                        {nodeRun.errorMessage ? (
                          <p className="mt-3 text-sm leading-6 text-red-200">
                            {nodeRun.errorMessage}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {run.nodeRuns.slice(0, 3).map((nodeRun) => (
                      <li
                        key={nodeRun.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-white">
                            {nodeRun.nodeTitle}
                          </span>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {nodeRun.durationLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {nodeRun.status} / {nodeRun.nodeType}
                        </p>
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
