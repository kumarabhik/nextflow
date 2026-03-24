import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import {
  loadEditorHydrationPayload,
  saveWorkflowDocument,
} from "@/lib/workflows/server";

export async function GET() {
  const authError = await requireAuthenticatedRoute(
    "Sign in to load your saved NextFlow workspace.",
  );

  if (authError) {
    return authError;
  }

  const payload = await loadEditorHydrationPayload();
  return NextResponse.json(payload);
}

export async function PUT(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to save this workflow to your account.",
  );

  if (authError) {
    return authError;
  }

  const body = await request.json();
  const result = await saveWorkflowDocument(body);

  if (!result) {
    return NextResponse.json(
      {
        message:
          "Workflow could not be persisted remotely. Add a real PostgreSQL DATABASE_URL to enable server saves.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(result);
}
