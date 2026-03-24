import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import { loadWorkflowVersionDocument } from "@/lib/workflows/server";

export async function GET(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to restore saved workflow versions.",
  );

  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");
  const workflowId = searchParams.get("workflowId") ?? undefined;

  if (!versionId) {
    return NextResponse.json(
      {
        message: "versionId is required.",
      },
      { status: 400 },
    );
  }

  const document = await loadWorkflowVersionDocument({
    versionId,
    workflowId,
  });

  if (!document) {
    return NextResponse.json(
      {
        message: "Workflow version could not be loaded.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(document);
}
