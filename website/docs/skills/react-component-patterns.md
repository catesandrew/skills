---
title: React Component Patterns
description: Guides the design of better React component APIs and structure, favoring early returns over inline conditional rendering for mutually exclusive states and discriminated unions over boolean prop flags to avoid impossible states.
---

# react-component-patterns

## Why It Exists

This skill was added in dotfiles commit `b8b107b2` ("chore: add more tsx skills"), which added its 130-line `SKILL.md` alongside an unrelated `typescript-type-safety` skill in the same commit — a paired batch addition rather than a targeted, single-purpose commit. There's no further revision history for it in dotfiles; the content landed complete and hasn't been revisited since. This is a case where the provenance is genuinely thin: no ported-from-a-real-codebase story, just a direct authoring commit.

## What It Does

The skill encodes two component-design rules with before/after code examples. Rule 1, "Early Returns Over Conditional Rendering," argues against stacking inline ternaries/`&&` checks for mutually exclusive UI states (loading, empty, error, data) inside JSX — showing how that pattern hides bugs and creates cognitive load — and prescribes extracting shared UI into a `Layout` component, then using one early `if` return per state. It calls out the concrete payoff: each `if` block maps to exactly one user-visible state, new states are easy to add, and TypeScript narrows `data` after each guard so you don't need optional chaining downstream. It also carves out an explicit exception: inline conditionals are fine for a single optional addition within one state (e.g. conditionally showing an avatar) — the anti-pattern is specifically using them to choose between mutually exclusive states.

Rule 2, "Discriminated Unions Over Boolean Flags," attacks boolean-prop proliferation (`isPercent`/`isCurrency`, `isPrimary`/`isSecondary`) by pointing out that two booleans produce four states when only three are meaningful, and each additional boolean doubles the state space with no compiler protection against invalid combinations. The fix is a single string-literal discriminator (`variant: 'standard' | 'percent' | 'currency'`) switched over exhaustively, giving compiler-enforced completeness when a new variant is added, no impossible states, and more readable call sites. The skill frames this as a matter of momentum: "resist adding the first boolean flag" — once one exists, future contributors extend the existing pattern (another boolean) rather than refactoring to a union.

## How To Use It

Triggers on: writing or reviewing React components, "conditional rendering of multiple states", "boolean prop flags", "component composition", "early returns", "discriminated union props", "avoiding impossible states in component APIs".

```sh
skills add -g catesandrew/skills --skill skills/react-component-patterns
```

```sh
npm install @catesworks/skill-react-component-patterns
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Use early returns for mutually exclusive states (loading/empty/error/data) — never stack inline conditionals for them in JSX.
- Inline conditionals remain fine for a single optional element within one already-selected state; the rule targets state-selection, not all conditional JSX.
- Layout duplication across early-return branches is acceptable and even helpful when states diverge slightly (e.g. different titles per branch).
- Never introduce a second boolean prop where a discriminated union would do — a boolean prop pair "invites" a third and fourth boolean rather than a refactor.
- A discriminated union must be handled with exhaustive matching (e.g. a `switch`) so the compiler flags missing cases when a variant is added.
- Boolean flags that can theoretically combine into an invalid state (e.g. `isPrimary` and `isSecondary` both true) are the specific failure mode this skill exists to prevent.

## Related Skills

- [react-hooks-closures](/docs/skills/react-hooks-closures) — companion React skill on hook correctness rather than component API shape.
- [react-use-state](/docs/skills/react-use-state) — related state-management patterns for component-local state.
- [react-ref-callbacks](/docs/skills/react-ref-callbacks) — another sibling from the same React skill family.

---

_Sourced from: skills/react-component-patterns/SKILL.md, skills/react-component-patterns/metadata.json, ~/.dotfiles git history (commit `b8b107b2`)_
