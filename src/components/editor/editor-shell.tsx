"use client";

import { useEffect, useState } from "react";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import type { EditorHydrationPayload, EnvironmentStatus } from "@/types/workflow";

type EditorShellProps = {
  environmentStatus: EnvironmentStatus;
  initialPayload: EditorHydrationPayload;
};

function BackgroundOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div 
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-[100px]"
        style={{ animation: "float-3d 15s ease-in-out infinite" }}
      />
      <div 
        className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 blur-[100px]"
        style={{ animation: "float-3d 18s ease-in-out infinite reverse" }}
      />
      <div 
        className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-gradient-to-r from-emerald-500/8 to-cyan-500/8 blur-[80px]"
        style={{ animation: "float-3d 20s ease-in-out infinite" }}
      />
      <div 
        className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full bg-gradient-to-r from-amber-500/8 to-orange-500/8 blur-[80px]"
        style={{ animation: "float-3d 12s ease-in-out infinite reverse" }}
      />
    </div>
  );
}

function MouseTracker() {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(103, 232, 249, 0.04) 0%, transparent 40%)`
      }}
    />
  );
}

export function EditorShell({
  environmentStatus,
  initialPayload,
}: EditorShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#07080b] text-white xl:h-screen perspective-container">
      <BackgroundOrbs />
      <MouseTracker />
      
      <div className="relative z-10 flex min-h-screen flex-col xl:h-screen">
        <EditorTopbar environmentStatus={environmentStatus} />
        <div className="flex min-h-0 flex-1 flex-col">
          <EditorWorkspace initialPayload={initialPayload} />
        </div>
      </div>
    </div>
  );
}
