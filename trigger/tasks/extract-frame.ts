import { promises as fs } from "node:fs";

import { task } from "@trigger.dev/sdk/v3";

import {
  extractFrameTaskPayloadSchema,
  remoteNodeTaskResultSchema,
  type ExtractFrameTaskPayload,
} from "../shared/contracts";
import {
  bufferToDataUrl,
  probeVideoDurationSeconds,
  removeTempFiles,
  resolveMediaReference,
  runFfmpeg,
  writeTempFile,
} from "../shared/media";

function parseTimestampSeconds(timestamp: string, durationSeconds: number) {
  const trimmed = timestamp.trim();

  if (trimmed.endsWith("%")) {
    const percent = Number.parseFloat(trimmed.slice(0, -1));

    if (!Number.isFinite(percent)) {
      throw new Error("Invalid timestamp percentage.");
    }

    return Math.max(0, (durationSeconds * percent) / 100);
  }

  const seconds = Number.parseFloat(trimmed);

  if (!Number.isFinite(seconds)) {
    throw new Error("Invalid timestamp seconds value.");
  }

  return Math.max(0, seconds);
}

export const extractFrameTask = task({
  id: "extract-frame-task",
  run: async (payload: ExtractFrameTaskPayload) => {
    const startedAt = Date.now();
    const input = extractFrameTaskPayloadSchema.parse(payload);
    const source = await resolveMediaReference(input.videoUrl, "video/mp4");
    const inputPath = await writeTempFile(
      "nextflow-frame-input",
      source.buffer,
      source.extension,
    );
    const outputPath = await writeTempFile("nextflow-frame-output", Buffer.alloc(0), "png");

    try {
      const durationSeconds = await probeVideoDurationSeconds(inputPath);
      const seekSeconds = parseTimestampSeconds(input.timestamp, durationSeconds);

      await runFfmpeg([
        "-y",
        "-ss",
        `${seekSeconds}`,
        "-i",
        inputPath,
        "-frames:v",
        "1",
        outputPath,
      ]);

      const buffer = await fs.readFile(outputPath);
      const outputValue = bufferToDataUrl(buffer, "image/png");

      return remoteNodeTaskResultSchema.parse({
        durationMs: Date.now() - startedAt,
        inputSummary: `Extracted frame at ${input.timestamp} (${seekSeconds.toFixed(2)}s).`,
        nodeId: input.nodeId,
        nodeTitle: input.nodeTitle,
        nodeType: "extract-frame",
        outputSummary: "Frame extracted as PNG data URL.",
        outputValue,
        summary: "FFmpeg frame extraction completed.",
      });
    } finally {
      await removeTempFiles([inputPath, outputPath]);
    }
  },
});
