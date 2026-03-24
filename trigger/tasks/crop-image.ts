import { promises as fs } from "node:fs";

import { task } from "@trigger.dev/sdk/v3";

import {
  cropImageTaskPayloadSchema,
  remoteNodeTaskResultSchema,
  type CropImageTaskPayload,
} from "../shared/contracts";
import {
  bufferToDataUrl,
  removeTempFiles,
  resolveMediaReference,
  runFfmpeg,
  writeTempFile,
} from "../shared/media";

function clampPercent(value: string, fallback: number) {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, parsed));
}

export const cropImageTask = task({
  id: "crop-image-task",
  run: async (payload: CropImageTaskPayload) => {
    const startedAt = Date.now();
    const input = cropImageTaskPayloadSchema.parse(payload);
    const source = await resolveMediaReference(input.imageUrl, "image/png");
    const inputPath = await writeTempFile("nextflow-crop-input", source.buffer, source.extension);
    const outputPath = await writeTempFile("nextflow-crop-output", Buffer.alloc(0), "png");

    try {
      const x = clampPercent(input.xPercent, 0);
      const y = clampPercent(input.yPercent, 0);
      const width = clampPercent(input.widthPercent, 100);
      const height = clampPercent(input.heightPercent, 100);

      await runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-vf",
        `crop=iw*${width / 100}:ih*${height / 100}:iw*${x / 100}:ih*${y / 100}`,
        outputPath,
      ]);

      const buffer = await fs.readFile(outputPath);
      const outputValue = bufferToDataUrl(buffer, "image/png");

      return remoteNodeTaskResultSchema.parse({
        durationMs: Date.now() - startedAt,
        inputSummary: `Crop image with x:${x}, y:${y}, width:${width}, height:${height}.`,
        nodeId: input.nodeId,
        nodeTitle: input.nodeTitle,
        nodeType: "crop-image",
        outputSummary: "Cropped image emitted as PNG data URL.",
        outputValue,
        summary: "FFmpeg crop completed.",
      });
    } finally {
      await removeTempFiles([inputPath, outputPath]);
    }
  },
});
