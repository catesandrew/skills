---
sidebar_position: 2
---

# Installing via the Claude Code plugin marketplace

This repo hosts its own [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces) directly (`.claude-plugin/marketplace.json`) — no separate registry, no publishing step beyond pushing to `main`. It bundles all 52 skills into a single installable plugin named `cw`.

This is the fastest way to get every skill at once inside Claude Code, and it updates in one command whenever new skills ship.

## Prerequisites

- A recent Claude Code build with plugin support.
- These are slash commands run **inside an interactive Claude Code session** (the terminal REPL). The CLI equivalents below work in non-interactive scripts; see [Non-interactive / cloud sessions](#non-interactive--cloud-sessions) if `/plugin` isn't available in your environment.

## Add the marketplace

```
/plugin marketplace add catesandrew/skills
```

GitHub `owner/repo` shorthand works directly — no need for the full clone URL. A full `https://github.com/catesandrew/skills.git` URL or `git@github.com:catesandrew/skills.git` SSH form also work if you prefer being explicit.

This registers the catalog — it doesn't install anything yet.

## Verify it's there

```
/plugin
```

Open the **Discover** tab to browse what the marketplace offers, or list every marketplace you've added:

```
/plugin marketplace list
```

## Install the plugin

```
/plugin install cw@skills
```

The part after `@` is the marketplace's registered name (the `name` field in `marketplace.json`, currently `skills`) — not the GitHub `owner/repo` you passed to `add`. This opens a scope-selection dialog:

- **User scope** — installed for you, across every project.
- **Project scope** — installed for every collaborator on the current repo (adds it to that repo's `.claude/settings.json`).
- **Local scope** — installed for you, in the current repo only, not shared with collaborators.

If the install summary says `Run /reload-plugins to activate.`, run that command.

Once installed, every skill is available and namespaced under the plugin name — e.g. the `commit-message` skill becomes `/cw:commit-message`.

## Update later

New skills or fixes land on `main` regularly (see the [Skills Catalog](./skills-catalog.md) for what's currently published). Pull in the latest without reinstalling:

```
/plugin marketplace update skills
```

Use the marketplace's registered name here too, not the original `catesandrew/skills` source — check `/plugin marketplace list` if you're not sure what it's registered as.

## Non-interactive / cloud sessions

If `/plugin` isn't available (non-interactive shells, some cloud/CI sessions), use the CLI form instead:

```sh
claude plugin marketplace add catesandrew/skills
claude plugin marketplace update skills
```

Or declare the plugin directly under [`enabledPlugins`](https://code.claude.com/docs/en/settings#enabledplugins) in `.claude/settings.json` so it's active without any interactive step.

## Other install channels

The plugin marketplace isn't the only way in — see [Getting Started](./getting-started.md#installing-skills) for the `skills` CLI and npm-package alternatives if you only want a single skill rather than all 52.
