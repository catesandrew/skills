---
name: architecture-corpus
description: Use when asked to map or document architecture across multiple repositories that together make up one platform, produce a docs/architecture folder from scratch, understand how a multi-repo (or multi-repo-plus-embedded-workspace) system fits together, or as a prerequisite for the runbook-from-corpus skill. Distinct from microservice-docs, which documents a single service from prescriptive templates with no evidence tagging — this skill builds an evidence-graded corpus across many repos/packages and is not for single-service documentation.
---

# Architecture Corpus Builder

Produces a `${input:outputDir}` corpus: one root `README.md` narrative +
master diagram, one doc per repo (and per workspace package, where one
exists), and a machine-parseable dependency graph. Stack- and
language-agnostic — does not assume any specific hosting model. The
output is only as good as its evidence discipline — this is a methodology
for citation-backed static analysis, not a template to fill in from
assumption.

## Inputs

- `${input:corpusRoot}` — base directory containing the sibling repos to
  scan. **Required, no default.** If empty, state that plainly and stop
  rather than scanning nothing.
- `${input:platformName}` — used in the narrative.
- `${input:outputDir:docs/architecture}` — where the corpus is written.
- `${input:includeOnly:}` — optional comma-separated allowlist of sibling
  directory names. Empty means scan everything found under `corpusRoot`.

## Core rule: evidence discipline

Every factual claim in the corpus traces to a `file:line` in the actual
repo under analysis. Mark every claim with one of three states, inline:

- **[C] Confirmed** — you read the cited line(s) yourself, this run.
- **[I] Inferred** — the evidence is indirect (naming convention, pattern
  parity with a sibling repo, a hedge word already in the source like
  `TODO` or `assumed`). Carry the hedge forward; never flatten [I] to [C].
- **[U] Unknown** — a reasonable person would want this for incident
  response or onboarding, and it isn't findable anywhere in the repos.
  Record it as an open question. Do not omit it and do not guess a
  plausible-sounding answer.

Never invent a tool, dashboard, command, or behavior because "systems
like this usually have one." If the repos don't show it, it's `[U]`.

Never quote a secret value (connection string, API key, password, token)
found in source — cite `file:line` and describe *that* a secret-shaped
value exists there, not what it is.

## Step 0: scope

Confirm which sibling directories under `${input:corpusRoot}` count as
"this platform" — a directory can contain unrelated repos; if ambiguous,
ask. Note repos that are empty, near-empty (template-only), or clearly
out of scope, but still list them — a missing repo that should be there
is a real finding, not noise. A sibling directory with **no `.git`** is
recorded as out-of-scope with the stated reason "not a git repository"
and is never scanned as a repo.

## Step 1: Workspace & Monorepo Detection

Before per-repo stack detection, check whether a sibling directory is
itself a workspace root containing multiple independently addressable
packages, using the marker table in
`references/workspace-markers.md`.

**Guard, applied at exactly two levels — never unbounded recursion:**

1. **Repo level**: only treat a repo as a workspace if it has a workspace
   marker **and** at least one non-empty `apps/*`/`packages/*` (or
   equivalent) member directory. A marker with no real members (e.g. a
   template leftover) falls back to whole-repo treatment.
2. **Member level**: a workspace member that is itself empty or
   scaffold-only is flagged the same way an empty whole-repo would be in
   Step 0 — noted, not silently skipped, not treated as a real doc unit.

Every confirmed workspace member becomes its own doc unit in Step 3,
nested under its parent repo.

## Step 2: per-repo stack detection

Don't assume the stack. Detect it per repo (or per workspace member) from
marker files before doing anything else — see the marker table in
`references/stack-detection.md`. The rest of this skill's steps are
written stack-neutral on purpose. Adapt concrete grep patterns to
whatever stack this step found; don't port assumptions from one stack
onto a repo using a different one just because a prior run of this skill
saw those.

## Step 3: per-repo (or per-package) doc

Write one doc per repo or workspace-member unit (naming convention in
`references/corpus-contract.md`) with the sections listed in
`references/per-repo-doc-template.md`: Purpose, Classification, Tech
Stack, Interface Surface, Data Ownership, Async/Event Dependencies,
Sync/Call Dependencies, Deploy Shape, **Operations Surface**, Tech Debt &
Flags, Sources.

Omit a section outright if it plainly doesn't apply, but say in one line
that it was omitted and why — a reader can't mistake "omitted" for
"forgotten."

**Operations Surface** sits immediately after Deploy Shape and is
**marker-gated**: emit it only when a concrete marker fires (release
tooling or an observability dependency — full marker list in
`references/operations-surface-markers.md`). Deploy Shape already owns CI
pipeline files; Operations Surface never duplicates that. If no marker
fires, omit the section silently — no per-repo "not found" line.

Every generated doc's header includes a `corpus-schema: 1` line.

For a handful of repos, do this directly. For dozens, and if your
environment supports spawning parallel subagents, delegate each unit's
pass to one in parallel — the per-unit doc only needs that one repo's
source. Do not parallelize Step 4; it needs every unit's doc to already
exist.

## Step 4: cross-repo (and cross-package) reconciliation

After every unit has a doc, build the global edge list:

- For each unit's Sync/Call Dependencies and Async publishes, find the
  target by name/SDK-package/queue-topic across every other unit's doc —
  including workspace members of other repos.
- Mark each edge's confidence: both sides confirmed / one side only /
  inferred from naming alone with no call site located.
- A dependency resolving to something **not** in this corpus at all still
  gets recorded as a node, marked **out-of-workspace** — never silently
  dropped, never invented internals for it.
- Update each unit's own doc with confirmed inbound callers once known.

## Step 5: aggregate `README.md`

Assemble, in this order, at `${input:outputDir}/README.md` — **this file
is where `corpus-schema: 1` lives as a YAML front-matter key**, the
pinned location the `runbook-from-corpus` skill's Precondition checks:

1. **Plain-English platform narrative** for `${input:platformName}` —
   what this system does end to end, closing with a one-sentence version.
2. **Master dependency diagram** (Mermaid) — nodes clustered by role,
   **and separately by filesystem boundary (repo) vs. build/publish
   boundary (package)** where a repo is a workspace with multiple
   packages — edges labeled sync/async/build-time with a legend. Diagram
   conventions and a worked example are in
   `references/diagram-examples.md`.
3. **Glossary** — one row per unit: purpose, classification.
4. **Security & tech-debt callouts** — aggregated from every unit's Tech
   Debt & Flags, ranked by severity/blast-radius, framed using whatever
   this system actually processes (infer the compliance context from the
   code; don't apply a generic template's framing to a system that
   doesn't carry that data).
5. **Diagram index** — table of every diagram file produced.
6. **Unresolved** — every `[U]`, every one-sided edge, every open question
   from every unit's doc, collected in one place. Non-empty is a sign of
   honesty, not incompleteness.

Also emit `diagrams/dependency-graph.mmd`: one edge per line, a
consistent operator per edge type (legend comment), clean enough for a
downstream parser — a dense graph shouldn't be force-fit into one
node-link diagram; that's downstream tooling's problem.

Optionally add C4 Context/Container diagrams and, for the 2-4
highest-centrality units (by confirmed edge count), C4 Component
drill-downs.

## Step 6: self-check before declaring done

- Every unit in scope has a doc (or an explicit, stated reason it
  doesn't).
- Every named dependency target either has its own doc or is marked
  out-of-workspace.
- Grep the finished corpus for secret-shaped patterns (`password=`,
  `key=`, `secret=`, connection-string shapes) to confirm none leaked
  through verbatim.
- Node/edge counts in the `.mmd` source match Step 4's reconciliation.
- Workspace member counts in the corpus match Step 1's detection output.

## Scope boundary

This skill stops at producing the corpus. Rendering it into a browsable
site, chunking a dense dependency graph for readability, or building an
incident runbook on top of it are separate concerns — see the
`runbook-from-corpus` skill for the latter.

## Common Mistakes

- Treating a repo with a stray workspace marker (e.g. a leftover
  `turbo.json` from a template) as a real workspace without checking for
  a non-empty member — see Step 1's guard.
- Duplicating CI-pipeline-file coverage between Deploy Shape and
  Operations Surface — Deploy Shape owns CI config; Operations Surface
  only adds release tooling and observability dependencies.
- Flattening an `[I]` or `[U]` claim to `[C]` because it "seems obviously
  true" — the hedge is the point.
- Skipping a `.git`-less sibling directory silently instead of recording
  it out-of-scope with a reason.
