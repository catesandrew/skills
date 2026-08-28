---
name: reflect-instructions
description: Use when you need to analyze and improve an AI agent instruction file (AGENTS.md, CLAUDE.md, GEMINI.md, or similar) based on observed failure patterns, misunderstandings, or gaps in the current conversation.
---

# reflect-instructions

Evidence-based workflow for analyzing and improving agent instruction files. Uses conversation history as ground truth for what's working and what isn't. Changes are proposed interactively and applied only after approval.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:instructionFile}` | Path to the instruction file to improve | `AGENTS.md`, `CLAUDE.md`, `.codex/config/system.md` |
| `${input:focus}` | Optional: specific area to focus improvement on | `tool selection`, `error handling`, `output format` |

If `${input:instructionFile}` is not provided, default to `AGENTS.md` in the current working directory.

## Workflow

### Phase 1: Analysis

Read `${input:instructionFile}` and review the conversation history in your context window.

**Look for:**
- Agent responses that didn't match user intent (misunderstanding of request)
- Repeated corrections by the user for the same type of mistake
- Tasks the agent couldn't complete due to missing guidance
- Overly verbose or overly terse responses vs user preference
- Tool selection errors (wrong tool chosen, right tool not used)
- Output format inconsistencies
- Edge cases not covered by current instructions

Use TodoWrite to track each identified gap as a separate improvement item.

### Phase 2: Present findings

For each identified improvement:
1. **Current issue** — describe what went wrong and where in the conversation
2. **Proposed change** — specific text to add, modify, or remove
3. **Expected improvement** — how this change prevents the issue from recurring

Present findings one at a time (or grouped by theme if there are many). Wait for user feedback before implementing.

### Phase 3: Implement approved changes

For each approved change:
1. Read the current state of `${input:instructionFile}`.
2. Use the Edit tool to make the minimal change that addresses the issue.
3. Confirm the section modified and the new text.
4. Mark the improvement task as complete.

### Phase 4: Final output

```md
<analysis>
[List issues identified and potential improvements]
</analysis>

<improvements>
[For each approved improvement:
1. Section modified
2. New/modified instruction text
3. How this addresses the issue]
</improvements>

<summary>
[N changes made. Key improvements: ...]
</summary>
```

## Best Practices

- **Evidence-based only** — every suggestion must be grounded in an actual failure from the conversation, not hypothetical scenarios.
- **Minimal changes** — prefer targeted additions to existing sections over rewrites.
- **Test proposals mentally** — for each change, ask: "Would this have prevented the issue? Could it cause regressions?"
- **Preserve working patterns** — don't change things that demonstrably worked well.
- **Version control** — commit changes after implementation with a clear commit message describing what was improved and why.

## Key Principles

| Principle | Application |
|-----------|-------------|
| Evidence-based | Only suggest changes backed by observed failures |
| User-focused | Prioritize UX improvements over internal consistency |
| Iterative | Refine based on feedback; don't batch all changes at once |
| Preserve core function | Enhance without disrupting essential behaviors |
| Concise | Instructions should be shorter after improvement, not longer |

## Common Mistakes
- **Fixing symptoms instead of root causes** — if the agent keeps misidentifying tasks, the fix is better task classification guidance, not more examples of individual tasks.
- **Over-specifying** — instructions that enumerate every edge case become too long to read reliably; use principles, not exhaustive lists.
- **Changing working patterns** — if users haven't complained about something, leave it alone.
- **Not committing** — improvements that aren't committed may be lost or overwritten.
