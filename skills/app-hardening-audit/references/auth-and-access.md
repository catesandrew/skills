# Authentication, authorization, and Supabase RLS

Checks for AUTH (authentication and sessions), AUTHZ (authorization, admin, multi-tenancy), and RLS (Supabase Row Level Security and Storage). Severity in brackets is the default.

Grounding: NIST SP 800-63B-4 (passwords, throttling, session timeouts), OWASP Top 10:2025 A01 Broken Access Control and A07 Authentication Failures, OWASP ASVS 5.0, Supabase RLS / API keys / Storage docs. Full URLs in [sources.md](sources.md).

---

## AUTH — Authentication & sessions

Profile: `auth`.

### AUTH-01 Use a maintained auth provider or library [High]
- **Verify:** Login, signup, reset, and session handling come from a maintained provider or library (for example Supabase Auth, Auth.js, Clerk, or the framework's own auth), not hand-rolled crypto.
- **How:** `rg -n "bcrypt|argon2|scrypt|jsonwebtoken|jose|createHash\(|crypto\.subtle" --glob '!node_modules'`. Read any custom login handler.
- **Fail signal:** Passwords hashed with `md5`/`sha1`/`sha256` without a password-hashing function; JWTs signed with a hard-coded secret; custom session tokens from `Math.random()`.
- **Fix:** Move to the provider's flow. If custom hashing must stay, use Argon2id or bcrypt with a per-user salt, and generate tokens with a CSPRNG (`crypto.randomBytes`/`crypto.getRandomValues`).

### AUTH-02 Password policy follows current NIST guidance [Medium]
- **Verify:** Minimum length is at least 15 characters when the password is the only factor, or at least 8 when used only with MFA. Maximum allowed is at least 64. No composition rules (forced symbols/digits). No forced periodic rotation. New passwords are checked against a breached/common list.
- **How:** Read the signup/reset validator (zod/yup schema, `supabase/config.toml` `[auth]` password settings, provider dashboard). `rg -n "minLength|min\(|password.*length|requireUppercase|requireSymbol"`.
- **Fail signal:** `min(6)` / `min(8)` on single-factor password login; regex requiring character classes; `maxLength` under 64.
- **Fix:** Set the length bounds above, drop composition rules, enable the provider's leaked-password protection (or check against a breached-password service on the server).

### AUTH-03 Login, signup, reset, and OTP endpoints are rate-limited [High]
- **Verify:** Failed attempts per account and per IP are limited on every credential and code-verification endpoint. NIST 800-63B-4 caps consecutive failures per authenticator at 100 as an upper bound; apps usually go much lower.
- **How:** Read the auth route handlers and middleware. `rg -n "ratelimit|rateLimit|@upstash/ratelimit|express-rate-limit|limiter"`. For Supabase, read `[auth.rate_limit]` in `supabase/config.toml`; dashboard values are **Unknown** unless shown.
- **Fail signal:** Custom `/api/login` or `/api/verify-otp` with no limiter; OTP of 6 digits with unlimited tries.
- **Fix:** Add a per-identifier and per-IP limiter (sliding window), lock the authenticator or add a delay/challenge after N failures, and alert on spikes.

### AUTH-04 Session cookies are hardened [High]
- **Verify:** Session cookies set `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, a bounded `Max-Age`, and ideally the `__Host-` prefix. Tokens are not stored in `localStorage` when a cookie flow is available.
- **How:** `rg -n "cookies\(\)\.set|setCookie|Set-Cookie|httpOnly|sameSite|localStorage\.setItem\(.*(token|session)"`.
- **Fail signal:** `httpOnly: false` on a session cookie; access/refresh tokens in `localStorage` in an app vulnerable to XSS; no expiry.
- **Fix:** Set the flags; use the provider's SSR cookie helper (for Supabase, `@supabase/ssr`).

### AUTH-05 Sessions expire and can be revoked [Medium]
- **Verify:** There is an overall session lifetime and an inactivity timeout appropriate to risk (NIST 800-63B-4 says at AAL2 the overall timeout should be no more than 24 hours and inactivity no more than 1 hour; at AAL1 overall should be no more than 30 days). Logout invalidates the server-side session/refresh token, not just the cookie. Password change and reset revoke other sessions.
- **How:** Read logout handler, provider session settings (`jwt_expiry`, refresh token rotation in `supabase/config.toml`), password-change handler.
- **Fail signal:** Logout only clears a client cookie; refresh tokens never rotate; password reset leaves old sessions alive.
- **Fix:** Call the provider's sign-out with global scope on password change; enable refresh-token rotation and reuse detection; set lifetimes.

### AUTH-06 Server code verifies the session, not just decodes it [Critical]
- **Verify:** Server-side auth checks validate the token signature/session with the provider (e.g. `supabase.auth.getUser()` or `getClaims()` with signature verification) rather than trusting an unverified decode or a cookie's presence.
- **How:** `rg -n "getSession\(\)|jwt\.decode|jwtDecode|atob\(.*split\('\.'\)|cookies\(\)\.get\(.*(token|session)"` in server files, middleware, and route handlers.
- **Fail signal:** Middleware or route authorizes on `getSession()` from cookies alone in server code, or decodes the JWT without verifying; any check of the form "cookie exists → logged in".
- **Fix:** Verify on the server on every protected request. Treat middleware as an optimization, and re-check in the route/server action that touches data.

### AUTH-07 Account recovery cannot be hijacked [High]
- **Verify:** Reset tokens are single-use, short-lived, random, and bound to the account. Reset and magic-link redirect URLs are allow-listed. Responses do not reveal whether an email exists.
- **How:** Read reset/magic-link handlers and redirect handling. `rg -n "redirectTo|emailRedirectTo|next=|returnTo|callbackUrl"`. Check `additional_redirect_urls` in `supabase/config.toml`.
- **Fail signal:** `redirectTo` taken from a query param without allow-list; wildcard redirect URLs; "no account with that email" messages.
- **Fix:** Allow-list redirect origins; use generic responses; expire and burn tokens on use.

### AUTH-08 MFA available for privileged accounts [Medium]
- **Verify:** Admin and owner roles can (ideally must) use a second factor; admin actions check the session's assurance level.
- **How:** `rg -n "mfa|aal2|totp|webauthn|passkey"`. Read admin route guards.
- **Fail signal:** Admin panel reachable with password-only sessions; MFA enrolled but never checked (`aal` not enforced).
- **Fix:** Require `aal2` (or equivalent) for admin routes and destructive actions; offer passkeys/TOTP.

### AUTH-09 OAuth/social login callbacks are safe [High]
- **Verify:** OAuth sign-in uses authorization code with PKCE and a `state` parameter; the callback validates both; open redirects after login are blocked.
- **How:** Read `/auth/callback` (or equivalent). `rg -n "exchangeCodeForSession|code_verifier|state="`.
- **Fail signal:** Implicit flow tokens in URL fragment used by server code; callback redirects to any `next` value.
- **Fix:** Use the provider's PKCE flow; validate `next` against a same-origin path allow-list.

### AUTH-10 Email verification gates sensitive features [Low]
- **Verify:** Unverified accounts cannot trigger costly or abusable features (LLM calls, invites, outbound email).
- **How:** Read signup config (`enable_confirmations`) and the guards on costly routes.
- **Fail signal:** Anonymous or unverified sign-ups can call paid model endpoints. Supabase advisor lint `0012_auth_allow_anonymous_sign_ins` fires and anonymous users are not handled in policies.
- **Fix:** Require verified email for costly features or give anonymous users a strict quota.

---

## AUTHZ — Authorization, admin & tenancy

Profile: `auth` (all), `admin` (AUTHZ-05..07).

### AUTHZ-01 Every data access checks ownership on the server [Critical]
- **Verify:** Every read/update/delete by ID scopes the query to the caller (`where user_id = session.user.id` or tenant membership), or relies on RLS with a user-scoped client.
- **How:** List route handlers, server actions, tRPC/GraphQL resolvers: `rg -n "params\.(id|slug)|searchParams\.get\('id'\)|findUnique|findFirst|\.eq\('id'"`. For each, find the ownership predicate.
- **Fail signal:** `db.order.findUnique({ where: { id } })` with no owner filter; service-role/admin client used for a user-facing read.
- **Fix:** Add the owner/tenant predicate in the data layer, or switch to a user-scoped client under RLS. Prefer non-guessable IDs as defense in depth, never as the control.

### AUTHZ-02 Roles and tenant IDs come from the server, never the request [Critical]
- **Verify:** `role`, `isAdmin`, `plan`, `org_id`, `tenant_id` used for decisions come from the verified session or a server-side lookup, not from body, query, headers, or client-writable metadata.
- **How:** `rg -n "body\.(role|isAdmin|plan|orgId|tenantId)|searchParams\.get\('(role|org|tenant)'\)|headers\.get\('x-(role|user|org)"`. Supabase: `rg -n "user_metadata"` in SQL and server code.
- **Fail signal:** Any of the above feeds an `if` that grants access; RLS policy reads `user_metadata` (users can update it; advisor lint `0015_rls_references_user_metadata`).
- **Fix:** Derive from session; store roles in a server-owned table or `app_metadata` / custom claims set by a trusted hook.

### AUTHZ-03 Mass assignment is blocked [High]
- **Verify:** Create/update handlers allow-list writable fields; users cannot set `role`, `plan`, `credits`, `owner_id`, `verified`, `stripe_customer_id`.
- **How:** `rg -n "\.update\((req\.body|body|data)\)|\.insert\((req\.body|body)\)|\.\.\.body|Object\.assign\(.*body"`.
- **Fail signal:** Request body spread into an ORM update; zod schema uses `.passthrough()` on a write path.
- **Fix:** Parse with a strict schema that lists writable fields only; set privileged fields server-side.

### AUTHZ-04 Server actions and RPCs are authorized individually [High]
- **Verify:** Each Next.js Server Action (`"use server"`), API route, and Postgres RPC function checks auth itself. Actions are public HTTP endpoints even when not linked from the UI.
- **How:** `rg -n "\"use server\"|'use server'"` and read each exported function's first lines. For SQL: `rg -n "security definer" supabase/migrations`.
- **Fail signal:** An action mutates data with no session check; a `security definer` function callable by `anon`/`authenticated` with no internal check (advisor lints `0028`/`0029`).
- **Fix:** Add an auth + ownership guard at the top of each action; revoke `execute` from `anon` (and `authenticated` if not needed) on definer functions or switch to `security invoker`; pin `search_path` (lint `0011`).

### AUTHZ-05 Admin routes are guarded server-side [Critical]
- **Verify:** `/admin` pages, APIs, and actions check an admin role on the server for every request.
- **How:** Read admin layout/middleware and every admin API handler.
- **Fail signal:** Guard only in a client component or only in middleware with a matcher that misses API routes.
- **Fix:** Shared `requireAdmin()` helper called in every admin handler and server action; middleware as an extra layer only.

### AUTHZ-06 Admin and impersonation actions are audited [Medium]
- **Verify:** Admin changes to users, plans, refunds, and impersonation sessions write an append-only audit record (who, what, when, target).
- **How:** `rg -n "audit|impersonat|admin_log"`.
- **Fail signal:** Admin can change plans or delete users with no trace.
- **Fix:** Write audit rows from the same transaction; restrict who can delete them.

### AUTHZ-07 Invites and membership changes are authorized [High]
- **Verify:** Only org owners/admins can invite, change roles, or remove members; invite tokens are single-use, expiring, and bound to the invited email.
- **How:** Read invite create/accept handlers.
- **Fail signal:** Any member can promote themselves; accepting an invite does not check the email; tokens never expire.
- **Fix:** Check inviter role server-side; bind token to email; expire and burn on use.

### AUTHZ-08 Deny by default [Medium]
- **Verify:** New routes are protected unless explicitly marked public (middleware matcher, route-group layout, or framework config).
- **How:** Read `middleware.ts` matcher and route layout structure.
- **Fail signal:** Protection is an allow-list of protected paths, so new routes are public by default.
- **Fix:** Invert to a public-path allow-list.

---

## RLS — Supabase Row Level Security & Storage

Profile: `supabase`. Supabase's docs: a table in an exposed schema without RLS is readable and writable by any role with a grant on it.

### RLS-01 RLS enabled on every table in exposed schemas [Critical]
- **Verify:** Every table in `public` (and any other schema exposed through the Data API) has `enable row level security`.
- **How:** From migrations, list tables: `rg -n "create table" supabase/migrations` and `rg -n "enable row level security" supabase/migrations`; compare the two lists. With a local stack: `supabase db advisors` (local only) and look for `0013_rls_disabled_in_public`.
- **Fail signal:** Any table missing from the second list.
- **Fix:** Migration: `alter table <t> enable row level security;` plus policies. If a table must be public-read, write an explicit `select` policy for `anon` and nothing else.

### RLS-02 Every RLS-enabled table has intended policies [High]
- **Verify:** Each table has policies for the operations the app uses, scoped to `to authenticated` (or `anon` deliberately). Note that RLS on with no policy denies everything (advisor `0008_rls_enabled_no_policy`) — fine if intended, a bug if the app expects access through the user client.
- **How:** For each table, read its `create policy` statements.
- **Fail signal:** Policy with `using (true)` or `with check (true)` on writes for `authenticated` or `anon` (advisor `0024_permissive_rls_policy`); policy defined but RLS not enabled (`0007_policy_exists_rls_disabled`).
- **Fix:** Scope by `(select auth.uid()) = user_id` or a membership check.

### RLS-03 UPDATE policies have WITH CHECK [High]
- **Verify:** Every `for update` policy has both `using` and `with check`, so users cannot move a row to another owner.
- **How:** `rg -n -A4 "for update" supabase/migrations`.
- **Fail signal:** `with check` missing, or `with check` weaker than `using`.
- **Fix:** Add `with check ((select auth.uid()) = user_id)` (or the tenant predicate).

### RLS-04 Policies do not trust user-editable metadata [Critical]
- **Verify:** No policy reads `auth.jwt() -> 'user_metadata'` / `raw_user_meta_data`. Supabase states this is updatable by the user.
- **How:** `rg -n "user_metadata|raw_user_meta_data" supabase/`.
- **Fail signal:** Any hit inside a policy or definer function used for authorization.
- **Fix:** Move authorization data to `app_metadata`, a roles table, or custom claims from an auth hook.

### RLS-05 Secret / service_role key is server-only [Critical]
- **Verify:** `sb_secret_…` and legacy `service_role` keys never appear in client bundles, `NEXT_PUBLIC_*`/`VITE_*`/`EXPO_PUBLIC_*` vars, mobile apps, or the repo. Server clients that use them run their own authorization checks first.
- **How:** `rg -n "sb_secret_|service_role|SERVICE_ROLE|SUPABASE_SECRET" --glob '!node_modules'`. Check every hit's file is server-only (route handler, server action, edge function, `server-only` import). After a local build: `rg -n "sb_secret_|service_role" .next/static dist build` (no output expected).
- **Fail signal:** Hit in a `"use client"` file, a public env var, built static assets, or committed `.env`.
- **Fix:** Move to a server-only module; rotate the key if it was ever committed or shipped (see SEC-02).

### RLS-06 Views and functions do not bypass RLS [High]
- **Verify:** Views exposed to `anon`/`authenticated` use `security_invoker = true` (Postgres 15+) or are in an unexposed schema. `security definer` functions are not callable by `anon`/`authenticated` unless they check auth internally, and they set `search_path`.
- **How:** `rg -n "create (or replace )?view|security definer|security_invoker|search_path" supabase/migrations`. Advisor lints `0010_security_definer_view`, `0011_function_search_path_mutable`, `0028`, `0029`.
- **Fail signal:** A plain view over an RLS table granted to `authenticated`; a definer function without `set search_path = ''`.
- **Fix:** `with (security_invoker = true)`; revoke execute; set `search_path`.

### RLS-07 auth.users and sensitive columns are not exposed [High]
- **Verify:** No view or table in an exposed schema exposes `auth.users` or columns like emails, phone numbers, tokens to other users.
- **How:** `rg -n "auth\.users" supabase/migrations`. Advisor lints `0002_auth_users_exposed`, `0023_sensitive_columns_exposed`.
- **Fail signal:** `create view public.users as select * from auth.users`.
- **Fix:** A `profiles` table with only public fields and its own RLS; column-level grants for sensitive fields.

### RLS-08 Storage buckets are private unless intentionally public [High]
- **Verify:** Buckets holding user files are private; `storage.objects` policies scope by `bucket_id` and the owner folder (e.g. `(storage.foldername(name))[1] = (select auth.uid())::text`). Public buckets do not allow listing.
- **How:** `rg -n "storage\.buckets|createBucket|public: true|storage\.objects" supabase/ src/ app/`. Advisor `0025_public_bucket_allows_listing`.
- **Fail signal:** User uploads in a public bucket; `insert` policy `with check (true)`; any authenticated user can read any object in a private bucket.
- **Fix:** Private bucket + per-user folder policies; signed URLs with short expiry for sharing.

### RLS-09 GraphQL and other exposed surfaces respect the same rules [Medium]
- **Verify:** If `pg_graphql` is enabled, tables visible to `anon` through it are intended. Extensions are not in `public`.
- **How:** Advisor lints `0026`/`0027` (pg_graphql exposure), `0014_extension_in_public`. Read `supabase/config.toml` `[api] schemas`.
- **Fail signal:** Tables discoverable by `anon` via GraphQL introspection that are not meant to be.
- **Fix:** Revoke grants from `anon` on non-public tables, or disable `pg_graphql` if unused.

### RLS-10 Policies are tested [Medium]
- **Verify:** There are tests that run queries as two different users and as `anon` and assert isolation (pgTAP, or integration tests with two user-scoped clients).
- **How:** `rg -ln "pgtap|plan\(|set local role|request.jwt.claims" supabase/tests tests`.
- **Fail signal:** No negative tests ("user B cannot read user A's row").
- **Fix:** Add at least one cross-user negative test per table that holds user data.
