---
title: Audit React Component
description: Reviews a React component for hooks correctness, render performance, memoization, controlled vs. uncontrolled inputs, props stability, and React 18/19 compatibility, with test suggestions.
---

# audit-react-component

## Why It Exists

`audit-react-component` traces to the same conversion commit as `audit-a11y-code`: `44d082a3` ("chore: add skills for prompts"), which turned a batch of Codex CLI custom prompts into portable Agent Skills. The commit deleted `home/.codex/prompts/react19-component-audit.prompt.md` while adding `agent-skills/audit-react-component/SKILL.md` — the name match (`react19-component-audit` → the skill's explicit "React 19 compatibility" section) is a direct, confident lineage. It was relocated to `agent-skills/skills/audit-react-component/` in `856e34fa`, migrated to the external `cw` marketplace in `df4241d4`, and reached this public repo via the bulk `13fbfbc` import.

## What It Does

This is a rigorous, checklist-driven code review for a React component (React 18+/19 compatible), organized as nine review passes. It starts by summarizing the component's intent, then walks the Rules of Hooks (top-level calls only, consistent order, `use`-prefixed custom hooks, correct `useEffect` vs `useLayoutEffect` choice), state/effects correctness (missing vs. over-broad vs. unnecessary dependency-array entries, and a specific cleanup checklist for `setInterval`/`setTimeout`, event listeners, subscriptions, and `AbortController`), and rendering/performance (what triggers a re-render, candidates for `useMemo`/`useCallback`, cascading state updates, layout thrashing from unbatched DOM reads/writes).

It then checks memoization correctness (whether `React.memo` is actually effective given prop referential stability, whether `useMemo`/`useCallback` are justified rather than premature), controlled-vs-uncontrolled input discipline (no switching between the two across renders, correct use of `key` to reset uncontrolled state), and props/API surface health (necessity, referential stability at the call site, prop-drilling past three components). A dedicated section covers React 18/19-specific behavior: Strict Mode double-invocation of effects in development, the `use` hook's top-level/Suspense-boundary requirement, Server Component constraints (no hooks, no browser APIs, no event handlers), and `useTransition`/`startTransition` usage for expensive updates.

Output follows a fixed structure — a one-paragraph summary with top-3 risks, then dedicated "🧠 Hooks & Effects", "⚡ Performance & Renders", "🎛 Controlled vs Uncontrolled", "🧩 Props & API", "🔄 React 18+/19 Compatibility", "🧪 Tests to add", and "🔧 Suggested fixes" sections, with fixes ordered by impact and file:line references throughout. It also names concrete test techniques (`renderHook`, mocked timers to verify cleanup fires, a render-count ref/`vi.fn()` to prove memoization actually works).

## How To Use It

Triggers on: "a thorough review of a React component for hooks correctness, render performance, memoization, controlled vs uncontrolled inputs, and React 19 compatibility".

```sh
skills add -g catesandrew/skills --skill skills/audit-react-component
```

```sh
npm install @catesworks/skill-audit-react-component
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Hooks must be called only at the top level, in consistent order across renders — conditionals, loops, and nested functions are hard violations.
- An empty dependency array (`[]`) with a value from state/props actually used inside the effect is flagged as a stale-closure bug, not accepted at face value.
- Object/array literals in a dependency array (e.g. `[{ id }]`) are called out as causing the effect to re-run every render — the fix is to depend on the primitive (`[id]`).
- A component must not switch between controlled and uncontrolled across renders — this is flagged as producing a React warning and undefined behavior, not just a style nit.
- `React.memo` wrapping is flagged as pointless when the parent always creates new object/function prop references — the review checks referential stability, not just presence of `memo`.
- Server Components must show zero hooks, browser APIs, or event handlers when that context applies.

## Related Skills

- [audit-a11y-code](/docs/skills/audit-a11y-code) — same "audit" family and same origin commit (`44d082a3`), covering accessibility instead of React internals.
- [chrome-audit-console](/docs/skills/chrome-audit-console) — complements this static review with live console capture that surfaces the same class of React warnings (missing keys, unmounted-component updates) at runtime.

---

_Sourced from: skills/audit-react-component/SKILL.md, skills/audit-react-component/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
