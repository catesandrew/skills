# Payments, entitlements, and cost exhaustion

Checks for PAY (payments and webhooks), ENT (entitlements and paywall enforcement), and COST (cost exhaustion / "denial of wallet").

Grounding: Stripe webhook docs (signature verification, raw body, 5-minute default tolerance, duplicate events), PCI SSC SAQ A update (January 2025), OWASP Top 10 for LLM Applications 2025 LLM10:2025 Unbounded Consumption, OWASP Top 10:2025 A06 Insecure Design. URLs in [sources.md](sources.md).

Stripe is used as the concrete example. Translate to Paddle, Lemon Squeezy, or others: the controls are the same (verify signature, dedupe events, server-side prices, server-side entitlement).

---

## PAY — Payments & webhooks

Profile: `payments`.

### PAY-01 Card data never touches your servers [Critical]
- **Verify:** Card entry uses the provider's hosted page or iframe fields (Stripe Checkout, Payment Element, Payment Links). No `<input>` for card number/CVC in your own DOM, and no card fields in your API bodies or logs.
- **How:** `rg -n -i "card_?number|cardNumber|cvc|cvv|exp_month" --glob '!node_modules'`. Read the checkout component.
- **Fail signal:** Own form posts PAN/CVC to your API.
- **Fix:** Switch to hosted checkout or provider Elements. Note in the report: SAQ A eligibility depends on fully outsourcing card handling; whether the merchant qualifies is a decision for their acquirer or compliance contact, not this audit.

### PAY-02 Payment pages are protected from script tampering [Medium]
- **Verify:** Pages that embed or redirect to the payment form load a minimal, known set of scripts, under a CSP. The January 2025 SAQ A revision added an eligibility criterion that the merchant confirm their site is not susceptible to attacks from scripts that could affect their e-commerce systems.
- **How:** Read the checkout page's script tags, tag-manager use, and HDR-02 result.
- **Fail signal:** Tag manager, chat widgets, and ad pixels on the page that hosts the payment iframe, with no CSP.
- **Fix:** Strip third-party scripts from checkout pages; enforce a CSP there; consider redirect-based hosted checkout.

### PAY-03 Webhook signatures are verified on the raw body [Critical]
- **Verify:** The webhook handler verifies the provider signature (`stripe.webhooks.constructEvent` / `constructEventAsync`) using the **raw** request body and the endpoint secret, before any processing. Stripe's docs state any manipulation of the raw body makes verification fail.
- **How:** `rg -n "constructEvent|stripe-signature|webhooks\.construct|whsec_|STRIPE_WEBHOOK_SECRET"`. Read the handler: is it `await req.text()` (or a raw-body parser), not `req.json()`?
- **Fail signal:** No signature check; `JSON.parse` before verify; verification in a `try` whose `catch` continues processing.
- **Fix:** `const event = stripe.webhooks.constructEvent(await req.text(), sig, secret)`; return 400 on failure and stop.

### PAY-04 Webhook replay window is not disabled [High]
- **Verify:** The timestamp tolerance is the library default (5 minutes for Stripe) or tighter, never `0` (Stripe documents that `0` disables the recency check).
- **How:** Look at the `constructEvent` call's tolerance argument.
- **Fail signal:** Tolerance `0` or a very large value.
- **Fix:** Use the default; keep server time synced (NTP).

### PAY-05 Webhook events are processed idempotently [High]
- **Verify:** Processed event IDs are stored and checked so a duplicate delivery does not double-grant credits, double-send emails, or double-provision. Order of events is not assumed.
- **How:** Read the handler for an `event.id` uniqueness check (table with unique constraint, upsert).
- **Fail signal:** `credits += amount` on every `checkout.session.completed` delivery with no dedupe.
- **Fix:** `insert into processed_events(id) … on conflict do nothing` in the same transaction as the grant; on conflict, return 200 and skip.

### PAY-06 Prices and amounts come from the server [Critical]
- **Verify:** Checkout sessions are created server-side using price IDs or amounts from server config/DB. The client sends only a product/plan key.
- **How:** `rg -n "checkout\.sessions\.create|paymentIntents\.create|unit_amount|amount:" ` and trace each value to its source.
- **Fail signal:** `unit_amount: body.amount`; `price: body.priceId` without allow-list; quantity unbounded from the client.
- **Fix:** Map plan key to price ID on the server; validate quantity bounds.

### PAY-07 Fulfilment happens on verified events, not the success redirect [Critical]
- **Verify:** Access, credits, or goods are granted from the verified webhook (or a server-side retrieve of the session with status check), never from landing on `/success?session_id=`.
- **How:** Read the success page and any route it calls.
- **Fail signal:** Success page calls `grantPlan()` based on query param.
- **Fix:** Grant in the webhook; success page only reads state.

### PAY-08 Subscription lifecycle is handled [High]
- **Verify:** Cancellation, failed payment, refund, dispute, and downgrade events revoke or adjust access (e.g. `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`, `charge.refunded`, `charge.dispute.created`).
- **How:** List the event types the handler switches on.
- **Fail signal:** Only `checkout.session.completed` is handled; cancelled users keep paid access forever.
- **Fix:** Handle the lifecycle events; store subscription status and period end; derive access from it.

### PAY-09 Customer ↔ user binding is server-owned [High]
- **Verify:** The mapping between provider customer ID and app user is set server-side (metadata on session creation, or `client_reference_id`) and not writable by users.
- **How:** Read session creation and the user/profile update path (see AUTHZ-03).
- **Fail signal:** Users can set their own `stripe_customer_id` via profile update.
- **Fix:** Exclude it from writable fields; set it only in server code.

### PAY-10 Test and live modes are separated [Medium]
- **Verify:** Live keys only in production; test keys in dev/preview; webhook secrets per endpoint per mode.
- **How:** `.env.example`, deployment config, `rg -n "sk_test_|pk_test_|sk_live_|pk_live_"` (redact).
- **Fail signal:** Live key in preview env; same webhook secret across modes.
- **Fix:** Per-environment secrets.

---

## ENT — Entitlements & paywall

Profile: `payments` (or any app with plan tiers, credits, or quotas).

### ENT-01 Entitlement checks run on the server for every gated action [Critical]
- **Verify:** Every paid feature (API route, server action, LLM call, export, seat add) checks plan/credits on the server at the time of use.
- **How:** List gated features from the pricing page/plan config; find the server check for each. `rg -n "plan ===|isPro|hasAccess|entitlement|credits"`.
- **Fail signal:** Gate exists only in UI (`{isPro && <Button/>}`), while the endpoint has no check.
- **Fix:** One `requireEntitlement(user, feature)` helper used by every gated handler.

### ENT-02 Plan state is not client-writable [Critical]
- **Verify:** `plan`, `credits`, `trial_ends_at`, `seats` are writable only by server code / webhooks. Under Supabase, RLS forbids users updating these columns.
- **How:** Read RLS update policies on the profile/subscription table; check column grants.
- **Fail signal:** User can `update profiles set plan = 'pro'` through the client SDK.
- **Fix:** Move plan data to a table with no user write policy, or revoke column update.

### ENT-03 Credit consumption is atomic [High]
- **Verify:** Deducting credits and performing the action cannot race: a single conditional update (`update … set credits = credits - $1 where id = $2 and credits >= $1 returning …`) or a transaction with row lock.
- **How:** Read the credit-deduct code.
- **Fail signal:** Read credits, check in JS, then write — parallel requests overspend.
- **Fix:** Conditional atomic update; refund on action failure.

### ENT-04 Trials and free tiers cannot be farmed trivially [Medium]
- **Verify:** Free-tier limits are per verified account at minimum, and signup has abuse friction proportional to the cost of the free tier (email verification, CAPTCHA, payment method for trials of costly features).
- **How:** Read signup and trial-start logic.
- **Fail signal:** Unlimited free LLM calls per throwaway email.
- **Fix:** Verification + per-account and per-IP quotas; see COST checks.

### ENT-05 Downgrade and expiry remove access [High]
- **Verify:** When a subscription ends, gated features stop working on the next request, and over-limit resources follow a defined policy.
- **How:** Trace from PAY-08 handler to the entitlement source of truth.
- **Fail signal:** Entitlement cached in a long-lived JWT claim with no refresh on downgrade.
- **Fix:** Read entitlement from DB per request, or refresh claims on change.

### ENT-06 Usage limits are enforced, not just displayed [Medium]
- **Verify:** Quotas shown in the UI (projects, seats, storage, messages/month) are enforced in the server path that creates the resource.
- **How:** For each quota, find the server check.
- **Fail signal:** "3 projects max" only in UI.
- **Fix:** Server check at creation; DB constraint where possible.

---

## COST — Cost exhaustion

Profile: always on; LLM items need `ai`. Maps to OWASP LLM10:2025 Unbounded Consumption.

### COST-01 Per-user and global spend caps on LLM calls [Critical]
- **Verify:** Every model call is preceded by a per-user quota check (requests/tokens per window) and protected by a global budget or circuit breaker. Provider-side spend limits are set (usually **Unknown** from the repo — ask).
- **How:** Find every model call site: `rg -n "chat\.completions\.create|responses\.create|messages\.create|generateText|streamText|generateObject|\.invoke\(|embeddings\.create"`. Check what runs before each.
- **Fail signal:** A model call reachable by any logged-in (or anonymous) user with no quota.
- **Fix:** Per-user token budget in DB or a rate-limit store; global daily cap that trips to a degraded mode; provider-side hard limit.

### COST-02 Output and input sizes are bounded [High]
- **Verify:** `max_tokens`/`maxOutputTokens` set on every call; input length capped before sending; file/document sizes capped for RAG ingestion.
- **How:** Inspect each call site's options and the input schema.
- **Fail signal:** No `max_tokens`; user can paste megabytes into the prompt.
- **Fix:** Set limits per feature; reject or truncate oversized input with a message.

### COST-03 Agent and tool loops terminate [Critical]
- **Verify:** Agentic loops have a hard cap on steps/tool calls (e.g. `maxSteps`/`stopWhen`, iteration counter), a wall-clock timeout, and a per-run token budget.
- **How:** `rg -n "while \(true\)|maxSteps|stopWhen|maxIterations|recursionLimit|for \(;;\)"` in agent code.
- **Fail signal:** Loop continues until the model says "done".
- **Fix:** Step cap, timeout, budget; abort and log when hit.

### COST-04 Expensive non-LLM operations are limited [High]
- **Verify:** Email, SMS, image/video generation, transcoding, exports, and third-party API calls that cost money are rate-limited per user and per IP.
- **How:** `rg -n "resend|sendgrid|postmark|twilio|messages\.create|sharp\(|ffmpeg"` and check for limits.
- **Fail signal:** Unauthenticated "send me a link" or SMS endpoint without limits (SMS pumping).
- **Fix:** Per-recipient and per-IP limits; CAPTCHA on unauthenticated sends; geographic allow-list for SMS if appropriate.

### COST-05 Streaming and long requests time out [Medium]
- **Verify:** Server functions set a max duration; upstream calls set timeouts; client disconnects abort upstream requests (`AbortSignal` passed through).
- **How:** `rg -n "maxDuration|AbortController|signal:|timeout:"`.
- **Fail signal:** Stream continues billing after the user closes the tab.
- **Fix:** Pass `req.signal` to the provider SDK; set `maxDuration`.

### COST-06 Caching and dedupe for repeat work [Low]
- **Verify:** Identical expensive requests (embeddings of the same doc, repeated summaries) are cached or deduped.
- **How:** Look for cache keys around embedding/summarise paths.
- **Fail signal:** Re-embedding the whole corpus on every upload.
- **Fix:** Content-hash cache.

### COST-07 Spend is monitored and alerts fire [Medium]
- **Verify:** Token usage and cost are recorded per user/feature, and an alert fires on anomalous spend.
- **How:** `rg -n "usage\.(total_tokens|input_tokens|output_tokens)|promptTokens|completionTokens"` and where they are stored.
- **Fail signal:** Usage discarded; first sign of abuse is the provider invoice.
- **Fix:** Log usage per request; daily anomaly alert; provider budget alerts.

### COST-08 Serverless and database scale limits are set [Medium]
- **Verify:** Hosting has concurrency/spend caps where the platform supports them; DB connection pooling is configured; auto-scaling has an upper bound.
- **How:** Read hosting config; values are often dashboard-only (**Unknown**).
- **Fail signal:** Unbounded autoscale with no spend cap on a public endpoint.
- **Fix:** Set caps and alerts on the platform.
