---
title: Pr Gh Open
description: Pushes the active branch and opens a GitHub pull request with a structured description, linked ticket, reviewers, and labels in a single pass.
---

# pr-gh-open

## Why It Exists

This skill was added to `~/.dotfiles` in commit `9dfa72e8` ("chore: add new skills"), a 24-file batch that introduced a family of PR/docs/estimation skills together — `pr-ado-open`, `pr-gh-code-review`, `pr-ado-code-review`, `ai-governance`, `jira-estimate`, and `microservice-docs` all landed in the same commit, with `pr-gh-open/SKILL.md` arriving at its full 156-line size already, no incremental buildup visible in dotfiles history. It later lived in dotfiles until `df4241d4` ("feat(skills): switch agent-skills to external cw skills marketplace") removed it — that commit's message states plainly that duplicate local copies of skills like `chrome-*`, `react-*`, and `pr-*` risked drifting from the now-canonical `catesandrew/skills` repo (this repo), so dotfiles dropped its local copy and wired in the `cw@skills` marketplace instead. In other words: this skill's real authorship happened in dotfiles, but its current home — and the copy this page describes — is this public repo, per that migration commit's explicit intent.

## What It Does

The skill runs a six-phase pipeline for opening a GitHub PR from the current branch. Phase 1 does pre-flight checks: confirms the working tree is clean (`git status --short`), identifies the active branch, and detects/confirms the base branch by checking for common integration branches (`dev`, `develop`, `main`, `master`) — always asking the user to confirm before proceeding, since merging into the wrong base can trigger unintended CI or deploy pipelines. Phase 2 extracts a ticket ID by pattern-matching `[A-Z]+-[0-9]+` first against the branch name, then falling back to commit subjects in `git log origin/<base>..HEAD`, and separately summarizes commit subjects as raw material for a human-readable Changes section (explicitly not raw commit messages).

Phase 3 pushes the branch (`git push -u origin <branch>`), stopping to ask the user before force-pushing on a rejected non-fast-forward push. Phase 4 builds a structured PR body from a fixed template with four sections — Ticket(s), Changes, Tests, Notes — each with explicit population rules (e.g., "never write 'fixed bug' — name the component and behavior"; omit Ticket(s) if no tracker is configured; only include Notes for migration steps, feature flags, or deployment ordering). Phase 5 creates the PR via `gh pr create` with base, title, body, reviewers, labels, and draft flag, falling back to a `CODEOWNERS` lookup via `gh api` when no reviewers are specified. Phase 6 prints the PR URL and optionally applies an `ai-assisted` label if the session was AI-assisted.

## How To Use It

Triggers on: "open a PR", "create a pull request", "submit a PR" against a GitHub repository, needing the branch pushed and a PR created with a structured description, linked ticket, reviewers, and labels.

```sh
skills add -g catesandrew/skills --skill skills/pr-gh-open
```

```sh
npm install @catesworks/skill-pr-gh-open
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Always confirm the base branch with the user before pushing — `dev` vs `main` can trigger different deployment pipelines.
- Push only after the base branch is confirmed, never before.
- Changes bullets must name the component and the behavior that changed — never vague text like "fixed bug" or "updated service."
- Explicitly state in the Tests section if no tests were added or modified; don't just omit it silently.
- Include the Notes section only when there are real migration steps, a feature flag, deployment ordering requirements, or known limitations — not by default.
- Don't force-push on a rejected push without investigating and confirming with the user first.
- Don't auto-assign reviewers without checking `CODEOWNERS` for the actual owners of the changed paths.
- Use draft mode for branches that aren't ready for review, to prevent accidental merges.

## Related Skills

- [pr-gh-code-review](/docs/skills/pr-gh-code-review) — reviews a GitHub PR after it's opened.
- [pr-ado-open](/docs/skills/pr-ado-open) — the Azure DevOps equivalent of this same open-PR workflow.

---

_Sourced from: skills/pr-gh-open/SKILL.md, skills/pr-gh-open/metadata.json, ~/.dotfiles git history (commits `9dfa72e8`, `df4241d4`)_
