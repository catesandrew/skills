---
title: Microservice Docs
description: Generates and maintains comprehensive, production-grade microservice documentation purely from static code analysis — READMEs, C4 diagrams, API contracts, OpenAPI specs, data models, and more.
---

# microservice-docs

## Why It Exists

Added in `9dfa72e8` ("chore: add new skills", 2026-04-17), the same 24-file bulk commit that introduced `jira-estimate`. The commit message itself gives no per-skill rationale beyond generic AI-attribution metadata, and no other commit in `~/.dotfiles` touches this skill's content besides its later path relocation into `agent-skills/skills/`. This is a thin trail on the "why" — but the skill's own SKILL.md is unusually detailed (287 lines plus 12 reference template files), suggesting significant deliberate design investment even though the commit history doesn't narrate it.

## What It Does

The skill generates an entire documentation tree for a microservice from static analysis alone — explicitly "no compilation, building, or execution." Its five core principles, stated up front, are: static-analysis-only, code-grounded (every documented endpoint/model/component must actually exist in the codebase — never hallucinated), progressive generation (each phase builds on the last), cross-referenced documents, and generic/adaptable templates across language and cloud provider.

It defines a full required structure — root `README.md`, a `docs/README.md` index, `project-overview.md`, `openapi-docs/`, one file per endpoint under `api-contracts/`, four levels of C4 architecture diagrams (system-context → container → component → deployment) as Mermaid, `data-models/` with request/response docs and an ER diagram, `sequence-diagrams/` (one per major flow), `dependencies/` (graph, internal, external, risk assessment), `data-lineage/`, and `infrastructure/` — but explicitly adapts: no Terraform means skip IAM docs, a single endpoint means inline the contract, no external calls means skip data lineage. Twelve phases run in a fixed generation order, each pointed at its own reference template file (e.g. `references/API-CONTRACT-TEMPLATE.md`, `references/DATA-MODEL-TEMPLATES.md`). The data-model phase carries the strictest rule in the skill: **read the actual source file for every class before documenting it** — never infer fields from a class name or a similar class — backed by an explicit six-point field verification checklist. An auto-update trigger table maps changed file types (controllers, config files, Docker/K8s/Terraform, build files) back to which docs need refreshing, and every generated file must end with a `Last Updated` metadata footer.

## How To Use It

Triggers on: creating a new service, updating APIs, changing configs, modifying deployments, or when documentation is missing or outdated and needs comprehensive microservice documentation generated from static code analysis.

```sh
skills add -g catesandrew/skills --skill skills/microservice-docs
```

```sh
npm install @catesworks/skill-microservice-docs
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Hallucinating fields is called out as the single most critical failure mode — every field in every table or diagram must trace back to a specific line in a source file.
- External library types must be marked "externally defined," listing only what's confirmed from usage — never fabricating their internal fields.
- If a README already exists, it must be read fully, compared against the checklist, and gaps presented for user confirmation before any edit — never silently rewritten.
- A single-endpoint service should not get all 11 phases of documentation; the Adaptation Rules exist specifically to skip irrelevant sections for simple projects.
- Updating one doc requires checking that every other doc that links to it is still accurate — stale cross-references are treated as a defect.
- Every documentation file must end with a `Last Updated: YYYY-MM-DD` metadata footer — no exceptions.
- Validation annotations and enum values in data-model docs may only include what's actually present in source — nothing inferred from convention.

---

_Sourced from: skills/microservice-docs/SKILL.md, skills/microservice-docs/metadata.json, ~/.dotfiles git history (commit `9dfa72e8`)_
