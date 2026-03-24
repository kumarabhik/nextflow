import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isClerkConfigured } from "@/lib/env";

export async function requireAuthenticatedRoute(message: string) {
  if (!isClerkConfigured) {
    return null;
  }

  const { userId } = await auth();

  if (userId) {
    return null;
  }

  return NextResponse.json(
    {
      message,
    },
    { status: 401 },
  );
}
