# Sources

Public standards and vendor documentation the checks were written from. Identifiers below were checked against the source pages in November 2026. Do not cite IDs that are not on this list without verifying them first.

## OWASP

- **OWASP Top 10:2025** (web) — https://owasp.org/Top10/2025/
  A01:2025 Broken Access Control · A02:2025 Security Misconfiguration · A03:2025 Software Supply Chain Failures · A04:2025 Cryptographic Failures · A05:2025 Injection · A06:2025 Insecure Design · A07:2025 Authentication Failures · A08:2025 Software or Data Integrity Failures · A09:2025 Security Logging and Alerting Failures · A10:2025 Mishandling of Exceptional Conditions
- **OWASP Top 10 for LLM Applications 2025** — https://genai.owasp.org/llm-top-10/
  LLM01:2025 Prompt Injection · LLM02:2025 Sensitive Information Disclosure · LLM03:2025 Supply Chain · LLM04:2025 Data and Model Poisoning · LLM05:2025 Improper Output Handling · LLM06:2025 Excessive Agency · LLM07:2025 System Prompt Leakage · LLM08:2025 Vector and Embedding Weaknesses · LLM09:2025 Misinformation · LLM10:2025 Unbounded Consumption
- **OWASP Top 10 for Agentic Applications for 2026** (OWASP GenAI Security Project, published December 2025) — https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
  ASI01 Agent Goal Hijack · ASI02 Tool Misuse · ASI03 Identity & Privilege Abuse · ASI04 Agentic Supply Chain Vulnerabilities · ASI05 Unexpected Code Execution · ASI06 Memory & Context Poisoning · ASI07 Insecure Inter-Agent Communication · ASI08 Cascading Failures · ASI09 Human-Agent Trust Exploitation · ASI10 Rogue Agents
  (IDs and names taken from the OWASP GenAI announcement post; the full document's longer titles may differ slightly, e.g. "Tool Misuse and Exploitation".)
- **OWASP Application Security Verification Standard (ASVS) 5.0.0** (published 30 May 2025) — https://owasp.org/www-project-application-security-verification-standard/
  Used for general coverage. The checks do not cite individual ASVS requirement numbers; map them yourself from the CSV if a report needs them.
- **OWASP Secure Headers Project** — https://owasp.org/www-project-secure-headers/
  Recommended header values: https://github.com/OWASP/www-project-secure-headers/blob/master/ci/headers_add.json

## NIST

- **NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management** (final, August 2025) — https://pages.nist.gov/800-63-4/sp800-63b.html
  Used for: password length (15 min single-factor, 8 min when only used with MFA, allow at least 64), no composition rules, no periodic rotation, blocklist, allow paste/password managers, ≤100 consecutive failed attempts as an upper bound, reauthentication timeouts (AAL1 overall ≤30 days; AAL2 overall ≤24 h, inactivity ≤1 h).
- **NIST AI Risk Management Framework (AI RMF 1.0)** (January 2023) — https://www.nist.gov/itl/ai-risk-management-framework
- **NIST AI 600-1, AI RMF: Generative Artificial Intelligence Profile** — https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence
  Used as background for the LLM domain. No check cites a specific AI RMF subcategory.

## Supabase

- **Row Level Security** — https://supabase.com/docs/guides/database/postgres/row-level-security
  Used for: RLS on every exposed table, `using` + `with check` on updates, `(select auth.uid())` wrapping, `user_metadata` is user-editable, `security_invoker` views, secret key / `service_role` bypasses RLS.
- **API keys** — https://supabase.com/docs/guides/api/api-keys
  Key types: publishable `sb_publishable_…` (public), secret `sb_secret_…` (server-only, bypasses RLS), legacy `anon` and `service_role` JWTs.
- **Advisors (security and performance lints)** — https://supabase.com/docs/guides/database/database-advisors
  Lints cited: 0002 auth users exposed · 0007 policy exists rls disabled · 0008 rls enabled no policy · 0010 security definer view · 0011 function search path mutable · 0012 auth allow anonymous sign ins · 0013 rls disabled in public · 0014 extension in public · 0015 rls references user metadata · 0023 sensitive columns exposed · 0024 permissive rls policy · 0025 public bucket allows listing · 0026/0027 pg graphql anon/authenticated table exposed · 0028/0029 anon/authenticated security definer function executable. CLI: `supabase db advisors`.
- **Storage access control** — https://supabase.com/docs/guides/storage/security/access-control

## Payments

- **Stripe: Receive events in your webhook endpoint** — https://docs.stripe.com/webhooks
  Used for: verify signature on the raw body, default 5-minute tolerance, tolerance `0` disables the recency check, handle duplicate events by event ID, return 2xx quickly, do not depend on event order.
- **Stripe: webhook signature troubleshooting** — https://docs.stripe.com/webhooks/signature
- **PCI SSC: Important updates for merchants validating to SAQ A** (January 2025) — https://blog.pcisecuritystandards.org/important-updates-announced-for-merchants-validating-to-self-assessment-questionnaire-a
  Used for: SAQ A covers merchants with card functions fully outsourced to PCI DSS validated third parties; the January 2025 SAQ A removed Requirements 6.4.3 and 11.6.1 and added an eligibility criterion to confirm the site is not susceptible to attacks from scripts that could affect the merchant's e-commerce system(s). Eligibility is decided with the merchant's acquirer/compliance entity, not by this audit.

## Privacy (GDPR, Regulation (EU) 2016/679)

Article text via https://gdpr-info.eu/ (unofficial consolidated text; the official text is on EUR-Lex: https://eur-lex.europa.eu/eli/reg/2016/679/oj).

- Art. 5 Principles (5(1)(c) data minimisation, 5(1)(e) storage limitation) — https://gdpr-info.eu/art-5-gdpr/
- Art. 7 Conditions for consent — https://gdpr-info.eu/art-7-gdpr/
- Art. 9 Special categories of personal data — https://gdpr-info.eu/art-9-gdpr/
- Art. 12 Transparent information and modalities (respond within one month, extendable by two further months) — https://gdpr-info.eu/art-12-gdpr/
- Art. 13 / 14 Information to be provided — https://gdpr-info.eu/art-13-gdpr/ · https://gdpr-info.eu/art-14-gdpr/
- Art. 15 Right of access — https://gdpr-info.eu/art-15-gdpr/
- Art. 16 Right to rectification — https://gdpr-info.eu/art-16-gdpr/
- Art. 17 Right to erasure — https://gdpr-info.eu/art-17-gdpr/
- Art. 20 Right to data portability — https://gdpr-info.eu/art-20-gdpr/
- Art. 21 Right to object — https://gdpr-info.eu/art-21-gdpr/
- Art. 25 Data protection by design and by default — https://gdpr-info.eu/art-25-gdpr/
- Art. 28 Processor — https://gdpr-info.eu/art-28-gdpr/
- Art. 30 Records of processing activities — https://gdpr-info.eu/art-30-gdpr/
- Art. 32 Security of processing — https://gdpr-info.eu/art-32-gdpr/
- Art. 33 Notification of a personal data breach to the supervisory authority (without undue delay, where feasible within 72 hours) — https://gdpr-info.eu/art-33-gdpr/
- Art. 34 Communication of a personal data breach to the data subject — https://gdpr-info.eu/art-34-gdpr/

Articles 5, 12, 17, and 33 were read for this skill; the other article titles are the standard GDPR headings and should be re-read before quoting their text.

## OAuth and identity

- **RFC 9700, Best Current Practice for OAuth 2.0 Security** (BCP 240, January 2025) — https://www.rfc-editor.org/rfc/rfc9700.html
  Used for: public clients MUST use PKCE (recommended for confidential clients), PKCE/nonce must be transaction-specific, exact string matching of redirect URIs/origins, no wildcard `postMessage` origins.

## Accessibility

- **W3C WCAG 2.2** — https://www.w3.org/TR/WCAG22/
  Success criteria cited: 1.1.1, 1.3.1, 1.4.3, 2.1.1, 2.4.2, 2.4.7, 2.4.11, 3.1.1, 3.3.1, 3.3.2, 3.3.8, 4.1.2.

## Not used / not verified

- Vendor-specific numbers that change often (rate-limit defaults, plan quotas) are not stated as facts; the checks tell the auditor to read the project's config instead.
- No check reproduces or paraphrases any commercial audit framework's prompts.
