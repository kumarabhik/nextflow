# NextFlow Roadmap

Status key:

- `[ ]` not started
- `[~]` in progress
- `[x]` complete

## 1. Must-Have Deliverables

### UI and Layout

- [~] Pixel-perfect Krea-inspired UI
- [x] Responsive layout
- [x] Left sidebar with exactly 6 quick-access buttons
- [x] Right sidebar with workflow history panel
- [x] React Flow canvas with dot grid background
- [x] Canvas zoom, pan, fit view, MiniMap
- [x] Animated edges
- [x] Pulsating glow effect on executing nodes

### Authentication

- [x] Clerk authentication
- [x] Sign in and sign up flow
- [x] Protected workflow routes
- [x] User-scoped workflows and history

### Node System

- [x] Text Node
- [x] Upload Image Node
- [x] Upload Video Node
- [x] Run Any LLM Node
- [x] Crop Image Node
- [x] Extract Frame from Video Node
- [x] Drag and drop node creation
- [x] Click-to-add node creation
- [x] Configurable node inputs
- [x] Connected-input disabled state
- [x] Type-safe connection rules
- [x] Node deletion
- [x] Undo/redo
- [x] DAG validation

### Execution

- [x] Single node execution
- [x] Selected nodes execution
- [x] Full workflow execution
- [x] Parallel execution for independent branches
- [x] Convergence/wait-for-dependencies behavior
- [x] All runtime node execution via Trigger.dev
- [x] Gemini integration
- [x] Vision prompt support
- [x] FFmpeg crop through Trigger.dev
- [x] FFmpeg frame extraction through Trigger.dev
- [x] Loading states and user-friendly errors
- [x] Inline LLM result display on the LLM node

### Persistence

- [x] PostgreSQL database
- [x] Prisma ORM
- [x] Save workflow to database
- [x] Load workflow from database
- [x] Persist run history
- [x] Persist node-level execution history
- [x] Import workflow JSON
- [x] Export workflow JSON

### History Panel

- [x] Run list with timestamp, status, duration, and scope
- [x] Expand run for node-level execution details
- [x] Show successful partial nodes when workflow fails
- [x] Color-coded statuses
- [x] Show node inputs used
- [x] Show node outputs generated
- [x] Show node execution time
- [x] Show node-level error messages

### Demo and Delivery

- [x] Pre-built sample workflow
- [x] Sample workflow demonstrates all 6 nodes
- [x] Sample workflow demonstrates parallel branches
- [x] Sample workflow demonstrates convergence node
- [x] Strict TypeScript throughout
- [x] Zod validation on APIs and graph data
- [x] Root README quickstart
- [x] Vercel config added
- [x] Vercel deployment readiness
- [x] Environment variable documentation
- [x] Demo video checklist support

## 2. Bonus Features

Only pursue these after the required checklist is stable.

- [x] Retry from failed node
- [x] Autosave
- [x] Draft recovery
- [x] Keyboard shortcuts
- [x] Command palette
- [x] Workflow versioning
- [x] Restore point recovery
- [x] Execution debugger with payload summary
- [x] Execution debugger with timing view
- [x] Dependency wait-state inspection

## 3. 5-Step Execution Waves

### Wave 1

- [x] Bootstrap Next.js app and tooling
- [x] Add Clerk
- [x] Add Prisma schema
- [x] Build dashboard shell
- [x] Add React Flow foundation

### Wave 2

- [x] Build left sidebar and node palette
- [x] Build right history sidebar shell
- [x] Add Zustand graph state
- [x] Add DAG validation
- [x] Add type-safe edges

### Wave 3

- [x] Implement Text Node
- [x] Implement Upload Image Node
- [x] Implement Upload Video Node
- [x] Implement node add/delete/edit flows
- [x] Implement autosave baseline

### Wave 4

- [x] Implement LLM Node
- [x] Implement Crop Image Node
- [x] Implement Extract Frame Node
- [x] Define Trigger.dev tasks
- [x] Define execution payload schemas

### Wave 5

- [x] Build full workflow execution
- [x] Build selected node execution
- [x] Build single node execution
- [x] Persist run history
- [x] Persist node run history

### Wave 6

- [x] Expand history detail view
- [x] Add sample workflow
- [x] Add import/export JSON
- [x] Add loading/error polish
- [~] Validate demo flow end to end

### Wave 7

- [x] Retry from failed node
- [x] Draft recovery
- [x] Keyboard shortcuts
- [x] Command palette
- [x] Workflow versions

### Wave 8

- [x] Execution debugger
- [x] Performance cleanup
- [x] Visual polish pass
- [x] Deployment setup
- [x] Demo video prep

### Wave 9

- [x] Deep health reporting
- [x] Local verification command
- [x] Final verification guide
- [~] Browser demo validation
- [ ] Final Vercel deploy

## 4. Daily Control List

Use this at the start and end of each work session.

### Start of Session

- [ ] Re-read `design_doc.md` session summary
- [ ] Pick one 5-step wave
- [ ] Confirm dependencies and env needs
- [ ] Work only on current wave unless blocked
- [ ] Update status as features land

### End of Session

- [ ] Update session summary in `design_doc.md`
- [ ] Mark completed roadmap items
- [ ] Note blockers and risks
- [ ] Note next exact 5 steps
- [ ] Confirm app still builds
