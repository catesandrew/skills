---
title: Pr Ado Open
description: Pushes the active branch and opens an Azure DevOps pull request with a structured description, linked work items, reviewers, and optional auto-complete policy in a single pass.
---

# pr-ado-open

## Why It Exists

Like its `pr-ado-code-review` sibling, this skill was added in dotfiles commit `9dfa72e8` ("chore: add new skills", 2026-04-17), a bulk commit that introduced seven skills at once with no skill-specific rationale in the message. Verification ruled out `d13234c8` (same day, "chore: add ado, tsdoc, cm skills") as a source despite the naming overlap — that commit added an unrelated family of Azure DevOps *ticket* skills (`ado-development`, `ado-monitor`, `ado-new-ticket`, `ado-story-from-figma`, `ado-update-ticket(s)`), not PR-opening tooling. It was removed from dotfiles in `df4241d4` (2026-08-29) when `agent-skills` was pointed at the external `catesandrew/skills` marketplace.

## What It Does

The skill runs a six-phase flow to push a branch and open a fully-formed Azure DevOps PR in one pass. Phase 1 configures `az devops` defaults, checks the working tree is clean (asking the user how to handle uncommitted changes rather than assuming), and confirms the target base branch — defaulting to a configured value or querying the repo's actual default branch, but always confirming with the user since merging into the wrong branch can trigger unintended pipelines or release gates. Phase 2 discovers ticket context by extracting a `[A-Z]+-[0-9]+`-style ticket ID from the branch name, falling back to scanning commit subjects, then resolving and confirming linked ADO work items via `az boards work-item show` — importantly, it treats mentioning a ticket ID in prose as insufficient and requires linking work items through `--work-items` because many teams' branch policies check for that link specifically.

Phase 3 pushes the branch (`git push -u origin`), investigating rather than blindly force-pushing on a rejected non-fast-forward push. Phase 4 assembles a structured PR description template with fixed sections — Ticket(s), Changes (1–5 bullets naming component and behavior, never vague "fixed bug" language), Tests (one bullet per test file touched, or an explicit "no tests added" statement), and an optional Notes section for migration steps/feature flags/deployment ordering. Phase 5 creates the PR via `az repos pr create` with title, description, reviewers, linked work items, and conditional `--draft`/`--auto-complete` flags. Phase 6 prints the resulting PR URL and, if reviewers weren't specified, checks the branch's required-reviewer policy so the caller knows whether more reviewers are needed.

## How To Use It

Triggers on: the user says "open a PR", "create a pull request", or "submit a PR" against an Azure DevOps repository and needs the branch pushed and PR created with a structured description, linked work items, reviewers, and auto-complete policy.

```sh
skills add -g catesandrew/skills --skill skills/pr-ado-open
```

```sh
npm install @catesworks/skill-pr-ado-open
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Configure `az devops` defaults first — every subsequent `az repos` command needs org/project without them.
- Always confirm the base branch with the user, even when a default is detected — different branches carry different reviewer policies and release gates.
- Link work items via `--work-items`, not just by mentioning the ticket ID in the description body — ADO branch policies on many teams require the actual link, not prose.
- Changes bullets must name the specific component and behavior changed — "Updated service" / "Fixed bug" are explicitly called out as insufficient.
- Never enable `--auto-complete true` on a branch that isn't fully ready — it merges automatically the instant policies pass.
- Draft PRs block voting and auto-complete in ADO — use `--draft true` intentionally for WIP branches and remember to publish before requesting review.
- Include the Notes section only when there are real migration steps, feature flags, or deployment-ordering concerns — omitting it when it matters is called out as an incident-causing mistake.
- On a rejected non-fast-forward push, investigate before force-pushing; confirm with the user first.

## Related Skills

- [pr-ado-code-review](/docs/skills/pr-ado-code-review) — reviews the PR this skill opens; same-commit sibling.
- [pr-gh-code-review](/docs/skills/pr-gh-code-review) — the GitHub-side review counterpart in the same PR-workflow family.

---

_Sourced from: skills/pr-ado-open/SKILL.md, skills/pr-ado-open/metadata.json, ~/.dotfiles git history (commits `9dfa72e8`, `df4241d4`)_
