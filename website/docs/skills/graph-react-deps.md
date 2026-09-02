---
title: Graph React Deps
description: Builds a directed Mermaid component dependency graph for a Next.js or React page by recursively tracing JSX usage, render props, and compound components, prioritizing coverage over readability.
---

# graph-react-deps

## Why It Exists

This skill traces back to a Codex custom prompt named `home/.codex/prompts/nextjs-page-react-dependency-graph.md` (42 lines), converted into `agent-skills/graph-react-deps/SKILL.md` (66 lines) in the same bulk commit `44d082a3` ("chore: add skills for prompts", 2026-04-17) that also produced `generate-angular-storybook` and `graph-react-render-tree` from their own respective `.codex/prompts/*.md` originals. The old prompt name — "nextjs-page-react-dependency-graph" — makes the intent clear even though the commit message itself carries no distinguishing detail: this was purpose-built for tracing a Next.js/React page's component tree, later generalized and renamed to `graph-react-deps` as it became a skill. It was relocated (no content change) into `agent-skills/skills/graph-react-deps/` in `856e34fa`.

## What It Does

Given a page entry file (`${input:startFile}`) and a tsconfig path (`${input:tsconfigFile}`, for resolving `@/...` aliases), the skill parses the file, resolves both relative imports and TypeScript path aliases, and identifies React components — JSX tags in the returned tree, components passed as render props (`as`, `component`), and re-exported components. It then recursively traverses into each local component file up to `${input:depthLimit}` (default 4), stopping at anything matching `${input:stopPackages}`, `node_modules`, framework internals (`next/*`, `react/*`, `react-dom/*`), the depth limit, or type-only imports. Barrel files (`index.ts`) are resolved through to their actual definition file, and primitive HTML tags are ignored entirely.

The output is a Mermaid `flowchart TD` where each node is labeled by PascalCase component name (or filename if unnamed), with a legend explaining conventions used and a list of any unresolved imports (missing files, opaque barrels, external packages not in the stoplist). A component used in multiple places still collapses to a single graph node. This skill explicitly trades readability for completeness — it is described as "fast mode," prioritizing coverage — and hands off to its sibling `graph-react-render-tree` when the resulting graph is too large to navigate.

## How To Use It

Triggers on: "Mermaid component dependency graph for a Next.js or React page", tracing JSX usage/render props/compound components recursively from a page entry point.

```sh
skills add -g catesandrew/skills --skill skills/graph-react-deps
```

```sh
npm install @catesworks/skill-graph-react-deps
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Without `${input:tsconfigFile}`, relative imports still resolve fine but `@/components/…`-style aliases will fail.
- A depth of 6+ generates unwieldy graphs — start at 3–4 and increase only if needed.
- Design-system packages should be added to `${input:stopPackages}`, or the graph balloons with framework-internal noise instead of staying focused on app-layer components.
- Path aliases with a `/*` suffix in `compilerOptions.paths` must have the suffix stripped before prefix matching.
- In monorepos, workspace package imports resolve relative to `${input:repoRoot}` when provided.

## Related Skills

- [graph-react-render-tree](/docs/skills/graph-react-render-tree) — the readability-optimized counterpart; use it when this skill's coverage-first graph is too large to navigate.
- [generate-angular-storybook](/docs/skills/generate-angular-storybook) — a sibling skill from the same migration batch (commit `44d082a3`).

---

_Sourced from: skills/graph-react-deps/SKILL.md, skills/graph-react-deps/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
