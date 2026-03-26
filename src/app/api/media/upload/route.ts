import { NextResponse } from "next/server";

import { requireAuthenticatedRoute } from "@/lib/auth/route-auth";
import { createMediaAsset } from "@/lib/media/server";
import { TransloaditUploadError } from "@/lib/media/transloadit";

export async function POST(request: Request) {
  const authError = await requireAuthenticatedRoute(
    "Sign in to upload media assets for workflow execution.",
  );

  if (authError) {
    return authError;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: "A file is required.",
      },
      { status: 400 },
    );
  }

  if (kind !== "image" && kind !== "video") {
    return NextResponse.json(
      {
        message: "A valid media kind is required.",
      },
      { status: 400 },
    );
  }

  let result;

  try {
    result = await createMediaAsset({
      file,
      kind,
    });
  } catch (error) {
    const message =
      error instanceof TransloaditUploadError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Media upload failed while storing the asset.";

    return NextResponse.json(
      {
        message,
      },
      { status: 502 },
    );
  }

  if (!result) {
    return NextResponse.json(
      {
        message:
          "Media could not be stored. Check authentication and DATABASE_URL.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(result);
}
