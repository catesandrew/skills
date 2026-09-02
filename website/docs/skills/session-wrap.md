---
title: Session Wrap
description: Wraps up a working session into a durable dossier containing a resume pointer, summary, lessons learned, architecture notes, ADRs, follow-ups, and a sanitized public blog post, reconstructed from git evidence rather than memory.
---

# session-wrap

## Why It Exists

This skill has a dedicated, well-documented dotfiles commit: `1b96a81b` ("feat(skills): add session-wrap for end-of-session handoff dossiers", 4 weeks ago at time of writing). The full commit message describes exactly what it built: "a tool-agnostic procedure that turns a working session into a dated dossier under `docs/sessions/<date>-<slug>/`: a resume pointer (repo state + copy-paste prompt to reopen in a fresh session + first action), a summary, lessons learned, architecture notes, MADR-style ADRs, follow-ups (blocked-on-user vs blocked-on-work), and a sanitized public blog post." It landed as a 335-line, 9-file commit — the `SKILL.md` itself plus six reference templates — with the stated rules: reconstruct from git evidence, not memory; state reality plainly when things are failing, skipped, or unpushed; wire a pointer into the project's memory/handoff system if one exists; and strip client/internal names from the blog post before publishing.

## What It Does

The skill turns a live working session into artifacts a future reader — a fresh session of the same agent, a teammate, or the public — can act on immediately: one dated session dossier, plus (when the project has one) a pointer wired into its existing memory/handoff system. It's meant to run *before* context runs out or compacts, not after, since the value is lost once that happens.

The procedure runs six numbered steps, each tracked as its own todo. Step 1 gathers facts purely from `git log`, `git status --short --branch`, and `git diff --stat @{u}..` across every repo touched — branch, committed vs. pending, staged/dirty, unpushed, and build/test/publish state — explicitly not from what the agent "thinks" it did. Step 2 picks an output location, defaulting to `docs/sessions/<date>-<slug>/` in the primary repo (or `.sessions/` if the repo has no `docs/`). Step 3 writes a fixed set of files from bundled reference templates — `README.md`, `SUMMARY.md`, `LESSONS.md`, `ARCHITECTURE.md`, per-decision `adr/NNNN-<title>.md` files, `FOLLOWUPS.md`, and `BLOG.md` — with the explicit rule that only files carrying real content get created; a session with no architectural decisions simply gets no `adr/` directory.

Step 4 is the load-bearing one: making the `README.md` resume pointer actually usable by a cold session, requiring a one-paragraph state summary, exact per-repo git state, a literal copy-paste prompt to reopen the next session with, a read-first list of 3–6 files, and one concrete first action. Step 5 wires a one-line pointer into the project's existing memory system (`MEMORY.md`, `.omc/`, `AGENTS.md` handoff notes) if one exists, without duplicating the dossier's content into it. Step 6 reports the dossier path, the resume prompt, and explicit blocked-on-user vs. blocked-on-work status to the user. Named anti-patterns include claiming "done" without checking `git status` or test output, a blog post that leaks a client or internal name, and a resume pointer that says "continue where we left off" without a concrete next action.

## How To Use It

Triggers on: "wrap up", "close out this session", "document what we did", "write this up", "hand off", "end of session", "blog post about this work", or any request to wrap up a working session, before context runs out, or when handing off.

```sh
skills add -g catesandrew/skills --skill skills/session-wrap
```

```sh
npm install @catesworks/skill-session-wrap
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Reconstruct everything from `git log`, `git diff`, branch state, and test output — never from what the agent believes happened.
- State reality plainly: failing tests, a skipped step, or something committed-but-unpushed must be reported as such, not smoothed over. "Blocked on X" is a valid, expected outcome.
- The blog post is public — strip client names, internal repo/package names, hostnames, ticket IDs, secrets, and anything under NDA; generalize specifics ("a multi-tenant SaaS" instead of the real name); when in doubt, leave it out and ask before publishing.
- Only create dossier files that carry real content — no empty placeholder sections or empty `adr/` directories.
- The README resume pointer must include a literal copy-paste prompt to reopen the next session with, not a vague "continue where we left off."
- If a project memory/handoff system exists, add a pointer to the dossier rather than duplicating the dossier's content into it.
- Convert relative dates to absolute when wiring a pointer into memory, so it stays meaningful after time passes.
- Do this before context runs out or compacts — the entire premise is that the value is lost once that happens.

## Related Skills

- [reflect-instructions](/docs/skills/reflect-instructions) — shares the "reconstruct from evidence, not memory" discipline, applied to instruction files rather than session handoffs.

---

_Sourced from: skills/session-wrap/SKILL.md, skills/session-wrap/metadata.json, ~/.dotfiles git history (commit `1b96a81b`)_
