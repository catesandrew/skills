---
title: Review and Ship
description: Reviews the current branch for bugs, regressions, security, and intent fit, runs or writes targeted tests, commits focused work, and opens or updates a PR.
---

# review-and-ship

## Why It Exists

Adapted from the `review-and-ship` skill in `cursor-team-kit` of [cursor/plugins](https://github.com/cursor/plugins) (MIT). Only the frontmatter `description` was reworded to the "Use when..." form this repo requires.

## What It Does

Gathers the diff against the base branch plus uncommitted changes and recent commits, runs targeted tests (or decides whether to add them), reviews for correctness, regressions, security, and intent fit (parallel subagents for larger diffs), fixes critical issues, commits selected files, then pushes and opens or updates the PR. Output is a findings summary (critical, warning, note), tests run, and the PR URL.

## How To Use It

```sh
skills add -g catesandrew/skills --skill skills/review-and-ship
```

```sh
npm install @catesworks/skill-review-and-ship
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

## Gotchas & Invariants

- Correctness, security, and regressions outrank style-only comments.
- Keep commits focused; no unrelated files.
- If pre-commit checks fail, fix the cause; never bypass hooks.
- Judge PR readiness with `gh pr checks`, not Actions-only commands.

---

_Sourced from: skills/review-and-ship/SKILL.md, skills/review-and-ship/metadata.json, upstream https://github.com/cursor/plugins (cursor-team-kit, MIT)_
