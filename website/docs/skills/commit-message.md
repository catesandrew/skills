---
title: Commit Message
description: Generates a conventional commit message from the staged diff and relevant recent session context, then uses that exact message to create the git commit, preserving explicit testing status and user-visible impact.
---

# commit-message

## Why It Exists

This skill has an unusually clear lineage. It was first added in dotfiles commit `53659f66` ("chore: add commit-message skill") as a **Codex-specific** skill at `home/.codex/skills/commit-message/SKILL.md`, complete with an `agents/openai.yaml` file — meaning it originated as an OpenAI Codex CLI skill, not a Claude Code one. It was carried into the shared `agent-skills/skills/commit-message` location in `d13234c8` ("chore: add ado, tsdoc, cm skills" — "cm" being the abbreviation the commit list flagged), where that same commit deleted a `fabric-create-git-diff-commit.prompt.md` file, suggesting the skill replaced an older Fabric-pattern-based prompt for the same job. It was later removed from dotfiles in `df4241d4` when `chrome-*`, `commit-message`, and other duplicated skills were pointed at the external `catesandrew/skills` marketplace instead.

## What It Does

Given staged git changes, the skill inspects the staged diff, optionally reviews recent conversation context from `~/.codex/sessions` when it clarifies intent, infers the correct conventional commit type (`fix`, `feat`, `refactor`, `docs`, `test`, `build`, `chore`), and writes a message explaining what changed, why, the bug fixed (if applicable), user-visible impact (if behavior changed), and testing status. It then runs `git commit` with that exact message and reports back the resulting hash and subject line.

If there are no staged changes, it stops and reports the blocker rather than guessing from the unstaged working tree. If the commit itself fails, it returns the generated message plus the failure reason instead of silently discarding the work.

The message format is tightly constrained: conventional-commit format, present tense/imperative mood, subject line ≤74 chars, body lines ≤80 chars, English/ASCII only (no Unicode punctuation or bullets), a first body bullet that explains *why*, a `Tests: ...` closing line, and a `BREAKING CHANGE:` footer when warranted.

## How To Use It

Triggers on: "the user asks for a commit message", "the user asks to summarize staged changes for git commit", "the user wants a conventional commit message from the current diff", "the user wants the staged changes committed now", staged changes plus recent Codex session context.

```sh
skills add -g catesandrew/skills --skill skills/commit-message
```

```sh
npm install @catesworks/skill-commit-message
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- No staged changes → stop and report the blocker; never fall back to guessing from the unstaged diff.
- The commit message used for `git commit` must exactly match the generated message — no silent post-hoc edits.
- Subject line hard-capped at 74 characters; body lines hard-capped at 80.
- ASCII only — no Unicode punctuation or bullet characters, even for emphasis.
- Must include a final `Tests: ...` line every time.
- Prefer specificity and the "why" over vague "what changed" summaries; omit a claim entirely if there isn't enough evidence for it rather than guessing.
- Do not mention specific filenames unless doing so adds real clarity.

---

_Sourced from: skills/commit-message/SKILL.md, skills/commit-message/metadata.json, ~/.dotfiles git history (commits `53659f66`, `d13234c8`, `df4241d4`)_
