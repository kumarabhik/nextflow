import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { clientEnv, isClerkConfigured, isDatabaseConfigured } from "@/lib/env";
import { mediaKindSchema } from "@/lib/media/schemas";

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

  if (!actorId || !isDatabaseConfigured) {
    return null;
  }

  const kind = mediaKindSchema.parse(input.kind);
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const asset = await db.mediaAsset.create({
    data: {
      bytes,
      fileName: input.file.name,
      kind,
      mimeType: input.file.type || "application/octet-stream",
      sizeBytes: bytes.byteLength,
      userId: actorId,
    },
  });

  return {
    assetId: asset.id,
    assetUrl: buildMediaAssetUrl(asset.id),
    fileName: asset.fileName,
    mimeType: asset.mimeType,
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
