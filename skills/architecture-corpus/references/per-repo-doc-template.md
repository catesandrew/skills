# Per-Repo / Per-Package Doc Template

Write to the path named in `corpus-contract.md`'s doc-unit naming
convention, with `corpus-schema: 1` in the header, then these sections
(omit any that plainly don't apply — state why in one line):

1. **Purpose** — 2-4 sentences, what this unit is for, cited to its
   README or an equivalent doc-comment/entrypoint if the README is
   templated/empty.
2. **Classification** — service / library / frontend / CLI /
   infra-as-code / tooling / test-suite / empty-placeholder. State the
   evidence.
3. **Tech Stack** — language, framework, runtime version, the
   dependency-injection/bootstrap convention if one exists, any notably
   heavy or unusual dependency.
4. **Interface Surface** — HTTP routes/controllers, CLI subcommands,
   RPC/GraphQL schema, public library API, queue-consumer entrypoints,
   cron/scheduled jobs, UI routes. Cite `file:line` per entry point; a
   big surface can be summarized by controller/module with a
   representative sample — say so if you sampled rather than enumerated.
5. **Data Ownership** — datastores/schemas/tables it owns, migrations,
   config *key names* only (never values). "Owns no data" is valid for a
   pure aggregator/BFF.
6. **Async/Event Dependencies** — publishes/consumes over whatever
   messaging exists. "None found" is a valid, stated answer.
7. **Sync/Call Dependencies** — outbound calls to other units in this
   same corpus, and, once Step 4 is done, confirmed inbound callers too.
8. **Deploy Shape** — Dockerfile, k8s/serverless manifests, CI pipeline
   files, or "no deploy artifacts found" (expected for a pure library).
9. **Operations Surface** — marker-gated (see
   `operations-surface-markers.md`); release tooling and observability
   dependencies only, never CI pipeline files (those live in Deploy
   Shape). Omit silently if no marker fires.
10. **Tech Debt & Flags** — `TODO`/`FIXME`/`HACK` comments, commented-out
    code still partially wired, version skew vs. siblings, anything the
    code's own comments flag as risky, dead, or landmine-shaped. Be
    concrete and cite exact lines — this is what the eventual runbook
    leans on hardest for its do-not-touch list.
11. **Sources** — every file actually read, and every file *found but not
    fully read* (grepped for an attribute, saw a filename, never opened
    it) — an honest gap beats a corpus that pretends full coverage.
