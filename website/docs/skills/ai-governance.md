---
title: AI Governance
description: Tracks AI coding session metrics and adds standardized attribution trailers to commits and pull requests, generating a session report for auditability, cost estimation, and ROI measurement.
---

# ai-governance

## Why It Exists

The trail here is thin. `ai-governance` only shows up as one of 24 files added in the generic bulk commit `9dfa72e8` ("chore: add new skills"), which added it alongside README and rules docs with no skill-specific rationale in the commit message beyond the standard AI-Attribution trailer dotfiles auto-generates. There is no dedicated add commit, no distinguishing design discussion, and no earlier prompt file it was converted from. It was later removed from dotfiles entirely in the `df4241d4` "switch to external cw skills marketplace" migration (which explicitly calls out `ai-governance` by name as one of the skills being externalized), then reached this public repo via the bulk `13fbfbc` import.

## What It Does

`ai-governance` is a process/documentation skill, not a code-analysis one: it standardizes how AI-assisted commits and PRs are attributed and measured across *any* AI coding agent, not just Claude Code. It defines three invocation points — `governance:start` (silently begin tracking session metrics from turn one: turn counter, course corrections, dead ends, files read/modified, model, and a one-line task summary), `governance:commit` (append `AI-Assisted-By:` and `Co-Authored-By:` trailers to the commit message), and `governance:pr` (generate a full "AI Session Report" block for the PR description and apply an `ai-assisted` GitHub label, creating the label if it doesn't exist).

The skill encodes concrete lookup tables rather than leaving them to inference: a tool-identification table mapping agent names (Claude Code, Codex CLI, Cursor, Windsurf, Copilot, Aider, Cline, Continue.dev, Gemini CLI, Zed AI, Amazon Q, Devin) to trailer values, a provider→email mapping for the `Co-Authored-By` trailer, and a cost-estimation guide with per-model $/M-token rates (Opus, Sonnet, Haiku, GPT-4o, o3, Gemini 2.5 Pro) plus a rough tokens-per-turn heuristic for estimating spend when exact usage isn't available.

It also documents a "Cross-Tool Reference" capability matrix (which of commit trailers / PR report / session tracking / auto-invoke-via-rules each tool supports) and a per-tool instruction-file map (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `.windsurfrules`, etc., with ready-to-paste config snippets in `rules/tool-configs.md`) so the same governance behavior can be wired into whichever agent a team actually uses. Downstream, it positions the `ai-assisted` label and `AI-Assisted-By` trailer as the raw signal for cost dashboards, model comparison, developer velocity, and quality-correlation queries against `git log`.

## How To Use It

Triggers on: "committing AI-assisted code or opening a pull request to add standardized AI attribution trailers, track session metrics, and generate a PR session report"; can also be invoked manually — "Add AI governance to this commit", "Generate a session report", "Track this AI session".

```sh
skills add -g catesandrew/skills --skill skills/ai-governance
```

```sh
npm install @catesworks/skill-ai-governance
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Session tracking must start at turn one (`governance:start`) — reconstructing metrics retroactively at PR time produces inaccurate counts, per the skill's own "Common Mistakes" section.
- Course corrections must be counted honestly (any time the user redirected the approach), not understated — the number is meant to reveal prompting quality over time, not flatter the session.
- The `ai-assisted` label is required, not optional — it's called out as the lightweight signal that powers all downstream queries, so skipping it breaks the audit trail.
- Task summaries in the session report must be specific ("Add retry with exponential backoff for DynamoDB batchWriteItem unprocessed items"), not generic ("Fixed a bug").
- Cost estimates use a documented but static per-model pricing table — the skill explicitly warns to verify against current provider pricing before reporting numbers to stakeholders, since pricing changes frequently.
- Tracking is silent by default — metrics are not printed during the session unless explicitly asked for.

---

_Sourced from: skills/ai-governance/SKILL.md, skills/ai-governance/metadata.json_
