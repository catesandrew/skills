---
name: frontend-scaffold
description: Use when you need to generate or wire frontend plumbing — feature flags, environment variables, API endpoint clients, or logging setup — into an existing project, following the project's detected conventions rather than judging code quality.
---

# frontend-scaffold

Generates frontend **plumbing** consistently with a project's existing patterns. This is code *generation*, kept deliberately separate from `frontend-quality-loop` (which *grades* code). Run scaffold to add the wiring, then run the quality loop to grade it.

Provider-portable (Claude Code, Codex, Gemini). On Claude Code it can delegate generation to an executor subagent; elsewhere it edits inline. Either way it mirrors existing conventions instead of imposing new ones.

## Inputs

| Variable | Description | Example |
|----------|-------------|---------|
| `${input:task}` | What to scaffold: `feature-flag`, `env-var`, `api-endpoint`, `logging` | `api-endpoint` |
| `${input:name}` | The identifier being added | `checkout-redesign`, `STRIPE_KEY`, `getInvoices` |
| `${input:spec}` | Details: flag default, env scope, endpoint method/path/shape, log level (optional) | `GET /invoices?lenderCode -> Invoice[]` |
| `${input:remove}` | Set `true` to remove the named item instead of adding it | `true` |

## Step 0: Detect conventions first (always)

Never generate blind. Read how the project already does the thing:
- **Flags:** grep for existing flag usage (LaunchDarkly, `unleash`, a local `flags.ts`, env-based gates). Match the same accessor.
- **Env vars:** read `.env.example` / `.env.*`, the framework's env convention (`NEXT_PUBLIC_*`, Vite `VITE_*`, Angular `environment.ts`), and any typed-env wrapper (`zod`-validated env).
- **API clients:** find the existing data layer (fetch wrapper, axios instance, react-query hooks, generated OpenAPI client) and copy its shape, error handling, and auth/tenant header pattern.
- **Logging:** find the current logger (sawdust, pino, winston, console wrapper) and its level/format conventions.

State what you found in one line before generating. If the project has no existing pattern, propose the minimal idiomatic one and say so.

## Tasks

### feature-flag
- Add the flag to the project's flag source using the existing accessor; default per `${input:spec}` (default `false` / off).
- Wire one usage site only if requested; otherwise just register the flag and show the accessor snippet.
- For `${input:remove}=true`: remove the registration and every reference, leaving the enabled-path code in place (de-gate, don't delete behavior — confirm if ambiguous).

### env-var
- Add to `.env.example` with a placeholder and a comment describing it.
- If a typed-env wrapper exists (e.g. `zod`-validated `env.ts`), add the key to the schema with the right type and `${input:spec}` validation.
- Respect the public/private boundary (`NEXT_PUBLIC_` / `VITE_` only for client-exposed values). **Never commit a real secret** — placeholder only; note where the real value goes (vault / CI secret).
- For `${input:remove}=true`: remove from example, schema, and all `process.env` / `import.meta.env` references; flag any orphaned usage.

### api-endpoint
- Generate a typed client function/hook in the existing data layer matching `${input:spec}` (method, path, params, response type).
- Reuse the existing fetch/axios instance, error handling, and required headers (auth token, tenant/lender scoping if the project uses it — do not invent a new client).
- If the project uses react-query, generate the matching `useQuery`/`useMutation` hook with a stable query key.
- Add the response/request types; reuse generated OpenAPI types if present rather than hand-rolling.

### logging
- Wire the project's existing logger at requested sites; never introduce a second logging library if one exists.
- Match level conventions and structured-field format.
- **Never log secrets, tokens, or PII** — redact per project policy.
- If no logger exists, scaffold a minimal wrapper around the existing console usage and note the upgrade path.

## Output Format

### 🔎 Conventions found
What pattern the project already uses for this task.

### 🛠 Changes
Files created/modified with a short diff summary and file:line.

### ➡️ Next
Remind the user to run `frontend-quality-loop` on the new code, plus any manual step (set the real secret in vault, enable the flag, regenerate OpenAPI types).

## Common Mistakes
- **Generating before detecting** — inventing a new fetch wrapper when the repo already has one creates inconsistency the quality loop will then flag. Detect first.
- **Committing real secrets** — env scaffolding adds placeholders only; the real value lives in a vault/CI secret, never in the repo.
- **Crossing the public/private env boundary** — exposing a server secret via `NEXT_PUBLIC_`/`VITE_` leaks it to the browser bundle.
- **Adding a second logging/flag library** — always reuse the existing one; two loggers means inconsistent output and double config.
- **Deleting behavior when removing a flag** — `${input:remove}` de-gates (keeps the enabled path), it does not delete the feature unless explicitly asked.
- **Doing quality grading here** — this skill generates; it does not grade. Hand off to `frontend-quality-loop`.
