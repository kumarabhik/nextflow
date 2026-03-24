# NextFlow Final Verification

Use this when you want the final confidence pass before submission.

## 1. Start the stack

Run these in separate terminals:

```bash
npm run dev
npm run trigger:dev
```

## 2. Run the automated local verifier

```bash
npm run verify:local
```

This checks:

- `/api/health`
- database connectivity
- env readiness for Clerk, Trigger.dev, and Gemini
- local `ffmpeg` and `ffprobe` availability
- whether the current request is signed in

Note:

- If `Clerk request session` shows `FAIL` from the terminal, that is expected unless the request is coming from your signed-in browser session. Treat that as a manual browser check, not a stack failure.

## 3. Run the final browser checks

1. Sign in through `/sign-in`.
2. Open `/dashboard`.
3. Upload one image and one video.
4. Run exactly one selected node with `Run node`.
5. Select 2 or more nodes and use `Run selected`.
6. Run the full workflow with `Run workflow`.
7. Confirm the right sidebar shows the new runs.
8. Expand the latest run and inspect node-level inputs, outputs, and timings.
9. Save a draft, save a version, restore a version, and test retry if a failed run exists.
10. Export the workflow JSON and import it back if needed.

## 4. Final submission checks

- `npm run build`
- `npm run verify:local`
- dashboard loads after sign-in
- sample workflow is intact
- image and video previews appear
- full workflow completes
- history panel updates correctly
- `/api/health` is healthy

## 5. Good recording order

Use [demo-video-checklist.md](C:\Users\kumar\Downloads\XOXO\Assignment\docs\demo-video-checklist.md) for the demo sequence after this verification passes.
