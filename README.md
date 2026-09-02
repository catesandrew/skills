# skills

Personal cross-agent skills for Claude Code, Codex, and other AI coding
agents. Skills follow the [Agent Skills](https://agentskills.io/) format and
are also published as a self-hosted Claude Code plugin marketplace (see
[Installation](#installation)).

This repo is the public, generic sibling of
[`next-starters`](https://github.com/catesandrew/next-starters)'s own
`skills/` plugin — that repo keeps the 25 skills tightly coupled to its
Next.js starter templates and stack conventions; this repo holds everything
stack-agnostic. Anything tied to a specific employer, client, or machine path
stays out of this repo by design (see [Scope](#scope) below).

Every skill below also has a deep-dive doc page — what it does, how to use
it, gotchas, and (where real history supports it) why it exists — in the
[`website/`](website/) Docusaurus site. Run it locally:

```sh
pnpm --filter website start
```

## Available Skills

### Browser automation & Chrome DevTools audit

| Skill | Description |
|-------|-------------|
| `agent-browser` | Navigate and interact with web pages — open URLs, click, fill forms, screenshot, scrape data |
| `chrome-inspect-element` | Deep DOM element inspection — computed styles, layout, a11y, outerHTML, screenshot |
| `chrome-inspect-a11y` | Live accessibility snapshot — roles, names, ARIA, contrast, keyboard focus |
| `chrome-audit-network` | Capture network activity — slow requests, payload sizes, initiator breakdown |
| `chrome-audit-bundles` | Identify heavy bundles and caching issues from resource timings |
| `chrome-audit-css` | CSS cascade audit — computed styles, matching rules, specificity conflicts |
| `chrome-audit-performance` | Client-side performance metrics — TTFB, FCP, LCP, heaviest resources |
| `chrome-audit-console` | Capture and categorize console errors/warnings during a repro window |
| `chrome-dump-storage` | Dump localStorage, sessionStorage, and cookie names (values redacted) |
| `chrome-run-flow` | Execute a sequence of UI interactions and screenshot the final state |
| `chrome-diff-screenshot` | Capture a screenshot for visual regression comparison against a baseline |
| `chrome-debug-screenshot` | Diagnose Chrome DevTools MCP screenshot failures — path, uid, frame, clip issues |

### Static code audit

| Skill | Description |
|-------|-------------|
| `audit-a11y-code` | Static accessibility review of components/templates against WCAG 2.1 AA |
| `audit-react-component` | React 18+/19 component audit — hooks, performance, memoization, controlled inputs |

### React, tables & state

| Skill | Description |
|-------|-------------|
| `react-component-patterns` | Better React component APIs — discriminated unions, composition, avoiding impossible states |
| `react-hooks-closures` | Correct React hooks code that avoids stale closures |
| `react-ref-callbacks` | Callback refs instead of `useRef` + `useEffect` for DOM node interactions |
| `react-use-state` | Correct `useState`/`useReducer` usage |
| `react-query-patterns` | Correct, performant TanStack Query v5 — keys, mutations, `select`, `queryOptions`, type safety |
| `react-query-cache-determinism` | Deterministic cache updates for CRUD mutations — deep-merge vs replace, optimistic status, invalidate-on-error-only |
| `nextjs-react-query-cache-coordination` | Next.js App Router ↔ React Query cache coordination — `updateTag` vs `revalidateTag`, hydration races, read-your-own-writes |
| `data-table-builder` | Typed URL-state data tables — nuqs, column factories, external cells, centralized reset |
| `tanstack-table-patterns` | Production TanStack Table v8 — meta pattern, editable cells, dynamic columns, virtualization |
| `excel-like-table-navigation` | Excel-like keyboard nav for tables — roving tabindex, cell registry, arrow/Tab/Enter/Esc, inline edit |
| `nuqs-url-state` | Type-safe URL state with nuqs — shareable filters, search, and pagination |
| `zustand-patterns` | Well-structured Zustand stores — selectors, actions, scoped stores over global singletons |
| `typescript-type-safety` | Safer TypeScript — index signatures, discriminated unions, exhaustive switches, `any` containment |

### Frontend workflow & generation

| Skill | Description |
|-------|-------------|
| `frontend-quality-loop` | Iteratively raise frontend code quality — a11y, performance, type-safety, patterns lenses, loop until clean |
| `design-critique-loop` | Screenshot self-critique loop — headless-browser vision review, complexity-upgrade rule, orchestrator/builder fan-out for N parallel builds |
| `frontend-scaffold` | Wire frontend plumbing (feature flags, env vars, API clients, logging) into an existing project's conventions |
| `ui-engineer` | Expert UI engineering persona — production-ready TypeScript/React/Vue/Angular, a11y, performance |
| `generate-angular-storybook` | Angular Storybook harness, CSF3 stories, and MDX docs for a component |

### Graphs & visualization

| Skill | Description |
|-------|-------------|
| `graph-react-deps` | Mermaid component dependency graph from a React/Next.js page entry point |
| `graph-react-render-tree` | Readable render tree with subgraphs, fan-out list, and leaf nodes for mocking |
| `dithered-motif-site` | Animated Bayer-dithered particle-field hero/background — prompt patterns + canvas dither engine |
| `scroll-video-site` | Full-bleed scroll-scrubbed video landing page — damped-playhead ScrollVideo engine, Lenis+GSAP, Auto Tour |
| `point-cloud-assembly-scene` | Three.js point-cloud scene assembling from dust — parametric shape sampling, shared-buffer multi-form architecture, fake curl-noise dust field |

### API & schemas

| Skill | Description |
|-------|-------------|
| `swagger` | Add or update Swagger/OpenAPI JSDoc on Next.js App Router route handlers, with optional combined TSDoc pass |
| `zod-repair` | Refactor staged Zod schemas safely; add focused regression tests for init cycles, map/record, union drift, parse breakage |
| `microservice-docs` | Generate comprehensive microservice documentation (C4, API contracts, OpenAPI, data models) via static analysis |

### Git, PR & governance workflow

| Skill | Description |
|-------|-------------|
| `commit-message` | Generate a conventional commit message from staged changes |
| `tsdoc` | Add expert-level inline TSDoc to staged TypeScript files |
| `pr-gh-open` | Open a GitHub PR from the active branch with structured description, linked ticket, reviewers, and labels |
| `pr-gh-code-review` | Review a GitHub pull request — correctness, security, performance, style via `gh` CLI |
| `pr-ado-open` | Open an Azure DevOps PR with structured description, linked work items, reviewers, and auto-complete policy |
| `pr-ado-code-review` | Review an Azure DevOps pull request — correctness, security, performance, style via `az repos` |
| `ai-governance` | Add AI attribution trailers on commit and generate session reports on PR creation |

### Planning, docs & meta

| Skill | Description |
|-------|-------------|
| `jira-estimate` | Estimate AI implementation time for a Jira ticket using weighted complexity scoring |
| `session-wrap` | Wrap a session into a dated dossier — resume pointer, summary, lessons, architecture, ADRs, follow-ups, sanitized blog post |
| `reflect-instructions` | Analyze and improve an agent instruction file based on observed failures |
| `spec-kit-skill` | GitHub Spec-Kit integration for constitution-based spec-driven development |
| `procfile-manager` | Manage multi-process dev stacks via Procfile (Overmind/foreman/hivemind) |

## Scope

This repo is **public**, so skills stay in it only if they're generic and
loosely coupled — no employer/client names, no internal tool or org URLs, no
absolute machine paths, no secrets. Anything that fails that bar (a specific
employer's Azure DevOps org and area-path conventions, a client's internal
design system, absolute `/Users/<name>/...` paths tied to one machine) stays
in a private dotfiles skills collection instead of being ported here.

## Installation

As a Claude Code plugin marketplace:

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Or via the [`skills`](https://www.npmjs.com/package/skills) CLI (Agent Skills
format, cross-agent):

```sh
skills add -g catesandrew/skills
```

## Adding a skill

1. Create `skills/<skill-name>/SKILL.md` with `name` and `description`
   frontmatter (`name` must be kebab-case and match the directory name;
   `description` should start with "Use when...").
2. Add the new skill's path to `.claude-plugin/marketplace.json`.
3. Keep `SKILL.md` under 500 lines — move heavy reference material to a
   `references/` directory.
4. No hardcoded org/client names, internal URLs, or absolute machine paths —
   parameterize with `${input:variableName}` instead.

See the [Agent Skills specification](https://agentskills.io/specification)
for the full format.
