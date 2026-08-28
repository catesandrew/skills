# AI Governance — Per-Tool Configuration Snippets

Paste the relevant block into your tool's instruction file. Replace `<model>` and `<provider-email>` with actual values (e.g. `Claude Sonnet 4.6` and `noreply@anthropic.com`).

---

## Claude Code — `CLAUDE.md` or `~/.claude/CLAUDE.md`

```markdown
## AI Governance

### Commit Trailers
Every AI-assisted commit MUST include these trailers after the commit body:

```
AI-Assisted-By: claude-code / <model>
Co-Authored-By: <model> <provider-email>
```

### Session Tracking
From the first user message, silently track: turn count, course corrections, dead ends, files read, files modified.

### Pull Requests
Include an AI Session Report section in every PR description:
- Task, Approach, Turns, Course corrections, Dead ends, Files read/modified, Model, Estimated tokens/cost, Outcome

After PR creation, run: `gh pr edit <number> --add-label "ai-assisted"`
Create the label if missing: `gh label create "ai-assisted" --color "7057ff" --description "PR includes AI-assisted code"`
```

---

## Codex CLI — `AGENTS.md` or `~/.codex/instructions/ai-governance.md`

```markdown
## AI Governance

### Commit Trailers
Append to every commit message body:

```
AI-Assisted-By: codex / <model>
Co-Authored-By: <model> <provider-email>
```

### Pull Requests
Add an AI Session Report to every PR description with: Task, Approach, Turns, Course corrections,
Dead ends, Files read/modified, Model, Estimated tokens/cost, Outcome.

After PR creation: `gh pr edit <number> --add-label "ai-assisted"`
```

---

## Cursor — `.cursor/rules/ai-governance.mdc`

```markdown
---
description: AI governance — commit trailers and PR session reports
globs: ["**/*"]
alwaysApply: true
---

## AI Governance

Every commit you make MUST include these trailers after the commit body:

```
AI-Assisted-By: cursor / <model>
Co-Authored-By: <model> <provider-email>
```

When creating a pull request, include an ## AI Session Report section:
- **Task**: one-line summary
- **Turns**: count
- **Course corrections**: count + descriptions
- **Dead ends**: count + descriptions
- **Files read / modified**: X / Y
- **Model**: <model>
- **Estimated cost**: ~$X

After PR creation: `gh pr edit <number> --add-label "ai-assisted"`
```

---

## Windsurf — `.windsurfrules`

```markdown
## AI Governance

### Commit Trailers
Every commit MUST end with:

AI-Assisted-By: windsurf / <model>
Co-Authored-By: <model> <provider-email>

### Pull Requests
Include an AI Session Report in every PR description covering: Task, Approach, Turns,
Course corrections, Dead ends, Files read/modified, Model, Estimated cost, Outcome.

After PR creation: gh pr edit <number> --add-label "ai-assisted"
```

---

## GitHub Copilot — `.github/copilot-instructions.md`

```markdown
## AI Governance

Every AI-assisted commit must include these trailers after the commit message body:

```
AI-Assisted-By: copilot / <model>
Co-Authored-By: <model> <provider-email>
```

Every AI-assisted PR must include an ## AI Session Report section with:
Task, Turns, Course corrections, Dead ends, Files read/modified, Model, Estimated cost, Outcome.

After PR creation, add the label: gh pr edit <number> --add-label "ai-assisted"
```

---

## Aider — `CONVENTIONS.md` (referenced via `--read`)

```markdown
## AI Governance

### Commit Trailers
Add to every commit message after the body:

```
AI-Assisted-By: aider / <model>
Co-Authored-By: <model> <provider-email>
```

### Pull Requests
When creating a PR, include an AI Session Report with:
Task, Approach, Turns, Course corrections, Dead ends, Files read/modified, Model, Estimated cost.

After PR creation: gh pr edit <number> --add-label "ai-assisted"
```

Alternatively, add to `.aider.conf.yml`:
```yaml
read: [CONVENTIONS.md]
```

---

## Cline — `.clinerules`

```markdown
## AI Governance

### Commit Trailers
Every commit MUST include after the body:

AI-Assisted-By: cline / <model>
Co-Authored-By: <model> <provider-email>

### Pull Requests
Include an AI Session Report in every PR:
Task | Turns | Course corrections | Dead ends | Files read/modified | Model | Estimated cost | Outcome

After PR creation: execute `gh pr edit <number> --add-label "ai-assisted"`
```

---

## Continue.dev — `.continue/config.json`

Add to the `systemMessage` field:

```json
{
  "systemMessage": "...(existing content)...\n\n## AI Governance\n\nEvery commit must include these trailers after the body:\nAI-Assisted-By: continue / <model>\nCo-Authored-By: <model> <provider-email>\n\nEvery PR must include an AI Session Report section: Task, Turns, Course corrections, Dead ends, Files read/modified, Model, Estimated cost, Outcome.\n\nAfter PR creation: gh pr edit <number> --add-label 'ai-assisted'"
}
```

---

## Gemini CLI — `GEMINI.md` or `~/.gemini/GEMINI.md`

```markdown
## AI Governance

### Commit Trailers
Every commit must include after the body:

```
AI-Assisted-By: gemini-cli / <model>
Co-Authored-By: <model> noreply@google.com
```

### Pull Requests
Include an AI Session Report in every PR description:
- Task, Approach, Turns, Course corrections, Dead ends, Files read/modified, Model, Estimated cost, Outcome

After PR creation: `gh pr edit <number> --add-label "ai-assisted"`
```

---

## Zed AI — `.zed/settings.json`

Add to the `assistant.default_prompt` field:

```json
{
  "assistant": {
    "default_prompt": "...(existing content)...\n\n## AI Governance\nEvery commit must end with:\nAI-Assisted-By: zed-ai / <model>\nCo-Authored-By: <model> <provider-email>\n\nEvery PR must include an AI Session Report: Task, Turns, Corrections, Dead ends, Files, Model, Cost."
  }
}
```

---

## Amazon Q Developer — `~/.aws/amazonq/instructions.md`

```markdown
## AI Governance

### Commit Trailers
Every commit must include after the body:

AI-Assisted-By: amazon-q / <model>
Co-Authored-By: <model> noreply@amazon.com

### Pull Requests
Include an AI Session Report in the PR description with:
Task, Approach, Turns, Course corrections, Dead ends, Files read/modified, Model, Outcome.

After PR creation: gh pr edit <number> --add-label "ai-assisted"
```

---

## Notes

- `Co-Authored-By` is recognized by GitHub and surfaces in contribution graphs and commit metadata.
- `AI-Assisted-By` is a custom trailer queryable via `git log --grep`.
- The `ai-assisted` label color `#7057ff` is consistent across all repos for easy filtering.
- All snippets use ASCII only — no Unicode bullets or curly quotes — for maximum compatibility.
