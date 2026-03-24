const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

function logSection(title) {
  console.log(`\n${title}`);
}

function logStatus(label, ok, message) {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${message}`);
}

async function main() {
  let response;

  try {
    response = await fetch(`${baseUrl}/api/health`, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    throw new Error(
      `Could not reach ${baseUrl}/api/health. Start npm run dev first, then rerun this command. ${error instanceof Error ? `(${error.message})` : ""}`.trim(),
    );
  }

  let report;

  try {
    report = await response.json();
  } catch {
    throw new Error(
      `The health route at ${baseUrl}/api/health did not return JSON. Is npm run dev running?`,
    );
  }

  logSection("NextFlow Local Verification");
  console.log(`Checked at: ${report.checkedAt}`);
  console.log(`Health route: ${baseUrl}/api/health`);

  logSection("Core Services");
  logStatus("Database", report.database.ok, report.database.message);
  logStatus(
    "Clerk config",
    report.environment.clerkConfigured,
    report.environment.clerkConfigured
      ? "Clerk keys are configured."
      : "Clerk keys are missing.",
  );
  logStatus(
    "Trigger.dev config",
    report.environment.triggerConfigured,
    report.environment.triggerConfigured
      ? "Trigger.dev env vars are configured."
      : "Trigger.dev env vars are missing.",
  );
  logStatus(
    "Gemini config",
    report.environment.geminiConfigured,
    report.environment.geminiConfigured
      ? "Gemini key is configured."
      : "Gemini key is missing.",
  );

  logSection("Runtime Binaries");
  logStatus("ffmpeg", report.runtime.ffmpeg.ok, report.runtime.ffmpeg.message);
  logStatus("ffprobe", report.runtime.ffprobe.ok, report.runtime.ffprobe.message);

  logSection("Request Auth State");
  logStatus("Clerk request session", report.auth.signedIn, report.auth.message);
  if (!report.auth.signedIn && report.auth.configured) {
    console.log(
      "NOTE Browser auth is a manual check. This terminal request does not carry your Clerk browser session.",
    );
  }

  logSection("Next Manual Checks");
  for (const step of report.nextChecks || []) {
    console.log(`- ${step}`);
  }

  const hardFailure =
    !response.ok ||
    !report.database.ok ||
    !report.environment.remoteExecutionReady ||
    !report.runtime.ffmpeg.ok ||
    !report.runtime.ffprobe.ok;

  if (hardFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("FAIL local verification:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
