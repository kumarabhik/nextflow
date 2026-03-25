"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function ThreeDCube() {
  return (
    <div className="relative h-48 w-48" style={{ perspective: "800px" }}>
      <div 
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d", animation: "float-3d 8s ease-in-out infinite" }}
      >
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateY(0deg) translateZ(60px)" }}
        />
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateY(90deg) translateZ(60px)" }}
        />
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateY(180deg) translateZ(60px)" }}
        />
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateY(-90deg) translateZ(60px)" }}
        />
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateX(90deg) translateZ(60px)" }}
        />
        <div 
          className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
          style={{ transform: "rotateX(-90deg) translateZ(60px)" }}
        />
        <div 
          className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-br from-cyan-400/30 to-emerald-400/20 backdrop-blur-sm"
          style={{ transform: "translateZ(60px)" }}
        />
      </div>
    </div>
  );
}

function OrbitingRings() {
  return (
    <div className="relative h-64 w-64" style={{ perspective: "1000px", transformStyle: "preserve-3d" }}>
      <div 
        className="absolute inset-0 rounded-full border border-cyan-400/20"
        style={{ 
          transform: "rotateX(75deg) rotateZ(45deg)",
          animation: "ring-rotate 20s linear infinite"
        }}
      />
      <div 
        className="absolute inset-0 rounded-full border border-violet-400/20"
        style={{ 
          transform: "rotateX(75deg) rotateZ(0deg)",
          animation: "ring-rotate-reverse 15s linear infinite"
        }}
      />
      <div 
        className="absolute inset-0 rounded-full border border-emerald-400/20"
        style={{ 
          transform: "rotateX(75deg) rotateZ(-45deg)",
          animation: "ring-rotate 25s linear infinite reverse"
        }}
      />
      <div 
        className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-cyan-400/40 to-cyan-400/20 backdrop-blur-sm shadow-lg shadow-cyan-500/30"
        style={{ animation: "pulse-depth 3s ease-in-out infinite" }}
      >
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300" />
      </div>
    </div>
  );
}

function FloatingGrid() {
  return (
    <div className="relative h-48 w-48 overflow-hidden rounded-2xl">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(103, 232, 249, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103, 232, 249, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          transform: "perspective(500px) rotateX(60deg) translateY(-50%)",
          animation: "mesh-float 6s ease-in-out infinite"
        }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-transparent to-transparent"
      />
    </div>
  );
}

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
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform("");
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-300 ease-out ${className}`}
      style={{ transform: transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

function MouseGlow() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(103, 232, 249, 0.06) 0%, transparent 50%)`
      }}
    />
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12 text-white perspective-container">
      <MouseGlow />
      
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-[150px]" />
        <div className="absolute right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-violet-500/15 to-purple-500/15 blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 blur-[150px]" />
        
        {mounted && (
          <>
            <div className="absolute right-[15%] top-[20%] float-slow">
              <ThreeDCube />
            </div>
            <div className="absolute left-[10%] top-[60%] float-medium">
              <OrbitingRings />
            </div>
            <div className="absolute right-[25%] bottom-[15%] float-fast">
              <FloatingGrid />
            </div>
          </>
        )}
      </div>

      <nav className="relative z-10 mx-auto mb-12 flex max-w-7xl items-center justify-between">
        <div className="group flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 shadow-lg shadow-cyan-500/20 transition-all group-hover:scale-110 group-hover:shadow-cyan-500/30">
            <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">NextFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
            href="/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/30 transition-all hover:shadow-cyan-500/50 hover:scale-105"
            href="/dashboard"
          >
            <span className="relative z-10 flex items-center gap-2">
              Launch app
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 shadow-2xl shadow-black/40 backdrop-blur-md md:p-10 depth-shadow">
          <TiltCard3D className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 shadow-2xl shadow-black/40 backdrop-blur-md md:p-10">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Krea-inspired workflow builder
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
                Build Gemini-powered
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                multimodal workflows
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent">
                with product-grade execution.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-400">
              A polished LLM workflow canvas with Trigger.dev orchestration,
              Prisma-backed history, and a Krea-influenced editor experience.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/30 transition-all hover:shadow-cyan-500/50 hover:scale-105"
                href="/dashboard"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open dashboard
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform group-hover:translate-x-full" />
              </Link>
              <Link
                className="group rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:border-white/25"
                href="/sign-in"
              >
                Sign in with Clerk
              </Link>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {[
                { icon: "⚡", label: "6 grading-critical nodes", color: "from-amber-400/20 to-orange-400/10" },
                { icon: "🔀", label: "Parallel DAG execution", color: "from-violet-400/20 to-purple-400/10" },
                { icon: "📊", label: "Node-level run history", color: "from-emerald-400/20 to-teal-400/10" },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="group/card relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 transition-all duration-500 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-500/10"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 transition-opacity group-hover/card:opacity-100`} />
                  <div className="relative z-10">
                    <div className="mb-3 text-3xl">{item.icon}</div>
                    <p className="text-sm font-medium text-slate-300">{item.label}</p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-gradient-to-r from-cyan-500/20 to-transparent opacity-0 blur-xl transition-opacity group-hover/card:opacity-100" />
                </div>
              ))}
            </div>
          </TiltCard3D>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent shadow-2xl shadow-cyan-500/5 depth-shadow">
          <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
              </div>
              <span className="text-sm font-medium text-slate-300">Development Progress</span>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {[
              "Next.js app scaffolded and flattened into the workspace root",
              "Clerk, Prisma, Zustand, Zod, React Flow, and Lucide installed",
              "Protected dashboard route scaffolded with Clerk proxy",
              "Prisma schema and generated client foundation queued",
              "Dashboard shell created with sidebars and canvas placeholder",
            ].map((step, index) => (
              <div
                key={step}
                className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-cyan-400/30 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-cyan-500/5"
                style={{ 
                  transform: "translateZ(0)",
                  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                }}
              >
                <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/25 to-cyan-400/5 text-sm font-bold text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30 transition-transform group-hover:scale-110">
                  {index + 1}
                </div>
                <p className="pt-1 text-sm leading-6 text-slate-400 transition-colors group-hover:text-slate-300">{step}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5 backdrop-blur">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-lg shadow-cyan-500/30 transition-all"
                  style={{ width: "60%" }}
                />
              </div>
              <span className="text-sm font-bold text-cyan-300">60%</span>
            </div>
          </div>
        </section>
      </div>

      <section className="relative z-10 mx-auto mt-20 max-w-7xl">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 shadow-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-white">Powered by Modern Tech</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { name: "Next.js", desc: "React framework for production", icon: "⚛️" },
              { name: "Trigger.dev", desc: "Background job orchestration", icon: "🚀" },
              { name: "Gemini AI", desc: "Multimodal AI capabilities", icon: "🤖" },
              { name: "React Flow", desc: "Interactive node canvas", icon: "🔄" },
            ].map((tech, i) => (
              <TiltCard3D
                key={tech.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-all hover:border-cyan-400/30 hover:bg-white/[0.05]"
              >
                <div className="mb-3 text-4xl">{tech.icon}</div>
                <h3 className="mb-1 text-lg font-semibold text-white">{tech.name}</h3>
                <p className="text-sm text-slate-500">{tech.desc}</p>
              </TiltCard3D>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto mt-16 max-w-7xl border-t border-white/10 pt-8 text-center">
        <p className="text-sm text-slate-500">
          Built with passion using Next.js, Trigger.dev, and Gemini
        </p>
      </footer>
    </main>
  );
}
