# Lessons — Public skills repo launch (2026-08-28)

## A private-data audit needs org/employer-name greps, not just path/secret regexes

- **What happened:** An initial sweep for `/Users/<name>` paths,
  secret/token patterns, and a fixed list of prior-employer terms
  (`envmgr|ad-infrastructure|podzilla|Disney|Tron|DPE`) came back clean.
  Only after extracting and eyeballing every skill's frontmatter
  `description` did `Origence`/`CUDirect`/`Forge Command` — a *different*,
  current employer's ADO org name and internal area-path convention —
  surface across 6 `ado-*` skills plus `baseline-design`, all of which would
  otherwise have shipped to a public repo.
- **Why:** Path and secret regexes only catch machine-specific and
  credential leaks. Employer/client names are prose, not a fixed pattern —
  they only surface by actually reading content (or by knowing in advance
  which org names to grep for), not by a generic regex sweep.
- **How to apply:** When vetting content for a public repo, always do at
  least one pass that reads (or greps for) organization/client proper nouns
  specifically — don't rely solely on path/secret/known-old-employer regex
  matches. Extracting every file's title/description line and reading it
  end-to-end was what actually caught this.
- **Evidence:** `SUMMARY.md`'s exclusion list; the grep hits in this
  session's transcript for `origence|cudirect|forge command`.

## Directory/frontmatter name drift is worth fixing during a migration, not deferring

- **What happened:** `spec-kit/SKILL.md` had `name: spec-kit-skill`, not
  matching its `spec-kit` directory name — a violation of the source repo's
  own documented quality bar (`AGENTS.md`: "name (kebab-case, matches
  directory)").
- **Why:** It's cheap to fix a rename during a migration (one `mv`, no
  functional risk) but easy to silently re-propagate a lint violation into
  a brand-new public repo if not checked.
- **How to apply:** When bulk-copying skills into a new location, script a
  dir-name vs. frontmatter-`name` consistency check as part of the copy, not
  as an afterthought — it surfaced only because a script diffed the two.
- **Evidence:** `mv skills/spec-kit skills/spec-kit-skill` in this session.

---

Candidates to promote into long-term memory (if the project has a memory system):

- [x] Public-repo content audits for AI-agent skills need an org/employer-name
      read-through, not just path/secret regexes — promoted to project memory.
