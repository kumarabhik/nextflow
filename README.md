# NextFlow

NextFlow is a Krea-inspired AI workflow builder focused on multimodal content pipelines. Users compose workflows on a React Flow canvas, connect six grading-critical node types, and execute the graph through Trigger.dev with Gemini and FFmpeg-backed tasks.

## What is in the app

- protected dashboard with Clerk auth
- React Flow editor with a prebuilt sample workflow
- 6 required nodes: Text, Upload Image, Upload Video, Run Any LLM, Crop Image, Extract Frame
- workflow history with node-level execution details
- autosave, versions, restore points, retry failed run, command palette, and keyboard shortcuts
- Neon/PostgreSQL persistence via Prisma
- Trigger.dev task orchestration for remote execution

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Populate the root `.env` file with the required keys described in [docs/environment-setup.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\environment-setup.md).

3. Push the Prisma schema to your database:

```bash
npx prisma db push
npx prisma generate
```

4. Start the app and Trigger.dev worker in separate terminals:

```bash
npm run dev
npm run trigger:dev
```

5. Open `http://localhost:3000/dashboard`.

## Useful commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run verify:local
npm run trigger:dev
npm run trigger:deploy
```

## Project docs

- env setup: [docs/environment-setup.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\environment-setup.md)
- Vercel deployment: [docs/vercel-deployment.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\vercel-deployment.md)
- final verification: [docs/final-verification.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\final-verification.md)
- demo walkthrough: [docs/demo-video-checklist.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\demo-video-checklist.md)
- architecture and session memory: [design_doc.md](C:\Users\kumar\Downloads\XOXO\Assignment\design_doc.md)
- execution checklist: [roadmap.md](C:\Users\kumar\Downloads\XOXO\Assignment\roadmap.md)

## Current status

The core execution path is working end to end with URL-backed media uploads, Gemini generation, and FFmpeg crop/frame tasks through Trigger.dev. The remaining manual finish-up is:

- one signed-in browser verification pass
- one Vercel production deploy
