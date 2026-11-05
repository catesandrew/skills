---
name: app-hardening-audit
description: Use when an app is about to launch, take payments, open signups, or ship AI features and the user wants a security and launch-readiness review of the codebase — especially AI-builder or "vibe-coded" apps on Supabase, Next.js, Stripe, or LLM-provider stacks. Triggers on "is this safe to launch", "security audit", "launch readiness", "harden this app", "check my RLS", "pre-launch checklist", "production readiness review", or a request for Pass/Fail findings with fixes.
---

# app-hardening-audit

Runs a checklist-driven security and launch-readiness audit against a codebase and writes a findings report: every applicable check is marked **Pass**, **Fail**, **Partial**, **Unknown**, or **N/A**, with `file:line` evidence and a concrete fix for every non-Pass.

The checks are written from public standards (OWASP, NIST, Supabase, Stripe, PCI SSC, GDPR, IETF, W3C — see [references/sources.md](references/sources.md)). They target the mistakes that show up most in fast-built apps: RLS left off, secret keys shipped to the browser, client-trusted roles, unsigned webhooks, uncapped LLM spend, and agents with more power than the user who drives them.

> **Disclaimer — include it in every report.** This audit produces findings, not a certification. It cannot prove the absence of vulnerabilities, it is not a penetration test, and it is not legal or compliance advice. A human owns the release decision.

## Safety rules (read before running anything)

1. **Static and local by default.** Read code, config, migrations, lockfiles, and CI files. Run only safe local commands: linters, `npm audit`/`pnpm audit`, `supabase db advisors` against a **local** stack, `git log`, a local build.
2. **Active tests only against hosts the user owns and names.** Allowed: `localhost`, a local Supabase stack, or a staging URL the user gives as `${input:staging_url:none}`. If none is given, skip every active step and mark it **Unknown** with "needs active test".
3. **Never** send traffic to production, to third-party services (Stripe, OpenAI, Anthropic, OAuth providers), or to any host the user has not confirmed is theirs. Use test-mode keys and CLI fixtures (`stripe trigger`, `stripe listen`) only against local endpoints.
4. **Never print secret values.** When a secret is found, report the file, line, and key *type* (e.g. "`sb_secret_…` prefix"), redact the value, and recommend rotation. Do not paste it into the report, a commit, or a chat message.
5. **Do not fix while auditing** unless the user asks. The audit is report-only; fixes are a separate pass.

## Inputs

| Param | Description | Default |
|---|---|---|
| `${input:target_path:.}` | Repo or app directory to audit | current directory |
| `${input:profile:auto}` | Comma list of app-profile flags (below), or `auto` to detect | `auto` |
| `${input:staging_url:none}` | A host the user owns for active checks (headers, rate limits). `none` = static only | `none` |
| `${input:report_path:./hardening-audit.md}` | Where to write the report | `./hardening-audit.md` |
| `${input:depth:standard}` | `quick` (Critical/High checks only), `standard`, or `full` (all checks + every stress test) | `standard` |

### App-profile flags

Profiles decide which domains apply. A domain whose profile is absent is reported as **N/A** with the reason, not silently dropped.

| Flag | Turn on when the code shows… | Adds domains |
|---|---|---|
| `auth` | Any login, session, or user table | AUTH, AUTHZ |
| `supabase` | `@supabase/*`, `supabase/` dir, `supabase/config.toml` | RLS |
| `payments` | `stripe`, `@stripe/*`, Paddle, Lemon Squeezy, checkout routes | PAY, ENT |
| `ai` | `openai`, `@anthropic-ai/*`, `ai` (Vercel AI SDK), `langchain`, `@google/genai`, model-provider env vars | LLM, COST (LLM part) |
| `ugc` | Uploads, comments, posts, profiles, public pages users author | ABUSE, storage checks |
| `eu` | EU/UK users, a cookie banner, a privacy policy mentioning GDPR, or the user says so | PRIV (GDPR depth) |
| `admin` | `/admin` routes, role columns, back-office tools | AUTHZ admin checks |
| `agent-oauth` | The app acts on a user's behalf in third-party accounts (Google, GitHub, Slack…), runs tool-calling agents, or exposes an MCP server | AGT |

Always-on domains: SEC (secrets), API, HDR (headers), COST (non-LLM), DATA, DEP, OPS, REL (deployment), A11Y.

## Procedure

### 1. Detect the stack

Read, in order: `package.json` (and workspace manifests), lockfile type, framework config (`next.config.*`, `vite.config.*`, `remix.config.*`), `supabase/config.toml` and `supabase/migrations/`, `vercel.json` / `netlify.toml` / `fly.toml` / `Dockerfile`, `.env.example`, `.github/workflows/`, `middleware.ts`.

Write a one-paragraph **Stack** section: framework + version, router type, hosting target, database/auth provider, payment provider, LLM providers, agent/tool frameworks.

### 2. Select applicable domains

Resolve `${input:profile}`. If `auto`, set each flag from the evidence column above and **list the evidence** (e.g. "`ai`: `openai@5` in package.json, `OPENAI_API_KEY` in `.env.example`"). Ask the user to confirm the profile only if a flag is ambiguous and it changes Critical-severity coverage (for example, whether EU users exist).

### 2b. Build the AI system inventory (only when `ai` or `agent-oauth` is on)

AI features are probabilistic: the same input can give different outputs and the behavior space cannot be enumerated, so the audit works from outcomes, not only from code paths. For each AI feature, record in the report:

- **Never-behaviors:** the written list of outcomes it must never produce, and its owner (LLM-12). If none exists, that is the first finding.
- **Channels in:** every place untrusted content can enter (chat, web pages, repos/dependencies, uploads, inbound email/messages, tickets, retrieved documents).
- **Channels out and tools:** every action it can take (send, write, delete, pay, post, run code) and the credential each uses.
- **Runtime enforcement and re-testing:** what blocks a harmful call at execution time (AGT-13) and when it was last adversarially tested (LLM-13).

The inventory drives LLM-*, AGT-*, and ST-05/12/13/14.

### 3. Run each check

Load the reference file for each selected domain and run its checks in ID order:

| Domain | IDs | Reference |
|---|---|---|
| Authentication & sessions | AUTH-* | [references/auth-and-access.md](references/auth-and-access.md) |
| Authorization, admin & tenancy | AUTHZ-* | [references/auth-and-access.md](references/auth-and-access.md) |
| Supabase RLS & storage | RLS-* | [references/auth-and-access.md](references/auth-and-access.md) |
| Secrets & API keys | SEC-* | [references/secrets-endpoints-headers.md](references/secrets-endpoints-headers.md) |
| API endpoint protection | API-* | [references/secrets-endpoints-headers.md](references/secrets-endpoints-headers.md) |
| HTTP security headers | HDR-* | [references/secrets-endpoints-headers.md](references/secrets-endpoints-headers.md) |
| Payments & webhooks | PAY-* | [references/payments-entitlements-cost.md](references/payments-entitlements-cost.md) |
| Entitlements & paywall | ENT-* | [references/payments-entitlements-cost.md](references/payments-entitlements-cost.md) |
| Cost exhaustion | COST-* | [references/payments-entitlements-cost.md](references/payments-entitlements-cost.md) |
| AI / LLM protections | LLM-* | [references/ai-and-agents.md](references/ai-and-agents.md) |
| OAuth & agent delegation | AGT-* | [references/ai-and-agents.md](references/ai-and-agents.md) |
| Privacy & data-subject rights | PRIV-* | [references/privacy-and-data.md](references/privacy-and-data.md) |
| Data minimization & retention | DATA-* | [references/privacy-and-data.md](references/privacy-and-data.md) |
| Dependencies & supply chain | DEP-* | [references/operations-and-release.md](references/operations-and-release.md) |
| Operational resilience | OPS-* | [references/operations-and-release.md](references/operations-and-release.md) |
| Abuse & moderation | ABUSE-* | [references/operations-and-release.md](references/operations-and-release.md) |
| Deployment readiness | REL-* | [references/operations-and-release.md](references/operations-and-release.md) |
| Accessibility basics | A11Y-* | [references/operations-and-release.md](references/operations-and-release.md) |

For each check:

1. Do what its **How** line says: read the named files, run the `rg` patterns, run the safe command.
2. Follow every hit to the code that decides the outcome. A grep hit is a lead, not a finding.
3. Record a status and evidence (see the scale below). Evidence is `path:line` plus a one-line quote or paraphrase. Never cite a line you did not read.
4. For every non-Pass, write the fix in terms of *this* codebase: name the file, function, or migration to change.

`quick` depth runs only checks whose default severity is Critical or High.

### 4. Run the stress tests

[references/stress-tests.md](references/stress-tests.md) holds scenario checks that cut across domains (cross-tenant IDOR, client-trusted role, webhook replay, prompt injection through tool output, cost loops, and others). Each is phrased as "verify the code defends against X". Run every scenario whose profile applies at `standard` depth, all of them at `full`. Trace the scenario through the code path; run the optional local reproduction only under the safety rules above.

### 5. Write the report

Use [references/report-template.md](references/report-template.md). Write to `${input:report_path}`. Sort findings by severity, then domain. Put the disclaimer at the top. Then give the user a 5-line summary in chat: counts by status, the Critical/High items, and the report path.

## Status scale

| Status | Meaning |
|---|---|
| **Pass** | The control exists and you read the code that enforces it |
| **Fail** | The control is missing or bypassable, with evidence |
| **Partial** | Present on some paths, missing on others (list the missing ones) |
| **Unknown** | Cannot be decided from the repo (dashboard setting, needs active test, missing access). Say what would decide it |
| **N/A** | The domain or check does not apply to this profile. Say why |

Never mark **Pass** on absence of evidence ("no grep hits for `service_role`") without also confirming where the thing *would* be (e.g. the server client file). Absence of a hit in a repo with dashboard-managed config is **Unknown**.

## Severity scale

Each check has a default severity. Raise or lower it with a one-line reason tied to this app.

| Severity | Use when | Example |
|---|---|---|
| **Critical** | Remote, unauthenticated, or any-user compromise of other users' data, money, or the whole account; or a live secret in a public place | RLS off on a table holding user data; `sb_secret_`/`sk_live_` key in client bundle; unsigned payment webhook grants paid plan |
| **High** | Authenticated user can reach other users' data or paid features; unbounded spend; account takeover with some precondition | IDOR on `/api/orders/[id]`; no per-user LLM cap; role read from request body |
| **Medium** | Defense-in-depth gap with a plausible attack path | Missing CSP; no login rate limit; verbose stack traces in prod |
| **Low** | Hygiene that reduces blast radius or improves detection | No `security.txt`; no dependency update bot |
| **Info** | Observation, no action required | Framework default already sets a header |

Launch guidance for the report's verdict line: any open Critical means "not ready"; open Highs need an owner and date. The human still decides.

AI-specific reading of the scale: a **Pass** on an LLM-* or AGT-* check means the control exists and you read it. It never means the model "cannot be jailbroken" or that the feature is "safe." Static review cannot elicit model behavior, so report what the code limits and list what was not tested.

## Common Mistakes

- **Writing an "all clear" for AI features.** There is no clean bill of health for a stochastic system, and security is a point-in-time result. Say which declared behaviors are blocked by code, which were never tested, and recommend re-testing on model, prompt, or tool changes.
- **Treating "read-only" as low risk.** A bot that can read HR, finance, or CRM data is a disclosure path for anyone who can talk to it. Check who it asks as, not only what it can write.
- **Assuming an attacker is required.** A benign request ("delete unused files") can destroy recovery data. Check destructive tools for previews, caps, and reversibility even when no hostile user exists.
- **Counting a confirmation prompt as a control without reading it.** Prompts on every action cause approval fatigue; a human rubber stamp is not a control. Check that prompts are risk-tiered and show the concrete action.
- **Watching only the chat channel.** Web pages, repos, files, and inbound email are also inputs, and the same agent acts on them with the user's credentials.
- **Expecting existing monitoring to catch agent harm.** Data sent out by an agent looks like normal traffic. Confirm tool-call logs exist and something reads them.

- **Trusting a grep.** `rg "enable row level security"` finding a hit does not mean every table has it. List every table in `public` from the migrations and check each.
- **Marking Pass from the client code.** Hiding a button is not authorization. Every AUTHZ/ENT/PAY Pass needs the *server-side* line that enforces it.
- **Confusing the Supabase publishable/anon key with a secret.** The publishable (`sb_publishable_…`) and legacy `anon` keys are meant to be public; RLS protects the data. The secret (`sb_secret_…`) and legacy `service_role` keys bypass RLS and must never reach a browser or a repo.
- **Printing secrets.** Redact. A report that contains the leaked key is a second leak.
- **Testing against production or third parties.** Rate-limit, replay, and header checks run against `localhost` or the user's named staging host only. No staging host means **Unknown**, not "I'll try prod quickly".
- **Inventing compliance claims.** Do not write "GDPR compliant" or "PCI compliant". Write which checks passed. PCI scope and GDPR obligations depend on facts outside the repo; say so.
- **Citing IDs you did not verify.** Use the OWASP/NIST/ASVS identifiers in [references/sources.md](references/sources.md). Do not make up requirement numbers.
- **Dropping N/A domains silently.** The reader needs to see that payments were *considered* and judged out of scope, with the reason.
- **Reporting a finding without a fix.** Every Fail and Partial needs a concrete change: which file, which function, which migration, which setting.
- **Fixing during the audit.** Report first. Edits mid-audit change the evidence and hide what was wrong.
- **Overweighting style.** A missing `Permissions-Policy` is not Critical. Severity follows impact on users' data and money.
