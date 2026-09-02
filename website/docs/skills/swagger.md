---
title: Swagger
description: Adds inline Swagger/OpenAPI JSDoc to Next.js App Router API route handlers, matching the real HTTP contract without changing runtime behavior, with an optional combined TSDoc mode.
---

# swagger

## Why It Exists

This skill was first added in dotfiles commit `7a82a083` ("chore: add swagger skill") as a standalone Codex skill at `home/.codex/skills/swagger/SKILL.md` (102 lines, with its own `agents/openai.yaml`). It was carried into the shared `agent-skills/skills/swagger` location in `aa6eef69` ("chore: relocate skills"), which deleted the old `home/.codex/skills/swagger` path in the same commit and landed the file at 98 lines — matching the current public repo's `skills/swagger/SKILL.md` line-for-line. There is no distinguishing rationale beyond the relocation itself; the commit messages are terse mechanical moves, not design narratives.

## What It Does

Given one or more Next.js App Router `route.ts` files, the skill reads every exported HTTP handler (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`) plus adjacent helpers, response builders, validators, and auth checks, then inserts one `@swagger` JSDoc block immediately above each handler. Each block documents `operationId`, `summary`, `description`, `tags`, the auth/`security` model, every query/path/header parameter with types and constraints, the JSON request body schema where applicable, success responses with accurate status codes and at least one example, and common error responses (`400`, `401`, `404`, `429`, `500`) when relevant.

An optional `combined` mode (`${input:mode}=combined`) layers a TSDoc pass on top of the same file — documenting exported handlers, types, and non-trivial internal helpers — while keeping Swagger focused on the HTTP contract and TSDoc focused on code semantics so the two documentation layers don't restate each other.

The skill is deliberately precision-focused: it requires matching the actual code paths, defaults, and JSON field naming convention (snake_case vs camelCase) rather than writing generic descriptions, and it explicitly forbids changing runtime logic — only comments (and, when needed, type-only imports for doc references) may be added.

## How To Use It

Triggers on: "Swagger or OpenAPI docs on a route.ts file", "`@swagger` JSDoc blocks added above Next.js route handlers", "both Swagger and TSDoc added to the same route file", "route docs that match the real HTTP contract without changing runtime behavior".

```sh
skills add -g catesandrew/skills --skill skills/swagger
```

```sh
npm install @catesworks/skill-swagger
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

This last one installs all 52 skills as a single bundled plugin named `cw` — there is no standalone per-skill plugin.

## Gotchas & Invariants

- Do not modify runtime logic — only comments and, where necessary, non-executing type-only imports.
- Place each `@swagger` block immediately above the exported handler it documents; generate a separate block per HTTP method in the same file.
- Match actual code behavior: real status codes from the response builder or `NextResponse` calls, real required fields from the validator (Zod/Joi/class-validator), not assumptions.
- Use snake_case response field names when the API itself uses them.
- Prefer existing component schema references already defined in the repo; only inline a new schema when none exists.
- If the route returns a standard error envelope, document it consistently across every handler, not just some.
- Update `operationId` after a handler rename/move to avoid spec collisions.
- ASCII only — no Unicode punctuation or bullets.
- In combined mode, TSDoc on a handler should add semantic context (why it exists, ordering invariants) rather than repeat the HTTP contract already captured in `@swagger`.

## Related Skills

- [tsdoc](/docs/skills/tsdoc) — the TSDoc engine this skill layers in via `combined` mode.
- [zod-repair](/docs/skills/zod-repair) — a related documentation-adjacent skill for the Zod schemas that often back a route's request/response validation.

---

_Sourced from: skills/swagger/SKILL.md, skills/swagger/metadata.json, ~/.dotfiles git history (commits `7a82a083`, `aa6eef69`)_
