import { auth } from "@clerk/nextjs/server";

import { EditorShell } from "@/components/editor/editor-shell";
import { environmentStatus, isClerkConfigured } from "@/lib/env";
import { loadEditorHydrationPayload } from "@/lib/workflows/server";

export default async function DashboardPage() {
  const initialPayload = await loadEditorHydrationPayload();

  if (!isClerkConfigured) {
    return (
      <EditorShell
        environmentStatus={environmentStatus}
        initialPayload={initialPayload}
      />
    );
  }

  await auth();

  return (
    <EditorShell
      environmentStatus={environmentStatus}
      initialPayload={initialPayload}
    />
  );
}
