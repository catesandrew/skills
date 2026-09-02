---
title: Procfile Manager
description: Manages multi-process local development stacks defined in a Procfile by discovering the Procfile, parsing its processes, selecting the best available runner (Overmind, hivemind, or foreman), and routing operations through it.
---

# procfile-manager

## Why It Exists

This skill was added in a single, self-contained dotfiles commit, `573ccc5a` ("chore: add procfile manager skill"), which added only `agent-skills/skills/procfile-manager/SKILL.md` (134 lines) with no other files touched and no further history — it hasn't been revisited since. There's no distinguishing narrative beyond that: it's a straightforward, one-shot addition of a workflow the author clearly used often (Overmind-based multi-process dev stacks), not a port or generalization of something else.

## What It Does

The skill operates local multi-process dev stacks defined in a `Procfile` through a five-step workflow. First it discovers the Procfile by searching the project root and parent directories up to the git root for `Procfile`, `Procfile.dev`, or `Procfile.local` — if none is found, it stops and tells the user rather than inventing processes. Second, it parses every `name: command` entry into a process map (name, command, working directory extracted from a leading `cd <dir> &&`, and port extracted from `--port N` or `PORT=N`), reporting the discovered processes back to the user before acting.

Third, it selects a runner in strict preference order: Overmind (full per-process control, log streaming, connect, restart) first, then Hivemind (lightweight, start-only), then Foreman (Ruby-based, supports `-m` process selection) — using whichever is installed, and recommending Overmind installation if none are present. Fourth, it routes the user's actual request (start, start-subset, restart-one, stop-one, kill-all, inspect-logs, connect) to the matching runner command, with a full command-reference table mapping each operation across all three runners. Fifth, it verifies the result with `overmind ps` after any start/restart, and directs to `overmind echo <name>` to inspect logs if a process fails rather than blindly retrying.

## How To Use It

Triggers on: "start/stop/restart/kill local services", "check/tail/inspect logs from a running process", "connect to or interact with a running process", "what processes are defined in the Procfile", mentions of "Overmind", "foreman", "hivemind", or "Procfile", "run the local dev stack", or a CLAUDE.md/AGENTS.md referencing a Procfile-based workflow.

```sh
skills add -g catesandrew/skills --skill skills/procfile-manager
```

```sh
npm install @catesworks/skill-procfile-manager
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Never start a process by running its raw command from the Procfile directly — always go through the runner, since the runner is how processes are actually operated (env vars, flags, ports).
- Never guess process names — parse them from the actual Procfile contents.
- If the Procfile path is non-standard (e.g. `Procfile.dev`), pass it explicitly via `-f`.
- When starting a subset, include only the processes the user asked for — never silently add extras.
- If a process is already running, use `restart` instead of starting a duplicate.
- Prefer Overmind over foreman or hivemind whenever it's available, for per-process control.
- Don't kill the whole stack to restart one process — use `overmind restart <name>`.
- Don't background Overmind with `&` or `nohup` — it manages its own process tree and needs a dedicated terminal/tmux pane.
- Always verify with `overmind ps` after start — a successful `start` doesn't guarantee every process booted cleanly.

---

_Sourced from: skills/procfile-manager/SKILL.md, skills/procfile-manager/metadata.json, ~/.dotfiles git history (commit `573ccc5a`)_
