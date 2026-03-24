import {
  parseEditorHydrationPayload,
  parseWorkflowDocument,
} from "@/lib/workflows/document";
import {
  remoteExecutionRequestSchema,
  remoteExecutionResponseSchema,
  workflowRunPersistRequestSchema,
  workflowSaveRequestSchema,
  workflowSaveResponseSchema,
} from "@/lib/workflows/schemas";
import { workflowRunItemSchema } from "@/lib/workflows/schemas";

async function extractApiErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const payload = (await response.clone().json()) as {
      error?: string;
      message?: string;
    };

    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Fall through to the raw text body below.
  }

  try {
    const text = await response.text();

    if (text.trim()) {
      return text;
    }
  } catch {
    // Fall through to the fallback below.
  }

  const statusLabel = response.status
    ? `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`
    : "";

  return statusLabel ? `${fallbackMessage} (${statusLabel})` : fallbackMessage;
}

export async function fetchEditorHydrationPayload() {
  const response = await fetch("/api/workflows/current", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(response, "Unable to hydrate workflow state."),
    );
  }

  return parseEditorHydrationPayload(await response.json());
}

export async function saveWorkflowRemotely(input: unknown) {
  const payload = workflowSaveRequestSchema.parse(input);

  const response = await fetch("/api/workflows/current", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(response, "Remote workflow save failed."),
    );
  }

  return workflowSaveResponseSchema.parse(await response.json());
}

export async function persistRunRemotely(input: unknown) {
  const payload = workflowRunPersistRequestSchema.parse(input);

  const response = await fetch("/api/workflows/runs", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(response, "Remote run persistence failed."),
    );
  }
}

export async function dispatchRemoteExecution(input: unknown) {
  const payload = remoteExecutionRequestSchema.parse(input);

  const response = await fetch("/api/execution", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(response, "Remote execution dispatch failed."),
    );
  }

  return remoteExecutionResponseSchema.parse(await response.json());
}

export async function fetchWorkflowRunHistory(workflowId: string) {
  const response = await fetch(
    `/api/workflows/history?workflowId=${encodeURIComponent(workflowId)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(
        response,
        "Unable to fetch persisted workflow history.",
      ),
    );
  }

  const payload = await response.json();

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => workflowRunItemSchema.safeParse(entry))
    .filter((entry) => entry.success)
    .map((entry) => entry.data);
}

export async function fetchWorkflowVersionDocument(input: {
  versionId: string;
  workflowId?: string;
}) {
  const params = new URLSearchParams({
    versionId: input.versionId,
  });

  if (input.workflowId) {
    params.set("workflowId", input.workflowId);
  }

  const response = await fetch(`/api/workflows/version?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await extractApiErrorMessage(
        response,
        "Unable to fetch the requested workflow version.",
      ),
    );
  }

  return parseWorkflowDocument(await response.json());
}
