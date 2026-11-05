# Report template

Copy this structure into `${input:report_path}`. Keep evidence as `path:line` with a short quote or paraphrase. Redact all secret values.

````markdown
# App hardening audit — <app name>

> **Findings, not certification.** This report lists what was checked and found in the code and configuration available on <date>. It does not prove the absence of vulnerabilities. It is not a penetration test and not legal or compliance advice. A human owns the release decision.

**Target:** `<path>` at commit `<sha>`
**Depth:** quick | standard | full
**Active testing:** none (static only) | localhost | `<staging host>` (user-confirmed)
**Auditor:** <agent/model>, run by <person>

## Verdict (advisory)

<One line. "Not ready: N open Critical" | "Ready with conditions: N High need owners" | "No Critical/High found in scope".>

| Status | Count |
|---|---|
| Fail | |
| Partial | |
| Unknown | |
| Pass | |
| N/A | |

| Severity (Fail + Partial) | Count |
|---|---|
| Critical | |
| High | |
| Medium | |
| Low | |

## Stack

<Framework + version, router, hosting, DB/auth, payments, LLM providers, agent/tool frameworks.>

## Profile

| Flag | On/Off | Evidence |
|---|---|---|
| auth | | |
| supabase | | |
| payments | | |
| ai | | |
| ugc | | |
| eu | | |
| admin | | |
| agent-oauth | | |

Domains marked N/A and why:
- <DOMAIN> — <reason>

## AI system inventory (only if `ai` or `agent-oauth` is on)

| AI feature | Never-behaviors + owner (LLM-12) | Channels in | Tools / credentials out | Runtime block (AGT-13) | Last adversarial test (LLM-13) |
|---|---|---|---|---|---|
| | | | | | |

Governance answers, from the evidence above (write "Unknown" where the repo cannot say):
1. Written list of behaviors each AI feature must never exhibit, and who owns it: <answer>
2. What stops one of those behaviors in production, and would that show up in existing monitoring: <answer>
3. How often each feature is re-tested and what happened the last time: <answer>

> AI results are point-in-time. This report does not say the AI features are safe; it says which declared behaviors the code blocks and which were not tested.

## Top findings

<The Critical and High Fail/Partial items, most severe first. One block each.>

### <ID> <title> — <Severity> — <Fail|Partial>
- **Evidence:** `path/to/file.ts:42` — <what the line does>
- **Impact:** <who can do what to whom>
- **Fix:** <concrete change in this codebase: file, function, migration>
- **Standard:** <e.g. OWASP A01:2025; LLM06:2025; ASI03; GDPR Art. 17; Supabase lint 0013>

## All checks

| ID | Check | Status | Severity | Evidence | Fix (short) |
|---|---|---|---|---|---|
| AUTH-01 | | | | | |
| … | | | | | |

## Stress tests

| ID | Scenario | Result | Code path traced | Related checks |
|---|---|---|---|---|
| ST-01 | Cross-tenant IDOR | Defended / Not defended / Partial / Unknown / N/A | `a.ts:10 → b.ts:22` | AUTHZ-01, RLS-02 |
| … | | | | |

## Unknowns to resolve

- <ID> — <what would decide it: dashboard setting, staging test, question for the owner>

## Out of scope / not checked

<e.g. mobile app binary, infrastructure outside the repo, third-party systems. For AI features: model behavior under live adversarial pressure, jailbreak resistance, and anything the static review could not elicit.>

## Method

Static review of source, configuration, migrations, lockfiles, and CI files; safe local commands (<list the ones actually run>). Checks derive from public standards listed in the skill's `references/sources.md`.
````

## Chat summary (after writing the file)

```
Audit written to <path>.
Fail <n> · Partial <n> · Unknown <n> · Pass <n> · N/A <n>
Critical: <IDs or "none">
High: <IDs or "none">
Biggest single fix: <one sentence>
```
