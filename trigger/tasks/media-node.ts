import { task } from "@trigger.dev/sdk/v3";

import {
  mediaNodePayloadSchema,
  remoteNodeTaskResultSchema,
  type MediaNodePayload,
} from "../shared/contracts";

export const mediaNodeTask = task({
  id: "media-node-task",
  run: async (payload: MediaNodePayload) => {
    const startedAt = Date.now();
    const input = mediaNodePayloadSchema.parse(payload);

    return remoteNodeTaskResultSchema.parse({
      durationMs: Date.now() - startedAt,
      inputSummary: input.mediaName
        ? `File: ${input.mediaName}`
        : "Media prepared for downstream execution.",
      nodeId: input.nodeId,
      nodeTitle: input.nodeTitle,
      nodeType: input.nodeType,
      outputSummary: input.mediaMimeType
        ? `Portable ${input.nodeType === "upload-image" ? "image" : "video"} payload (${input.mediaMimeType}).`
        : "Portable media payload ready.",
      outputValue: input.mediaReference,
      summary:
        input.nodeType === "upload-image"
          ? "Image payload prepared."
          : "Video payload prepared.",
    });
  },
});
