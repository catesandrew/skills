---
title: Runbook From Corpus
description: Generates a symptom-first incident runbook strictly grounded in an existing multi-repo architecture corpus, citing the corpus rather than re-deriving from source.
---

# runbook-from-corpus

## Why It Exists

An incident runbook written by re-reading source under time pressure
drifts from reality fast and has no citation trail a responder can
verify. This skill instead only ever recombines an already-built
`architecture-corpus` corpus — its citations point at corpus docs, never
back into a repo's own source tree — so the runbook and the corpus can be
regenerated and cross-checked independently.

**Note:** this package is currently unpublished (`private: true`); the
usual `npm install`/git-archaeology sections below are omitted until it
ships. This will be backfilled once the introducing commit exists and/or
the package is published.

## What It Does

Reads an existing architecture corpus and writes a symptom-first incident
runbook: a quick-reference page for the first 15 minutes, a
symptom-to-cause known-failure catalog, do-not-touch hazard cards, and a
monorepo-aware appendix for failures spanning multiple packages inside
one workspace repo — every entry traceable to a specific corpus citation,
never invented.

## When To Use It

When asked to write, update, or re-verify a SEV1/incident/on-call runbook
for a documented multi-repo or multi-service system. Requires an existing
corpus (e.g. one built by `architecture-corpus`) — it will say so and
stop if none is found.
