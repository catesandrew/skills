# Architecture — Skills docs site (2026-09-02)

## Context

This repo needed skill documentation with usage examples, matching
`next-starters`' Docusaurus catalog + deep-dive-page pattern — but unlike
`next-starters`, this repo's own git history is too thin (one bulk import
commit for 48 of 52 skills) to source real "Why It Exists" content the same
way `next-starters` could from its own incremental commits.

## Shape

```
skills/<name>/{SKILL.md,metadata.json}     (source of truth, unchanged by this work)
        │
        ▼  bin/generate-skill-docs.mjs (mechanical, regenerable)
website/docs/skills-catalog.md             (generated table: abstract, use case, install cmd, per skill)

website/docs/skills/<name>.md              (hand-written, NOT generated — Why It Exists /
        │                                    What It Does / How To Use It / Gotchas /
        │                                    Related Skills, sourced from real git archaeology)
        ▼  docusaurus build
website/build/  →  vercel deploy --prod  →  Vercel project "skills-docs"  →  skills.catesworks.dev
```

## Key decisions

- Generate only the mechanical catalog table; hand-write the deep-dive prose
  per skill rather than templating it, so page quality/accuracy isn't capped
  by a generic template and isn't allowed to fabricate history the archives
  don't support (see `adr/0001-ground-deep-dive-pages-in-real-archaeology.md`).
- Link the Vercel project from inside `website/` (`--cwd website`) rather
  than from the repo root, so Docusaurus auto-detection resolves the project
  root correctly without a manual Root Directory override.

## Invariants

1. `website/docs/skills/<name>.md` must exist for every `skills/<name>/` —
   enforced by `node bin/generate-skill-docs.mjs --check` (also checks the
   catalog table is up to date).
2. Deep-dive pages never assert an origin story the archaeology didn't
   actually find — thin history is stated as thin, not padded to match
   `next-starters`' prose depth.
3. Install instructions on every page reflect what's actually installable:
   the `skills` CLI (per-skill), npm (per-skill package), and the Claude
   Code plugin marketplace (whole-repo bundle `cw@skills` — there is no
   per-skill plugin, unlike a claim on one `next-starters` deep-dive page
   this repo deliberately did not copy).

## What's deliberately not here

- No auto-deploy-on-push — the live site is a CLI-only deploy
  (`vercel deploy --cwd website --prod`), not tied to `git push`. See
  `FOLLOWUPS.md`.
- No blog section (`blog: false`) — no blog content existed to publish yet.
- No `HomepageStats`/`HomepageFeatures` components from `next-starters`' own
  homepage — this repo's homepage is a minimal hero only.
