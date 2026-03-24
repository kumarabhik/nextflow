# NextFlow Environment Setup

The live app reads env vars from the root [`.env`](C:\Users\kumar\Downloads\XOXO\Assignment\.env) file.

## Required for Local Development

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"

DATABASE_URL="postgresql://..."

GEMINI_API_KEY="AIza..."
TRIGGER_SECRET_KEY="tr_dev_..."
TRIGGER_PROJECT_REF="proj_..."
```

## Optional

These are not required by the current code path:

```env
TRANSLOADIT_AUTH_KEY="..."
TRANSLOADIT_AUTH_SECRET="..."
```

## Important Notes

- The root app is the workspace root, not the leftover [`nextflow/`](C:\Users\kumar\Downloads\XOXO\Assignment\nextflow) folder.
- A placeholder `DATABASE_URL` such as `johndoe:randompassword@localhost:5432/mydb` is treated as not configured.
- `Trigger.dev` is only considered ready when both `TRIGGER_SECRET_KEY` and `TRIGGER_PROJECT_REF` are present.

## Health Check

Use the dashboard status cards and the health endpoint:

- [Health route](C:\Users\kumar\Downloads\XOXO\Assignment\src\app\api\health\route.ts)

When the app is running locally:

- `GET http://localhost:3000/api/health`

## Local Commands

```bash
npm run dev
npm run build
npm run lint
npm run trigger:dev
```

## Needed Before Real End-to-End Validation

1. Replace the placeholder `DATABASE_URL` with a real PostgreSQL or Neon connection string.
2. Keep `npm run dev` running in one terminal.
3. Run `npm run trigger:dev` in a second terminal.
4. Open `/dashboard`.
5. Save a workflow, run it, and confirm history persists remotely.
