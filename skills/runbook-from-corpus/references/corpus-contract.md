# Corpus Contract

Shared between `architecture-corpus` (the writer) and `runbook-from-corpus`
(the reader). This file is intentionally duplicated, byte-for-byte,
in both skills' `references/` directories — the two skills install and
ship independently and neither can read the other's `references/` at
runtime, so the same file lives in both places. A CI check diffs the two
copies on every change to either skill.

## Doc-unit naming

- **Repo-level unit** (a sibling repo that is not a workspace, or a
  workspace repo with no confirmed members): `services/<repo-name>.md`
  (or `packages/<repo-name>.md` — whichever fits the domain vocabulary,
  stated consistently across one corpus run).
- **Package-level unit** (a confirmed member of a workspace repo):
  `services/<repo-name>/<package-name>.md`, nested under its parent
  repo's own naming choice above.

## Required section headings (repo-level and package-level units alike)

Purpose, Classification, Tech Stack, Interface Surface, Data Ownership,
Async/Event Dependencies, Sync/Call Dependencies, Deploy Shape,
Operations Surface (marker-gated, may be silently absent), Tech Debt &
Flags, Sources. A section other than Operations Surface that plainly
doesn't apply is omitted with a one-line stated reason, not silently
dropped.

## Evidence-tag vocabulary

- `[C]` Confirmed — the citing agent read the cited `file:line` itself,
  this run.
- `[I]` Inferred — indirect evidence (naming convention, pattern parity,
  a hedge word already in the source). Never flattened to `[C]`.
- `[U]` Unknown — a reasonable question with no findable answer in the
  repos. Recorded as an open question, never silently omitted, never
  guessed.

## `corpus-schema` header

Every corpus this contract governs carries a `corpus-schema: 1` line:

- As **YAML front matter in the corpus's own root doc**,
  `${input:outputDir}/README.md` — this is the one, pinned, predictable
  location `runbook-from-corpus`'s Precondition checks before treating a
  directory as a corpus it recognizes.
- Repeated in each per-repo/per-package doc's own header (informational;
  the root `README.md`'s copy is the one that gates recognition).

A corpus lacking this header at `${input:outputDir}/README.md` is not
necessarily invalid — it may be a hand-written or third-party corpus
organized differently. `runbook-from-corpus` offers a fallback in that
case rather than a silent hard-refuse; see its own `SKILL.md` Precondition
section.
