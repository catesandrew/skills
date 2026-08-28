---
name: session-wrap
description: Wrap up a working session into a durable dossier — a resume pointer for picking the work back up in a fresh session, a summary of what was done, lessons learned, architecture notes, ADRs for decisions, follow-ups, and a sanitized public blog post. Use at the end of a session, before context runs out, when handing off, or when the user says "wrap up", "close out this session", "document what we did", "write this up", "hand off", "end of session", or "blog post about this work".
---

# session-wrap

## Overview

Turn a working session into artifacts a future reader (you-in-a-new-session, a
teammate, the public) can act on. Produces one dated **session dossier** plus,
when the project supports them, a resume pointer in the project's memory/handoff
system.

Do this **before** context runs out or at a natural stopping point — the value is
lost if the session compacts first.

## Rules

- **Evidence, not memory.** Reconstruct what happened from `git log`, `git diff`,
  the branch state, test output, and files on disk — not from what you *think*
  you did. Cite commit SHAs and file paths.
- **State reality.** If tests fail, a step was skipped, or something is committed
  but unpushed / unpublished, say so plainly. "Blocked on X" is a valid outcome.
- **Sanitize the blog post.** It is public. Strip client names, internal repo
  and package names, hostnames, ticket ids, secrets, and anything under NDA.
  Generalize ("a multi-tenant SaaS", "an internal infra monorepo"). When in
  doubt, leave it out — and ask the user before publishing anywhere.
- **Tool-agnostic.** Works under any agent/harness. Use plain shell + file writes.

## Procedure

Create one todo per step.

### 1. Gather the facts

```sh
DATE=$(date +%F)
git -C <repo> log --oneline -20
git -C <repo> status --short --branch          # committed vs pending, branch, ahead/behind
git -C <repo> diff --stat @{u}.. 2>/dev/null   # what's unpushed
```

Note across every repo you touched: branch, what's committed, what's staged/dirty,
what's unpushed, and any build/test/publish state. Skim the conversation for
decisions, dead ends, and surprises.

### 2. Pick the output location

Default: `docs/sessions/<DATE>-<slug>/` in the primary repo (`<slug>` = 2–4 word
kebab summary). If the repo has none of `docs/`, use `.sessions/<DATE>-<slug>/`.
Create the directory, then write the files below from `references/`.

### 3. Write the dossier

| File | From template | Holds |
|------|---------------|-------|
| `README.md` | `handoff-README.md` | **Resume pointer** — see step 4. The index of the dossier. |
| `SUMMARY.md` | `SUMMARY.md` | What was done, per repo, with commit SHAs and file paths. |
| `LESSONS.md` | `LESSONS.md` | What was learned — gotchas, wrong turns, verified facts. |
| `ARCHITECTURE.md` | `ARCHITECTURE.md` | New/changed architecture. Omit the file if none. |
| `adr/NNNN-<title>.md` | `adr-template.md` | One MADR-style record per real decision. None → skip the dir. |
| `FOLLOWUPS.md` | `FOLLOWUPS.md` | Open items, split blocked-on-user vs blocked-on-work. |
| `BLOG.md` | `BLOG.md` | Sanitized public write-up. |

Only create files that carry content. A dossier with no ADRs simply has no
`adr/` directory — don't emit empty placeholders.

### 4. Make the resume pointer real

`README.md` must let a cold session restart in one paste. Include:

- **One-paragraph state:** what's done, what's mid-flight, what's blocked.
- **Exact repo state:** each repo → branch, last commit SHA, committed/pending,
  unpushed/unpublished.
- **A copy-paste resume prompt** — literally the message to open the next session
  with, e.g.:
  > "Resume the <slug> work. Read `docs/sessions/<DATE>-<slug>/README.md` and
  > `FOLLOWUPS.md`. State was: <one line>. Next: <first task>."
- **Read-first list:** the 3–6 files that rebuild context fastest.
- **First action:** the single next step, concrete.

### 5. Wire into the project's memory/handoff system (if present)

- If a memory index exists (e.g. `MEMORY.md`, `.omc/`, `AGENTS.md` handoff
  notes), add/refresh a one-line pointer to this dossier so a future session
  finds it. Convert relative dates to absolute.
- Don't duplicate the dossier into memory — point at it.

### 6. Report

Tell the user: dossier path, the copy-paste resume prompt, and whether the blog
post is safe to publish or needs their review. End by stating what's blocked on
them vs on remaining work.

## Anti-patterns

- Claiming "done" without checking `git status` / test output.
- A blog post that leaks a client or internal name.
- A resume pointer that says "continue where we left off" without the concrete
  next action and the files to read.
- Emitting empty template sections instead of omitting them.

## References

- `references/handoff-README.md` — resume-pointer / dossier index template
- `references/SUMMARY.md`, `references/LESSONS.md`, `references/ARCHITECTURE.md`
- `references/adr-template.md` — MADR-style decision record
- `references/FOLLOWUPS.md`, `references/BLOG.md`
