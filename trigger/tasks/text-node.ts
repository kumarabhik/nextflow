import { task } from "@trigger.dev/sdk/v3";

import {
  remoteNodeTaskResultSchema,
  textNodePayloadSchema,
  type TextNodePayload,
} from "../shared/contracts";

export const textNodeTask = task({
  id: "text-node-task",
  run: async (payload: TextNodePayload) => {
    const startedAt = Date.now();
    const input = textNodePayloadSchema.parse(payload);
    const value = input.textValue.trim();

    return remoteNodeTaskResultSchema.parse({
      durationMs: Date.now() - startedAt,
      inputSummary: value ? `Text: "${value}"` : "Blank text emitted.",
      nodeId: input.nodeId,
      nodeTitle: input.nodeTitle,
      nodeType: "text",
      outputSummary: value || "(blank text)",
      outputValue: value,
      summary: value ? "Text emitted." : "Blank text emitted.",
    });
  },
});
