---
name: tsdoc
description: Add expert-level inline TSDoc to staged TypeScript code. Use when the user wants exported APIs documented thoroughly, internal helpers documented concisely, and TSDoc blocks inserted directly into staged files without changing runtime behavior.
---

# TSDoc Skill

Document staged TypeScript code inline using TSDoc, with different depth for public and internal APIs.

## When to Use

Use this skill when:
- The user asks to document staged TypeScript code
- The user wants TSDoc added inline to existing files
- The task calls for different documentation depth for exported vs internal APIs
- The task requires expert-level API docs without runtime changes

## Workflow

1. Inspect the staged diff and identify affected TypeScript files.
2. Read the surrounding code to understand symbol intent, invariants, and call patterns before writing docs.
3. Add TSDoc blocks above:
   - every exported function, type, interface, and const in scope
   - internal helpers that are non-trivial or reused
4. Keep exported API docs thorough and internal helper docs concise.
5. Preserve existing formatting and avoid any runtime behavior changes.

## Exported API Depth

For exported functions, types, interfaces, and consts, document:
- purpose and why the symbol exists
- parameter semantics and constraints
- options object fields, defaults, and omitted behavior
- optional parameter fallback behavior
- union parameter variants and how each behaves
- return shape, invariants, and expected consumption
- error behavior or failure paths
- ordering, batching, concurrency, caching, or performance concerns when relevant
- at least one `@example`

For exported types and interfaces, also document:
- overall contract and intent
- each field meaning
- defaults when applicable
- deprecated fields explicitly

## Internal Helper Depth

For internal helpers, document only:
- short purpose
- key parameters
- notable or non-obvious behavior

Skip trivial helpers that are obvious and not reused.

## Required Tags

Use TSDoc tags when relevant:
- `@param`
- `@returns`
- `@throws`
- `@deprecated`
- `@defaultValue`
- `@remarks`
- `@example`
- `@see`

When referencing symbols, prefer `{@link TypeName}` or `{@link Module.Member}`.

## Constraints

- Keep comments concise but complete.
- Do not restate obvious code.
- Preserve existing formatting conventions.
- Do not change runtime behavior.
- ASCII only. Do not use Unicode punctuation or bullets.

## Output Behavior

Edit the file inline by inserting TSDoc blocks directly above the relevant declarations.

Do not emit standalone prose documentation unless the user explicitly asks for it.

## Quality Bar

- Prefer accurate semantics over generic wording.
- Document behavior visible at the API boundary, not implementation trivia.
- Call out failure modes and invariants when they matter to callers.
- If behavior is unclear from the code, inspect adjacent call sites before documenting.
