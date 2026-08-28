# Session: <TITLE> — <YYYY-MM-DD>

> Resume pointer + index for this session's dossier. Read this first.

## State in one paragraph

<What got done, what is mid-flight, what is blocked. 2–4 sentences. Honest.>

## Resume prompt (paste into a new session)

```
Resume the <slug> work. Read docs/sessions/<DATE>-<slug>/README.md and FOLLOWUPS.md.
State: <one line>. Next action: <first concrete task>.
```

## Repo state

| Repo | Branch | Last commit | Committed? | Pushed? | Notes |
|------|--------|-------------|-----------|---------|-------|
| <repo> | <branch> | <sha> <subject> | yes/pending | ahead N / pushed | e.g. "publish pending", "behind 1, rebase first" |

## Read first (rebuilds context fastest)

1. `SUMMARY.md` — what changed and where
2. `FOLLOWUPS.md` — what's left
3. `<key source file>` — <why>
4. `ARCHITECTURE.md` / `adr/` — <if decisions were made>

## First action

<The single next step, concrete enough to start without re-deriving anything.>

## Dossier contents

- `SUMMARY.md` — what was done
- `LESSONS.md` — lessons learned
- `ARCHITECTURE.md` — architecture (if any)
- `adr/` — decision records (if any)
- `FOLLOWUPS.md` — open items
- `BLOG.md` — public write-up (⚠ review before publishing)
