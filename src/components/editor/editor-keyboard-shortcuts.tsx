"use client";

import { useEffect } from "react";

import { useEditorStore } from "@/stores/editor-store";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function EditorKeyboardShortcuts() {
  const closeCommandPalette = useEditorStore((state) => state.closeCommandPalette);
  const isCommandPaletteOpen = useEditorStore(
    (state) => state.isCommandPaletteOpen,
  );
  const redo = useEditorStore((state) => state.redo);
  const requestSave = useEditorStore((state) => state.requestSave);
  const runFullWorkflow = useEditorStore((state) => state.runFullWorkflow);
  const runSingleNode = useEditorStore((state) => state.runSingleNode);
  const runSelectedWorkflow = useEditorStore(
    (state) => state.runSelectedWorkflow,
  );
  const toggleCommandPalette = useEditorStore(
    (state) => state.toggleCommandPalette,
  );
  const undo = useEditorStore((state) => state.undo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasPrimaryModifier = event.metaKey || event.ctrlKey;
      const editableTarget = isEditableTarget(event.target);

      if (event.key === "Escape" && isCommandPaletteOpen) {
        event.preventDefault();
        closeCommandPalette();
        return;
      }

      if (!hasPrimaryModifier) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }

      if (key === "s") {
        event.preventDefault();
        requestSave({
          createVersion: event.shiftKey,
          reason: "manual",
        });
        return;
      }

      if (key === "enter") {
        event.preventDefault();

        if (event.altKey) {
          void runSingleNode();
        } else if (event.shiftKey) {
          void runSelectedWorkflow();
        } else {
          void runFullWorkflow();
        }

        return;
      }

      if (editableTarget) {
        return;
      }

      if (key === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }

        return;
      }

      if (key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    closeCommandPalette,
    isCommandPaletteOpen,
    redo,
    requestSave,
    runFullWorkflow,
    runSingleNode,
    runSelectedWorkflow,
    toggleCommandPalette,
    undo,
  ]);

  return null;
}
