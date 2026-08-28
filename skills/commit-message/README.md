# Commit Message

Generate a conventional commit message from staged git changes and recent session context, then commit with that message.

## Inputs

- Staged git diff
- Optional recent session context when it clarifies intent

## Behavior

- Generates a conventional commit message from the staged diff
- Runs `git commit` with that exact message
- Reports the created commit hash on success
- Falls back to showing the generated message only when commit creation is blocked

## Includes

- `SKILL.md`
- `agents/openai.yaml`
