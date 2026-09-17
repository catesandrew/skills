---
title: Architecture Corpus
description: Builds an evidence-cited architecture documentation corpus — a platform README, per-repo docs, and a dependency graph — from static analysis across multiple sibling repositories, including embedded pnpm/turbo/Nx/Cargo/Go workspaces.
---

# architecture-corpus

## Why It Exists

Documenting a single service is a solved problem in this repo (see
`microservice-docs`), but documenting how a whole fleet of independent
repositories fits together — including repos that are themselves
workspaces with several independently-deployable packages — needed a
different contract: evidence-graded claims ([C]/[I]/[U]), explicit
cross-repo reconciliation, and a machine-parseable dependency graph a
downstream tool (like `runbook-from-corpus`) can rely on. This skill and
its sibling were added to fill that gap.

**Note:** this package is currently unpublished (`private: true`); the
usual `npm install`/git-archaeology sections below are omitted until it
ships. This will be backfilled once the introducing commit exists and/or
the package is published.

## What It Does

Statically analyzes a set of sibling repositories and produces a
`docs/architecture/`-shaped corpus: a root `README.md` with a
plain-English platform narrative and a master dependency diagram, one doc
per repo (and per workspace package, for repos that are themselves
pnpm/turbo/Nx/Cargo/Go workspaces), and a machine-parseable
`diagrams/dependency-graph.mmd`. Every factual claim is tagged
`[C]`onfirmed, `[I]`nferred, or `[U]`nknown, never invented, and secret
values are never quoted — only their presence at a `file:line` is noted.

## When To Use It

When asked to map or document architecture across multiple repos, produce
a `docs/architecture` folder from scratch, or as a prerequisite for
`runbook-from-corpus`. Not for documenting a single service — see
`microservice-docs` for that.
