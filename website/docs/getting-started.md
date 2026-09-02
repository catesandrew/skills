---
sidebar_position: 1
---

# Getting Started

This repo is a personal, cross-agent collection of [Agent Skills](https://agentskills.io/) — reusable playbooks for Claude Code, Codex, and other AI coding agents. It's the public, generic sibling of [`next-starters`](https://github.com/catesandrew/next-starters)'s own `skills/` plugin: that repo keeps its skills tightly coupled to Next.js starter templates and stack conventions; this repo holds everything stack-agnostic — Chrome DevTools audits, React/TanStack patterns, git/PR workflow, generative frontend builds, and general planning/meta skills.

## Prerequisites

- **Claude Code** (for the plugin-marketplace install path) or the [`skills`](https://www.npmjs.com/package/skills) CLI (for the cross-agent, Agent-Skills-format path).
- **Node.js >= 20** and **pnpm** — only needed if you're developing in this repo (running the doc generator, the release pipeline, or this docs site) rather than just installing a skill.
- **git** — for cloning or symlinking skills locally.

## Installing skills

Three independent install channels — pick whichever fits your workflow. See [Installing via the Claude Code plugin marketplace](./installing-plugin.md) for the full walkthrough of the first one.

### 1. Claude Code plugin marketplace (all 52 at once)

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

Every skill becomes available namespaced under the plugin name — e.g. the `commit-message` skill becomes `/cw:commit-message`.

### 2. The `skills` CLI (cross-agent, Agent Skills format)

```sh
# every skill in the repo
skills add -g catesandrew/skills

# a single skill
skills add -g catesandrew/skills --skill skills/commit-message
```

This works for any agent that reads the Agent Skills format, not just Claude Code.

### 3. npm package (a single skill, pinned to a version)

Every skill also publishes as its own scoped npm package:

```sh
npm install @catesworks/skill-commit-message
```

## What's here

- **[Skill Catalog](./skills-catalog.md)** — all 52 skills, auto-generated with a one-liner, use case, and install command for each, plus a deep-dive page per skill.
- **[Architecture](./architecture.md)** — how the repo is organized: `skills/` (source of truth), `packages/` (generated npm packages), the release pipeline, and the scope rule that keeps this repo public-safe.

## Contributing a skill

1. Create `skills/<skill-name>/SKILL.md` with `name` and `description` frontmatter (`name` must be kebab-case and match the directory name; `description` should start with "Use when...").
2. Add the new skill's path to `.claude-plugin/marketplace.json`.
3. Keep `SKILL.md` under 500 lines — move heavy reference material to a `references/` directory.
4. No hardcoded org/client names, internal URLs, or absolute machine paths — parameterize with `${input:variableName}` instead.

See the [Agent Skills specification](https://agentskills.io/specification) for the full format, and this repo's `README.md` for the "Scope" rule on what's allowed to live here versus a private dotfiles collection.
