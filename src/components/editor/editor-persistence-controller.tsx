"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  loadLocalEditorState,
  loadLocalRunHistory,
  saveLocalEditorState,
  saveLocalRunHistory,
  saveLocalVersionDocument,
} from "@/lib/workflows/browser-storage";
import { formatRunTimestampLabel } from "@/lib/execution/formatters";
import {
  fetchWorkflowRunHistory,
  saveWorkflowRemotely,
} from "@/lib/workflows/client";
import { getWorkflowDocumentHash } from "@/lib/workflows/document";
import type { EditorHydrationPayload } from "@/types/workflow";

import { useEditorStore } from "@/stores/editor-store";

type EditorPersistenceControllerProps = {
  initialPayload: EditorHydrationPayload;
};

export function EditorPersistenceController({
  initialPayload,
}: EditorPersistenceControllerProps) {
  const hydratedRef = useRef(false);
  const buildWorkflowDocument = useEditorStore((state) => state.buildWorkflowDocument);
  const consumeSaveRequest = useEditorStore((state) => state.consumeSaveRequest);
  const hydrateEditor = useEditorStore((state) => state.hydrateEditor);
  const isHydrated = useEditorStore((state) => state.isHydrated);
  const lastPersistedHash = useEditorStore((state) => state.lastPersistedHash);
  const markLocalBackupSaved = useEditorStore(
    (state) => state.markLocalBackupSaved,
  );
  const markLocalVersionSaved = useEditorStore(
    (state) => state.markLocalVersionSaved,
  );
  const markSaving = useEditorStore((state) => state.markSaving);
  const markWorkflowSaved = useEditorStore((state) => state.markWorkflowSaved);
  const pendingSaveRequest = useEditorStore((state) => state.pendingSaveRequest);
  const replaceRunHistory = useEditorStore((state) => state.replaceRunHistory);
  const runHistory = useEditorStore((state) => state.runHistory);
  const workflowId = useEditorStore((state) => state.workflowId);
  const workflowVersions = useEditorStore((state) => state.workflowVersions);

  const document = buildWorkflowDocument();
  const documentHash = getWorkflowDocumentHash(document);

  const createLocalVersionSummary = useCallback(
    (savedAtMs: number) => ({
      createdAtLabel: formatRunTimestampLabel(savedAtMs),
      id: `local-version-${savedAtMs}`,
      versionNumber:
        workflowVersions.reduce(
          (maxVersion, version) => Math.max(maxVersion, version.versionNumber),
          0,
        ) + 1,
    }),
    [workflowVersions],
  );

  useEffect(() => {
    if (hydratedRef.current) {
      return;
    }

    const localPayload =
      initialPayload.source === "sample" ? loadLocalEditorState() : null;

    if (localPayload) {
      hydrateEditor({
        ...localPayload,
        runHistory:
          localPayload.runHistory.length > 0
            ? localPayload.runHistory
            : loadLocalRunHistory(),
        source: "local",
      });
    } else {
      hydrateEditor(initialPayload);

      if (initialPayload.runHistory.length === 0) {
        const localRuns = loadLocalRunHistory();

        if (localRuns.length > 0) {
          replaceRunHistory(localRuns);
        }
      }
    }

    hydratedRef.current = true;
  }, [hydrateEditor, initialPayload, replaceRunHistory]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveLocalRunHistory(runHistory);
  }, [isHydrated, runHistory]);

  useEffect(() => {
    if (
      !isHydrated ||
      !workflowId ||
      !runHistory.some(
        (run) => run.status === "queued" || run.status === "running",
      )
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const latestHistory = await fetchWorkflowRunHistory(workflowId);

          if (latestHistory.length > 0) {
            replaceRunHistory(latestHistory);
          }
        } catch {
          // Ignore transient polling failures while background runs are in flight.
        }
      })();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isHydrated, replaceRunHistory, runHistory, workflowId]);

  useEffect(() => {
    if (!isHydrated || documentHash === lastPersistedHash) {
      return;
    }

    const timer = window.setTimeout(() => {
      const savedAtMs = Date.now();

      saveLocalEditorState({
        document,
        runHistory,
        source: "local",
        versions: workflowVersions,
        workflowId,
      });

      void (async () => {
        markSaving();

        try {
          const result = await saveWorkflowRemotely({
            document,
            source: "autosave",
            workflowId: workflowId ?? undefined,
          });

          saveLocalEditorState({
            document,
            runHistory,
            source: "local",
            versions: result.versions,
            workflowId: result.workflowId,
          });

          if (result.versions[0]) {
            saveLocalVersionDocument(result.versions[0].id, document);
          }

          markWorkflowSaved({
            hash: documentHash,
            savedAtMs: result.savedAtMs,
            source: "saved",
            versions: result.versions,
            workflowId: result.workflowId,
          });
        } catch {
          markLocalBackupSaved({
            hash: documentHash,
            savedAtMs,
          });
        }
      })();
    }, 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    document,
    documentHash,
    isHydrated,
    lastPersistedHash,
    markLocalBackupSaved,
    markSaving,
    markWorkflowSaved,
    runHistory,
    workflowId,
    workflowVersions,
  ]);

  useEffect(() => {
    if (!pendingSaveRequest || !isHydrated) {
      return;
    }

    const token = pendingSaveRequest.token;

    void (async () => {
      markSaving();

      const savedAtMs = Date.now();

      saveLocalEditorState({
        document,
        runHistory,
        source: "local",
        versions: workflowVersions,
        workflowId,
      });

      try {
        const result = await saveWorkflowRemotely({
          createVersion: pendingSaveRequest.createVersion,
          document,
          source: pendingSaveRequest.reason,
          workflowId: workflowId ?? undefined,
        });

        saveLocalEditorState({
          document,
          runHistory,
          source: "local",
          versions: result.versions,
          workflowId: result.workflowId,
        });

        if (pendingSaveRequest.createVersion && result.versions[0]) {
          saveLocalVersionDocument(result.versions[0].id, document);
        }

        markWorkflowSaved({
          hash: documentHash,
          savedAtMs: result.savedAtMs,
          source: "saved",
          versions: result.versions,
          workflowId: result.workflowId,
          });
        } catch {
          if (pendingSaveRequest.createVersion) {
            const localVersion = createLocalVersionSummary(savedAtMs);

            saveLocalVersionDocument(localVersion.id, document);
            saveLocalEditorState({
              document,
              runHistory,
              source: "local",
              versions: [localVersion, ...workflowVersions].slice(0, 8),
              workflowId,
            });

            markLocalVersionSaved({
              hash: documentHash,
              savedAtMs,
              version: localVersion,
            });
          } else {
            markLocalBackupSaved({
              hash: documentHash,
              savedAtMs,
            });
          }
        } finally {
          consumeSaveRequest(token);
        }
      })();
  }, [
    consumeSaveRequest,
    createLocalVersionSummary,
    document,
    documentHash,
    isHydrated,
    markLocalBackupSaved,
    markLocalVersionSaved,
    markSaving,
    markWorkflowSaved,
    pendingSaveRequest,
    runHistory,
    workflowId,
    workflowVersions,
  ]);

  return null;
}
