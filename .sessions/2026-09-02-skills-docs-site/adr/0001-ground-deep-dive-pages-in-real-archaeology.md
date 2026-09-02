# ADR 0001: Ground deep-dive "Why It Exists" sections in real git archaeology, not fabrication

- **Status:** accepted
- **Date:** 2026-09-02
- **Deciders:** user, assistant

## Context

The user asked for skill documentation "in a similar way we did with
next-starters," which includes a "Why It Exists" section per skill built
from real git-commit archaeology. This repo's own git history is thin: one
bulk `13fbfbc` import commit covers 48 of the 52 skills, with no per-skill
rationale — nothing like `next-starters`' incrementally-committed history to
mine. A decision was needed on how (or whether) to write that section here.

## Options considered

1. **Fabricate plausible-sounding origin stories per skill.** Fast, matches
   `next-starters`' prose depth uniformly. Cons: invents facts and ships
   them on a public site as if researched.
2. **Drop "Why It Exists" entirely, repo-wide.** Honest, simple. Cons:
   throws away real information that does exist just one directory over,
   and doesn't match what the user actually asked for.
3. **Dig `~/.dotfiles` (the actual repo most skills were migrated from) for
   real per-skill history; state plainly when a skill's history is thin;
   use this repo's own commits for the few skills authored directly here.**

## Decision

Option 3. The user, asked directly, pointed at `~/.dotfiles` as the place to
look — confirming real history was findable rather than assumed absent. This
satisfies the original request without inventing facts.

## Consequences

- **Positive:** every deep-dive page's "Why It Exists" claim traces to a
  real, cited commit hash. Several pages surfaced genuinely useful
  provenance that wasn't documented anywhere else before this — e.g.
  `react-query-cache-determinism`/`nextjs-react-query-cache-coordination`
  were ported and generalized from a real client codebase; the `chrome-*`
  and several `audit-*` skills trace to a verified file-for-file conversion
  from earlier Codex `.prompt.md` files; `agent-browser` wraps a named
  third-party CLI.
- **Negative / cost:** required real research time — 8 parallel subagents,
  each running a 3-pass git archaeology recipe (path search, message grep,
  pickaxe) per assigned skill — instead of a near-instant templated
  fabrication. A handful of skills that only trace to a generic bulk-add
  commit have shorter, plainer "Why It Exists" sections than
  `next-starters`' equivalents, by design.
- **Follow-on:** none required beyond what's already tracked in
  `FOLLOWUPS.md`.

## Notes

Representative examples: `website/docs/skills/data-table-builder.md` and
`react-query-cache-determinism.md` (rich, verified provenance) vs.
`website/docs/skills/dithered-motif-site.md` (confirmed-thin, stated
plainly rather than padded).
