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
      <div className="flex min-h-0 flex-1 overflow-hidden bg-[#07080b]">
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
          className="flex min-w-0 flex-1 flex-col xl:grid xl:overflow-hidden"
          style={{
            gridTemplateColumns: `${libraryOpen ? "248px" : "0px"} minmax(0, 1fr) ${runsOpen ? "272px" : "0px"}`,
          }}
        >
          <div className="min-w-0 overflow-hidden">{libraryOpen ? <EditorSidebar /> : null}</div>
          <EditorCanvas />
          <div className="min-w-0 overflow-hidden">{runsOpen ? <EditorHistoryPanel /> : null}</div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
