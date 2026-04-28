---
name: auto-push-deploy
description: Automatically commit, push to main, and run production redeploy after implementing requested code changes in this repo. Use when the user asks for features/fixes and wants release without repeated confirmation.
---

# Auto Push Deploy

Use this skill for this repository when the user wants continuous ship behavior.

User preference (verbatim): **"dont ask everytime"**

## Default behavior

After completing implementation and local verification:

1. Stage all relevant changes.
2. Create a clear commit message matching repo style.
3. Push to `origin main`.
4. Trigger production deploy with:
   - `vercel --prod --yes`
5. Return deployment URL and alias URL.

## Verification before shipping

- Run focused typecheck/lint for touched areas before commit.
- If typecheck or lint fails, fix first and then continue.

## Guardrails

- Skip auto-push/deploy only if the user explicitly says not to push/deploy.
- Do not use destructive git commands.
- Keep secrets out of commits.

## Output format to user

- Latest commit hash + title
- Push result (`main -> main`)
- Production deployment URL
- Aliased live URL
