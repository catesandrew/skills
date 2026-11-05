# AI / LLM protections and agent delegation

Checks for LLM (features that call language models) and AGT (third-party OAuth, tool-calling agents, MCP servers, acting on a user's behalf).

Grounding: OWASP Top 10 for LLM Applications 2025 (IDs `LLM01:2025`–`LLM10:2025`), OWASP Top 10 for Agentic Applications for 2026 (IDs `ASI01`–`ASI10`), NIST AI RMF 1.0 and the Generative AI Profile (NIST AI 600-1), IETF RFC 9700 (OAuth 2.0 Security Best Current Practice). URLs and the full ID lists are in [sources.md](sources.md). Map each finding to the relevant ID in the report.

---

## LLM — AI / LLM protections

Profile: `ai`.

### LLM-01 Untrusted content is separated from instructions [High] — LLM01:2025
- **Verify:** User input and retrieved/tool content are passed as data (separate messages or clearly delimited blocks), never concatenated into the system prompt. The design assumes prompt injection will sometimes succeed and limits what a hijacked model can do (see LLM-04, AGT-*).
- **How:** Read prompt construction: `rg -n "system:|role: ['\"]system|systemPrompt|instructions:"` and trace interpolated values.
- **Fail signal:** `` system: `You are… ${userBio}` ``; retrieved web pages pasted into the system prompt.
- **Fix:** Keep the system prompt static; put user/retrieved content in user-role messages with delimiters; rely on least privilege, not on the prompt, for safety.

### LLM-02 Model output is treated as untrusted [Critical] — LLM05:2025
- **Verify:** Output is never passed unvalidated to SQL, shell, `eval`, file paths, redirects, HTML, or `fetch`. Markdown rendering sanitizes HTML and restricts image/link URLs (image tags can exfiltrate data via query strings).
- **How:** Trace model output variables to sinks: `rg -n "dangerouslySetInnerHTML|eval\(|exec\(|\$queryRawUnsafe|redirect\(|router\.push\(" ` near model calls. Read the markdown renderer config (`rehype-raw`, `allowDangerousHtml`).
- **Fail signal:** Model-generated SQL executed directly; `rehype-raw` on model output; arbitrary image URLs rendered.
- **Fix:** Schema-validate structured output; parameterize; sanitize HTML; allow-list image/link domains or proxy them.

### LLM-03 No secrets or other users' data in prompts [High] — LLM02:2025, LLM07:2025
- **Verify:** System prompts contain no API keys, internal URLs, or access rules that only the prompt enforces. Context for a request contains only data the requesting user may see.
- **How:** Read system prompt files/strings; read context assembly (RAG retrieval, conversation history loading) for the user filter.
- **Fail signal:** Key or admin instructions in the prompt; history or documents loaded without a `user_id` filter.
- **Fix:** Assume the system prompt will leak. Move secrets to server config; enforce access in code; filter context by user.

### LLM-04 Tools exposed to the model are least-privilege [Critical] — LLM06:2025
- **Verify:** Each tool does one narrow thing, runs with the *calling user's* permissions (not a service account), validates its arguments with a schema, and cannot reach admin or cross-tenant data.
- **How:** List tools: `rg -n "tools:|tool\(\{|function_declarations|\.bindTools|server\.tool\(|registerTool"`. Read each tool's implementation for its client/credentials.
- **Fail signal:** A generic `runSQL`, `fetchUrl`, or `executeCode` tool; tool uses the Supabase secret key or an admin token.
- **Fix:** Narrow tools; user-scoped clients; argument schemas with bounds.

### LLM-05 Destructive or external actions need human confirmation [High] — LLM06:2025
- **Verify:** Tools that send messages, spend money, delete data, change permissions, or post publicly require explicit user approval of the concrete action before execution. Approval is risk-tiered: low-risk calls run freely so that people still read the prompts that matter. A confirmation on every action trains people to approve without reading, and then it is no control.
- **How:** Read tool definitions for an approval step (`needsApproval`, confirmation UI, two-phase "propose then execute"). Count how many tool calls prompt in a typical run, and look for persisted "always allow" / "approve all" options.
- **Fail signal:** Model can email, pay, or delete in one step. Or the opposite: every tool call prompts, a persistent "always allow" exists for destructive tools, or bulk actions show one generic "Proceed?" with no per-item detail.
- **Fix:** Propose → show the exact action (recipients, amounts, the list of items to delete) → user confirms → execute with the confirmed arguments only. Tier tools by risk, prompt only on the high tier, and make the prompt name the concrete effect.

### LLM-06 RAG retrieval respects access control [Critical] — LLM08:2025
- **Verify:** Vector search filters by tenant/user (metadata filter or RLS on the embeddings table) **before** results reach the model. The same holds *within* a tenant: an assistant can only retrieve what the asking user's role may see. "It only reads" is not low risk; broad read access is itself the exposure.
- **How:** `rg -n "match_documents|similarity_search|\.query\(\{.*vector|pgvector|<=>|embedding"` and read the filter. For internal assistants over HR, finance, legal, or CRM data, find the role/ACL filter on retrieval and the user the retrieval client runs as.
- **Fail signal:** Global vector search across all tenants' documents. An internal assistant indexed on a service account that can see everything, so an ordinary employee can ask for executive compensation and get it.
- **Fix:** Tenant filter in the query; RLS on the embeddings table; separate namespaces per tenant; retrieve with the requesting user's identity and ACLs, not the indexer's.

### LLM-07 Ingested content is screened [Medium] — LLM04:2025, LLM08:2025
- **Verify:** Documents, URLs, and user files ingested into retrieval or memory come from expected sources, are size/type limited, and are attributed so poisoned entries can be found and removed.
- **How:** Read the ingestion pipeline.
- **Fail signal:** Any user can add documents that other tenants' queries retrieve.
- **Fix:** Per-tenant ingestion; provenance metadata; deletion path.

### LLM-08 Model and SDK supply chain is pinned [Medium] — LLM03:2025
- **Verify:** Model IDs are pinned to explicit versions where the provider offers them; SDKs are in the lockfile; any downloaded model weights or third-party prompts/plugins come from trusted sources with integrity checks.
- **How:** `rg -n "model: ['\"]" ` and check for floating aliases; read model-download code.
- **Fail signal:** Weights pulled from an arbitrary URL at runtime; untrusted community tool plugins loaded dynamically.
- **Fix:** Pin; verify hashes; vendor or review plugins.

### LLM-09 Output that users rely on is labelled and checkable [Low] — LLM09:2025
- **Verify:** AI-generated content is labelled as such; features giving medical, legal, financial, or safety-relevant answers show sources or disclaimers and route high-stakes cases to humans.
- **How:** Read the UI around generated output.
- **Fail signal:** Generated answers presented as authoritative facts with no source.
- **Fix:** Label, cite retrieved sources, add a human-review path for high-stakes outputs.

### LLM-10 Prompts and outputs are logged safely [Medium]
- **Verify:** Prompts/outputs are logged for abuse investigation with retention limits and PII handling consistent with the privacy policy; logs are access-controlled.
- **How:** Read logging around model calls and the observability vendor config.
- **Fail signal:** Full prompts with personal data sent to a third-party logging tool with no retention setting and no mention in the privacy policy.
- **Fix:** Redact or hash PII, set retention, disclose the processor (see PRIV-05).

### LLM-11 Content safety for user-facing generation [Medium]
- **Verify:** For public or UGC-facing generation, inputs and outputs pass a moderation step appropriate to the audience, and abuse reports reach a human.
- **How:** `rg -n "moderations\.create|moderation|safety|guardrail"`.
- **Fail signal:** Public image or text generation with no moderation and no report path.
- **Fix:** Provider moderation endpoint or classifier; report button; see ABUSE.

### LLM-12 Unacceptable behaviors are declared, owned, and enforceable [High] — LLM06:2025, LLM02:2025
- **Verify:** For each AI feature, a written list in plain language states the outcomes it must never produce (leak this data class, run this command, give this kind of advice, contact these people), with a named owner. Each item maps to at least one enforcing control elsewhere in this audit (a tool restriction, an authz check, a runtime block, an output filter). Items with no mapped control are gaps.
- **How:** Look for a policy doc, `AGENTS.md`/`SECURITY.md` section, system-prompt spec, or eval config that names forbidden outcomes: `rg -il "must never|never (reveal|send|delete|execute)|forbidden|unacceptable|red line" docs/ .github/ *.md`. Ask the owner if nothing is in the repo (mark **Unknown**).
- **Fail signal:** No list exists; the only statement is a system-prompt sentence ("don't reveal secrets") with no code-level control behind it; a list exists with no owner.
- **Fix:** Write the list (5–15 specific behaviors, not "be safe"), assign an owner, and link each item to its control and its test (LLM-13). Report the list in the report's AI inventory table.

### LLM-13 Adversarial testing is repeatable and re-run [Medium] — LLM01:2025
- **Verify:** The declared behaviors (LLM-12) have a repeatable adversarial test set (prompt-injection, jailbreak, exfiltration, tool-abuse cases) that runs on changes to the prompt, model ID, tools, or retrieval corpus, and on a schedule. Results are recorded, including what could not be elicited and when it was last tried. A model that resists attack today can fail after a model swap or new technique, so a one-time launch test is not enough.
- **How:** `rg -il "promptfoo|garak|pyrit|deepteam|red.?team|adversarial|injection.?test" . --glob '!node_modules'`; read `.github/workflows/` for scheduled or on-change eval jobs; check for stored results.
- **Fail signal:** No adversarial cases; cases exist but never run in CI or on model changes; results are not kept.
- **Fix:** Add a small suite keyed to the LLM-12 list, run it in CI on prompt/model/tool changes plus a schedule, and store dated results. Do not read a green run as "secure": it only covers the cases tried.

---

## AGT — Third-party OAuth & agent delegation

Profile: `agent-oauth`. Covers apps that connect to users' accounts elsewhere (Google, GitHub, Slack, Notion…), run agents that act on those accounts, or expose an MCP server.

### AGT-01 OAuth uses authorization code + PKCE with exact redirect URIs [High]
- **Verify:** Outbound OAuth connections use the authorization code grant with PKCE and a `state` value bound to the user's session; registered redirect URIs are exact, not wildcards. RFC 9700 requires public clients to use PKCE and recommends it for confidential clients.
- **How:** Read the connect/callback handlers: `rg -n "code_challenge|code_verifier|state|redirect_uri|response_type"`.
- **Fail signal:** Implicit grant (`response_type=token`); `state` missing or not checked; wildcard redirect.
- **Fix:** Code + PKCE; random `state` stored server-side and compared on callback; exact redirect URIs.

### AGT-02 Requested scopes are minimal [High] — ASI03
- **Verify:** Each integration requests only the scopes its features use; read-only where possible; incremental authorization for extra features.
- **How:** `rg -n "scope[s]?[:=]"` in integration code. Compare to features.
- **Fail signal:** Full mailbox or full-repo write scope for a feature that only reads metadata.
- **Fix:** Narrow scopes; request more only when the user opts into the feature.

### AGT-03 Third-party tokens are stored encrypted and server-side [Critical]
- **Verify:** Access and refresh tokens for connected accounts live only in the server DB, encrypted at rest with a key not stored in the same DB, never sent to the browser, never logged.
- **How:** Find the token table/columns; check for encryption (`pgsodium`, Vault, KMS, app-level AES-GCM) and RLS/grants on it.
- **Fail signal:** Plaintext `refresh_token` column readable through the user's own Supabase client; tokens in `localStorage`.
- **Fix:** Encrypt; no client read access; decrypt only in the server function that calls the provider.

### AGT-04 Agents act with the user's authority, not more [Critical] — ASI03
- **Verify:** When an agent calls a third-party API or your own API, it uses the specific user's delegated token and your app's per-user authorization, never a shared admin token or a service key that spans users.
- **How:** Trace each agent tool to the credential it uses.
- **Fail signal:** One org-wide bot token used for all users' requests; agent tools call internal APIs with a service key.
- **Fix:** Per-user delegated credentials; enforce the same AUTHZ checks as for direct user requests.

### AGT-05 Tool output and fetched content cannot redirect the agent [High] — ASI01, LLM01:2025
- **Verify:** Content returned by tools (emails, web pages, issues, documents) is treated as data; the agent's allowed actions after reading untrusted content are restricted (no new recipients, no new domains, no privilege change) or require confirmation. This holds on **every** channel the agent reads, not only the chat box: web pages and URLs it opens, repositories and dependencies, uploaded files, inbound email and messages, and tickets. A content filter on the user conversation alone leaves the other channels open.
- **How:** Read the agent loop and tool-result handling; look for any policy that limits actions after untrusted reads. List every tool that ingests external content and confirm each one goes through the same policy.
- **Fail signal:** Agent reads an inbound email and can then forward mail to any address with no confirmation.
- **Fix:** Taint tracking or a simple rule: after untrusted input, sensitive tools need confirmation; allow-list destinations.

### AGT-06 Tool misuse is bounded [High] — ASI02
- **Verify:** Each tool validates arguments, enforces per-run and per-user call limits, and refuses out-of-scope targets (other tenants, internal hosts).
- **How:** Read tool implementations and the agent runner's limits (COST-03).
- **Fail signal:** `sendEmail({to, body})` with any `to`; `httpGet(url)` with no host allow-list.
- **Fix:** Schema + allow-lists + per-run caps.

### AGT-07 Code execution is sandboxed [Critical] — ASI05
- **Verify:** If the agent can run code, it runs in an isolated sandbox (separate container/VM/WASM) with no host credentials, network egress limited, CPU/time/memory limits.
- **How:** `rg -n "vm\.runIn|new Function|eval\(|child_process|execSync|e2b|sandbox|pyodide|docker run"`.
- **Fail signal:** Generated code run with `eval` or `child_process` in the app server.
- **Fix:** Dedicated sandbox service; no secrets in its environment.

### AGT-08 Agent memory is scoped and reviewable [Medium] — ASI06
- **Verify:** Long-term memory/context stores are per user or tenant, can be viewed and deleted by the user, and do not let one user's content influence another's agent.
- **How:** Read memory read/write code and its keys.
- **Fail signal:** Shared memory store across users; no delete path.
- **Fix:** Scope by user; expose view/delete; expire entries.

### AGT-09 MCP servers and inter-agent calls authenticate [High] — ASI04, ASI07
- **Verify:** MCP servers the app exposes require auth for remote transports and authorize each tool call per user; MCP servers or agents the app *consumes* are pinned and from trusted sources; messages between agents are authenticated.
- **How:** `rg -n "@modelcontextprotocol|McpServer|StreamableHTTP|SSEServerTransport|mcp\.json"`. Read the auth middleware on the transport.
- **Fail signal:** Remote MCP endpoint with no auth; installing MCP servers from unpinned `npx` at runtime.
- **Fix:** OAuth or token auth on remote transports; per-tool authz; pin versions.

### AGT-10 Users can see and revoke delegations [Medium]
- **Verify:** Users can list connected accounts and active agent permissions, disconnect them, and disconnecting revokes tokens at the provider and deletes them locally.
- **How:** Read settings/integrations page and disconnect handler.
- **Fail signal:** Disconnect only hides the integration; token stays in DB.
- **Fix:** Call provider revocation endpoint; delete stored tokens.

### AGT-11 Agent actions are audited [Medium] — ASI08, ASI10
- **Verify:** Every agent action on a user's behalf is logged with user, tool, arguments (redacted), result, and run ID; there is a kill switch to disable an agent or tool quickly. The log reaches wherever alerts are raised: agent harm often looks like normal traffic (no malware, no failed login, no firewall hit), so network and auth monitoring will not see it.
- **How:** Read agent runner logging and feature-flag config. Find where the action log ships and whether any alert reads it (egress to a new recipient or domain, bulk reads, mass deletes, unusual tool volume).
- **Fail signal:** No record of what the agent did; no way to disable a misbehaving tool without a deploy; action logs exist but no alert or review reads them, so a data-exfiltrating "send me the contracts" request would leave no signal.
- **Fix:** Structured action log; per-tool feature flag; alert rules on agent egress and bulk-action patterns.

### AGT-12 Agent output does not overclaim [Low] — ASI09
- **Verify:** The UI shows what the agent actually did (diffs, sent messages, receipts) rather than a model-written summary only, so users are not misled into trusting unverified claims.
- **How:** Read the result UI.
- **Fail signal:** "Done! I've emailed everyone" with no record shown.
- **Fix:** Render the action log next to the summary.

### AGT-13 Harmful tool calls are blocked at execution time [High] — ASI02, ASI01
- **Verify:** Pre-deployment testing (LLM-13) shows what an agent can be pushed to do; it does not stop anything in production. A runtime policy layer sits between the model and each tool, inspects the actual arguments, and blocks calls that hit the LLM-12 list (new external recipient, bulk delete, secrets in a payload, off-allow-list host) while letting ordinary calls through. The policy runs in code, outside the model, so a hijacked model cannot talk its way past it.
- **How:** Find the single choke point every tool call passes through (wrapper, middleware, MCP proxy, guardrail SDK): `rg -n "beforeToolCall|onToolCall|toolGuard|policy\.(check|evaluate)|guardrail|allowedDomains"`. Confirm no tool is registered around it.
- **Fail signal:** Tools called directly by the model loop with only schema validation; safety rests on the system prompt; a guard exists but some tools bypass it.
- **Fix:** Route all tool calls through one policy function that returns allow / deny / require-confirmation, with deny rules derived from LLM-12 and its decisions logged (AGT-11).

### AGT-14 Benign instructions cannot cause irreversible damage [High] — ASI02, ASI08
- **Verify:** No attacker is needed for harm. An ordinary instruction such as "delete my old unused files" can wipe disaster-recovery data that merely looks unused. Destructive tools (delete, overwrite, drop, force-push, revoke, bulk update) support a preview/dry-run, act on an explicit item list the user saw, are capped per run, and prefer reversible forms (soft delete, trash, versioning). Backups and recovery copies sit outside what the agent's credentials can modify.
- **How:** List destructive tools (`rg -n "delete|remove|rm |unlink|drop|truncate|overwrite|force|--hard"` in tool code). For each, check for dry-run, item cap, soft-delete, and which credential runs it. Check whether that credential can reach backups or other environments.
- **Fail signal:** A `deleteFiles(pattern)` or "clean up" tool that acts on a glob/heuristic with no preview; an agent token that can delete backups, production data, or branches; no per-run cap on destructive calls.
- **Fix:** Dry-run then confirm with the concrete list; soft delete with retention; per-run caps; separate credentials so the agent cannot touch backups or prod from a dev task.

### AGT-15 Inbound requests to a connected agent are authorized by sender [High] — ASI03, ASI01
- **Verify:** If the agent processes messages from outside parties (email, chat, support tickets, form submissions), the sender's identity and entitlement are checked before the agent can act on or disclose data for them. A stranger who writes "send me your largest contracts" must not get an answer built from the owner's data.
- **How:** Find inbound channels wired to the agent (`rg -n "inbound|webhook.*email|imap|mail\.on|slack.*event|ticket"`); read what the agent can do in response and which data tools it holds on that path.
- **Fail signal:** Inbound email or chat triggers an agent that holds CRM, file, or email-send tools with the owner's credentials and no sender check or allow-list.
- **Fix:** Treat inbound content as untrusted (AGT-05); give inbound-triggered runs a separate, read-minimal tool set with no access to the owner's private data; require owner approval for any reply that includes internal data.
