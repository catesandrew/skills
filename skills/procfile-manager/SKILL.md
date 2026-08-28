---
name: procfile-manager
description: Manage multi-process dev stacks via Procfile. Detects Procfile in the project, parses process names, and routes start/stop/restart/logs through the appropriate runner (Overmind, foreman, hivemind). Use when starting services, checking logs, restarting processes, or managing the local dev stack.
---

# procfile-manager

Operate local multi-process development stacks defined in a Procfile. Automatically detects the Procfile, parses available processes, selects the best runner, and provides process lifecycle management and log inspection.

## When to Use

- User asks to start, stop, restart, or kill local services
- User asks to check, tail, or inspect logs from a running process
- User asks to connect to or interact with a running process
- User wants to see what processes are defined in the Procfile
- User mentions Overmind, foreman, hivemind, or Procfile
- User asks to run the local dev stack or app stack
- A CLAUDE.md or AGENTS.md references a Procfile-based workflow

## Workflow

### 1. Discover the Procfile

Search for a Procfile in the project root and any parent directories up to the git root:

```
Procfile
Procfile.dev
Procfile.local
```

If no Procfile is found, stop and tell the user. Do not invent processes.

### 2. Parse Processes

Read the Procfile and extract every process entry (lines matching `name: command`). Ignore comments and blank lines. Build a process map:

| Field | Source |
|-------|--------|
| Name | Left side of `:` |
| Command | Right side of `:` (trimmed) |
| Working directory | Extracted from leading `cd <dir> &&` if present |
| Port | Extracted from `--port N` or `PORT=N` if present |

Report the discovered processes to the user before acting.

### 3. Select a Runner

Check which Procfile runners are installed, in preference order:

1. **Overmind** (`overmind -v`) — preferred; supports per-process control, log streaming, connect, restart
2. **Hivemind** (`hivemind --version`) — lightweight alternative; start-only, no per-process control
3. **Foreman** (`foreman version`) — Ruby-based; supports process selection via `-m`

Use the first available runner. If none are installed, recommend installing Overmind and stop.

### 4. Execute the Requested Operation

Route the user's intent to the appropriate runner command. All examples below use Overmind; adapt syntax if using an alternate runner.

**Start the full stack:**
```sh
overmind start -f Procfile
```

**Start specific processes only:**
```sh
overmind start -f Procfile -l temporal,worker,web
```

**Restart a single process:**
```sh
overmind restart web
```

**Stop a single process:**
```sh
overmind stop worker
```

**Kill the entire stack:**
```sh
overmind kill
```

**Inspect logs for a process:**
```sh
overmind echo worker
```

**Connect to a process (interactive):**
```sh
overmind connect web
```

### 5. Verify

After starting or restarting, confirm the process is running:

```sh
overmind ps
```

If a process fails to start, inspect its logs with `overmind echo <name>` before retrying.

## Runner Command Reference

| Operation | Overmind | Foreman | Hivemind |
|-----------|----------|---------|----------|
| Start all | `overmind start -f Procfile` | `foreman start -f Procfile` | `hivemind Procfile` |
| Start subset | `overmind start -f Procfile -l a,b` | `foreman start -f Procfile -m a=1,b=1` | `hivemind a b` |
| Stop one | `overmind stop <name>` | N/A | N/A |
| Restart one | `overmind restart <name>` | N/A | N/A |
| Kill all | `overmind kill` | Ctrl-C | Ctrl-C |
| Logs | `overmind echo <name>` | (interleaved stdout) | (interleaved stdout) |
| Connect | `overmind connect <name>` | N/A | N/A |
| Status | `overmind ps` | N/A | N/A |

## Constraints

- Never start a process by running its raw command from the Procfile directly. Always use the runner. The Procfile is the source of truth for how processes are configured; the runner is how they are operated.
- Never guess process names. Parse them from the actual Procfile.
- If the Procfile path is non-standard (e.g., `Procfile.dev`), pass it explicitly via `-f`.
- When starting a subset, only include processes the user asked for. Do not silently add extras.
- If a process is already running, do not start a duplicate. Use `restart` instead.
- If Overmind is available, always prefer it over foreman or hivemind for per-process operations.

## Common Mistakes

- **Running `yarn dev` or `npm start` when a Procfile target exists.** The Procfile defines the canonical process configuration (env vars, flags, ports). Running the underlying script directly skips that configuration.
- **Killing the whole stack to restart one process.** Use `overmind restart <name>` instead of `overmind kill` followed by `overmind start`.
- **Rerunning a script to see its output.** Use `overmind echo <name>` to read logs from an already-running process instead of stopping and restarting it.
- **Starting Overmind in the background.** Overmind manages its own process tree. Do not `&` or `nohup` it — run it in a dedicated terminal or tmux pane.
- **Forgetting to check `overmind ps` after start.** A successful `overmind start` does not guarantee every process booted cleanly. Always verify.
