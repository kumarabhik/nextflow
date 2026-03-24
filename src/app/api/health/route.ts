import { NextResponse } from "next/server";

import { getEnvironmentHealthReport } from "@/lib/health";

export async function GET() {
  const report = await getEnvironmentHealthReport();

  return NextResponse.json(report, {
    status: report.database.ok ? 200 : 503,
  });
}
