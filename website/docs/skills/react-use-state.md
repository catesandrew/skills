---
title: React Use State
description: Guides correct useState and useReducer usage in React, covering avoiding derived state, syncing props to state via keys instead of effects, functional updaters, lazy initializers, and choosing between useState and useReducer.
---

# react-use-state

## Why It Exists

Traced to the same dotfiles commit as `react-ref-callbacks`: `ba8c22e4` ("chore: add react skills", 2026-04-30), which added this skill, `react-ref-callbacks`, and `react-hooks-closures` together as a 604-line, three-skill drop. The commit message ("add react skills") offers no distinguishing rationale for this skill specifically — it's a bulk addition, not a targeted fix or a response to an observed bug, and it's stated here plainly rather than invented. No other dotfiles commit touches this skill's content before the eventual `df4241d4` migration-out to the external `catesandrew/skills` marketplace.

## What It Does

The skill is a rules-based guide against the most common `useState`/`useReducer` misuses, structured as six numbered rules rather than a narrative. Rule 1 targets derived state: if a value can be computed from existing state or props, don't give it its own `useState` — the worked example shows a `categories` state that's kept in sync with `data` via an effect (which can desync) versus just computing `categories` inline from `data` on every render (which can't). Rule 2 is the props-to-state anti-pattern: `useState(initialEmail)` only seeds on mount, so re-renders silently ignore prop changes, and syncing via `useEffect(() => setEmail(initialEmail), [initialEmail])` is called out explicitly as the wrong fix — the guide instead offers three legitimate patterns (a `key` prop to force remount on entity change, as the recommended default; lifting state to the parent; or letting the component naturally unmount/remount).

Rules 3–5 cover mechanical correctness: functional updaters (`setCount(prev => prev + 1)`) so that two calls in the same tick don't clobber each other and so `useCallback` dependencies can drop `count`; lazy initializers (`useState(() => expensiveComputation(props))`) so expensive setup only runs once instead of on every render; and using `useState` with an ignored setter — not `useMemo` — for values that must be guaranteed stable for the component's lifetime, since `useMemo` carries no such guarantee and React may discard the cached value. Rule 6 is a decision table for when to graduate from several `useState` calls to a single `useReducer`, plus a TypeScript tip for the `useState<number>()` convenience overload over `useState<number | null>(null)`. A `references/use-reducer-patterns.md` file (also added in `ba8c22e4`) goes deeper on event-driven reducer actions.

## How To Use It

Triggers on: writing or reviewing React state-management code, especially derived state, initializing state from props, functional updaters, one-time initializations, choosing between `useState` and `useReducer`, or syncing state with `useEffect` (flagged as usually wrong).

```sh
skills add -g catesandrew/skills --skill skills/react-use-state
```

```sh
npm install @catesworks/skill-react-use-state
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- If a state setter is only ever called synchronously inside an effect to mirror another value, that state shouldn't exist — compute it inline instead, and reach for `useMemo` only after measuring that the computation is actually expensive.
- Never sync a prop to state with `useEffect(() => setX(prop), [prop])` — `useState`'s initial value is mount-only, and the effect-sync anti-pattern is explicitly called out as wrong, not just suboptimal.
- Prefer a `key` prop as the default fix for props-to-state desync (forces remount on entity change); fall back to lifting state up or conditional unmount/remount only when a key isn't appropriate.
- Use functional updaters (`prev => ...`) whenever a new state value depends on the previous one, especially across multiple calls in the same event handler.
- Use a lazy initializer function (`useState(() => expensive())`), not a bare expensive call, or the computation reruns every render and the result is thrown away.
- For a value that must be guaranteed stable across the component's lifetime, use `useState` with an ignored setter, not `useMemo` — React offers no semantic guarantee that a memoized value survives.
- Reach for `useReducer` specifically when multiple distinct actions update different parts of the same state; keep independent fields as separate `useState` calls otherwise.

## Related Skills

- [react-ref-callbacks](/docs/skills/react-ref-callbacks) — added in the same dotfiles commit (`ba8c22e4`), covering DOM-node side effects rather than state correctness.
- [react-hooks-closures](/docs/skills/react-hooks-closures) — the third skill added alongside this one in `ba8c22e4`, covering stale-closure pitfalls in hooks.

---

_Sourced from: skills/react-use-state/SKILL.md, skills/react-use-state/metadata.json, ~/.dotfiles git history (commit `ba8c22e4`)_
