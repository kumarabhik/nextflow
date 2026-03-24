import { EditorTopbar } from "@/components/editor/editor-topbar";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import type { EditorHydrationPayload, EnvironmentStatus } from "@/types/workflow";

type EditorShellProps = {
  environmentStatus: EnvironmentStatus;
  initialPayload: EditorHydrationPayload;
};

export function EditorShell({
  environmentStatus,
  initialPayload,
}: EditorShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#07080b] text-white xl:h-screen">
      <EditorTopbar environmentStatus={environmentStatus} />

      <div className="flex min-h-0 flex-1 flex-col">
        <EditorWorkspace initialPayload={initialPayload} />
      </div>
    </div>
  );
}
