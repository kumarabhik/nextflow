import { Bot, Crop, FileText, ImagePlus, Sparkles, Video } from "lucide-react";

const nodeCards = [
  {
    id: "n1",
    label: "System Prompt",
    subtitle: "Text Node",
    icon: FileText,
    className: "left-12 top-14",
  },
  {
    id: "n2",
    label: "Product Image",
    subtitle: "Upload Image",
    icon: ImagePlus,
    className: "left-14 top-72",
  },
  {
    id: "n3",
    label: "Crop Image",
    subtitle: "FFmpeg Task",
    icon: Crop,
    className: "left-[23rem] top-[22rem]",
  },
  {
    id: "n4",
    label: "Product Copy",
    subtitle: "Run Any LLM",
    icon: Bot,
    className: "left-[28rem] top-12",
  },
  {
    id: "n5",
    label: "Demo Clip",
    subtitle: "Upload Video",
    icon: Video,
    className: "left-[46rem] top-28",
  },
];

export function EditorCanvasPlaceholder() {
  return (
    <section className="relative flex-1 overflow-hidden bg-[#0f1117]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),transparent_38%),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:auto,44px_44px,44px_44px] bg-[position:center,center,center]" />

      <div className="absolute inset-x-8 top-8 flex items-center justify-between rounded-3xl border border-white/10 bg-[#11141b]/90 px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">
            Canvas foundation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            React Flow shell is next
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            This placeholder preserves the target spatial layout while the graph
            engine, drag-and-drop behavior, and real nodes are wired in.
          </p>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
          Phase 1 of 8
        </div>
      </div>

      <div className="absolute inset-0">
        {nodeCards.map((node) => {
          const Icon = node.icon;

          return (
            <article
              key={node.id}
              className={`absolute w-64 rounded-[28px] border border-white/10 bg-[#121520]/95 p-4 shadow-2xl shadow-black/30 ${node.className}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{node.label}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                    {node.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/6 bg-white/[0.03] p-3 text-sm text-slate-400">
                Baseline shell ready for real graph components, handles, and
                execution states.
              </div>
            </article>
          );
        })}

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          fill="none"
          viewBox="0 0 1280 720"
        >
          <path
            d="M274 120 C 340 120, 350 120, 446 120"
            stroke="rgba(103, 232, 249, 0.85)"
            strokeDasharray="6 10"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M270 336 C 340 336, 350 336, 436 336"
            stroke="rgba(52, 211, 153, 0.85)"
            strokeDasharray="6 10"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M530 120 C 640 120, 660 220, 780 220"
            stroke="rgba(129, 140, 248, 0.85)"
            strokeDasharray="6 10"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="absolute bottom-8 left-8 rounded-3xl border border-white/10 bg-[#11141b]/90 px-5 py-4 shadow-xl shadow-black/30">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Planned in this slice
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>Top-level shell and editor layout</li>
          <li>Protected dashboard foundation</li>
          <li>Node catalog and visual rhythm</li>
          <li>Prisma + Clerk + env scaffolding</li>
        </ul>
      </div>

      <div className="absolute bottom-8 right-8 rounded-3xl border border-white/10 bg-[#11141b]/90 p-4 shadow-xl shadow-black/30">
        <div className="mb-3 flex items-center justify-between gap-8">
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
            MiniMap
          </span>
          <span className="text-xs text-slate-400">Coming with React Flow</span>
        </div>
        <div className="h-28 w-40 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_38%),linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:auto,22px_22px,22px_22px]" />
      </div>
    </section>
  );
}
