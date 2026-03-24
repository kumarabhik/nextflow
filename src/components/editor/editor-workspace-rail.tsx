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
    <aside className="nextflow-panel-surface hidden h-full w-[64px] shrink-0 flex-col items-center gap-3 border-r border-white/10 px-2 py-3 xl:flex">
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/18 to-emerald-300/10 text-cyan-100 shadow-lg shadow-cyan-950/20">
        <Sparkles className="h-5 w-5" />
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-3 pt-1">
        {railItems.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="group relative w-full">
              <button
                aria-label={item.label}
                className={`grid h-12 w-12 place-items-center rounded-2xl border transition ${
                  item.selected
                    ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.06)]"
                    : "border-white/8 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]"
                }`}
                onClick={item.onClick}
                type="button"
              >
                <Icon className="h-4 w-4" />
              </button>

              <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 hidden min-w-[140px] -translate-y-1/2 rounded-xl border border-white/10 bg-[#11141b]/96 px-3 py-2 text-xs shadow-xl shadow-black/30 group-hover:block">
                <p className="font-medium text-slate-100">{item.label}</p>
                <p className="mt-1 uppercase tracking-[0.18em] text-slate-500">
                  {item.status}
                </p>
                <p className="mt-2 text-slate-300">{item.tooltip}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
