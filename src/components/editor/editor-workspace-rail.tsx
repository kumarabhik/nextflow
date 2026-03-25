"use client";

import { Blocks, PlaySquare, Sparkles } from "lucide-react";

type EditorWorkspaceRailProps = {
  canvasFocus: boolean;
  libraryOpen: boolean;
  onToggleFocus: () => void;
  onToggleLibrary: () => void;
  onToggleRuns: () => void;
  runsOpen: boolean;
};

type RailItem = {
  label: string;
  status: string;
  icon: typeof Sparkles;
  onClick: () => void;
  selected: boolean;
  tooltip: string;
};

export function EditorWorkspaceRail({
  canvasFocus,
  libraryOpen,
  onToggleFocus,
  onToggleLibrary,
  onToggleRuns,
  runsOpen,
}: EditorWorkspaceRailProps) {
  const railItems: RailItem[] = [
    {
      icon: Sparkles,
      label: "Studio",
      onClick: onToggleFocus,
      selected: canvasFocus,
      status: canvasFocus ? "Focus" : "Open",
      tooltip: "Focus mode: hide or restore side panels",
    },
    {
      icon: Blocks,
      label: "Library",
      onClick: onToggleLibrary,
      selected: libraryOpen,
      status: libraryOpen ? "Shown" : "Hidden",
      tooltip: "Toggle the Automation Library panel",
    },
    {
      icon: PlaySquare,
      label: "Runs",
      onClick: onToggleRuns,
      selected: runsOpen,
      status: runsOpen ? "Shown" : "Hidden",
      tooltip: "Toggle the Run Inspector panel",
    },
  ];

  return (
    <aside className="nextflow-panel-surface hidden h-full w-[68px] shrink-0 flex-col items-center gap-3 border-r border-white/[0.06] px-2 py-4 xl:flex">
      <div className="group relative">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 text-cyan-100 shadow-lg shadow-cyan-500/15 transition-transform hover:scale-105">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 opacity-0 blur-lg transition-opacity group-hover:opacity-30" />
      </div>

      <div className="h-px w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex w-full flex-1 flex-col items-center gap-2">
        {railItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="group relative w-full">
              <button
                aria-label={item.label}
                className={`relative grid h-11 w-11 place-items-center rounded-xl border transition-all ${
                  item.selected
                    ? "border-cyan-400/35 bg-gradient-to-br from-cyan-400/15 to-cyan-400/5 text-cyan-100 shadow-lg shadow-cyan-500/10"
                    : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                }`}
                onClick={item.onClick}
                type="button"
              >
                <Icon className="h-4 w-4" />
                {item.selected && (
                  <div className="absolute -right-0.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400" />
                )}
              </button>

              <div className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden min-w-[160px] -translate-y-1/2 rounded-xl border border-white/[0.08] bg-[#0f1117]/98 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl group-hover:block">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{item.label}</p>
                  <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-cyan-300">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.tooltip}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
