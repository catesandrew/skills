---
name: swagger
description: Use when the user wants Swagger/OpenAPI JSDoc added or updated on Next.js App Router route handlers, or wants combined Swagger and TSDoc on the same route file.
---

# Swagger Skill

Add inline Swagger/OpenAPI JSDoc to Next.js App Router API routes, with an optional combined TSDoc pass for the same file.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:files}` | Route file path(s) to document | `app/api/users/route.ts` |
| `${input:mode}` | `swagger` (default) or `combined` for Swagger + TSDoc | `swagger` |

## When to Use

Use this skill when:
- The user asks for Swagger or OpenAPI docs on a `route.ts` file
- The user wants `@swagger` JSDoc blocks added above Next.js route handlers
- The user wants both Swagger and TSDoc added to the same route file (`${input:mode}=combined`)
- The task requires route docs that match the real HTTP contract without changing runtime behavior

## Workflow

1. Read `${input:files}` and identify every exported handler: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.
2. Read adjacent helpers, response builders, validators, auth checks, parsers, and existing repo Swagger patterns before documenting.
3. Add or update one `@swagger` block immediately above each exported handler.
4. In `combined` mode, also add TSDoc above exported handlers and non-trivial internal helpers.
5. Preserve formatting, ordering, and runtime behavior.

## Swagger Requirements

For each handler, document:
- `operationId`, `summary`, `description`, and `tags`
- auth model and `security` when required
- every supported query, path, and header parameter with types, defaults, enums, constraints, and examples
- JSON request body schema for methods that accept one
- success responses with accurate status codes, schemas, and at least one example
- common error responses (`400`, `401`, `404`, `429`, `500`) when applicable
- pagination, sorting, filtering, search, and `Link` header behavior when present
- caching, invalidation toggles, batching, concurrency, and upstream latency notes when relevant

## Swagger Precision Rules

- Match actual code paths, defaults, auth behavior, query parsing, pagination, and JSON field names.
- Prefer existing component schema references when the repo already defines them; otherwise inline a schema that matches the actual payload shape.
- Mark `required` fields accurately.
- Use snake_case response field names when the API uses them.
- If the route returns a standard error envelope, document it consistently across all handlers.

## TSDoc Requirements (combined mode only)

Add TSDoc above:
- every exported handler, type, interface, and const in the file
- internal helpers that are non-trivial or reused

For exported symbols, document:
- purpose and why the symbol exists
- parameter semantics and constraints
- return shape and consumption expectations
- error behavior or failure paths
- noteworthy ordering, caching, batching, or concurrency behavior
- at least one `@example` when it adds value

For internal helpers, document only a short purpose, key parameters, and notable non-obvious behavior.

Required tags when relevant: `@param`, `@returns`, `@throws`, `@remarks`, `@example`, `@see`, `@deprecated`, `@defaultValue`.

## Constraints

- Do not modify runtime logic.
- Only add or edit comments and, when necessary, non-executing type-only imports for documentation references.
- Place Swagger JSDoc immediately above the exported handler it documents.
- Keep existing formatting and code style.
- ASCII only. Do not use Unicode punctuation or bullets.

## Output Behavior

- Apply documentation inline in `${input:files}`.
- Generate separate `@swagger` blocks for each HTTP method in the same route file.
- In combined mode, keep Swagger focused on the HTTP contract and TSDoc focused on code semantics.

## Quality Bar

- Prefer precise schemas over vague descriptions.
- Do not restate obvious implementation details.
- Inspect parsing helpers and response builders when behavior is unclear before documenting.
- Follow existing repo conventions first, then fill gaps carefully.

## Common Mistakes

- **Documenting the wrong status codes** — read the actual response builder or `NextResponse` calls; don't assume `200` is always the success code.
- **Missing required fields on request body schemas** — check validators (Zod, Joi, class-validator) to determine which fields are truly required.
- **Stale `operationId` after renaming** — if a handler was renamed or moved, update `operationId` to avoid collisions in the generated spec.
- **Inconsistent error envelopes** — if the repo uses a shared error shape, use it in every `4xx`/`5xx` response, not just some.
- **Over-documenting in TSDoc what Swagger already covers** — in combined mode, TSDoc on a handler should add semantic context (why it exists, ordering invariants), not repeat the HTTP contract already in `@swagger`.
