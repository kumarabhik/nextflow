import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import { persistWorkflowRun } from "@/lib/workflows/server";

export async function POST(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to persist workflow runs to your account history.",
  );

  if (authError) {
    return authError;
  }

  const body = await request.json();
  const success = await persistWorkflowRun(body);

  if (!success) {
    return NextResponse.json(
      {
        message:
          "Run history was not persisted remotely. Add a real PostgreSQL DATABASE_URL to enable server-side run history.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
  });
}
