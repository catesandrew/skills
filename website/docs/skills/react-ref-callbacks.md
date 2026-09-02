---
title: React Ref Callbacks
description: Guides using callback refs instead of useRef plus useEffect for DOM node interactions such as focusing, scrolling, measuring, or observing nodes, including React 19 ref cleanup functions and ResizeObserver usage.
---

# react-ref-callbacks

## Why It Exists

Traced to dotfiles commit `ba8c22e4` ("chore: add react skills", 2026-04-30), which added this skill together with `react-use-state` and `react-hooks-closures` in a single 604-line, three-skill drop — the commit message itself carries no distinguishing detail beyond "add react skills." A pickaxe search for the literal string `react-ref-callbacks` across `agent-skills/` in `~/.dotfiles` turns up only this commit, the later `initial public dotfiles` squash point, and the `df4241d4` migration-out commit that eventually removed the local copy from dotfiles in favor of the external `catesandrew/skills` marketplace — no dedicated commit exists for this skill alone.

## What It Does

The skill is a focused guide steering React code away from the common `useRef` + `useEffect` pattern for DOM-node side effects and toward callback refs. It opens by showing the concrete failure mode: an effect that reads `ref.current` on mount is bound to the *parent's* lifecycle, so if the target node is conditionally rendered, `ref.current` is still `null` when the effect fires. A callback ref instead runs exactly when React attaches the node, sidestepping that class of bug entirely.

From there it lays out a stability rule that's easy to get backwards: for one-time operations, extract the callback-ref function outside the component rather than wrapping it in `useCallback`, because `useCallback` implies "this is a performance optimization" (which the React Compiler assumes too), while an unmemoized inline callback ref that does something idempotent — like `setState` with the same primitive value, which bails out of re-rendering — is perfectly fine to leave inline. It calls out one specific trap: storing a full `DOMRect` object in state from a measurement ref causes infinite re-renders, so only primitives should be extracted.

The last major section covers React 19's addition of cleanup functions returned from callback refs (mirroring effect cleanup), demonstrated with a `ResizeObserver` example, and notes the semantic shift that once a cleanup is returned, React stops calling the ref with `null` on unmount. It closes with a compact decision table mapping scenario → recommended pattern (callback ref vs. `useEffect` vs. neither, for cases like async data fetching).

## How To Use It

Triggers on: writing code that needs to focus, scroll, measure, or observe DOM nodes after render, especially with conditionally rendered elements; reviewing `useRef` + `useEffect` DOM-interaction code; React 19 ref cleanup functions; `ResizeObserver` wired through a ref; deciding whether to prefer a ref callback over `useEffect`.

```sh
skills add -g catesandrew/skills --skill skills/react-ref-callbacks
```

```sh
npm install @catesworks/skill-react-ref-callbacks
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- A callback ref runs on the node's own lifecycle, not the parent's — this is the entire reason to prefer it over `useRef` + `useEffect` for conditionally rendered elements.
- Don't wrap a one-time-operation callback ref in `useCallback` — extract the function outside the component instead; `useCallback` implies a stability guarantee that doesn't apply here and conflicts with the React Compiler's assumptions about what `useCallback` means.
- Inline callback refs are safe only when repeated execution is harmless (e.g. a `setState` call with an unchanged primitive that bails out of re-rendering).
- Never store a full `DOMRect` (or other new object) in state from a measurement ref — extract primitive values only, or you get infinite re-renders.
- In React 19+, once a callback ref returns a cleanup function, React no longer calls the ref with `null` on unmount — the cleanup replaces that call.
- Async operations (e.g. data fetching) belong to neither `useEffect` nor callback refs — use a data-fetching library.

## Related Skills

- [react-use-state](/docs/skills/react-use-state) — added in the same dotfiles commit (`ba8c22e4`), covering the other half of common React state pitfalls.
- [react-hooks-closures](/docs/skills/react-hooks-closures) — the third skill added alongside this one in `ba8c22e4`, covering stale-closure pitfalls in hooks.

---

_Sourced from: skills/react-ref-callbacks/SKILL.md, skills/react-ref-callbacks/metadata.json, ~/.dotfiles git history (commit `ba8c22e4`)_
