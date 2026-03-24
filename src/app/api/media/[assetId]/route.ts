import { loadMediaAsset } from "@/lib/media/server";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { assetId } = await context.params;
  const asset = await loadMediaAsset(assetId);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.bytes), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": `${asset.sizeBytes}`,
      "Content-Type": asset.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.fileName)}"`,
    },
  });
}
