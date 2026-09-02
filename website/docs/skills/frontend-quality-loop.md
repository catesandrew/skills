---
title: Frontend Quality Loop
description: Auto-detects a frontend project's stack and iteratively raises code quality by running accessibility, performance, type-safety, and patterns/correctness review lenses until clean and verified.
---

# frontend-quality-loop

## Why It Exists

Introduced in `29619062` ("feat(skills): add frontend quality workflows", 2026-06-15) alongside its sibling `frontend-scaffold`. The commit message states the goal directly: make frontend review and plumbing tasks "portable across Claude, Codex, and Gemini while keeping grading separate from generation." That grading/generation split is the core design decision — this skill only reviews and fixes code quality, and hands scaffolding work off to `frontend-scaffold` rather than absorbing it. The commit also mentions a companion Claude `/frontend-quality` command that layers `ralph` persistence and parallel specialist review on top of this portable core.

## What It Does

The skill first detects the project's stack by reading `package.json` (plus `tsconfig.json`, `angular.json`, `next.config.*`, `tailwind.config.*` when present) and classifies it into a profile — e.g. `next + ts + react-query + tailwind + e2e-playwright` — stating the detection result before doing anything else. It refuses to proceed on a non-frontend project.

From that profile it selects **lenses**: a11y (always), perf (React/Next/Angular), types (TypeScript), patterns (React/Next hooks and component correctness), state (react-query/zustand), styling (Tailwind/CSS-in-JS), and e2e (Playwright, only at the `strict` quality bar). Each lens maps to both a Claude subagent for acceleration (e.g. `react-performance-expert`) and a portable skill to load on other hosts (e.g. `chrome-audit-performance`).

The core mechanism is a bounded loop: run all selected lenses (parallel on Claude, sequential elsewhere), collect findings, apply fixes for anything high/medium severity, then re-run. It stops after two consecutive clean rounds or hits `max_rounds` (default 5), whichever comes first. A hard rule enforced throughout: the pass that reviews code is never the same pass that self-approves its own fix — a fix must be re-graded in a fresh round. The loop finishes with a non-negotiable verification gate — typecheck, tests, build, and (at `strict`) Lighthouse/e2e — and every round prints a one-line scoreboard like `Round 2 — a11y:0 perf:2 types:0 patterns:1 → fixing 3`.

## How To Use It

Triggers on: "iteratively raise the quality of frontend code to a satisfactory bar", stack auto-detection from `package.json`, running accessibility/performance/type-safety/patterns review lenses, applying fixes, looping until clean and verified.

```sh
skills add -g catesandrew/skills --skill skills/frontend-quality-loop
```

```sh
npm install @catesworks/skill-frontend-quality-loop
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Stack detection is mandatory and must read `package.json` first — running React lenses on an Angular repo (or vice versa) just produces noise.
- A lens **reviews**; a separate fix pass **changes** code. The same pass must never both grade and self-approve — re-grade in the next round.
- The loop is capped by `max_rounds`; it reports what remains rather than looping forever on a stubborn or disagreeing finding.
- If a fix introduces a new typecheck/test regression, that fix must be reverted and logged as a finding for human review — not kept.
- Completion is never declared without running the verification gate (typecheck/tests/build, plus Lighthouse/e2e at `strict`) with real output.
- Scaffolding work (feature flags, env vars, endpoints) is out of scope here — it's code *generation*, not grading, and belongs to `frontend-scaffold`; mixing the two lets generation bugs slip past the grader.
- `${input:target}` must be passed in, never a hardcoded repo-specific path.

## Related Skills

- [frontend-scaffold](/docs/skills/frontend-scaffold) — the generation counterpart; scaffold plumbing first, then grade it with this loop.
- [design-critique-loop](/docs/skills/design-critique-loop) — a related iterative review loop, focused on visual/design critique rather than code quality lenses.

---

_Sourced from: skills/frontend-quality-loop/SKILL.md, skills/frontend-quality-loop/metadata.json, ~/.dotfiles git history (commit `29619062`)_
