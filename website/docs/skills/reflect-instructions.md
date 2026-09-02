---
title: Reflect Instructions
description: Provides an evidence-based workflow for analyzing an AI agent instruction file such as AGENTS.md or CLAUDE.md against observed conversation failures and proposing minimal, approved improvements.
---

# reflect-instructions

## Why It Exists

This skill started life as a Codex slash-command prompt, not a skill: dotfiles commit `44d082a3` ("chore: add skills for prompts", 2026-04-17) added `agent-skills/reflect-instructions/SKILL.md` (94 lines) in the same diff that *removed* `home/.codex/prompts/instruction-reflector.md` (78 lines) — a direct port from a Codex prompt into the cross-agent skill format, not a from-scratch write. The same day, commit `856e34fa` ("chore: agent-skills") did a pure rename with a zero-line diff, moving the file from the flat `agent-skills/reflect-instructions/SKILL.md` path into the now-standard `agent-skills/skills/reflect-instructions/SKILL.md` layout — this is the reorganization that gave the whole `agent-skills/skills/` tree its current shape, not a content change to this skill specifically.

## What It Does

The skill runs a four-phase workflow for improving an AI agent's instruction file (`AGENTS.md`, `CLAUDE.md`, or similar) using the current conversation as evidence. Phase 1 (Analysis) reads the target instruction file — defaulting to `AGENTS.md` if none is specified — and scans the conversation history for concrete failure signals: responses that missed user intent, repeated corrections for the same mistake, tasks blocked by missing guidance, verbosity mismatches, wrong tool selection, and inconsistent output formats, tracking each as a separate `TodoWrite` item. Phase 2 (Present findings) requires surfacing each proposed change as a three-part unit — current issue, proposed change, expected improvement — and explicitly waiting for user feedback before touching anything, one item or theme group at a time rather than dumping the whole list at once.

Phase 3 (Implement) applies only approved changes, re-reading the file fresh before each edit and making the minimal targeted change rather than a rewrite. Phase 4 (Final output) wraps everything in a fixed `<analysis>` / `<improvements>` / `<summary>` block structure. A companion "Best Practices" and "Key Principles" section reinforces the workflow's core constraint: every suggestion must trace to an actual observed failure, not a hypothetical one, and changes should make the instruction file shorter, not longer, over time. A "Common Mistakes" section calls out three specific anti-patterns to avoid: patching symptoms instead of root causes (e.g. adding more examples instead of fixing task-classification guidance), over-specifying into an unreadable enumeration of edge cases, and touching instructions nobody has complained about.

## How To Use It

Triggers on: analyzing and improving an AI agent instruction file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or similar) based on observed failure patterns, misunderstandings, or gaps surfaced in the current conversation.

```sh
skills add -g catesandrew/skills --skill skills/reflect-instructions
```

```sh
npm install @catesworks/skill-reflect-instructions
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Every proposed change must be grounded in an actual observed failure from the conversation — hypothetical scenarios are explicitly disallowed as justification.
- Present findings one at a time (or grouped by theme) and wait for user approval before implementing anything; don't batch every change through unreviewed.
- Prefer minimal, targeted edits to existing sections over rewriting the instruction file.
- The instruction file should get shorter after improvement, not longer — over-specifying into an exhaustive edge-case list is called out as a named failure mode.
- Don't fix symptoms — if the agent keeps misclassifying tasks, the fix is better classification guidance, not more per-case examples.
- Leave working patterns alone; a section nobody has complained about is not a target for "improvement."
- Commit changes after implementation with a clear message — improvements left uncommitted risk being lost or overwritten.
- Default target file is `AGENTS.md` in the current working directory when no file is specified.

## Related Skills

- [session-wrap](/docs/skills/session-wrap) — both skills share the "reconstruct from evidence, not memory" discipline, applied to instruction files versus session handoffs respectively.

---

_Sourced from: skills/reflect-instructions/SKILL.md, skills/reflect-instructions/metadata.json, ~/.dotfiles git history (commits `44d082a3`, `856e34fa`)_
