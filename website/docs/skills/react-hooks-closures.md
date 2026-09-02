---
title: React Hooks Closures
description: Guides writing correct React hooks code that avoids stale closures, covering dependency array discipline, React.memo comparison pitfalls, the latest ref pattern, and the experimental useEffectEvent hook.
---

# react-hooks-closures

## Why It Exists

This skill was added in dotfiles commit `ba8c22e4` ("chore: add react skills"), a batch commit that introduced it alongside two siblings — `react-ref-callbacks` and `react-use-state` (the latter with its own `use-reducer-patterns.md` reference) — plus this skill's own `references/patterns.md`. It landed complete at 108 lines with no incremental history afterward. As with its sibling `react-component-patterns`, the provenance here is a direct, undistinguished authoring commit rather than a port from another codebase.

## What It Does

The skill centers on a single mental model — the "photo analogy" — to explain stale closures: every function React creates (via render, `useCallback`, `useMemo`, `useEffect`) captures a snapshot ("photo") of everything it closes over, frozen at creation time. Re-renders take a fresh photo; memoization holds the old photo until dependencies change; empty dependency arrays freeze the first photo forever; refs act as "photoshop," letting you mutate the captured value in place so it always reflects the latest state. From that model it derives four concrete rules with code examples.

Rule 1 says never lie about dependencies — set `react-hooks/exhaustive-deps` to `error` (not `warn`) and include every closed-over value, since the linter catches what humans miss. Rule 2 warns that custom `areEqual` functions passed to `React.memo` create stale closures the linter cannot catch — if a memo comparison ignores a callback prop that itself closes over other state, that callback goes stale until an unrelated prop also changes, producing hard-to-reproduce intermittent bugs. Rule 3 introduces the "latest ref pattern" for custom hooks that accept a callback and use it inside an effect: store the callback in a ref via `useLayoutEffect`, so the effect's own dependency array can safely exclude the callback without forcing every consumer to memoize it. Rule 4 covers `useEffectEvent` (experimental, React 19+) as the eventual built-in replacement for that same pattern — a stable function that always reads the latest props/state without needing a dependency entry — with an explicit caveat to verify availability and fall back to the ref pattern when it's not present. A decision flowchart ties the four rules together, and a `references/patterns.md` file holds the full walkthrough and extended examples.

## How To Use It

Triggers on: writing or reviewing `useEffect`, `useMemo`, `useCallback`, or `React.memo` code — especially "dependency arrays", "memoization", "callback stability", "stale closures", "stale state", or the "latest ref pattern".

```sh
skills add -g catesandrew/skills --skill skills/react-hooks-closures
```

```sh
npm install @catesworks/skill-react-hooks-closures
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- `react-hooks/exhaustive-deps` must be set to `error`, not `warn` — every value the closure reads belongs in the dependency array.
- A custom `React.memo` `areEqual` function that omits a callback prop from its comparison can leave that callback stale even though the linter has no way to flag it.
- The latest-ref pattern requires writing the ref inside `useLayoutEffect` (not `useEffect`) so the ref is current before any subsequent effect or event reads it.
- Excluding a value from a dependency array is only safe when it's read through a ref (or `useEffectEvent`) that's guaranteed current — never by simply omitting it and hoping.
- `useEffectEvent` is experimental (React 19+) — check availability before relying on it, and fall back to the latest-ref pattern otherwise.
- Use `useCallback` with correct deps for stable callbacks inside a component, but reach for the latest-ref pattern (or `useEffectEvent`) for consumer-facing custom hooks so callers aren't forced to memoize.

## Related Skills

- [react-component-patterns](/docs/skills/react-component-patterns) — companion React skill on component API/structure rather than hook correctness.
- [react-use-state](/docs/skills/react-use-state) — sibling skill from the same batch, covering state and reducer patterns.
- [react-ref-callbacks](/docs/skills/react-ref-callbacks) — sibling skill on ref-callback patterns, added in the same commit.

---

_Sourced from: skills/react-hooks-closures/SKILL.md, skills/react-hooks-closures/metadata.json, ~/.dotfiles git history (commit `ba8c22e4`)_
