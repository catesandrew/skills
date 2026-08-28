# ai-governance

Standardized AI attribution and session reporting for any AI coding agent. Produces commit trailers, PR session reports, and an `ai-assisted` label so teams can track AI usage, measure cost, and correlate AI-assisted code with review quality over time.

## What it does

| Event | Output |
|-------|--------|
| Session start | Silently tracks turns, corrections, dead ends, files read/modified |
| Commit | Appends `AI-Assisted-By` and `Co-Authored-By` trailers to the commit message |
| Pull request | Inserts an AI Session Report into the PR description and adds `ai-assisted` label |

## Commit trailer format

```
AI-Assisted-By: claude-code / Claude Sonnet 4.6
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

`Co-Authored-By` is recognized by GitHub and surfaces in contribution graphs. `AI-Assisted-By` is a custom trailer queryable via `git log --grep`.

## PR session report format

```markdown
## AI Session Report
- **Task**: Add retry with exponential backoff for DynamoDB batchWriteItem
- **Approach**: Read DynamoDbRepository, implemented backoff (100ms/200ms/400ms, max 3 retries), added Micrometer counter, wrote unit + integration tests
- **Turns**: 6
- **Course corrections**: 1 — switched from SLF4J logging to Micrometer counter
- **Dead ends**: 0
- **Files read / modified**: 5 read / 3 modified
- **Model**: Claude Sonnet 4.6
- **Estimated tokens**: ~12k in / ~6k out
- **Estimated cost**: ~$0.13
- **Outcome**: Complete with tests. Existing backoff config in application.properties was unused — now wired in.
```

## Supported tools

Claude Code, Codex CLI, Cursor, Windsurf, GitHub Copilot, Aider, Cline, Continue.dev, Gemini CLI, Zed AI, Amazon Q Developer.

See [rules/tool-configs.md](rules/tool-configs.md) for ready-to-paste configuration snippets for each tool.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Full skill instructions — session tracking, commit trailers, PR report template, capability matrix |
| `rules/tool-configs.md` | Per-tool configuration snippets (CLAUDE.md, AGENTS.md, .cursorrules, .windsurfrules, etc.) |
