---
name: commit-message
description: Generate a conventional commit message from staged git changes and recent Codex session context, then commit with that exact message. Use when the user wants the staged changes committed with a high-signal conventional message.
---

# Commit Message Skill

Generate a commit message for the currently staged changes, then create the git commit with that exact message.

## When to Use

Use this skill when:
- The user asks for a commit message
- The user asks to summarize staged changes for git commit
- The user wants a conventional commit message from the current diff
- The user wants the staged changes committed now
- The task mentions staged changes and recent Codex session context

## Workflow

1. Inspect the staged diff with git and confirm there are staged changes to commit.
2. Review recent relevant conversation context from `~/.codex/sessions` when it helps explain intent or rationale.
3. Infer the most appropriate conventional commit type such as `fix`, `feat`, `refactor`, `docs`, `test`, `build`, or `chore`.
4. Write a commit message that explains:
   - what changed
   - why it changed
   - the bug fixed, if this is a bug fix
   - user-visible impact, if behavior changed
   - testing status
5. Execute `git commit` using the generated message exactly as written.
6. Report the resulting commit hash and subject line.

If there are no staged changes, stop and report that blocker instead of guessing from the working tree.
If `git commit` fails, return the generated message and the failure reason.

## Constraints

- Use conventional commit format.
- Use present tense and imperative mood.
- Subject line must be 74 characters or fewer.
- Body lines must be 80 characters or fewer.
- Use English only.
- The first body bullet must explain why the change was made.
- If behavior changes for users, add a bullet describing the impact.
- Add a final `Tests: ...` line.
- Use `BREAKING CHANGE:` footer when applicable.
- ASCII only. Do not use Unicode punctuation or bullets.

## Output Format

On success, return:
- the created commit hash
- the subject line used
- a short note that the staged changes were committed

If commit creation is blocked or fails, return the full generated commit message in a fenced Markdown code block with info string `text`, followed by the blocker or error.

## Quality Bar

- Prefer specificity over vague summaries.
- Explain why more than what.
- Do not mention files unless needed for clarity.
- If there is not enough evidence for a claim, omit it rather than guessing.
- The commit message used for `git commit` must exactly match the generated message.
