---
title: Graph React Render Tree
description: Builds a readable Mermaid render tree for a Next.js or React page, grouping components by folder boundary, deduplicating nodes, annotating edges, and identifying leaf nodes to mock in tests.
---

# graph-react-render-tree

## Why It Exists

Like its sibling `graph-react-deps`, this skill originates from a Codex custom prompt — `home/.codex/prompts/nextjs-page-render-tree-graph.md` (50 lines) — converted into `agent-skills/graph-react-render-tree/SKILL.md` (104 lines) in the bulk commit `44d082a3` ("chore: add skills for prompts", 2026-04-17). The commit message gives no specific rationale, but the old prompt file's name and the fact that it was deleted in the same commit that added this skill's file confirms a direct migration. It was relocated (no content change) into `agent-skills/skills/graph-react-render-tree/` in `856e34fa`.

## What It Does

The skill takes the same core inputs as `graph-react-deps` (`${input:startFile}`, `${input:tsconfigFile}`, `${input:repoRoot}`, `${input:depthLimit}`, defaulting to 5) plus two extra ones — `${input:stopPackages}` and `${input:stopFolders}` — that let it treat folder substrings, not just import prefixes, as traversal terminals. It follows components that are directly rendered in JSX, returned from a local wrapper, or part of a compound pattern (`Foo.Bar`), and explicitly deduplicates: a component appearing in multiple places becomes one node with multiple incoming edges rather than being redrawn.

Where it diverges from `graph-react-deps` is presentation. Nodes are grouped into 3–5 labeled Mermaid subgraphs by folder boundary (the route segment, local feature folder(s), shared package(s)), and edges are annotated when the relationship isn't obvious — `--render-prop-->`, `--as-prop-->`, `--compound-->`, `--wrapper-->`. Stopped nodes are kept in the graph as labeled terminals rather than dropped. The deliverables go beyond the diagram itself: a fan-out list ranking components by how many direct children they render, a leaf/terminal-node list of design-system components (the ones worth mocking in unit tests), and the same unresolved-imports report as its sibling. The skill states outright that it trades completeness for readability — for exhaustive coverage, it defers back to `graph-react-deps` with a higher depth limit.

## How To Use It

Triggers on: "optimized, readable Mermaid render tree for a Next.js or React page", grouping by folder, deduplicating nodes, annotating render-prop and compound-component edges, identifying leaf nodes to mock in tests — used when `graph-react-deps`'s output is too large to navigate.

```sh
skills add -g catesandrew/skills --skill skills/graph-react-render-tree
```

```sh
npm install @catesworks/skill-graph-react-render-tree
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Aim for 3–5 subgraphs — more creates visual noise rather than clarity.
- Deduplication is mandatory: the same shared component appearing a dozen times must collapse to one node, not pollute the graph.
- Compound components (`Table.Row`, `Form.Field`, etc.) are easy to miss when only scanning literal JSX tags — they must be tracked explicitly.
- Subgraph names should describe the domain/feature, not just echo the folder path.
- For very large trees, consider splitting into two diagrams — one for server components, one for client — rather than cramming everything into one.
- This graph deliberately trades completeness for readability; if every component is needed, use `graph-react-deps` with a higher depth limit instead.

## Related Skills

- [graph-react-deps](/docs/skills/graph-react-deps) — the coverage-first sibling; this skill exists specifically to produce a more readable graph when that one's output is too large.
- [generate-angular-storybook](/docs/skills/generate-angular-storybook) — a sibling skill from the same migration batch (commit `44d082a3`).

---

_Sourced from: skills/graph-react-render-tree/SKILL.md, skills/graph-react-render-tree/metadata.json, ~/.dotfiles git history (commit `44d082a3`)_
