import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07080b] px-6 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[40px] border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-12">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/60">
            Krea-inspired workflow builder
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl">
            Build Gemini-powered multimodal workflows with product-grade
            execution history.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            NextFlow is being built as a polished LLM workflow canvas with
            Trigger.dev orchestration, Prisma-backed history, and a
            Krea-influenced editor experience.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              href="/dashboard"
            >
              Open dashboard
            </Link>
            <Link
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/sign-in"
            >
              Sign in with Clerk
            </Link>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              "6 grading-critical nodes",
              "Parallel DAG execution",
              "Node-level run history",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-[#10131a] p-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[40px] border border-white/10 bg-[#0d0f14] shadow-2xl shadow-cyan-500/10">
          <div className="border-b border-white/10 px-6 py-4 text-sm text-slate-300">
            First 10-step slice
          </div>
          <div className="space-y-4 p-6">
            {[
              "Next.js app scaffolded and flattened into the workspace root",
              "Clerk, Prisma, Zustand, Zod, React Flow, and Lucide installed",
              "Protected dashboard route scaffolded with Clerk proxy",
              "Prisma schema and generated client foundation queued",
              "Dashboard shell created with sidebars and canvas placeholder",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-semibold text-slate-950">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
