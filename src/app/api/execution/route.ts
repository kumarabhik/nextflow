import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import { isDatabaseConfigured, isTriggerConfigured } from "@/lib/env";
import { remoteExecutionRequestSchema } from "@/lib/workflows/schemas";
import {
  attachTriggerRunId,
  createQueuedWorkflowRun,
  failWorkflowRunDispatch,
  saveWorkflowDocument,
} from "@/lib/workflows/server";

export async function POST(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to dispatch workflow runs through Trigger.dev.",
  );

  if (authError) {
    return authError;
  }

  if (!isDatabaseConfigured || !isTriggerConfigured) {
    return NextResponse.json(
      {
        message:
          "Remote execution needs a real DATABASE_URL plus TRIGGER_SECRET_KEY and TRIGGER_PROJECT_REF.",
      },
      { status: 503 },
    );
  }

  const body = remoteExecutionRequestSchema.parse(await request.json());
  const savedWorkflow = await saveWorkflowDocument({
    document: body.document,
    source: "manual",
    workflowId: body.workflowId,
  });

  if (!savedWorkflow) {
    return NextResponse.json(
      {
        message:
          "Workflow could not be saved before execution. Check that DATABASE_URL points to a real PostgreSQL database.",
      },
      { status: 503 },
    );
  }

  const workflowRunId = crypto.randomUUID();
  const queuedRun = await createQueuedWorkflowRun({
    scope: body.scope,
    selectedNodeIds: body.selectedNodeIds,
    workflowId: savedWorkflow.workflowId,
    workflowRunId,
  });

  if (!queuedRun) {
    return NextResponse.json(
      {
        message: "Workflow run could not be queued.",
      },
      { status: 503 },
    );
  }

  try {
    const handle = await tasks.trigger("execute-workflow-task", {
      document: body.document,
      scope: body.scope,
      selectedNodeIds: body.selectedNodeIds ?? [],
      workflowId: savedWorkflow.workflowId,
      workflowRunId,
    });

    await attachTriggerRunId({
      triggerRunId: handle.id,
      workflowRunId,
    });

    return NextResponse.json({
      queuedRun,
      workflowId: savedWorkflow.workflowId,
    });
  } catch (error) {
    await failWorkflowRunDispatch({
      errorMessage:
        error instanceof Error ? error.message : "Trigger.dev dispatch failed.",
      workflowRunId,
    });

    return NextResponse.json(
      {
        message: "Trigger.dev dispatch failed.",
      },
      { status: 503 },
    );
  }
}
