import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import { loadWorkflowRunHistory } from "@/lib/workflows/server";

export async function GET(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to view your persisted workflow history.",
  );

  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return NextResponse.json([]);
  }

  const history = await loadWorkflowRunHistory(workflowId);
  return NextResponse.json(history);
}
