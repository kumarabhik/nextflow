# NextFlow Vercel Deployment

## Goal

Deploy the Next.js app on Vercel with the same env vars used locally.

## Pre-Deploy Checklist

- Clerk keys are valid.
- Gemini key is valid.
- Trigger.dev secret and project ref are valid.
- `DATABASE_URL` points to a real PostgreSQL database.
- `npm run build` passes locally.

## Required Vercel Environment Variables

Copy these from your local root [`.env`](C:\Users\kumar\Downloads\XOXO\Assignment\.env):

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `TRIGGER_SECRET_KEY`
- `TRIGGER_PROJECT_REF`

## Deployment Steps

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables before the first production deploy.
4. Set `NEXT_PUBLIC_APP_URL` to the deployed site URL after the domain is known.
5. Deploy.

## Post-Deploy Verification

1. Open `/sign-in` and `/sign-up`.
2. Sign in and confirm `/dashboard` is protected.
3. Load the sample workflow.
4. Save draft and save version.
5. Run a workflow and check the history panel.
6. Open `/api/health` and confirm the report is clean.

## Trigger.dev Note

For production background runs, deploy your Trigger.dev tasks as well:

```bash
npm run trigger:deploy
```
