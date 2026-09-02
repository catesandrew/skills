# Summary — Skills docs site (2026-09-02)

## Goal

Give this repo the same skill documentation treatment as `next-starters`: a
generated skill-catalog table plus a hand-written deep-dive page per skill
(why it exists, what it does, how to use it, gotchas), then deploy it live.

## What was done

### skills repo — docs site scaffold

- `website/` — new Docusaurus 3.10.2 (TS, classic preset) site: `docusaurus.config.ts`,
  `sidebars.ts`, `tsconfig.json`, `package.json`, `src/pages/index.tsx` +
  `index.module.css`, `src/css/custom.css`, `static/img/*` (favicon, logo,
  social card reused from `next-starters`' stock Docusaurus assets).
- `website/docs/getting-started.md`, `architecture.md`, `installing-plugin.md` —
  hand-written, adapted from `next-starters`' equivalents to this repo's real
  install channels (`/plugin install cw@skills`, `skills` CLI, npm
  `@catesworks/skill-<name>`).
- `bin/generate-skill-docs.mjs` — ported from `next-starters`' generator.
  Adapted `deriveUseCase()` to fall back to a truncated description instead
  of hard-failing when a skill's description doesn't start with "Use when"
  (`skills/session-wrap/SKILL.md` doesn't). Generates
  `website/docs/skills-catalog.md` from every `skills/*/SKILL.md` +
  `metadata.json`. Added `pnpm docs:generate` / `pnpm docs:check` to root
  `package.json`.
- `website/docs/skills/*.md` — 52 deep-dive pages, one per skill. Written by
  8 parallel subagents doing real git archaeology: most skills' real history
  lives in a private dotfiles repo (`~/.dotfiles/agent-skills/skills/<name>/`)
  they were migrated from, not in this repo's own thin git log. 4 skills
  (`design-critique-loop` `5ebf063`, `point-cloud-assembly-scene` `1b364bf`,
  `scroll-video-site` `35b6689`) were authored directly in this repo instead;
  `dithered-motif-site` has no traceable prior history anywhere and first
  appears in the bulk `13fbfbc` import commit.
- Fixed 2 real MDX build breaks surfaced by `pnpm build`:
  - `website/docs/skills/jira-estimate.md` — literal `<100 lines` in prose
    read as an unterminated JSX tag start → `&lt;100 lines`.
  - `website/docs/skills/data-table-builder.md` — a backslash-escaped
    backtick inside a single-backtick code span closed the span early,
    exposing `${parent.id}` as an unintended MDX JS expression → switched to
    double-backtick (`` `` ``) code-span delimiters.
- `pnpm-workspace.yaml` — added `website` package.
- `.gitignore` — added `website/build/`, `website/.docusaurus/`.
- `website/.gitignore` (written by `vercel link`) — `.vercel`, `.env*`.
- `README.md` — added a "Read the docs →" link and local-dev instructions.

### Deploy

- `vercel link --cwd website -p skills-docs --team catesandrew -y` → created
  `catesandrew/skills-docs`; auto-detected Docusaurus (v2+) correctly because
  the link was run from inside `website/`, no explicit Root Directory override
  needed.
- `vercel deploy --cwd website --prod --yes` → build succeeded, aliased to
  `skills-docs-pi.vercel.app`.
- `vercel domains add skills.catesworks.dev skills-docs` → attached;
  `vercel domains verify` reported `configured-correctly` immediately — an
  existing Cloudflare DNS record for `catesworks.dev` already routes to
  Vercel's edge, so no new DNS record was needed.
- Verified live with `curl`: `200` on `/`, `/docs/skills-catalog`,
  `/docs/skills/commit-message`.

## Verification

- `node bin/generate-skill-docs.mjs --check` → OK, 52 skills, catalog in
  sync, all 52 deep-dive pages present.
- `pnpm typecheck` (website) → clean.
- `pnpm build` (website) → succeeded after the 2 MDX fixes above; no broken
  doc links (`onBrokenLinks: 'throw'` in `docusaurus.config.ts`).
- `curl -o /dev/null -w "%{http_code}"` → `200` on 3 representative live URLs.

## Commits

| SHA | Repo | Message | Pushed? |
|-----|------|---------|---------|
| `565c818` | skills | feat: add Docusaurus docs site with per-skill deep-dive pages | yes |
| `e152ad2` | skills | docs: link the live skills.catesworks.dev docs site from README | yes |
| `f710d60` | skills | chore: ignore website/.vercel and env files | pending — committed, not pushed (user asked only to commit) |

## Out of scope / deferred

- No GitHub-integration auto-deploy — the live site was shipped via CLI
  (`vercel deploy --cwd website --prod`) and will not update on future
  pushes until that's wired up. See `FOLLOWUPS.md`.
- No blog (`blog: false` in `docusaurus.config.ts`) — no blog content was
  authored this session.
- No `HomepageStats`/`HomepageFeatures` components — kept the homepage to a
  minimal hero, unlike `next-starters`' fuller landing page.
