---
name: ai-governance
description: Use when committing AI-assisted code or opening a pull request to add standardized AI attribution trailers, track session metrics, and generate a PR session report. Works with any AI coding agent.
---

# AI Governance

Track what AI did, how the developer prompted, and how efficient the session was. Produces commit trailers and PR session reports for auditability and ROI measurement.

## When to Invoke

- **On commit** (`governance:commit`) — add AI attribution trailers to the commit message
- **On PR creation** (`governance:pr`) — generate session report and add `ai-assisted` label
- **On session start** (`governance:start`) — silently begin tracking session metrics

Can also be invoked manually: "Add AI governance to this commit", "Generate a session report", "Track this AI session".

## Session Tracking (governance:start)

Silently track these metrics from the start of the conversation. Do not print tracking info during the session unless asked.

| Metric | How to measure |
|--------|---------------|
| Turn counter | Increment on each user ↔ agent exchange |
| Course corrections | User says "no", "not that", "instead do X", "wrong approach" |
| Dead ends | Agent tries an approach and backtracks, or user rejects it |
| Files read | Count of unique files read via tools |
| Files modified | Count of unique files written or edited |
| Model | Model name from environment or self-identification |
| Task summary | One-line description from the first substantive prompt |

## On Commit (governance:commit)

Append these trailers to every commit message (after the body, separated by a blank line):

```
AI-Assisted-By: <tool> / <model>
Co-Authored-By: <model> <noreply@provider.com>
```

**Tool identification:**

| Tool | Value |
|------|-------|
| Claude Code | `claude-code` |
| Codex CLI | `codex` |
| Cursor | `cursor` |
| Windsurf | `windsurf` |
| GitHub Copilot | `copilot` |
| Copilot Workspace | `copilot-workspace` |
| Aider | `aider` |
| Cline | `cline` |
| Continue.dev | `continue` |
| Gemini CLI | `gemini-cli` |
| Zed AI | `zed-ai` |
| Amazon Q Developer | `amazon-q` |
| Devin | `devin` |
| Other | `ai-assisted` |

**Provider email mapping:**

| Provider | Models | Email |
|----------|--------|-------|
| Anthropic | Claude | `noreply@anthropic.com` |
| OpenAI | GPT-4o, o1, o3 | `noreply@openai.com` |
| Google | Gemini, Gemma | `noreply@google.com` |
| Meta | Llama | `noreply@meta.com` |
| Mistral | Mistral, Codestral | `noreply@mistral.ai` |
| xAI | Grok | `noreply@x.ai` |
| Amazon | Nova, Titan | `noreply@amazon.com` |
| DeepSeek | DeepSeek | `noreply@deepseek.com` |
| Other | — | `noreply@ai-assisted.dev` |

**Example:**
```
feat(retry): add exponential backoff for DynamoDB batch writes

Unprocessed items re-queued with backoff (max 3 retries).

AI-Assisted-By: claude-code / Claude Sonnet 4.6
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## On PR Creation (governance:pr)

### Step 1: Generate Session Report

Include this section in the PR description using tracked session metrics:

```markdown
## AI Session Report
- **Task**: <one-line summary of what the developer asked for>
- **Approach**: <steps taken, key decisions, alternatives considered>
- **Turns**: <number of user ↔ agent exchanges>
- **Course corrections**: <count> — <brief description of each>
- **Dead ends**: <count> — <brief description of each>
- **Files read / modified**: <X> read / <Y> modified
- **Model**: <model name>
- **Estimated tokens**: ~<input>k in / ~<output>k out
- **Estimated cost**: ~$<amount>
- **Outcome**: <what was delivered, caveats, what's left>
```

**Cost estimation guide:**
- Claude Opus 4.6: ~$15/M input, ~$75/M output
- Claude Sonnet 4.6: ~$3/M input, ~$15/M output
- Claude Haiku 4.5: ~$0.80/M input, ~$4/M output
- GPT-4o: ~$2.50/M input, ~$10/M output
- o3: ~$10/M input, ~$40/M output
- Gemini 2.5 Pro: ~$1.25/M input, ~$10/M output
- Estimate tokens: ~800 tokens/turn input, ~400 tokens/turn output, +~1000 tokens per file read

### Step 2: Add Label

```bash
gh pr edit <number> --add-label "ai-assisted"
# If label doesn't exist:
gh label create "ai-assisted" --color "7057ff" --description "PR includes AI-assisted code"
```

## What Gets Measured

| Signal | Source | Purpose |
|--------|--------|---------|
| AI was used | `ai-assisted` label | Filter AI vs non-AI PRs |
| Which tool & model | `AI-Assisted-By` trailer | Cost analysis, model comparison |
| Prompting efficiency | Turns, corrections, dead ends | Developer skill over time |
| Scope discipline | Files read vs modified ratio | Was the AI focused or wandering? |
| Cost per PR | Session report | ROI tracking |
| Code review rounds | Review count on `ai-assisted` PRs | Does AI code need more review? |

## Cross-Tool Reference

### Capability Matrix

| Tool | Commit trailers | PR report | Session tracking | Auto-invoke via rules |
|------|:-:|:-:|:-:|:-:|
| Claude Code | ✓ | ✓ | ✓ | ✓ (CLAUDE.md) |
| Codex CLI | ✓ | ✓ | ✓ | ✓ (AGENTS.md) |
| Cursor | ✓ | ✓ | ✓ | ✓ (.cursor/rules/) |
| Windsurf | ✓ | ✓ | ✓ | ✓ (.windsurfrules) |
| GitHub Copilot | ✓ | ✓ | limited | ✓ (copilot-instructions.md) |
| Aider | ✓ | manual | limited | ✓ (CONVENTIONS.md) |
| Cline | ✓ | ✓ | ✓ | ✓ (.clinerules) |
| Continue.dev | ✓ | manual | limited | ✓ (.continue/config.json) |
| Gemini CLI | ✓ | ✓ | ✓ | ✓ (GEMINI.md) |
| Zed AI | ✓ | manual | limited | partial |
| Amazon Q | ✓ | manual | limited | partial |

### Configuration Snippets

See [rules/tool-configs.md](rules/tool-configs.md) for the exact configuration block to add to each tool's instruction file. The snippets are ready to paste — just replace `<model>` and `<provider>` with actual values.

**Quick reference — which file to edit per tool:**

| Tool | Instruction file |
|------|-----------------|
| Claude Code | `CLAUDE.md` (global: `~/.claude/CLAUDE.md`) |
| Codex CLI | `AGENTS.md` or `~/.codex/instructions/` |
| Cursor | `.cursor/rules/ai-governance.mdc` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Aider | `CONVENTIONS.md` or `.aider.conf.yml` |
| Cline | `.clinerules` |
| Continue.dev | `.continue/config.json` (systemMessage) |
| Gemini CLI | `GEMINI.md` |
| Zed AI | `.zed/settings.json` (default_prompt) |

## Downstream Uses

Once the `ai-assisted` label and `AI-Assisted-By` trailers are in place, teams can build:

- **Cost dashboards** — sum estimated cost from session reports per sprint
- **Model comparison** — query `git log --grep="AI-Assisted-By"` and compare PR review rounds by model
- **Developer velocity** — compare turn counts and corrections across team members over time
- **Quality correlation** — correlate `ai-assisted` label with PR review round count or post-merge bug rate
- **Audit trail** — `git log --format="%H %s %b" | grep "AI-Assisted-By"` surfaces all AI-touched commits

## Common Mistakes

- **Forgetting to start tracking** — Session metrics must be tracked from turn 1. Reconstructing them at PR time produces inaccurate counts.
- **Understating course corrections** — A course correction is any time the user redirected the approach. Count them honestly; the number reveals prompting quality over time.
- **Skipping the label** — The `ai-assisted` label is the lightweight signal that powers all downstream queries. Always add it.
- **Generic task summaries** — "Fixed a bug" is not useful. Be specific: "Add retry with exponential backoff for DynamoDB batchWriteItem unprocessed items."
- **Stale cost estimates** — Model pricing changes frequently. Verify estimates against current provider pricing before reporting to stakeholders.
