---
name: vercel-manual-deploys
description: "skills docs site deploys to Vercel manually via the vercel-deploy GitHub workflow, not on push to main"
metadata:
  node_type: memory
  type: project
  originSessionId: ac4d6716-d828-4e6e-b34a-1b8b38d8d5bc
  modified: 2026-10-31T19:45:06.559Z
---

The Docusaurus site in `website/` (skills.catesworks.dev) is deployed to Vercel only when the user runs the `vercel-deploy` GitHub Actions workflow by hand.

**Why:** the user does manual deployments to reduce Vercel costs, so pushing to `main` does not deploy.

**How to apply:** never say a push "should auto-deploy" or wait for a deploy after pushing. After a website change, say it needs the `vercel-deploy` workflow run, and leave triggering it to the user.
