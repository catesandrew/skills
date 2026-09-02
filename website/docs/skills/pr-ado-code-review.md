---
title: Pr Ado Code Review
description: Performs a systematic, file-by-file review of an Azure DevOps pull request and posts inline thread comments plus a vote directly to the PR via the Azure CLI and REST API, prioritizing correctness, security, and style.
---

# pr-ado-code-review

## Why It Exists

This skill was added in dotfiles commit `9dfa72e8` ("chore: add new skills", 2026-04-17), a bulk commit that introduced seven skills at once (`pr-ado-code-review`, `pr-ado-open`, `pr-gh-code-review`, `pr-gh-open`, `ai-governance`, `jira-estimate`, `microservice-docs`) plus reference material — the commit message carries no skill-specific rationale beyond the bulk addition. Worth flagging explicitly: the task brief's initial hypothesis was that `d13234c8` ("chore: add ado, tsdoc, cm skills," same day) might be its origin because of the shared "ado" naming, but verification by `--stat` shows that commit is unrelated — it added a completely different family of Azure DevOps *ticket-management* skills (`ado-development`, `ado-monitor`, `ado-new-ticket`, `ado-story-from-figma`, `ado-update-ticket(s)`) plus `tsdoc` and `commit-message`, none of which touch PR review. It was later removed from dotfiles in `df4241d4` (2026-08-29), whose message explicitly lists `pr-*` skills among those redirected to the external `catesandrew/skills` marketplace.

## What It Does

The skill drives a six-phase workflow against the Azure DevOps CLI (`az repos`, `az boards`) and REST API. Phase 1 gathers context: PR metadata (`az repos pr show`), changed files (`az repos pr list-changes`), the latest iteration ID (required to anchor inline comments), the full diff for that iteration, existing open review threads (to avoid duplicating findings), and any linked work items' acceptance criteria via `az boards work-item show` — then classifies the PR type (bug fix / feature / refactor / dependency update / config change) to calibrate review depth. Phase 2 applies a per-file checklist across five weighted categories — Correctness and Security marked Critical, Best Practices and Performance marked Medium, Style/Readability marked Low — fetching each file's full source (not just the diff) from the source branch for context. Phase 3 covers cross-cutting concerns once per PR: test coverage, breaking changes (API/schema/env-var changes without version bumps or migrations), new dependency justification, and documentation gaps.

Phase 4 posts findings back to ADO: each inline finding becomes a separate `az rest POST` call against the PR's `/threads` endpoint with a `threadContext` anchoring it to a file and line range (ADO requires one REST call per comment, unlike GitHub's single-review-payload model), followed by an overall summary comment and a vote (`approve`, `approved with suggestions`, `wait for author`, or `reject`) chosen from a decision table keyed on the highest severity found. It prescribes an exact comment format (`**[Severity] — [Category]:** [problem]. [why it matters]. [fix]`) and a documented set of common mistakes specific to the ADO API's quirks — missing iteration ID, exact vote-string spelling, one-call-per-comment overhead, and skipping linked-work-item context that GitHub PRs don't have an equivalent for.

## How To Use It

Triggers on: wanting a thorough code review on an Azure DevOps pull request with inline thread comments posted directly to the PR via the Azure CLI and ADO REST API.

```sh
skills add -g catesandrew/skills --skill skills/pr-ado-code-review
```

```sh
npm install @catesworks/skill-pr-ado-code-review
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Run `az devops configure --defaults organization=... project=...` first — without it, every subsequent `az repos` call needs explicit `--org`/`--project` flags.
- Inline `threadContext` comments require the *latest iteration ID* (`az rest ... iterations?api-version=7.1`); posting without it fails to anchor the thread correctly.
- ADO requires one REST call per inline comment — there is no batched multi-comment review payload like GitHub's; batch findings mentally before posting to minimize round trips.
- Vote strings must match exactly: `approve`, `approved with suggestions`, `wait for author`, `reject` — any other string throws a CLI error.
- Check existing open threads (`status!='closed'`) before posting to avoid duplicating unresolved findings.
- Always read linked work items — ADO PRs are typically tied to a ticket that states intent the diff alone doesn't show.
- Do not flag formatting nits if the project uses auto-formatters.
- Read the full file content, not just the diff — diff-only context is often misleading about whether a finding is real.

## Related Skills

- [pr-ado-open](/docs/skills/pr-ado-open) — opens the ADO PR this skill reviews; same-commit sibling and Azure DevOps workflow counterpart.
- [pr-gh-code-review](/docs/skills/pr-gh-code-review) — the GitHub equivalent of this same review workflow, added in the same bulk commit.

---

_Sourced from: skills/pr-ado-code-review/SKILL.md, skills/pr-ado-code-review/metadata.json, ~/.dotfiles git history (commits `9dfa72e8`, `df4241d4`)_
