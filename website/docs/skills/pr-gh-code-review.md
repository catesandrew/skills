---
title: Pr Gh Code Review
description: Performs a systematic, file-by-file review of a GitHub pull request and posts inline comments plus a verdict directly to the PR via the GitHub CLI and API, prioritizing correctness, security, performance, and style findings.
---

# pr-gh-code-review

## Why It Exists

This skill was added in dotfiles commit `9dfa72e8` ("chore: add new skills", 2026-04-17), the same bulk commit that added `pr-ado-code-review`, `pr-ado-open`, `pr-gh-open`, `ai-governance`, `jira-estimate`, and `microservice-docs` — the commit message gives no skill-specific rationale, just a bulk addition. It was removed from dotfiles in `df4241d4` (2026-08-29), whose message explicitly cites `pr-*` skills (naming `pr-gh-open` as an example) among those removed and redirected to the external `catesandrew/skills` marketplace this repo now is.

## What It Does

The skill mirrors its ADO counterpart's four-phase structure but targets the GitHub CLI (`gh`) and API instead. Phase 1 pulls PR metadata (`gh pr view --json`), the full diff (`gh pr diff`), a changed-files list with add/delete stats, and existing review comments to avoid duplication — then classifies the PR type (bug fix / feature / refactor / dependency update / config change) to set review depth. Phase 2 applies the same weighted five-category checklist as the ADO version (Correctness and Security as Critical, Best Practices and Performance as Medium, Style/Readability as Low), reading each file's full content at the head ref via `gh api .../contents` rather than trusting diff context alone. Phase 3 covers cross-cutting concerns once per PR — test coverage adequacy, breaking changes to public APIs/DB schema/env vars/message schemas, dependency justification and CVE exposure, and documentation gaps.

Phase 4 is where it diverges most from the ADO version: GitHub supports a single batched review submission, so all inline findings get collected into one `gh api .../pulls/{n}/reviews` POST with a `comments` array (each a `{path, line, body}` object, `start_line` for multi-line spans) and one `event` verdict — `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` — rather than ADO's one-call-per-thread model. It also documents the simpler `gh pr review --approve/--request-changes/--comment` path for file-level-only feedback and `gh pr comment` for standalone cross-cutting notes. The same enforced comment format (`**[Severity] — [Category]:** [problem]. [why]. [fix]`) and tone guidelines (constructive, distinguish must-fix from follow-up, acknowledge good work, ask rather than assume) apply, and its Common Mistakes section specifically flags fragmenting a review into many individual `gh pr comment` calls instead of one batched `gh api reviews` submission.

## How To Use It

Triggers on: wanting a thorough code review on a GitHub pull request, with inline comments posted directly to the PR via the GitHub CLI and API.

```sh
skills add -g catesandrew/skills --skill skills/pr-gh-code-review
```

```sh
npm install @catesworks/skill-pr-gh-code-review
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Batch all inline findings into one `gh api .../reviews` POST rather than posting many separate `gh pr comment` calls — fragmented reviews create noise.
- `event` must be one of exactly `APPROVE`, `REQUEST_CHANGES`, or `COMMENT`.
- Read the full file at the PR's head ref, not just the diff — diff-only context is called out as often misleading.
- Never set `event: APPROVE` without first checking the test coverage section.
- Check existing review comments before posting to avoid duplicating already-raised feedback.
- Do not flag formatting nits on projects that use auto-formatters (Prettier, Black, gofmt, etc.).
- Post critical findings first — style-only comments on code with unresolved critical issues send the wrong signal.
- Every comment must state what to change and why; "this could be better" is explicitly disallowed as non-actionable.

## Related Skills

- [pr-ado-code-review](/docs/skills/pr-ado-code-review) — the Azure DevOps equivalent of this same review workflow, added in the same bulk commit.
- [pr-ado-open](/docs/skills/pr-ado-open) — Azure DevOps PR-opening counterpart in the same git-workflow family.

---

_Sourced from: skills/pr-gh-code-review/SKILL.md, skills/pr-gh-code-review/metadata.json, ~/.dotfiles git history (commits `9dfa72e8`, `df4241d4`)_
