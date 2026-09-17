---
name: runbook-from-corpus
description: Use when asked to write, update, or re-verify a SEV1/incident/on-call runbook for a multi-repo or multi-service system that already has an architecture documentation corpus (e.g. one built by the architecture-corpus skill). Stack- and platform-agnostic; strictly cites the corpus and never re-derives from source. Distinct from microservice-docs, which documents a single service with no evidence tagging and no incident-runbook output — this skill only ever recombines an existing multi-repo corpus for an on-call responder.
---

# Incident Runbook From Architecture Corpus

Writes a symptom-first incident runbook by reading an existing
architecture corpus, never by re-deriving from source or from what
"systems like this usually have." The corpus is upstream of this skill;
this skill only recombines and reframes what it already says for an
on-call responder.

## Inputs

- `${input:corpusPath}` — path to an *existing* corpus's root, i.e. the
  directory containing that corpus's own `README.md`. **Required, no
  default.**
- `${input:runbookOutputDir:docs/runbooks}` — where the runbook is
  written.

## Precondition

An architecture corpus must already exist at `${input:corpusPath}` — a
root `README.md` plus per-repo/per-service docs carrying `file:line`
citations. Read `${input:corpusPath}/README.md`'s front matter and check
for `corpus-schema: 1` (the pinned location and key defined in
`references/corpus-contract.md`):

- **Present**: proceed normally.
- **Absent**: state plainly that no recognized schema marker was found —
  do not silently proceed and do not silently hard-refuse. Ask whether
  this is an equivalently-structured corpus organized differently (the
  documented fallback for a hand-written or third-party corpus). If
  confirmed, proceed with an explicit `[U]` schema-confidence note on the
  runbook's own header. If not confirmed, or running unattended, stop and
  recommend the `architecture-corpus` skill, or ask the user where the
  equivalent docs live.

## Evidence discipline (inherited, one layer removed)

Same `[C]`/`[I]`/`[U]` convention as the corpus (vocabulary restated in
`references/corpus-contract.md`). The critical rule specific to this
skill: **cite the corpus, not the source.** The corpus already did the
`file:line` grounding — this runbook's citations, on their own authority
(a link/path/section-reference the reader is told to open directly),
point at a doc under `${input:corpusPath}`, not back into a repo's own
source tree. Re-deriving from source here duplicates the corpus's work
and lets the two documents drift independently. If something needed for
the runbook isn't in the corpus, that's a corpus gap — note it as `[U]`
here, and separately flag it as something the corpus should pick up next
time it's regenerated, rather than quietly re-investigating the source.

**Nested source citations inside an attributed corpus excerpt are
correct, expected output, not a violation** — e.g. a hazard card quoting
the corpus's own Tech Debt & Flags citation, which itself legitimately
cites a source `file:line`, per the section skeleton below. The rule this
skill enforces is about the runbook's *own* citation targets, not about
whether a source path string ever appears anywhere in the document.

Never quote a secret value. Never name a specific tool, dashboard,
endpoint, or command unless it's cited in the corpus — "a logging
aggregator exists" is fine if the corpus says so vaguely; naming a
specific product and URL is not fine unless the corpus names that product
and URL specifically. A platform of this shape *usually* has some
familiar tool doesn't mean *this* one's documented — mark the gap `[U]`
instead of assuming a familiar-sounding default.

## Document header

- **Owner** — from a CODEOWNERS-equivalent if the corpus found one;
  otherwise `[U] — needs owner`, plus whatever non-authoritative contact
  heuristic the corpus supports, clearly labeled non-authoritative.
- **Last verified** — today's date, and an explicit statement of what was
  and wasn't exercised (almost certainly: corpus docs checked, no live
  system/dashboard/cluster access used).
- **Re-verify trigger** — tied to specific corpus files: re-verify
  whenever the dependency graph source or any per-unit doc changes, or at
  the next scheduled review.
- **Source of truth** — state plainly that the corpus wins on any
  conflict; this runbook cross-references, it does not duplicate.
- **Status** — draft, pending review of every `[U]` marker, until a human
  owner signs off.
- **Schema confidence** — normally silent; only present, and set to
  `[U]`, when the Precondition's fallback path was used.

If this runbook's *section skeleton* is modeled on another team's or
product's runbook, say so explicitly, and state clearly that only the
skeleton was borrowed — not that product's specific tooling. Cross-check
every tool name that borrowed skeleton implies against this corpus; drop
or re-mark `[U]` anything not independently confirmed here.

## Section skeleton

Full templates for each section are in `references/section-templates.md`.
Section list:

1. **Quick-reference incident page** — everything needed for the first 15
   minutes: one-sentence platform description, critical journeys table,
   a short "first N things to check" list, reachability/health-check
   probes (per the corpus's own documented convention, never assumed
   uniform), and a do-not-touch list from the corpus's Tech Debt & Flags.
2. **Purpose and scope** — explicit in-scope unit list from the corpus,
   explicit out-of-scope. State the depth-selection philosophy plainly
   (centrality + existing corpus depth is defensible; a fabricated
   incident-history weighting is not, unless real incident data exists
   and is cited).
3. **Platform summary** — copied from the corpus's own platform summary,
   not re-derived.
4. **Architecture and request flow** — link to the corpus's own diagrams
   rather than redrawing them; narrate critical paths in prose.
5. **Symptom-to-cause navigation / known-failure catalog** — built
   entirely from the corpus's dependency edges and Tech Debt & Flags
   sections. Every entry traceable to a specific corpus citation.
   **Monorepo appendix**: a known-failure entry that spans multiple
   workspace packages inside one repo must cite the corpus's own
   `diagrams/dependency-graph.mmd` and the aggregate README's
   master-diagram section specifically — never a step number, since a
   runbook reader holds a corpus directory, not the corpus-builder
   skill's own step numbering. If that artifact doesn't cover a given
   multi-package case, the entry is `[U]`, never filled in by reading
   source directly.
6. **Kill switches / do-not-touch hazard cards** — one full card per
   hazard: the danger, the exact corpus citation (which itself may cite
   `file:line` in source — expected, see Evidence discipline above), the
   blast radius, and the safe alternative if documented.
7. **Deep-dive appendices** — only for units the corpus already covers at
   component depth. Note shallow coverage instead of fabricating depth.
8. **Open questions / unknowns** — carry forward the corpus's own
   Unresolved section verbatim, plus anything newly discovered as a gap.
   Never resolve these by guessing to make the section shorter.

## Anti-invention gate

Before writing any sentence that names a specific tool, dashboard,
endpoint, command, or team, stop and confirm it's cited in the corpus. If
it's the kind of thing a system of this shape typically has but this
one's corpus doesn't document, the sentence is wrong to write as fact —
write the gap into the Open questions section instead.

## Verification pass (after drafting)

- Grep the finished runbook for every named tool/service/file reference
  and confirm each resolves to something the corpus actually contains.
- Re-run the secret-value check.
- If published alongside a docs site or wiki, verify every internal link
  resolves after the runbook is wired in.

## Scope boundary

This skill only writes the runbook. It does not build the underlying
corpus (`architecture-corpus`), and it does not build a browsable docs
site around either document.

## Common Mistakes

- Treating "a source `file:line` string appears in the runbook" as
  automatically wrong — hazard cards' nested corpus citations legitimately
  carry one. The actual rule is about the runbook's own citation targets.
- Filling in a monorepo-spanning failure entry from source when the
  corpus's dependency-graph artifact doesn't cover it — that's an `[U]`,
  not a research prompt.
- Silently hard-refusing a corpus that lacks `corpus-schema: 1` instead of
  offering the "organized differently" fallback first.
