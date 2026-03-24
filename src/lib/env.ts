import { z } from "zod";

import type { EnvironmentStatus } from "@/types/workflow";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),
  TRIGGER_PROJECT_REF: z.string().min(1).optional(),
  TRANSLOADIT_AUTH_KEY: z.string().min(1).optional(),
  TRANSLOADIT_AUTH_SECRET: z.string().min(1).optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
  TRANSLOADIT_AUTH_KEY: process.env.TRANSLOADIT_AUTH_KEY,
  TRANSLOADIT_AUTH_SECRET: process.env.TRANSLOADIT_AUTH_SECRET,
});

export const isClerkConfigured = Boolean(
  clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && serverEnv.CLERK_SECRET_KEY,
);

const placeholderDatabaseFragments = [
  "johndoe:randompassword@localhost:5432/mydb",
  "user:password@localhost:5432/nextflow",
  "localhost:5432/mydb",
  "localhost:5432/nextflow",
];

export function isPlaceholderDatabaseUrl(url?: string | null) {
  if (!url) {
    return false;
  }

  return placeholderDatabaseFragments.some((fragment) => url.includes(fragment));
}

export const isDatabaseConfigured = Boolean(
  serverEnv.DATABASE_URL && !isPlaceholderDatabaseUrl(serverEnv.DATABASE_URL),
);

export const isTriggerConfigured = Boolean(
  serverEnv.TRIGGER_SECRET_KEY && serverEnv.TRIGGER_PROJECT_REF,
);

export const isGeminiConfigured = Boolean(serverEnv.GEMINI_API_KEY);
export const isTransloaditConfigured = Boolean(
  serverEnv.TRANSLOADIT_AUTH_KEY && serverEnv.TRANSLOADIT_AUTH_SECRET,
);

export const environmentStatus: EnvironmentStatus = {
  clerkConfigured: isClerkConfigured,
  databaseConfigured: isDatabaseConfigured,
  databasePlaceholder: isPlaceholderDatabaseUrl(serverEnv.DATABASE_URL),
  geminiConfigured: isGeminiConfigured,
  issues: [
    !clientEnv.NEXT_PUBLIC_APP_URL ? "NEXT_PUBLIC_APP_URL missing" : null,
    !isClerkConfigured ? "Clerk keys missing" : null,
    isPlaceholderDatabaseUrl(serverEnv.DATABASE_URL)
      ? "DATABASE_URL is still using the starter placeholder"
      : null,
    !serverEnv.DATABASE_URL ? "DATABASE_URL missing" : null,
    !serverEnv.TRIGGER_SECRET_KEY ? "TRIGGER_SECRET_KEY missing" : null,
    !serverEnv.TRIGGER_PROJECT_REF ? "TRIGGER_PROJECT_REF missing" : null,
    !serverEnv.GEMINI_API_KEY ? "GEMINI_API_KEY missing" : null,
    !isTransloaditConfigured ? "Transloadit keys missing" : null,
  ].filter((issue): issue is string => Boolean(issue)),
  remoteExecutionReady: Boolean(
    isDatabaseConfigured &&
      isTriggerConfigured &&
      isGeminiConfigured &&
      isTransloaditConfigured,
  ),
  transloaditConfigured: isTransloaditConfigured,
  triggerConfigured: isTriggerConfigured,
};
