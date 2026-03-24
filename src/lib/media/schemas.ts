import { z } from "zod";

export const mediaKindSchema = z.enum(["image", "video"]);

export const mediaUploadResponseSchema = z.object({
  assetId: z.string(),
  assetUrl: z.string().url(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});

export type MediaUploadResponse = z.infer<typeof mediaUploadResponseSchema>;
