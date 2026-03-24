# NextFlow Demo Video Checklist

Use this as the recording script for the final walkthrough.

## Before Recording

- `npm run dev` is running
- `npm run trigger:dev` is running
- real `DATABASE_URL` is configured
- the sample workflow is loaded
- one test image and one test video are ready

## Demo Flow

1. Show authentication working.
2. Open the dashboard and point out the Krea-style layout:
   - left sidebar
   - center workflow canvas
   - right history panel
3. Show the 6 required node types.
4. Upload an image.
5. Upload a video.
6. Explain the parallel branches and convergence node in the sample workflow.
7. Run the full workflow.
8. Show live node state changes and pulsing glow.
9. Open the history panel and expand the latest run.
10. Show node-level inputs, outputs, timings, and errors.
11. Show `Run node` with exactly one selected node.
12. Show `Run selected` with a small selected group.
13. Show save draft, save version, and restore version.
14. Show retry failed run if a failure exists.
15. Show import/export JSON.
16. Open `/api/health` and show service readiness.

## What Reviewers Should Notice

- responsive editor shell
- type-safe node connections
- DAG validation
- parallel execution behavior
- inline LLM output
- restore points
- keyboard shortcuts and command palette
- execution debugger quality
