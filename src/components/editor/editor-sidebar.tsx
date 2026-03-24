"use client";

import { useState } from "react";
import { Grip, MousePointerClick, Search } from "lucide-react";

import { quickNodeCatalog } from "@/lib/editor/node-catalog";
import { useEditorStore } from "@/stores/editor-store";

const outputHints: Record<(typeof quickNodeCatalog)[number]["type"], string> = {
  "crop-image": "Outputs image",
  "extract-frame": "Outputs image",
  "run-llm": "Outputs text",
  text: "Outputs text",
  "upload-image": "Outputs image",
  "upload-video": "Outputs video",
};

export function EditorSidebar() {
  const addNode = useEditorStore((state) => state.addNode);
  const [query, setQuery] = useState("");
  const filteredNodes = quickNodeCatalog.filter((node) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return (
      node.label.toLowerCase().includes(normalizedQuery) ||
      node.description.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <aside className="nextflow-panel-surface flex w-full shrink-0 flex-col border-b border-white/10 xl:h-full xl:w-full xl:max-w-none xl:border-r xl:border-b-0">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0c10]/95 px-4 py-3 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">
          Automation Library
        </p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Blocks</h2>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-100">
            {filteredNodes.length} visible
          </span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          Click or drag a block onto the canvas
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blocks..."
            value={query}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <MousePointerClick className="h-3.5 w-3.5 text-cyan-200" />
            Click to add
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Grip className="h-3.5 w-3.5 text-cyan-200" />
            Drag to place
          </span>
        </div>
      </div>

      <div className="grid max-h-[42vh] flex-1 gap-2 overflow-y-auto px-3 py-3 sm:grid-cols-2 xl:block xl:max-h-none xl:space-y-2">
        {filteredNodes.map((node) => {
          const Icon = node.icon;

          return (
            <button
              key={node.type}
              className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/[0.06]"
              draggable
              onClick={() => addNode(node.type)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/nextflow-node", node.type);
              }}
              type="button"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${node.accent} text-slate-950 shadow-lg`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[13px] font-semibold text-white">
                      {node.label}
                    </h3>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                      Quick
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-5 text-slate-400">
                    {node.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                    <span>{outputHints[node.type]}</span>
                    <span className="text-cyan-200/70">Drag or click</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filteredNodes.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-400">
            No node matched that search.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
