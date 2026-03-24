import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import {
  environmentStatus,
  isClerkConfigured,
  isDatabaseConfigured,
  serverEnv,
} from "@/lib/env";
import type {
  AuthHealth,
  BinaryHealth,
  DatabaseHealth,
  EnvironmentHealthReport,
} from "@/types/workflow";

const execFileAsync = promisify(execFile);

function getDatabaseStatusMessage(): DatabaseHealth {
  if (!serverEnv.DATABASE_URL) {
    return {
      message: "DATABASE_URL is missing.",
      mode: "missing",
      ok: false,
    };
  }

  if (environmentStatus.databasePlaceholder) {
    return {
      message:
        "DATABASE_URL is still using the local Prisma starter placeholder.",
      mode: "placeholder",
      ok: false,
    };
  }

  return {
    message: "DATABASE_URL is configured.",
    mode: "ready",
    ok: true,
  };
}

async function getAuthHealth(): Promise<AuthHealth> {
  if (!isClerkConfigured) {
    return {
      configured: false,
      message: "Clerk is not configured in this environment.",
      signedIn: false,
    };
  }

  try {
    const { userId } = await auth();

    return {
      configured: true,
      message: userId
        ? "A signed-in Clerk session is present."
        : "Clerk is configured, but there is no active signed-in session for this request.",
      signedIn: Boolean(userId),
    };
  } catch (error) {
    return {
      configured: true,
      message:
        error instanceof Error
          ? error.message
          : "Unable to inspect the Clerk session for this request.",
      signedIn: false,
    };
  }
}

async function getBinaryHealth(command: string, args: string[]): Promise<BinaryHealth> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      windowsHide: true,
    });
    const output = `${stdout ?? ""}\n${stderr ?? ""}`.trim().split(/\r?\n/)[0];

    return {
      command,
      message: output || `${command} responded successfully.`,
      ok: true,
    };
  } catch (error) {
    return {
      command,
      message:
        error instanceof Error ? error.message : `${command} is not available.`,
      ok: false,
    };
  }
}

export async function getEnvironmentHealthReport(): Promise<EnvironmentHealthReport> {
  const database = getDatabaseStatusMessage();
  const [authHealth, ffmpeg, ffprobe] = await Promise.all([
    getAuthHealth(),
    getBinaryHealth("ffmpeg", ["-version"]),
    getBinaryHealth("ffprobe", ["-version"]),
  ]);

  if (isDatabaseConfigured) {
    try {
      await db.$queryRawUnsafe("select 1");
    } catch (error) {
      return {
        auth: authHealth,
        checkedAt: new Date().toISOString(),
        database: {
          message:
            error instanceof Error
              ? error.message
              : "Database connectivity check failed.",
          mode: "error",
          ok: false,
        },
        environment: environmentStatus,
        nextChecks: [
          "Fix the database connectivity issue before testing workflow saves or execution.",
          "Keep npm run dev and npm run trigger:dev running in separate terminals.",
          environmentStatus.transloaditConfigured
            ? "Upload one image and one video to confirm the Transloadit path is healthy."
            : "Add TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET before the final grading pass.",
          authHealth.signedIn
            ? "Open /dashboard and run one node, one selected group, and one full workflow."
            : "Sign in first, then open /dashboard and run one node, one selected group, and one full workflow.",
        ],
        runtime: {
          ffmpeg,
          ffprobe,
        },
      };
    }
  }

  return {
    auth: authHealth,
    checkedAt: new Date().toISOString(),
    database,
    environment: environmentStatus,
    nextChecks: [
      environmentStatus.transloaditConfigured
        ? "Upload one image and one video to confirm the Transloadit path is healthy."
        : "Add TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET before the final grading pass.",
      authHealth.signedIn
        ? "Open /dashboard and verify Run node, Run selected, and Run workflow."
        : "Sign in through /sign-in, then open /dashboard and verify Run node, Run selected, and Run workflow.",
      "Confirm previews and a successful history entry after the media uploads finish.",
      "Use Save draft, Save version, Restore version, and Retry failed during the final demo pass.",
    ],
    runtime: {
      ffmpeg,
      ffprobe,
    },
  };
}
