import {
  mediaKindSchema,
  mediaUploadResponseSchema,
  type MediaUploadResponse,
} from "@/lib/media/schemas";

export async function uploadMediaAsset(
  file: File,
  kind: "image" | "video",
): Promise<MediaUploadResponse> {
  mediaKindSchema.parse(kind);

  const formData = new FormData();
  formData.set("file", file);
  formData.set("kind", kind);

  const response = await fetch("/api/media/upload", {
    body: formData,
    method: "POST",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(payload?.message ?? "Media upload failed.");
  }

  return mediaUploadResponseSchema.parse(await response.json());
}
