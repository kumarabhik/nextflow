"use client";

import { useRef, useState } from "react";
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

function TiltCard3D({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("");
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform: transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

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
    <aside className="nextflow-panel-surface flex w-full shrink-0 flex-col border-b border-white/[0.06] xl:h-full xl:w-full xl:max-w-none xl:border-r xl:border-b-0">
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-gradient-to-b from-[#0c0e14]/98 to-transparent px-4 py-4 backdrop-blur-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/8 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-cyan-300/80">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          Automation Library
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Blocks</h2>
          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-cyan-300">
            {filteredNodes.length} visible
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Click or drag a block onto the canvas
        </p>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 shadow-inner">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search blocks..."
            value={query}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
            <MousePointerClick className="h-3 w-3 text-cyan-400" />
            Click to add
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
            <Grip className="h-3 w-3 text-cyan-400" />
            Drag to place
          </span>
        </div>
      </div>

      <div className="grid max-h-[42vh] flex-1 gap-2.5 overflow-y-auto p-3 sm:grid-cols-2 xl:block xl:max-h-none xl:space-y-2.5">
        {filteredNodes.map((node) => {
          const Icon = node.icon;

          return (
            <TiltCard3D key={node.type}>
              <button
                className="group relative w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3.5 text-left transition-all hover:border-cyan-400/40 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-cyan-500/10 active:scale-[0.98]"
                draggable
                onClick={() => addNode(node.type)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("application/nextflow-node", node.type);
                }}
                type="button"
              >
                <div 
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ transform: "translateZ(40px)" }}
                />
                <div className="relative flex items-start gap-3" style={{ transform: "translateZ(20px)" }}>
                  <div
                    className={`relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${node.accent} text-slate-950 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[13px] font-semibold text-white">
                        {node.label}
                      </h3>
                      <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                        Quick
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-slate-400">
                      {node.description}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="text-slate-500">{outputHints[node.type]}</span>
                      <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-cyan-300/80">
                        Drag or click
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </TiltCard3D>
          );
        })}

        {filteredNodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No node matched that search.</p>
            <p className="mt-1 text-xs text-slate-600">Try a different search term</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
