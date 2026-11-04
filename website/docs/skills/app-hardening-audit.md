---
title: App Hardening Audit
description: Runs a checklist-driven security and launch-readiness audit on a web app's code, marks each check Pass, Fail or N/A with file-and-line evidence, and writes a findings report with concrete fixes.
---

# app-hardening-audit

## Why It Exists

`app-hardening-audit` was written in November 2026, in a single session, after looking at a public "AI launch readiness" checklist for apps built with AI builders (17 audit domains and 10 attack-style stress tests). That checklist sells its prompts, so this skill does not reuse or paraphrase them. It covers similar ground with checks written from public standards instead: the OWASP Top 10:2025, the OWASP Top 10 for LLM Applications 2025, the OWASP Top 10 for Agentic Applications 2026 (`ASI01`–`ASI10`), Supabase's row-level-security documentation and advisor lints, NIST SP 800-63B-4, and Stripe's webhook and PCI guidance. Every source is listed in `references/sources.md`, and claims that could not be checked against the live document are marked there as unverified.

## What It Does

The agent detects the stack, sets eight profile flags (auth, supabase, payments, ai, ugc, eu, admin, agent-oauth), and runs only the domains that apply. Each check has an ID, what to verify, how to verify it (files to read, `rg` patterns, safe local commands), the signal that means it fails, and the fix. About 160 checks are split across six reference files:

- **Auth and access:** authentication and sessions, authorization, Supabase RLS.
- **Secrets, endpoints, headers:** key handling, API protection, HTTP security headers.
- **Payments, entitlements, cost:** hosted-checkout scope, webhook verification, server-side paywalls, spend caps on AI endpoints.
- **AI and agents:** LLM risks mapped to `LLM01:2025`–`LLM10:2025`, agent risks mapped to `ASI01`–`ASI10`.
- **Privacy and data:** GDPR rights and data minimization.
- **Operations and release:** dependencies, resilience, abuse and moderation, deployment, accessibility basics.

A separate `references/stress-tests.md` has 11 defensive scenarios (`ST-01` to `ST-11`), such as cross-tenant access, webhook replay, a client-trusted role, and prompt injection through tool output. Each is a "verify the code defends against X" check with a local-only repro. The output follows `references/report-template.md`: a verdict, status and severity counts, top findings with `path:line` evidence, a full check table, and unknowns to resolve.

## How To Use It

Triggers on: auditing an app's security or launch readiness, hardening a vibe-coded or AI-built app before release, checking Supabase RLS, secrets, payments or LLM safety in a codebase.

```sh
skills add -g catesandrew/skills --skill skills/app-hardening-audit
```

```sh
npm install @catesworks/skill-app-hardening-audit
```

```
/plugin marketplace add catesandrew/skills
/plugin install cw@skills
```

The last one installs every skill as a single bundled plugin named `cw`; there is no standalone per-skill plugin.

## Gotchas & Invariants

- The report is findings, not certification. It is not a penetration test, and a person makes the release decision. The disclaimer sits at the top of every report.
- Analysis is static and local by default. Active testing runs only against the user's own localhost or a staging host they confirm, never a third-party or production system.
- Secret values are redacted in the report. Evidence is a `path:line` and a short paraphrase.
- A check the agent cannot decide from the repo is marked Unknown, not Pass.
- Standard IDs are cited only where they were checked against the live source. ASVS requirement numbers and AI RMF subcategories are deliberately not cited.
- The skill has not been run against a real app yet, and not every `rg` pattern has been syntax-tested. The A11Y-03 pattern needs `--pcre2`.

## Related Skills

- [audit-a11y-code](/docs/skills/audit-a11y-code): a deeper static accessibility review of a single component, for when the A11Y checks here flag something.
- [audit-react-component](/docs/skills/audit-react-component): reviews hooks and render behavior, which this skill does not cover.

---

_Sourced from: skills/app-hardening-audit/SKILL.md, skills/app-hardening-audit/metadata.json, skills/app-hardening-audit/references/sources.md_
