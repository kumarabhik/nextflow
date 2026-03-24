import { ffmpeg } from "@trigger.dev/build/extensions/core";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  build: {
    extensions: [ffmpeg({ version: "7" }), prismaExtension({ mode: "modern" })],
  },
  dirs: ["./trigger"],
  maxDuration: 1800,
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_replace_me",
});
