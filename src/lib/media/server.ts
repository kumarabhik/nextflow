import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import {
  clientEnv,
  isClerkConfigured,
  isDatabaseConfigured,
  isTransloaditConfigured,
} from "@/lib/env";
import { mediaKindSchema } from "@/lib/media/schemas";
import { uploadTransloaditFile } from "@/lib/media/transloadit";

async function resolveMediaActorId() {
  if (!isClerkConfigured) {
    return "demo-user";
  }

  const { userId } = await auth();
  return userId;
}

export function buildMediaAssetUrl(assetId: string) {
  const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/api/media/${assetId}`;
}

export async function createMediaAsset(input: {
  file: File;
  kind: "image" | "video";
}) {
  const actorId = await resolveMediaActorId();

  if (!actorId) {
    return null;
  }

  const kind = mediaKindSchema.parse(input.kind);

  if (isTransloaditConfigured) {
    const upload = await uploadTransloaditFile(input.file);

    return {
      assetId: upload.assetId,
      assetUrl: upload.assetUrl,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      provider: "transloadit" as const,
      sizeBytes: upload.sizeBytes,
    };
  }

  if (!isDatabaseConfigured) {
    return null;
  }

  const upload = {
    bytes: Buffer.from(await input.file.arrayBuffer()),
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    sizeBytes: input.file.size,
  };

  const asset = await db.mediaAsset.create({
    data: {
      bytes: upload.bytes,
      fileName: upload.fileName,
      kind,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      userId: actorId,
    },
  });

  return {
    assetId: asset.id,
    assetUrl: buildMediaAssetUrl(asset.id),
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    provider: "local" as const,
    sizeBytes: asset.sizeBytes,
  };
}

export async function loadMediaAsset(assetId: string) {
  if (!isDatabaseConfigured) {
    return null;
  }

  return db.mediaAsset.findUnique({
    where: {
      id: assetId,
    },
  });
}
