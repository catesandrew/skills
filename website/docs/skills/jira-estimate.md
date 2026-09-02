---
title: Jira Estimate
description: Estimates how long a Jira ticket would take for AI to implement, expressed as story points and AI time, by fetching ticket details and scoring codebase complexity across five weighted factors.
---

# jira-estimate

## Why It Exists

This skill was added in `9dfa72e8` ("chore: add new skills", 2026-04-17) alongside `microservice-docs`, in a 24-file bulk commit whose message carries no distinguishing rationale — the commit's own metadata records it as 100% AI-generated content across 24 files but gives no per-skill explanation. No earlier or later commit in `~/.dotfiles` history touches this skill's content beyond its relocation into `agent-skills/skills/`. This is a thin trail: the skill's design (a five-factor weighted complexity score converting to Jira story points and an AI-time estimate) has to be read from the SKILL.md itself rather than from commit history.

## What It Does

Given a Jira base URL and ticket ID, the skill fetches the ticket (title, type, description, acceptance criteria, labels/priority, linked issues), then analyzes the local codebase using Glob/Grep to identify files likely to be modified, relevant existing patterns, dependencies needing updates, and tests requiring changes. It scores five factors 1–5 each — Technical Complexity, Codebase Familiarity, Change Scope, Testing Requirements, and Risk & Unknowns — using concrete rubrics (e.g. Change Scope: 1 = "1–3 files, &lt;100 lines" up to 5 = "50+ files, 1000+ lines").

Those five scores are combined into a weighted total out of 60 (Technical ×3, Familiarity ×2, Scope ×3, Testing ×2, Risk ×2), and the resulting percentage maps to a story-point/AI-time bracket: ≤20% → 1 point (10–30 min), ≤35% → 2 points (1–3 hrs), ≤55% → 5 points (4–8 hrs), ≤75% → 8 points (1–2 days), >75% → 13 points (2–4 days). The skill states its underlying assumption plainly: AI is typically 10–50x faster than a human for simple well-defined tasks and 3–8x faster for complex ones. Output is a fixed markdown report — summary, ticket details, codebase analysis, per-factor complexity breakdown with reasons, implementation approach, assumptions/risks, and an explicit AI-suitability recommendation — and it can optionally post the estimate back to Jira as a comment (only writing the Story Points field directly if it's editable and the save is verified).

## How To Use It

Triggers on: "estimate how long a Jira ticket would take for AI to implement", expressed as story points and AI time, based on codebase analysis and complexity scoring.

```sh
skills add -g catesandrew/skills --skill skills/jira-estimate
```

```sh
npm install @catesworks/skill-jira-estimate
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Complexity scores must never be assigned before actually fetching and reading the ticket description and acceptance criteria.
- Familiarity and Scope scores require actually searching the repo — no blind estimation.
- Data-only changes get a minimum of 1 story point regardless of score, reflecting the 10–50x AI speedup for simple tasks.
- Research/spike tickets add +2 story points and are marked Low Confidence outright.
- Bug fixes with unclear root cause add +1 story point.
- If acceptance criteria are missing or vague, confidence must be marked Low regardless of the numeric score.
- The recommendation section (is this a good AI candidate?) is not optional — it's called out as the most useful part of the output.
- Only the Story Points field is written back directly, and only if it's editable and the write is verified; otherwise the estimate goes in as a comment.

---

_Sourced from: skills/jira-estimate/SKILL.md, skills/jira-estimate/metadata.json, ~/.dotfiles git history (commit `9dfa72e8`)_
