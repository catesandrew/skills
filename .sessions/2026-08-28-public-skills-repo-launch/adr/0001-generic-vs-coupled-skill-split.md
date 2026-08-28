# 0001. Split agent skills by coupling, not by origin repo

Date: 2026-08-28

## Status

Accepted

## Context

Skills for AI coding agents were accumulating in two places: 25 skills
inside `next-starters/skills`, wired into that repo's own
`.claude-plugin/marketplace.json`, and 56 skills in a private dotfiles repo
(`~/.dotfiles/agent-skills`), installed cross-machine via the `skills` CLI.
The `next-starters` skills are tightly coupled to that repo's own stack
(env-loader conventions, Kubb-generated data layer, its Playwright
testid/attribute conventions, its templates). A new skill
(`dithered-motif-site`) had just been authored that belonged to neither
bucket — it's generic (a canvas-dither technique + Higgsfield prompt
patterns) but wasn't in the dotfiles collection.

The dotfiles skills themselves also range from fully generic
(`react-query-patterns`, `zustand-patterns`) to silently coupled to a
specific current employer's Azure DevOps org and internal design system
(`ado-*`, `baseline-design`) or to the user's own personal machine/client
paths (`repo-portfolio-deep-dive`).

## Decision

Create a third, public repo (`catesandrew/skills`) that holds only skills
that are genuinely generic and loosely coupled — no employer/client names,
no internal org URLs, no absolute machine paths, no secrets. Membership is
decided per-skill by that coupling test, not by which source repo a skill
happened to live in:

- `next-starters/skills` keeps skills coupled to that repo's own
  Next.js/Kubb/Playwright stack.
- `catesandrew/skills` (this repo) holds stack-agnostic skills, regardless
  of whether they originated in dotfiles or were authored fresh.
- Skills that fail the public-safety test stay in the private dotfiles
  collection, even if they're otherwise well-written and actively used.

Both `next-starters/skills` and `catesandrew/skills` are structured as
self-hosted Claude Code plugin marketplaces
(`.claude-plugin/marketplace.json` + `skills/`), so the pattern is
consistent across both.

## Consequences

- A new skill's home is decided by a coupling/safety test applied at
  creation time, not by "which repo am I already working in."
- The public repo needs an explicit, repeatable private-data sweep
  (see `LESSONS.md`) any time a skill is added, since nothing else enforces
  that boundary.
- Some genuinely useful skills (the `ado-*` Azure DevOps ones, in
  particular) are now inaccessible to any project that isn't dotfiles-linked
  to this machine, unless someone later distills a generic core out of them
  (tracked in `FOLLOWUPS.md`).
