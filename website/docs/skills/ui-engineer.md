---
title: Ui Engineer
description: Provides an expert UI engineering persona for implementing production-ready frontend solutions with TypeScript and modern frameworks, covering component architecture, state management, accessibility, and code review.
---

# ui-engineer

## Why It Exists

This skill has an unusually clean, verifiable provenance chain, even though it does not trace to any of the pre-supplied candidate commits. It first appears in dotfiles commit `c0ba2ee2` ("prompts"), which added `home/.claude/agents/ui-engineer.md` (64 lines) — a Claude Code **subagent** definition, not a skill — alongside a parallel `home/.codex/prompts/ui-engineer.md` (63 lines) Codex prompt version. A later commit, `44d082a3` ("chore: add skills for prompts"), converted that Codex prompt into Agent Skill format at `agent-skills/ui-engineer/SKILL.md` (96 lines) and deleted the old `home/.codex/prompts/ui-engineer.md` in the same commit — i.e. the skill was born from repurposing an existing subagent persona/prompt pair into the skill format, not authored fresh. The file was then relocated into `agent-skills/skills/ui-engineer/SKILL.md` by `856e34fa` / `b24afa6f`. The 96-line count from `44d082a3` matches the current public repo's `skills/ui-engineer/SKILL.md` file exactly, confirming the chain. This is also a case where the pre-supplied candidate list (`9dfa72e8`) was a red herring — that commit does not touch `ui-engineer` at all.

## What It Does

Unlike most of the other skills in this catalog, `ui-engineer` is not a narrow workflow — it's a full engineering persona the agent adopts for UI implementation, architecture decisions, code reviews, and refactoring. It accepts requirements, an optional target framework (React/Vue/Angular, inferred from the codebase if omitted), and optional constraints (existing state management, styling approach, design tokens), and asks clarifying questions up front if the framework, design system, state approach, accessibility level, or browser targets are ambiguous.

The workflow moves through four stages: analyze requirements (break the UI into components/state/interactions, identify data flow sources, flag conflicts with good UX or accessibility), design architecture (component hierarchy, TypeScript interfaces for props/state, state management choice, loading/error/empty state planning), implement (composable single-responsibility components, co-located state, no side effects in render, design tokens instead of inline styles, semantic HTML with minimal ARIA), and a pre-submission quality checklist (TypeScript compiles, keyboard accessibility, loading/error/empty states handled, no inline styles, no magic numbers, error boundaries around async work).

It also encodes an explicit table of expertise areas (component design, state management, data fetching, forms, performance, styling, testing, accessibility) and a review-mode focus order — correctness, readability, performance, accessibility, maintainability — plus a "Common Mistakes to Avoid" list capturing anti-patterns like `useEffect`-based data fetching, prop drilling past two levels, preemptive `useMemo`/`useCallback` wrapping, and `!important` in CSS.

## How To Use It

Triggers on: "expert UI engineering assistance", "implements production-ready frontend solutions with TypeScript, modern frameworks (React/Vue/Angular), accessibility, and performance best practices", building React/Vue/Angular components, responsive designs, or any frontend development task, UI/UX implementation, component architecture, frontend best practices.

```sh
skills add -g catesandrew/skills --skill skills/ui-engineer
```

```sh
npm install @catesworks/skill-ui-engineer
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Ask before proceeding if framework, existing design system, state management approach, accessibility level (WCAG), or browser/device targets are ambiguous — don't assume.
- Explicit TypeScript types everywhere, no `any`; use `unknown` and narrow instead.
- No side effects in render; clean up subscriptions and timers in effects.
- No inline styles — use design tokens / CSS custom properties for colors, spacing, typography.
- No magic numbers — use constants or tokens.
- Provide complete, working code, not pseudocode or skeletons; include TypeScript types and interfaces.
- Data fetching goes through React Query / SWR, never a raw `useEffect` fetch.
- Don't preemptively wrap everything in `useMemo`/`useCallback` — profile first.
- When reviewing code, prioritize by impact and don't bikeshed formatting a linter already handles.

## Related Skills

- [typescript-type-safety](/docs/skills/typescript-type-safety) — the type-safety patterns this persona's "explicit types, no any" standard draws on.
- [zustand-patterns](/docs/skills/zustand-patterns) — one of the state-management options this persona reaches for beyond local/lifted state and Context.
- [tanstack-table-patterns](/docs/skills/tanstack-table-patterns) — a concrete implementation pattern this persona would apply when the UI work involves a data table.

---

_Sourced from: skills/ui-engineer/SKILL.md, skills/ui-engineer/metadata.json, ~/.dotfiles git history (commits `c0ba2ee2`, `44d082a3`, `856e34fa`)_
