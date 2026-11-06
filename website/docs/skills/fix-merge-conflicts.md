---
title: Fix Merge Conflicts
description: Resolves merge conflicts non-interactively with minimal correctness-first edits, regenerates lockfiles with tooling, validates build and tests, and stages the result without pushing.
---

# fix-merge-conflicts

## Why It Exists

Adapted from the `fix-merge-conflicts` skill in `cursor-team-kit` of [cursor/plugins](https://github.com/cursor/plugins) (MIT). Only the frontmatter `description` was reworded to the "Use when..." form this repo requires; the workflow is unchanged.

## What It Does

Detects every conflicting file from `git status` and conflict markers, resolves each with a minimal edit (preserving both sides when safe, otherwise the variant that compiles and keeps public behavior stable), regenerates lockfiles with the package manager, runs compile, lint, and relevant tests, then stages the files and summarizes the key decisions.

## How To Use It

```sh
skills add -g catesandrew/skills --skill skills/fix-merge-conflicts
```

```sh
npm install @catesworks/skill-fix-merge-conflicts
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

## Gotchas & Invariants

- Never leave conflict markers in any file.
- Never hand-edit lockfiles; regenerate them.
- No broad refactors while resolving.
- Never push or tag during resolution.

---

_Sourced from: skills/fix-merge-conflicts/SKILL.md, skills/fix-merge-conflicts/metadata.json, upstream https://github.com/cursor/plugins (cursor-team-kit, MIT)_
