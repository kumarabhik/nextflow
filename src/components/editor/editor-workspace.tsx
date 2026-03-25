"use client";

import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorCommandPalette } from "@/components/editor/editor-command-palette";
import { EditorHistoryPanel } from "@/components/editor/editor-history-panel";
import { EditorKeyboardShortcuts } from "@/components/editor/editor-keyboard-shortcuts";
import { EditorPersistenceController } from "@/components/editor/editor-persistence-controller";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorWorkspaceRail } from "@/components/editor/editor-workspace-rail";
import type { EditorHydrationPayload } from "@/types/workflow";

type EditorWorkspaceProps = {
  initialPayload: EditorHydrationPayload;
};

export function EditorWorkspace({ initialPayload }: EditorWorkspaceProps) {
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [runsOpen, setRunsOpen] = useState(true);

  const canvasFocus = !libraryOpen && !runsOpen;

  return (
    <ReactFlowProvider>
      <EditorKeyboardShortcuts />
      <EditorCommandPalette />
      <EditorPersistenceController initialPayload={initialPayload} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-[#07080b]">
        <div 
          className="pointer-events-none absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(103, 232, 249, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(103, 232, 249, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: "perspective(800px) rotateX(45deg) translateY(-30%)",
          }}
        />
        <EditorWorkspaceRail
          canvasFocus={canvasFocus}
          libraryOpen={libraryOpen}
          onToggleFocus={() => {
            if (canvasFocus) {
              setLibraryOpen(true);
              setRunsOpen(true);
              return;
            }

            setLibraryOpen(false);
            setRunsOpen(false);
          }}
          onToggleLibrary={() => setLibraryOpen((current) => !current)}
          onToggleRuns={() => setRunsOpen((current) => !current)}
          runsOpen={runsOpen}
        />
        <div
          className="relative z-10 flex min-w-0 flex-1 flex-col transition-all duration-500 xl:grid xl:overflow-hidden"
          style={{
            gridTemplateColumns: `${libraryOpen ? "248px" : "0px"} minmax(0, 1fr) ${runsOpen ? "272px" : "0px"}`,
          }}
        >
          <div 
            className="min-w-0 overflow-hidden transition-all duration-500"
            style={{ 
              transform: libraryOpen ? "translateX(0)" : "translateX(-20px)",
              opacity: libraryOpen ? 1 : 0
            }}
          >
            {libraryOpen ? <EditorSidebar /> : null}
          </div>
          <div className="relative min-h-[68vh] min-w-0 xl:h-full xl:min-h-0">
            <EditorCanvas />
            <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-[#07080b]/50 via-transparent to-transparent" />
          </div>
          <div 
            className="min-w-0 overflow-hidden transition-all duration-500"
            style={{ 
              transform: runsOpen ? "translateX(0)" : "translateX(20px)",
              opacity: runsOpen ? 1 : 0
            }}
          >
            {runsOpen ? <EditorHistoryPanel /> : null}
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
