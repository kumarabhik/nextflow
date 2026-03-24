import {
  parseEditorHydrationPayload,
  parseWorkflowDocument,
} from "@/lib/workflows/document";
import { workflowRunItemSchema } from "@/lib/workflows/schemas";
import type {
  EditorHydrationPayload,
  WorkflowDocument,
  WorkflowRunItem,
} from "@/types/workflow";

const LOCAL_EDITOR_KEY = "nextflow/editor-state/v1";
const LOCAL_RUNS_KEY = "nextflow/run-history/v1";
const LOCAL_VERSION_DOCS_KEY = "nextflow/version-documents/v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadLocalEditorState(): EditorHydrationPayload | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(LOCAL_EDITOR_KEY);

  if (!raw) {
    return null;
  }

  try {
    return parseEditorHydrationPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLocalEditorState(payload: EditorHydrationPayload) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(LOCAL_EDITOR_KEY, JSON.stringify(payload));
}

export function loadLocalRunHistory(): WorkflowRunItem[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_RUNS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .map((entry) => workflowRunItemSchema.safeParse(entry))
          .filter((entry) => entry.success)
          .map((entry) => entry.data)
      : [];
  } catch {
    return [];
  }
}

export function saveLocalRunHistory(runHistory: WorkflowRunItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(LOCAL_RUNS_KEY, JSON.stringify(runHistory));
}

function loadLocalVersionDocuments() {
  if (!isBrowser()) {
    return {} as Record<string, WorkflowDocument>;
  }

  const raw = window.localStorage.getItem(LOCAL_VERSION_DOCS_KEY);

  if (!raw) {
    return {} as Record<string, WorkflowDocument>;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return {} as Record<string, WorkflowDocument>;
    }

    const documents: Record<string, WorkflowDocument> = {};

    for (const [versionId, document] of Object.entries(parsed)) {
      try {
        documents[versionId] = parseWorkflowDocument(document);
      } catch {
        // Ignore malformed cached version entries.
      }
    }

    return documents;
  } catch {
    return {} as Record<string, WorkflowDocument>;
  }
}

export function loadLocalVersionDocument(versionId: string) {
  return loadLocalVersionDocuments()[versionId] ?? null;
}

export function saveLocalVersionDocument(
  versionId: string,
  document: WorkflowDocument,
) {
  if (!isBrowser()) {
    return;
  }

  const current = loadLocalVersionDocuments();
  current[versionId] = document;
  window.localStorage.setItem(LOCAL_VERSION_DOCS_KEY, JSON.stringify(current));
}
