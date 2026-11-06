---
title: Verify This
description: Proves or disproves a specific claim with fresh local evidence: restates it falsifiably, captures baseline and treatment, compares raw artifacts, and returns exactly one verdict.
---

# verify-this

## Why It Exists

Adapted from the `verify-this` skill in `cursor-team-kit` of [cursor/plugins](https://github.com/cursor/plugins) (MIT). The frontmatter `description` was reworded to the "Use when..." form, the Cursor-specific `control-cli`/`control-ui` tools were replaced with generic equivalents (terminal transcripts, Chrome DevTools MCP, Playwright), and the artifact directory became `${input:artifactDir:/tmp/verify-this}`.

## What It Does

Restates the claim as condition, metric, and threshold; picks the smallest local surface that can disprove it; captures a baseline from the old state and a treatment from the changed state with the same command, data, and environment; compares raw artifacts; and returns exactly one of `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`.

## How To Use It

```sh
skills add -g catesandrew/skills --skill skills/verify-this
```

```sh
npm install @catesworks/skill-verify-this
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

## Gotchas & Invariants

- Refuse vague claims ("the code is cleaner"); ask for a measurable one first.
- Same command, data, warmup, and environment for baseline and treatment.
- Do not soften a negative result.
- Keep sensitive artifacts (prompts, HTTP bodies, heap data) inline-only unless the user agrees to disk storage.

---

_Sourced from: skills/verify-this/SKILL.md, skills/verify-this/metadata.json, upstream https://github.com/cursor/plugins (cursor-team-kit, MIT)_
