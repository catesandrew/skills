# architecture-corpus

Build an evidence-cited architecture documentation corpus by statically
analyzing a set of sibling repositories that together make up one
platform or system.

## Validation

Smoke-tested against a real 2-repo sample (1 flat repo, 1 pnpm/turbo
workspace with 5 confirmed non-empty members), output generated entirely
outside this repo's working tree and discarded after recording these
counts-only results:

- Workspace & Monorepo Detection (Step 1): produced per-package docs for
  all 5 confirmed workspace members, plus 1 correctly-flagged unscanned
  member — **pass**.
- Operations Surface (marker-gated section): fired correctly for 3 of 7
  sampled units (1 release-tooling marker, 2 distinct observability
  markers) and was silently omitted — no "not found" line — for the
  remaining 4 units that had no marker — **pass**.
- Evidence-tag spot check: 15/15 sampled `[C]`-tagged factual claims
  verified correct against their cited `file:line`; zero flattened
  `[I]`/`[U]` claims found — **15/15 correct**.
- Redaction rule: no secret-shaped value was encountered in this sample —
  explicitly recorded as such rather than silently skipped.
- Publishing: not added to `docs/published-skills.json` this revision —
  ships `private: true`, pending real-world use.

