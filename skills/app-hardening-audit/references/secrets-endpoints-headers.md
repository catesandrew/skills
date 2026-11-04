# Secrets, API endpoints, and HTTP security headers

Checks for SEC (API keys and secrets), API (endpoint protection), and HDR (HTTP security headers). All three are always on.

Grounding: OWASP Top 10:2025 A02 Security Misconfiguration, A04 Cryptographic Failures, A05 Injection, A10 Mishandling of Exceptional Conditions; OWASP ASVS 5.0; OWASP Secure Headers Project; Supabase API keys guide. URLs in [sources.md](sources.md).

---

## SEC — Secrets & API keys

### SEC-01 No secrets in the working tree [Critical]
- **Verify:** No live credentials in tracked files: provider keys, DB URLs with passwords, private keys, webhook secrets, OAuth client secrets.
- **How:** If installed, run `gitleaks detect --no-git --redact` or `trufflehog filesystem . --only-verified` locally. Otherwise: `rg -n --hidden --glob '!node_modules' --glob '!*.lock' -e 'sk_live_|rk_live_|whsec_|sb_secret_|sk-ant-|sk-proj-|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?://[^:]+:[^@]+@|xox[baprs]-|ghp_[A-Za-z0-9]{36}'`. Redact values in the report.
- **Fail signal:** Any real-looking value outside `.env.example` placeholders.
- **Fix:** Move to the host's secret store; **rotate** the credential (removal alone is not enough); add a pre-commit secret scanner.

### SEC-02 No secrets in git history [Critical]
- **Verify:** Secrets were never committed, even if since deleted.
- **How:** `gitleaks detect --redact` (scans history) or `git log -p --all -S 'sk_live_' | head` per prefix. `git log --all --diff-filter=A --name-only -- '*.env' '.env*'`.
- **Fail signal:** A `.env` or key appears in any commit.
- **Fix:** Rotate first. History rewriting is optional and does not un-leak a pushed secret.

### SEC-03 `.env` files are ignored [High]
- **Verify:** `.gitignore` covers `.env`, `.env.local`, `.env.*.local`, and only `.env.example` (placeholders) is tracked.
- **How:** `git ls-files | rg '(^|/)\.env'`; read `.gitignore`.
- **Fail signal:** A tracked `.env` with values.
- **Fix:** Ignore, untrack (`git rm --cached`), rotate.

### SEC-04 Public env prefixes hold only public values [Critical]
- **Verify:** Variables exposed to the browser (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`, `EXPO_PUBLIC_`, `REACT_APP_`) contain only values designed to be public (publishable keys, URLs, analytics IDs).
- **How:** `rg -n "(NEXT_PUBLIC|VITE|PUBLIC|EXPO_PUBLIC|REACT_APP)_[A-Z0-9_]*(SECRET|SERVICE|PRIVATE|TOKEN|PASSWORD|OPENAI|ANTHROPIC|STRIPE_SECRET)" --glob '!node_modules'`.
- **Fail signal:** `NEXT_PUBLIC_OPENAI_API_KEY`, `VITE_STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- **Fix:** Rename to a server-only var, move the call server-side, rotate.

### SEC-05 Built client bundle contains no secrets [Critical]
- **Verify:** After a local production build, static output contains no secret prefixes.
- **How:** Run the project's build locally, then `rg -n -e 'sk_live_|sb_secret_|service_role|sk-ant-|sk-proj-|whsec_' .next/static dist build out 2>/dev/null`.
- **Fail signal:** Any hit.
- **Fix:** Trace the import chain to the client component; add `import 'server-only'` to modules that read secrets.

### SEC-06 Server-only modules are marked [Medium]
- **Verify:** Modules that read secrets or create privileged clients cannot be imported from client code (Next.js `server-only` package, or equivalent bundler boundary).
- **How:** `rg -ln "process\.env\.[A-Z_]*(SECRET|SERVICE|PRIVATE|KEY)" src app lib` then check each for `import 'server-only'`.
- **Fail signal:** Privileged client factory in a shared `lib/` with no guard.
- **Fix:** Add `import 'server-only'` and keep privileged factories in a `server/` path.

### SEC-07 Least-privilege, separate keys per environment [Medium]
- **Verify:** Dev, preview, and prod use different keys; restricted/scoped keys are used where the provider supports them (Stripe restricted keys, scoped LLM project keys); test-mode keys in non-prod.
- **How:** Read `.env.example`, deployment config, CI secrets names. Values are usually **Unknown** from the repo.
- **Fail signal:** Prod key referenced in preview deployments or CI tests.
- **Fix:** Per-environment secrets; restricted keys; spend limits on provider dashboards.

### SEC-08 Secrets are not logged or returned [High]
- **Verify:** Logs, error responses, and analytics events never include tokens, keys, `Authorization` headers, or full env dumps.
- **How:** `rg -n "console\.(log|error)\((process\.env|req\.headers|headers|token|apiKey)|JSON\.stringify\(process\.env"`.
- **Fail signal:** Request headers logged wholesale; error handler returns `err.config` from an HTTP client (often includes auth headers).
- **Fix:** Redaction in the logger; return generic errors.

### SEC-09 Rotation path exists [Low]
- **Verify:** There is a written way to rotate each critical secret without downtime (provider docs link, runbook, or dual-key support).
- **How:** Look for `SECURITY.md`, `docs/`, runbooks.
- **Fail signal:** No one knows how to rotate the DB password or webhook secret.
- **Fix:** Short runbook per secret: where it lives, how to rotate, who owns it.

---

## API — Endpoint protection

### API-01 Inventory of endpoints [Medium]
- **Verify:** You can list every server entry point: API routes, route handlers, server actions, edge/serverless functions, RPC functions, cron endpoints, webhooks.
- **How:** `rg --files | rg '(app|pages)/api/|route\.(ts|js)$|functions/|supabase/functions/'`; `rg -ln "\"use server\"|'use server'"`; `vercel.json` crons.
- **Fail signal:** Endpoints exist that nobody knew about (debug, seed, test routes).
- **Fix:** Delete unused endpoints; record the rest in the report table.

### API-02 Every non-public endpoint authenticates [Critical]
- **Verify:** Each endpoint from API-01 either requires a verified session/key or is deliberately public and listed as such.
- **How:** Read the first lines of each handler for the auth guard.
- **Fail signal:** `/api/admin/*`, `/api/users/*`, `/api/seed`, `/api/debug`, or a cron route callable without auth.
- **Fix:** Shared guard; cron endpoints check a secret header (e.g. `Authorization: Bearer ${CRON_SECRET}`) compared in constant time.

### API-03 Input is validated at the boundary [High]
- **Verify:** Bodies, params, and query strings are parsed with a schema (zod, valibot, yup) before use, with size limits.
- **How:** `rg -n "await req\.json\(\)|request\.json\(\)|req\.body" ` and check for `.parse(`/`.safeParse(` nearby.
- **Fail signal:** Raw `req.body` passed to DB or LLM; no max length on strings; arrays without max size.
- **Fix:** Strict schemas with `.max()` bounds; reject unknown keys on writes.

### API-04 No injection sinks [Critical]
- **Verify:** No string-built SQL, shell commands, or HTML from user input.
- **How:** `rg -n '\$queryRawUnsafe|\$executeRawUnsafe|\.raw\(|sql\.unsafe|execSync\(|exec\(|spawn\(.*shell: true|dangerouslySetInnerHTML|innerHTML\s*=|eval\(|new Function\('`.
- **Fail signal:** Template literal with user input in raw SQL or a shell call; unsanitized HTML render.
- **Fix:** Parameterized queries; `execFile` with argument arrays; sanitize HTML with a maintained sanitizer or render as text.

### API-05 SSRF is blocked on URL-fetching features [High]
- **Verify:** Features that fetch a user-supplied URL (link previews, imports, webhooks-out, LLM browse tools) block private, loopback, link-local, and metadata addresses, and re-check after redirects.
- **How:** `rg -n "fetch\((url|body\.url|input\.url|params\.url)|axios\.get\((url|req)"`.
- **Fail signal:** Direct `fetch(userUrl)` from the server.
- **Fix:** Allow-list schemes and hosts, resolve and check IPs, disable or re-validate redirects, set timeouts and size caps.

### API-06 Rate limits on public and costly endpoints [High]
- **Verify:** Unauthenticated endpoints (contact forms, signup, search) and costly ones (LLM, email, SMS, exports) have per-IP and per-user limits.
- **How:** `rg -n "ratelimit|rateLimit|limiter|@upstash/ratelimit|express-rate-limit"`. Host-level rules (WAF, platform firewall) are **Unknown** unless in config.
- **Fail signal:** Contact form or SMS OTP with no limit.
- **Fix:** Add a limiter keyed by user ID and IP; return `429` with `Retry-After`.

### API-07 CORS is restrictive [High]
- **Verify:** `Access-Control-Allow-Origin` is an allow-list, never reflected from `Origin` together with `Allow-Credentials: true`.
- **How:** `rg -n "Access-Control-Allow-Origin|cors\(|origin: (true|\"\*\"|'\*')"`.
- **Fail signal:** `origin: true` or reflected origin with credentials.
- **Fix:** Explicit origin list; no credentials unless required.

### API-08 State-changing requests resist CSRF [Medium]
- **Verify:** Cookie-authenticated mutations use `SameSite=Lax/Strict` cookies plus an origin check or CSRF token; no state change on `GET`.
- **How:** Read mutation handlers and cookie settings; `rg -n "export (async )?function GET" app/api` and check for writes.
- **Fail signal:** `GET /api/delete?id=`; custom cookie auth with `SameSite=None` and no token.
- **Fix:** Mutations on POST/PUT/DELETE only; verify `Origin`; framework CSRF protection.

### API-09 Errors do not leak internals [Medium]
- **Verify:** Production responses do not include stack traces, SQL errors, file paths, or upstream provider errors.
- **How:** Read error handlers; `rg -n "err\.stack|error\.message|JSON\.stringify\(err"` in responses.
- **Fail signal:** `return Response.json({ error: e })` with the raw error.
- **Fix:** Log details server-side with a request ID; return a generic message and the ID.

### API-10 Uploads are constrained [High]
- **Verify:** Upload endpoints enforce size limits, content-type allow-lists checked server-side, randomised storage names, and do not serve user files from the app origin as HTML.
- **How:** `rg -n "formData\(\)|multer|busboy|upload\(|createSignedUploadUrl"`.
- **Fail signal:** Unlimited size; extension-only check; user HTML/SVG served inline from the main domain.
- **Fix:** Limits, sniffed type check, `Content-Disposition: attachment` or a separate user-content domain.

---

## HDR — HTTP security headers

Values below follow the OWASP Secure Headers Project's recommended set. Static check: read `next.config.*` `headers()`, `middleware.ts`, `vercel.json`/`netlify.toml`/`_headers`, server framework config. Active check (only `localhost` or `${input:staging_url}`): `curl -sI <host>`.

### HDR-01 Strict-Transport-Security [Medium]
- **Verify:** HTTPS responses send `Strict-Transport-Security: max-age=63072000; includeSubDomains` (or at least a long max-age). Add `preload` only if the domain owner intends to submit to the preload list.
- **Fail signal:** Header missing or `max-age` small.
- **Fix:** Set at the edge/host or in framework headers config.

### HDR-02 Content-Security-Policy [Medium]
- **Verify:** A CSP exists. Baseline from OWASP: `default-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests`, extended with the app's real script/connect sources. Prefer nonces or hashes over `'unsafe-inline'` for scripts.
- **Fail signal:** No CSP; `script-src *`; `'unsafe-eval'` without need.
- **Fix:** Start in `Content-Security-Policy-Report-Only`, collect violations locally, then enforce.

### HDR-03 Framing is blocked [Medium]
- **Verify:** `frame-ancestors 'none'` (or `'self'`) in CSP, and `X-Frame-Options: DENY` for older clients.
- **Fail signal:** Neither present on pages with authenticated actions.
- **Fix:** Add both.

### HDR-04 X-Content-Type-Options [Low]
- **Verify:** `X-Content-Type-Options: nosniff`.
- **Fix:** Add globally.

### HDR-05 Referrer-Policy [Low]
- **Verify:** `Referrer-Policy` set (OWASP recommends `no-referrer`; `strict-origin-when-cross-origin` is a common compromise). Tokens never appear in URLs.
- **Fail signal:** Reset tokens or session IDs in query strings with a permissive referrer policy.
- **Fix:** Set the header; move tokens out of URLs.

### HDR-06 Permissions-Policy [Low]
- **Verify:** Features the app does not use (camera, microphone, geolocation, payment, usb…) are disabled with `Permissions-Policy`.
- **Fix:** Add a policy listing unused features as `=()`.

### HDR-07 Cross-origin isolation headers where safe [Info]
- **Verify:** `Cross-Origin-Opener-Policy: same-origin` on app pages. `Cross-Origin-Resource-Policy` / `Cross-Origin-Embedder-Policy` only if they do not break third-party embeds (OAuth popups and payment iframes often need `same-origin-allow-popups` or no COEP).
- **Fix:** Add COOP; test COEP/CORP locally before enforcing.

### HDR-08 Sensitive responses are not cached [Medium]
- **Verify:** Authenticated pages and API responses with personal data send `Cache-Control: no-store` (or `private`) and are not cached by the CDN.
- **How:** Static: framework caching config (`export const dynamic`, `revalidate`, `fetch` cache options) on authenticated routes.
- **Fail signal:** Statically generated or CDN-cached page that renders per-user data.
- **Fix:** Mark per-user routes dynamic and `no-store`.

### HDR-09 No version-disclosing headers [Info]
- **Verify:** `X-Powered-By` and detailed `Server` headers are off.
- **Fix:** Next.js: `poweredByHeader: false`; Express: `app.disable('x-powered-by')`.
