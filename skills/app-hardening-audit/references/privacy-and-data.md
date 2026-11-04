# Privacy, data-subject rights, and data minimization

Checks for PRIV (privacy notices and data-subject rights) and DATA (minimization, retention, protection at rest).

Grounding: GDPR (Regulation (EU) 2016/679) articles cited per check; OWASP Top 10:2025 A04 Cryptographic Failures. URLs in [sources.md](sources.md).

**Scope note for the report.** These checks look for *technical capability* in the code (can the app export, erase, honour consent?). Whether GDPR or another privacy law applies, and whether the organisation meets it, depends on facts outside the repo (establishment, users, lawful bases, contracts). Never write "GDPR compliant". Write which capabilities exist and which are missing, and recommend legal review where obligations are unclear.

Profile: PRIV is at full depth with `eu`; without `eu`, run PRIV-01, PRIV-05, and PRIV-07 only (they apply to most privacy laws and app-store policies) and mark the rest N/A with the reason.

---

## PRIV — Privacy & data-subject rights

### PRIV-01 A privacy notice exists and matches the code [High] — GDPR Art. 13, 14
- **Verify:** A privacy policy is reachable from signup and the footer, and the data it lists matches what the code actually collects and the processors it actually calls.
- **How:** Find the policy page. Build the list of collected fields from schemas/migrations and the list of third parties from `package.json` (analytics, error tracking, LLM providers, email, payments). Compare.
- **Fail signal:** No policy; or the code sends data to processors the policy does not mention (common: LLM provider, session replay).
- **Fix:** Update the policy to match; or remove the undisclosed data flow.

### PRIV-02 Right of access / export [Medium] — GDPR Art. 15, 20
- **Verify:** There is a way (self-serve or documented admin procedure) to export a user's personal data in a machine-readable format covering all tables and stores that hold it.
- **How:** `rg -n "export|download.*data|dsar|data_request"`. List tables with a `user_id` and compare to what the export includes.
- **Fail signal:** No export path; export misses tables (messages, uploads, LLM history).
- **Fix:** One export function that walks every user-keyed table and storage prefix; output JSON/CSV.

### PRIV-03 Right to erasure [High] — GDPR Art. 17
- **Verify:** Account deletion removes or anonymises personal data in the DB, storage buckets, vector stores, third-party processors (email lists, analytics, CRM), and backups on their rotation schedule. Foreign keys cascade or are handled.
- **How:** Read the delete-account handler; list every place user data is written (DB tables, storage, embeddings, third-party APIs).
- **Fail signal:** Delete only removes the auth user; rows, files, and embeddings remain; no call to processors.
- **Fix:** Deletion job covering every store; record what is retained and why (e.g. invoices kept for legal obligations).

### PRIV-04 Rectification and objection paths [Low] — GDPR Art. 16, 21
- **Verify:** Users can correct profile data, and can opt out of marketing and of processing based on legitimate interest (e.g. product analytics, where that is the basis used).
- **How:** Read settings pages and email preference handling.
- **Fail signal:** No unsubscribe; no way to edit stored personal fields.
- **Fix:** Settings fields; unsubscribe links; analytics opt-out.

### PRIV-05 Processors are known and minimal [Medium] — GDPR Art. 28, 30
- **Verify:** You can list every third party receiving personal data, what they receive, and their region. Data sent to each is limited to what the feature needs.
- **How:** From `package.json` and server code, list outbound SDKs/APIs; check what fields each call sends.
- **Fail signal:** Full user objects sent to analytics; whole conversation history sent to an LLM provider when a summary would do.
- **Fix:** Processor inventory in the report; trim payloads.

### PRIV-06 Consent is real where consent is the basis [Medium] — GDPR Art. 7
- **Verify:** Non-essential cookies and trackers load only after opt-in where consent is the lawful basis; withdrawing consent is as easy as giving it; consent choice is recorded.
- **How:** Read the layout/root for analytics and pixel scripts and whether they are gated by a consent state.
- **Fail signal:** Analytics/ads scripts load before any choice; banner with "Accept" only.
- **Fix:** Gate script loading on consent; add "Reject" with equal prominence; store the choice.

### PRIV-07 Requests can be answered on time [Low] — GDPR Art. 12
- **Verify:** There is a documented contact for privacy requests and an internal process that can respond within one month (extendable by two further months for complex cases, with notice to the requester).
- **How:** Look for a privacy contact in the policy and a runbook in `docs/`.
- **Fail signal:** No contact; no process owner.
- **Fix:** Add contact and a short runbook using PRIV-02/PRIV-03 tooling.

### PRIV-08 Breach response is prepared [Medium] — GDPR Art. 33, 34
- **Verify:** There is a written incident procedure that can support notifying the supervisory authority without undue delay and, where feasible, within 72 hours of becoming aware of a personal data breach, and affected users where the risk is high.
- **How:** Look for `SECURITY.md`, incident runbooks, on-call ownership.
- **Fail signal:** No procedure; no one owns the decision.
- **Fix:** One-page incident runbook: detect, contain, assess, notify, document. See OPS checks.

### PRIV-09 Privacy by default in features [Low] — GDPR Art. 25
- **Verify:** New user content defaults to private; public profiles and sharing are opt-in; minimal data is visible to other users.
- **How:** Read defaults for visibility columns and sharing settings.
- **Fail signal:** Profiles or projects public by default.
- **Fix:** Default private.

---

## DATA — Minimization, retention & protection

Profile: always on. Grounded in GDPR Art. 5(1)(c) data minimisation and 5(1)(e) storage limitation, Art. 32 security of processing.

### DATA-01 Only necessary fields are collected [Medium] — GDPR Art. 5(1)(c)
- **Verify:** Each personal field collected at signup and in forms has a feature that uses it.
- **How:** List personal columns from migrations (`email`, `phone`, `dob`, `address`, `ip`, `location`); search for where each is read.
- **Fail signal:** Required phone number or birth date never used.
- **Fix:** Drop or make optional; delete existing values.

### DATA-02 Retention limits exist and are enforced [Medium] — GDPR Art. 5(1)(e)
- **Verify:** Logs, LLM transcripts, uploads, analytics events, and soft-deleted rows have a retention period and a job that enforces it.
- **How:** `rg -n "retention|ttl|expires_at|deleted_at|pg_cron|cron\.schedule"`.
- **Fail signal:** Soft-delete forever; transcripts kept indefinitely.
- **Fix:** Scheduled purge job; document periods in the privacy policy.

### DATA-03 Sensitive data is not in logs or analytics [High]
- **Verify:** Passwords, tokens, full payment data, health data, government IDs, and raw prompts with personal data are not written to logs, error trackers, or analytics.
- **How:** Read logger config and error tracker `beforeSend`; `rg -n "console\.log\((user|body|req\.body|profile)|captureException\(.*user"`.
- **Fail signal:** Request bodies logged wholesale; session replay recording password or payment fields.
- **Fix:** Redaction lists; mask inputs in session replay; scrub in `beforeSend`.

### DATA-04 Special-category or high-risk data is identified [Medium] — GDPR Art. 9
- **Verify:** If the app stores health, biometric, sexual orientation, religious, political, or similar data, it is flagged, access-limited, and encrypted at the field level where feasible.
- **How:** Read schemas and feature descriptions.
- **Fail signal:** Health or mental-health notes stored as plain text readable by support staff tooling.
- **Fix:** Field-level encryption; strict access; recommend legal review (lawful basis for special categories is stricter).

### DATA-05 Encryption in transit and at rest [Medium] — GDPR Art. 32
- **Verify:** All external traffic is HTTPS; DB and storage connections use TLS; managed DB/storage encryption at rest is on (usually the provider default — mark **Unknown** if not visible); backups are encrypted.
- **How:** `rg -n "http://" --glob '!node_modules' --glob '!*.md'` for non-local URLs; DB connection strings for `sslmode`.
- **Fail signal:** `http://` API base URLs in production config; `sslmode=disable`.
- **Fix:** HTTPS everywhere; TLS on DB connections.

### DATA-06 Test and seed data contain no real personal data [Medium]
- **Verify:** Seeds, fixtures, and screenshots in the repo use synthetic data. Production dumps are not copied to dev machines unredacted.
- **How:** Read `supabase/seed.sql`, `fixtures/`, `__tests__/` data; `rg -n "@gmail\.com|@yahoo\.com|\+1[0-9]{10}"` in seeds.
- **Fail signal:** Real customer emails in seeds.
- **Fix:** Replace with generated data; document the redaction process for any prod copy.

### DATA-07 Identifiers in URLs and public pages leak nothing [Low]
- **Verify:** Public URLs do not contain emails, names, or sequential IDs that reveal user counts or let others enumerate records.
- **How:** Read route params and share-link generation.
- **Fail signal:** `/u/john.smith@example.com`; `/invoice/1043`.
- **Fix:** Random slugs or UUIDs; authorization still required (AUTHZ-01).
