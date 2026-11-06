---
title: Thermo-Nuclear Code Quality Review
description: An extremely strict maintainability review that hunts for structural simplification, file-size blowups, spaghetti branching, leaky abstractions, and type-boundary problems, and withholds approval until they are fixed.
---

# thermo-nuclear-code-quality-review

## Why It Exists

Adapted from the `thermo-nuclear-code-quality-review` skill in `cursor-team-kit` of [cursor/plugins](https://github.com/cursor/plugins) (MIT). The body is verbatim; only the frontmatter `description` was reworded to the "Use when..." form. It keeps `disable-model-invocation: true`, so it runs only when explicitly requested.

## What It Does

Reviews a branch's changes against a deliberately harsh bar: look for "code judo" restructurings that delete whole layers of complexity, block PRs that push a file past 1000 lines, reject ad-hoc conditionals bolted onto unrelated flows, and flag thin wrappers, casts, optionality, canonical-helper duplication, and layer leaks. Findings are ordered structural regressions first, nits last; approval requires none of the listed blockers.

## How To Use It

```sh
skills add -g catesandrew/skills --skill skills/thermo-nuclear-code-quality-review
```

```sh
npm install @catesworks/skill-thermo-nuclear-code-quality-review
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

## Gotchas & Invariants

- Not for casual reviews: the tone is intentionally demanding.
- Prefer few high-conviction findings over a long list of cosmetic ones.
- "It works" is never sufficient grounds for approval.

---

_Sourced from: skills/thermo-nuclear-code-quality-review/SKILL.md, skills/thermo-nuclear-code-quality-review/metadata.json, upstream https://github.com/cursor/plugins (cursor-team-kit, MIT)_
