# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in
this repository.

## Repository Overview

A public, personal collection of cross-agent skills, published both as an
[Agent Skills](https://agentskills.io/) library (installable via the
[`skills`](https://www.npmjs.com/package/skills) CLI) and as a self-hosted
Claude Code plugin marketplace (`.claude-plugin/marketplace.json`).

This is the public sibling of
[`next-starters`](https://github.com/catesandrew/next-starters)'s own
`skills/` plugin: that repo keeps skills coupled to its Next.js starter
templates; this repo holds everything stack-agnostic.

## Directory Structure

```
skills/                       # this repo
  README.md                   # human-readable overview
  AGENTS.md                   # this file
  LICENSE
  .claude-plugin/
    marketplace.json          # plugin manifest listing every skill path
  skills/
    {skill-name}/              # kebab-case, matches the `name` field in SKILL.md
      SKILL.md                 # required: frontmatter (name, description) + instructions
      README.md                # optional: human-readable docs
      metadata.json             # optional: version, author, abstract, references
      references/ or rules/     # optional: supplementary reference material
```

## Creating or Editing a Skill

1. `SKILL.md` frontmatter must have `name` (kebab-case, matches directory)
   and `description` (starts with "Use when...", states triggering
   conditions, not the workflow).
2. Keep `SKILL.md` under 500 lines. Move heavy reference material to a
   `references/` directory.
3. Variables use `${input:variableName:default}` syntax for user-provided
   inputs.
4. Add the new skill's path to `.claude-plugin/marketplace.json`'s `skills`
   array, and to the appropriate table in `README.md`.
5. If installed via the `skills` CLI, re-run `skills add -g catesandrew/skills`
   after changes to update the local installation.

## Skill Quality Bar

- Descriptions are third-person, start with "Use when...", and describe
  triggering conditions only (not the workflow).
- No hardcoded employer/client names, internal org URLs, or absolute machine
  paths (`/Users/<name>/...`) — this repo is public. Parameterize with
  `${input:...}` instead, or keep the skill in a private collection.
- Each skill has a "Common Mistakes" section where applicable.
- Chrome DevTools skills note they require the Chrome DevTools MCP server.
