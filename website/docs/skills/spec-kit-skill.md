---
title: Spec Kit Skill
description: Integrates the GitHub Spec-Kit CLI's seven-phase constitution-driven workflow for feature development, covering constitution, specify, clarify, plan, tasks, analyze, and implement phases within the .specify/ directory structure.
---

# spec-kit-skill

## Why It Exists

This skill's history is genuinely tangled across renames and even a prior packaging as a full standalone plugin. A pickaxe search for `spec-kit` in `~/.dotfiles` surfaces three commits: `c0ba2ee2` ("prompts", 2025-12-03), `a2fee86a` ("chore: temp relocate", 2026-04-17), and `b24afa6f` ("initial public dotfiles", 2026-05-16). The oldest, `c0ba2ee2`, is the earliest form found — it lands the skill not under `agent-skills/` at all but as a full self-contained Claude Code plugin at `plugins/spec-kit-skill/`, complete with its own `.claude-plugin/plugin.json`, a `helpers/detection-logic.md`, and a `scripts/detect-phase.sh`, alongside sibling plugins (`kiro-skill`, `codex-skill`, `nanobanana-skill`, `autonomous-skill`) — evidence this began life as one of several standalone plugin experiments, not as part of the `agent-skills` bundle. By `a2fee86a` (four and a half months later), the skill reappears consolidated into `agent-skills/skills/spec-kit/SKILL.md` at the same 894 lines as the plugin-era file, with `home/.claude/skills/spec-kit-skill` removed — i.e. it was folded into the unified `agent-skills` skill tree and renamed from `spec-kit-skill` to `spec-kit` in the process, dropping the standalone plugin scaffolding (the detection-logic helper and detect-phase script) along the way. `b24afa6f` shows the same 894-line file present at the same path, consistent with that being a squash/import point rather than a further change. The public repo's own name, `spec-kit-skill`, restores the pre-consolidation name from `c0ba2ee2` rather than the `spec-kit` name it carried through most of its dotfiles life.

## What It Does

The skill is a large (nearly 900-line), heavily structured guide implementing GitHub's Spec-Kit constitution-driven workflow end to end: constitution → specify → clarify → plan → tasks → analyze → implement, all persisted under a `.specify/` directory with numbered feature folders (`.specify/specs/NNN-feature-name/`). It opens with installation/detection logic — checking whether the `specify` CLI is installed (`uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`), whether the project has been initialized (`.specify/memory/constitution.md` present), and, if so, which phase the latest feature is currently in, inferred purely from which files exist (`spec.md` without a `## Clarifications` section means "clarify" phase; no `plan.md` means "plan" phase; and so on).

Each of the seven phases gets its own collapsible `<details>` section with a template and worked example: Constitution establishes durable project principles (values, technical standards, a decision framework) in `.specify/memory/constitution.md`; Specify captures technology-agnostic functional requirements and user stories via a `create-new-feature.sh --json` script that also branches and checks out git automatically; Clarify caps itself at a maximum of 5 targeted, decision-focused questions per round, appended to the spec as a `## Clarifications` section; Plan produces `plan.md`, an optional `data-model.md`, API contracts, and optional `research.md`/`quickstart.md` files, gated by an explicit alignment checklist against the constitution; Tasks generates a dependency-ordered `tasks.md` where each task cites the requirement(s) it satisfies and is tagged `[P]` if parallelizable; Analyze is explicitly read-only, cross-checking requirement coverage, constitution alignment, and dependency consistency across all prior documents and reporting findings as passing/warning/critical; and Implement executes tasks phase-by-phase with a test-first pattern, updating `tasks.md` checkboxes as it goes.

A closing "File Structure" diagram and "Workflow Rules" section summarize six hard rules: phases must run sequentially, constitution comes first, each feature gets its own branch, features are numbered sequentially, the provided bash scripts should be used for consistency, and every decision must trace back to the constitution.

## How To Use It

Triggers on: "spec-kit", "speckit", "constitution", "specify", references to the `.specify/` directory, spec-kit CLI commands, setting up spec-kit in a project, creating constitution-based feature specifications, or following the GitHub Spec-Kit workflow.

```sh
skills add -g catesandrew/skills --skill skills/spec-kit-skill
```

```sh
npm install @catesworks/skill-spec-kit-skill
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Phases must run strictly in order (constitution → specify → clarify → plan → tasks → analyze → implement) — this is stated as a hard workflow rule, not a suggestion.
- Constitution must exist before any feature work begins; every later decision is expected to trace back to it.
- The Clarify phase caps itself at a maximum of 5 questions per round, and each question must be decision-focused ("How should the system handle concurrent edits?"), not open-ended ("How should it work?").
- The Analyze phase is explicitly read-only — it reports findings (passing / warning / critical) but never modifies constitution, spec, plan, or tasks files itself.
- Specifications must stay technology-agnostic ("what" and "why," not "use React" or "MySQL") — technology choices belong to the Plan phase.
- Each feature gets its own numbered git branch (`001-feature-name`, `002-...`), created automatically by the `create-new-feature.sh` script.
- Tasks must be sized to 1–4 hours, cite the requirement(s) they satisfy, and be tagged `[P]` when they can run in parallel with siblings.
- Deployment, user training, marketing, and other non-coding activities are explicitly excluded from the Tasks phase's scope.

---

_Sourced from: skills/spec-kit-skill/SKILL.md, skills/spec-kit-skill/metadata.json, ~/.dotfiles git history (commits `c0ba2ee2`, `a2fee86a`, `b24afa6f`)_
