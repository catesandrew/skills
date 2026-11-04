# Operations, supply chain, abuse, deployment, accessibility

Checks for DEP (dependencies and supply chain), OPS (operational resilience), ABUSE (abuse and moderation), REL (deployment readiness), and A11Y (accessibility basics).

Grounding: OWASP Top 10:2025 A03 Software Supply Chain Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions; OWASP ASVS 5.0; W3C WCAG 2.2. URLs in [sources.md](sources.md).

---

## DEP — Dependencies & supply chain

Always on.

### DEP-01 Lockfile committed and used in CI [High]
- **Verify:** One lockfile is committed and CI installs from it strictly (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`, `bun install --frozen-lockfile`).
- **How:** `git ls-files | rg 'package-lock.json|pnpm-lock.yaml|yarn.lock|bun.lockb?'`; read `.github/workflows/*`.
- **Fail signal:** No lockfile; CI runs `npm install`.
- **Fix:** Commit lockfile; strict install in CI and deploy builds.

### DEP-02 No known critical/high vulnerabilities in production deps [High]
- **Verify:** The package manager's audit shows no unresolved critical/high advisories in production dependencies.
- **How:** Run locally: `npm audit --omit=dev` / `pnpm audit --prod` / `yarn npm audit --environment production`. Record counts; list the critical/high ones with the fixed version.
- **Fail signal:** Critical/high advisories with an available fix not applied.
- **Fix:** Upgrade; if no fix exists, document the exposure and a mitigation.

### DEP-03 Framework and runtime are on supported versions [High]
- **Verify:** Framework (Next.js, React, etc.) and Node runtime are on currently supported release lines with security patches applied.
- **How:** Read versions from `package.json`, `.nvmrc`, `engines`, Dockerfile base image; check against the project's published support policy.
- **Fail signal:** End-of-life Node; framework major with no security backports.
- **Fix:** Upgrade plan with a date.

### DEP-04 Dependency updates are automated [Low]
- **Verify:** Dependabot, Renovate, or an equivalent opens update PRs, at least for security advisories.
- **How:** `.github/dependabot.yml`, `renovate.json`.
- **Fail signal:** Neither present.
- **Fix:** Add one with security updates enabled.

### DEP-05 Install scripts and new packages are reviewed [Medium]
- **Verify:** New dependencies are checked for typosquats and install-time scripts; where the package manager supports it, lifecycle scripts are restricted to an allow-list (e.g. pnpm `onlyBuiltDependencies`, `--ignore-scripts` with explicit rebuilds).
- **How:** Read `package.json`, `.npmrc`, `pnpm-workspace.yaml`. Look for odd near-duplicate names of popular packages.
- **Fail signal:** Packages with unknown publishers and `postinstall` scripts; git-URL dependencies on unpinned branches.
- **Fix:** Restrict lifecycle scripts; pin git deps to a commit; remove unused packages.

### DEP-06 CI/CD is hardened [Medium] — A03:2025, A08:2025
- **Verify:** Third-party GitHub Actions are pinned to a full commit SHA; workflow `permissions` are least-privilege; secrets are not exposed to `pull_request_target` runs from forks; deploy credentials are scoped.
- **How:** `rg -n "uses: " .github/workflows` (check for `@v` tags vs SHAs); `rg -n "pull_request_target|permissions:" .github/workflows`.
- **Fail signal:** `pull_request_target` that checks out PR code with secrets; `permissions: write-all`.
- **Fix:** Pin SHAs; set `permissions: contents: read` by default; avoid running untrusted code with secrets.

### DEP-07 Third-party scripts are controlled [Medium]
- **Verify:** Scripts loaded from third-party CDNs are few, known, and either self-hosted or covered by CSP; Subresource Integrity is used for static CDN files where versions are fixed.
- **How:** `rg -n "<script[^>]+src=|next/script|Script src="`.
- **Fail signal:** Many tag-manager-injected scripts on authenticated pages.
- **Fix:** Remove unused; self-host; SRI; CSP (HDR-02).

---

## OPS — Operational resilience

Always on.

### OPS-01 Errors are tracked [Medium] — A09:2025
- **Verify:** Server and client errors reach an error tracker or log sink that someone watches, with PII scrubbing (DATA-03).
- **How:** `rg -n "@sentry|bugsnag|rollbar|datadog|logtail|axiom|pino|winston"`.
- **Fail signal:** Errors only in `console.error` on serverless with no log drain.
- **Fix:** Add tracking with `beforeSend` scrubbing.

### OPS-02 Security events are logged and alertable [Medium] — A09:2025
- **Verify:** Login failures, password resets, role changes, admin actions, webhook signature failures, and rate-limit trips are logged with user/IP/time, and spikes alert.
- **How:** Read auth, admin, and webhook handlers for log calls.
- **Fail signal:** Signature failures silently return 400 with no log.
- **Fix:** Structured security log; one alert rule per event type.

### OPS-03 Health check and uptime monitoring [Low]
- **Verify:** A health endpoint (that does not leak internals) exists and an external monitor checks the main user flow.
- **How:** `rg -n "/health|/api/health|/status"`.
- **Fail signal:** First alert of downtime is a user email.
- **Fix:** Health route + uptime monitor.

### OPS-04 Backups exist and restore has been tested [High]
- **Verify:** Database backups or point-in-time recovery are enabled for production, and a restore has been rehearsed. Storage buckets have a backup or versioning story.
- **How:** Usually dashboard-only: mark **Unknown** and ask. Look for a restore runbook.
- **Fail signal:** Free tier with no backups for an app holding paid users' data; never-tested restore.
- **Fix:** Enable PITR/backups; do one restore drill to a scratch project.

### OPS-05 Failures fail closed [High] — A10:2025
- **Verify:** When an auth provider, entitlement lookup, rate limiter store, or moderation call errors, the code denies the action instead of allowing it.
- **How:** Read `catch` blocks around auth/entitlement/limiter calls: `rg -n -A3 "catch" ` in those files.
- **Fail signal:** `catch { return true }` in `hasAccess`; limiter error → allow unlimited.
- **Fix:** Deny on error (or degrade to a safe, limited mode), log, alert.

### OPS-06 Migrations are versioned and reversible [Medium]
- **Verify:** Schema changes go through versioned migration files applied in CI/deploy, not ad-hoc dashboard edits; destructive migrations have a rollback or backup step.
- **How:** Read `supabase/migrations/`, `prisma/migrations/`, `drizzle/`; compare to any "edited in dashboard" notes.
- **Fail signal:** No migrations folder but a live DB; RLS policies exist only in the dashboard.
- **Fix:** `supabase db pull`/diff into a migration; apply via CI.

### OPS-07 Timeouts and retries are bounded [Medium]
- **Verify:** Outbound calls set timeouts; retries use backoff and a max count; background jobs have dead-letter handling.
- **How:** `rg -n "retry|retries|backoff|timeout"` in HTTP clients and job code.
- **Fail signal:** Infinite retry loop on provider errors (also a cost risk).
- **Fix:** Timeout + capped exponential backoff.

### OPS-08 Incident contacts and kill switches exist [Low]
- **Verify:** There is an owner for incidents, a `SECURITY.md` or `/.well-known/security.txt` for reports, and feature flags or config to disable risky features (signups, AI, uploads) without a deploy.
- **How:** Look for the files and the flag system.
- **Fail signal:** No way to stop signups during an abuse wave short of redeploying.
- **Fix:** Add `security.txt`; add kill-switch flags.

---

## ABUSE — Abuse & moderation

Profile: `ugc` (and any app with public signup).

### ABUSE-01 Signup and public forms resist bots [Medium]
- **Verify:** Signup, contact, and invite forms have bot friction (CAPTCHA/Turnstile, proof-of-work, or provider bot protection) plus rate limits.
- **How:** `rg -n "turnstile|hcaptcha|recaptcha|captcha|botid"`.
- **Fail signal:** Unlimited unauthenticated signups that each get free quota.
- **Fix:** Add a challenge on unauthenticated forms; verify server-side.

### ABUSE-02 Users can report content and accounts [Medium]
- **Verify:** UGC has a report action that reaches a moderation queue a human reviews.
- **How:** `rg -n "report|flag|moderation_queue"`.
- **Fail signal:** No report path for public content.
- **Fix:** Report button + queue + admin view.

### ABUSE-03 Moderators can remove content and suspend accounts [Medium]
- **Verify:** Admin tooling can hide content, suspend or ban users, and the suspension is enforced server-side (AUTH and AUTHZ checks honour it).
- **How:** Read admin actions and the session guard for a `banned`/`suspended` flag.
- **Fail signal:** Ban flag exists but sessions keep working.
- **Fix:** Check the flag in the auth guard; revoke sessions on ban.

### ABUSE-04 Uploaded media is screened where required [Medium]
- **Verify:** Public image/video uploads pass through moderation appropriate to the platform; known illegal-content hash matching is considered where the platform hosts public media (legal duties vary by jurisdiction — recommend legal review).
- **How:** Read upload pipeline.
- **Fail signal:** Public media hosting with no screening and no report path.
- **Fix:** Moderation service; report path; legal review.

### ABUSE-05 Outbound messaging cannot be weaponised [High]
- **Verify:** Features that send email/SMS/notifications to addresses the user types (invites, "share with a friend") are rate-limited per sender and recipient and do not let users control the full message body sent from your domain.
- **How:** Read invite/share handlers.
- **Fail signal:** Unlimited invites with user-written body from your domain (spam relay, phishing).
- **Fix:** Templates with limited user text; per-sender caps; verified sender only.

### ABUSE-06 Rendered UGC is safe [High]
- **Verify:** User-authored text, markdown, and SVG render without script execution; links get `rel="noopener noreferrer nofollow ugc"` where public.
- **How:** Read the renderer and sanitizer config (see API-04, LLM-02).
- **Fail signal:** Raw HTML from users rendered on the app origin; SVG uploads served inline.
- **Fix:** Sanitize; serve SVG as attachment or from a separate domain.

---

## REL — Deployment readiness

Always on.

### REL-01 Production runs a production build [High]
- **Verify:** Production uses `NODE_ENV=production`, a production build, and no dev servers, debug flags, or source-map exposure of server code.
- **How:** Read start scripts, Dockerfile, hosting config; `rg -n "productionBrowserSourceMaps|debug: true|DEBUG="`.
- **Fail signal:** `next dev` in Dockerfile; public source maps including secrets or internal comments.
- **Fix:** Production build and start; upload source maps to the error tracker privately instead of serving them.

### REL-02 Debug, seed, and test routes are removed or gated [Critical]
- **Verify:** No `/api/seed`, `/api/test`, `/api/debug`, `/api/reset`, or GraphQL playground/introspection is reachable in production without admin auth.
- **How:** From API-01's inventory; `rg -n "seed|debug|playground|introspection|__test"` in routes.
- **Fail signal:** Any such route public.
- **Fix:** Delete or gate behind `NODE_ENV !== 'production'` *and* admin auth.

### REL-03 Required env vars are validated at startup [Medium]
- **Verify:** The app validates required environment variables at build/boot (zod env schema, `@t3-oss/env`, or equivalent) and fails fast when one is missing.
- **How:** `rg -n "createEnv|envSchema|z\.object\(\{[^}]*process\.env"`.
- **Fail signal:** Missing webhook secret silently disables verification (`if (secret) verify()`).
- **Fix:** Env schema; never make a security check conditional on a variable existing.

### REL-04 Preview deployments are protected [Medium]
- **Verify:** Preview/staging deployments do not use production data or keys and are not publicly indexed or open to anyone (deployment protection, auth, or `noindex`).
- **How:** Hosting config; env scoping.
- **Fail signal:** Preview builds connected to the production DB with the secret key.
- **Fix:** Separate projects/keys; enable deployment protection.

### REL-05 Domains, DNS, and email authentication are set [Low]
- **Verify:** Sending domains have SPF, DKIM, and DMARC; no dangling DNS records point at deprovisioned hosts (subdomain takeover).
- **How:** Usually outside the repo — **Unknown**; if the user permits, `dig TXT <their-domain>` for their own domain only.
- **Fail signal:** No DMARC on the domain used for auth emails.
- **Fix:** Add records; remove dangling CNAMEs.

### REL-06 Legal and support pages exist [Low]
- **Verify:** Terms, privacy policy, contact/support, and (if payments) refund policy pages exist and are linked.
- **How:** Read routes/footer.
- **Fail signal:** Paid app with no terms or refund policy.
- **Fix:** Add pages; recommend legal review of content.

### REL-07 Rollback is possible [Medium]
- **Verify:** The team can roll back a bad deploy quickly (host instant rollback, previous image tag) and migrations are compatible with one-version rollback.
- **How:** Hosting docs/config; migration style.
- **Fail signal:** Destructive migration shipped with code that cannot run on the old schema.
- **Fix:** Expand/contract migrations; document rollback.

### REL-08 Security tests run in CI [Low]
- **Verify:** CI runs at least type-check, lint, tests, dependency audit, and secret scan on every PR; RLS/authorization tests run against a local DB.
- **How:** Read `.github/workflows/*`.
- **Fail signal:** No CI, or CI that only builds.
- **Fix:** Add the steps; start with secret scanning and RLS negative tests.

---

## A11Y — Accessibility basics

Always on. A launch-level smoke check against WCAG 2.2 Level AA, not a full audit. For depth, run a dedicated accessibility audit skill.

### A11Y-01 Interactive elements are real controls [Medium] — WCAG 2.1.1, 4.1.2
- **Verify:** Clickable things are `<button>`/`<a href>`, or have role, `tabIndex`, and keyboard handlers.
- **How:** `rg -n "<div[^>]*onClick|<span[^>]*onClick"`.
- **Fail signal:** `div onClick` without role/keyboard support.
- **Fix:** Use native elements.

### A11Y-02 Form inputs have labels and errors are announced [Medium] — WCAG 1.3.1, 3.3.1, 3.3.2
- **Verify:** Every input has an associated `<label>` or `aria-label`; errors are text, linked via `aria-describedby`, not colour alone.
- **How:** Read auth, checkout, and settings forms.
- **Fail signal:** Placeholder-only labels on login/signup.
- **Fix:** Add labels and described-by errors.

### A11Y-03 Images and icons have text alternatives [Low] — WCAG 1.1.1
- **Verify:** Meaningful images have `alt`; decorative ones `alt=""`; icon-only buttons have an accessible name.
- **How:** `rg -n "<img(?![^>]*alt=)" --pcre2`; icon button components.
- **Fix:** Add `alt`/`aria-label`.

### A11Y-04 Focus is visible and managed [Medium] — WCAG 2.4.7, 2.4.11
- **Verify:** No global `outline: none` without a replacement; modals trap and restore focus; focused elements are not hidden behind sticky headers.
- **How:** `rg -n "outline:\s*(none|0)|outline-none"`; read modal/dialog component.
- **Fix:** `:focus-visible` styles; use an accessible dialog primitive.

### A11Y-05 Page language, titles, and contrast basics [Low] — WCAG 3.1.1, 2.4.2, 1.4.3
- **Verify:** `<html lang>` set; each route has a unique `<title>`; text contrast meets 4.5:1 (3:1 for large text) on primary flows.
- **How:** Read root layout and metadata; spot-check theme tokens.
- **Fix:** Set `lang`, per-route titles, adjust tokens.

### A11Y-06 Auth flows are accessible [Medium] — WCAG 3.3.8
- **Verify:** Login does not rely on a cognitive test alone (puzzles, transcription) without an alternative; password managers and paste work (also NIST 800-63B-4 guidance).
- **How:** Read login/signup fields for `onPaste` blocking and `autocomplete` attributes; check the CAPTCHA type.
- **Fail signal:** `onPaste={e => e.preventDefault()}` on password; image-puzzle CAPTCHA with no alternative.
- **Fix:** Allow paste; set `autocomplete="current-password"`/`"new-password"`; use a non-puzzle challenge.
