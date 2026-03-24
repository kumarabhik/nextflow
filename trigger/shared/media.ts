import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const dataUrlPattern = /^data:([^;]+);base64,(.+)$/;

const mimeToExtension: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

function extensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split(".").pop()?.toLowerCase();
  } catch {
    return undefined;
  }
}

export function mimeTypeToExtension(mimeType?: string, fallback = "bin") {
  if (!mimeType) {
    return fallback;
  }

  return mimeToExtension[mimeType.toLowerCase()] ?? fallback;
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function resolveMediaReference(reference: string, fallbackMime?: string) {
  const dataUrlMatch = reference.match(dataUrlPattern);

  if (dataUrlMatch) {
    return {
      buffer: Buffer.from(dataUrlMatch[2], "base64"),
      extension: mimeTypeToExtension(
        dataUrlMatch[1],
        extensionFromUrl(reference) ?? "bin",
      ),
      mimeType: dataUrlMatch[1],
    };
  }

  if (reference.startsWith("blob:")) {
    throw new Error(
      "Remote execution cannot access browser-local blob URLs. Re-upload the media so it is persisted with the workflow draft.",
    );
  }

  const response = await fetch(reference);

  if (!response.ok) {
    throw new Error(`Unable to fetch remote media: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const mimeType =
    response.headers.get("content-type") ?? fallbackMime ?? "application/octet-stream";

  return {
    buffer: Buffer.from(arrayBuffer),
    extension: mimeTypeToExtension(mimeType, extensionFromUrl(reference) ?? "bin"),
    mimeType,
  };
}

export async function writeTempFile(
  prefix: string,
  buffer: Buffer,
  extension: string,
) {
  const filePath = path.join(
    tmpdir(),
    `${prefix}-${crypto.randomUUID()}.${extension}`,
  );

  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function removeTempFiles(paths: string[]) {
  await Promise.allSettled(paths.map((filePath) => fs.unlink(filePath)));
}

export async function runFfmpeg(args: string[]) {
  await execFileAsync(process.env.FFMPEG_PATH ?? "ffmpeg", args);
}

export async function probeVideoDurationSeconds(inputPath: string) {
  const { stdout } = await execFileAsync(process.env.FFPROBE_PATH ?? "ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    inputPath,
  ]);

  const duration = Number.parseFloat(stdout.trim());

  if (!Number.isFinite(duration)) {
    throw new Error("Unable to determine the video duration for frame extraction.");
  }

  return duration;
}
