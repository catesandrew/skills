---
title: Zustand Patterns
description: Guides writing well-structured Zustand stores in React, covering atomic selector hooks, separating actions from state, event-based action design, and scoping reusable stores via React Context.
---

# zustand-patterns

## Why It Exists

This skill was added whole in dotfiles commit `1ec047cc` ("chore: zustand skill") — a single 161-line `SKILL.md`, 0%-AI-attributed per the commit trailer, matching the current public repo's `skills/zustand-patterns/SKILL.md` line-for-line. It was later swept into the same "React, tables & state" cross-link pass as `tanstack-table-patterns`, via `54e5f48c` ("feat(skills): port 3 generic React/RQ skills from envmgr-ui, cross-link cluster"), without materially changing its content. The commit subject is terse and the file was authored directly rather than through an iterative or debugged history — there's no deeper design narrative beyond that.

## What It Does

The skill lays out five store-organization rules, each with a before/after code pair. First: never export the store itself, only atomic selector hooks (`useBears`, `useFish`) built on top of a private `create(...)` call — destructuring the whole store subscribes a component to every field change, not just the one it reads. Second: avoid selectors that return new object/array literals, since Zustand's `===` equality check treats a fresh object as always-changed, defeating the selector entirely; prefer separate atomic hooks per field, or `shallow` equality only as a fallback. Third: group all mutator functions under a single `actions` namespace in the store so one `useCountActions()` hook exposes every action as a referentially stable object, safe to destructure without triggering re-renders. Fourth: model actions as named events (`increment`, `reset`) rather than generic setters — if a store's only job is holding raw assigned values, the skill's position is that you don't need a store. Fifth: keep stores small and per-feature, combining them with custom hooks (e.g. `useFilteredTodos` mixing a Zustand filter-state selector with a React Query call) rather than one large global store.

A second major section covers the Context pattern for scoped/reusable stores: instead of `create()`, use `createStore()` from vanilla `zustand` wrapped in a React Context Provider, with a `useState(() => createStore(...))` initializer (explicitly not `useMemo`, which has no creation-once guarantee) so each Provider instance owns its own isolated store — solving three problems a global store can't: initializing from props without a `useEffect` sync, per-render test isolation without manual mocking/reset, and safely rendering multiple independent instances of the same store shape. The skill closes with a decision table: global stores for true app-wide singletons (auth, theme, feature flags), Context stores for route-scoped state, reusable components, or anything needing prop-based initialization or test isolation.

## How To Use It

Triggers on: "writing well-structured Zustand stores in React", "creating or reviewing Zustand stores", "store organization", "selectors", "action patterns", "combining stores with React Query or other hooks", "using React Context for scoped/reusable stores instead of global singletons".

```sh
skills add -g catesandrew/skills --skill skills/zustand-patterns
```

```sh
npm install @catesworks/skill-zustand-patterns
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Never export the raw store — only export atomic selector hooks, one per field, so components subscribe to just what they read.
- Selectors must return stable primitives or referentially-stable values — an inline object/array literal in a selector defeats Zustand's `===` equality check and re-renders on every store update.
- Group actions under a single `actions` key so they can be destructured via one hook without causing re-renders; actions are static and never change.
- Model actions as domain events (`increment`, `reset`), not generic `set`-style setters — a store that's only assigning values doesn't need to be a store.
- Prefer several small, per-feature stores over one large global store; combine with custom hooks that also pull in React Query or similar.
- For Context-scoped stores, initialize the store instance with `useState(() => createStore(...))`, never `useMemo` — `useMemo` carries no guarantee it won't re-run.
- Use a global store only for true app-wide singletons; use a Context store for anything needing prop-based initialization, per-instance isolation, or test isolation.

## Related Skills

- [tanstack-table-patterns](/docs/skills/tanstack-table-patterns) — cross-linked in the same dotfiles React/state pass (`54e5f48c`); table `meta` state and Zustand stores solve adjacent state-sharing problems.
- [typescript-type-safety](/docs/skills/typescript-type-safety) — the `Record`/module-augmentation and containment patterns this skill's typed store/action shapes rely on.

---

_Sourced from: skills/zustand-patterns/SKILL.md, skills/zustand-patterns/metadata.json, ~/.dotfiles git history (commits `1ec047cc`, `54e5f48c`)_
