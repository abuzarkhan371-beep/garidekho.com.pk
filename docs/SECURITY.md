# Security — threat model and controls

This document describes what the current code does, what operators must configure, and the gaps to close before treating Garidekho as a public, payment-enabled marketplace.

## Assets and trust boundaries

| Asset | Why it matters |
| --- | --- |
| User PII (email, phone, name, profile, seller contact details) | Privacy obligations and social-engineering risk. |
| Credentials, sessions, OTP codes | Account takeover. |
| Listings, dealer identities, moderation state | Marketplace trust and fraud. |
| Uploaded images | Malware, phishing content, storage cost abuse. |
| Payment/webhook secrets and records | Financial fraud and chargebacks. |
| Admin roles/permissions and audit logs | Privilege escalation and insider abuse. |

Trust boundaries: (1) browser ↔ Next.js Server Actions/API routes, (2) OAuth/email/SMS/payment providers ↔ callbacks and webhooks, (3) user-supplied files ↔ image processing/storage, (4) privileged admin UI ↔ database. Every input crossing these boundaries must be authenticated or verified, validated and rate-limited.

## Threats and controls

### Implemented in code

| Threat | Control | Reference |
| --- | --- | --- |
| Password database leak | bcrypt hashing with cost 12 via `hashPassword`; `verifyPassword` uses bcrypt compare. Seed accounts use cost 10 and a shared dev password — dev only. | `src/lib/auth.ts`, `prisma/seed.ts` |
| Session token theft / fixation | 32 random bytes per session; only SHA-256 hash stored in `Session`; `httpOnly`, `secure` in production, `SameSite=Lax`, path `/`, max-age from `SESSION_TTL_DAYS`; server checks expiry, user status and deletion; logout deletes the session row and cookies. Guest sessions use a separate cookie. | `src/lib/auth.ts` |
| OTP interception/replay at rest | 6-digit codes stored as HMAC-SHA-256 using `AUTH_SECRET` plus identifier/purpose, 10-minute expiry, `attempts`/`maxAttempts` limits, constant-time comparison via `timingSafeEqual`, single-use `verifiedAt`. | `src/lib/auth.ts` (`issueOtp`, `verifyOtp`) |
| Enumeration via OTP/login | Verification-token helpers hash tokens with SHA-256 before storage; verification links are time-limited. OTP request responses are generic apart from the explicit dev-only `console` preview. | `src/lib/auth.ts`, `src/app/(auth)/actions.ts` |
| Privilege escalation | Role/permission tables seeded; `hasRole`, `hasPermission`, `requireUser`, `requirePermission` gate privileged operations; sessions resolve role permissions from the database on each request and reject suspended/deleted users. | `src/lib/auth.ts`, `prisma/seed.ts` |
| Malicious/duplicate listings | Listing statuses (`PENDING`/`ACTIVE`), `isVerified`, seller verification timestamps, `Report`/`AdminLog` models and moderator/dealer roles provide the foundation for moderation. Admin/moderator pages are not implemented yet. | `prisma/schema.prisma`, `prisma/seed.ts` |
| Malicious uploads | MIME allowlist (JPEG/PNG/WebP/AVIF), `NEXT_PUBLIC_UPLOAD_MAX_MB` size limit, `sharp` re-encode to WebP (resizes/strips metadata), generated public IDs; Cloudinary config is server-side. | `src/lib/services/storage.ts` |
| SQL injection | All queries use Prisma's parameterized client with `@prisma/adapter-pg`; no raw SQL concatenation in application code. Keep it that way and review any future `$queryRaw` usage. | `src/lib/db.ts`, `src/lib/**` |
| Header-based attacks / clickjacking | `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` set globally; `poweredByHeader: false`. | `next.config.ts` |
| Input-shape attacks | Zod schemas validate registration, login, OTP, listing drafts, inquiries and reports before persistence; search params are normalised before being mapped into typed Prisma filters. | `src/lib/validation.ts`, `src/lib/search.ts` |

### Must be configured by operators

- **Secrets management**: keep `.env` out of version control (`.gitignore`); store `AUTH_SECRET`, `CRON_SECRET`, OAuth/SMTP/SMS/Cloudinary/payment secrets in the platform secret manager. Generate 32+ random bytes, use a unique `AUTH_SECRET` per environment, and rotate on suspicion. Changing `AUTH_SECRET` invalidates outstanding OTP hashes. Never expose secrets via `NEXT_PUBLIC_*`.
- **HTTPS/TLS**: enforce HTTPS and HSTS at the edge; `secure` cookies are only set when `NODE_ENV=production`, so verify that setting. Update OAuth redirect URIs and all payment webhook URLs to the canonical HTTPS host.
- **CSRF**: cookies are `SameSite=Lax` and Next.js Server Actions include origin checks, which mitigates typical cross-site POSTs. For any future cookie-authenticated JSON endpoints, require a CSRF token or `Origin`/`Sec-Fetch-Site` validation, consider `SameSite=Strict` for admin-only cookies, and keep all state changes off `GET` routes. Webhook routes are a separate boundary: verify provider signatures, never session cookies.
- **Rate limiting (recommended, not yet implemented)**: per IP **and** account/phone limits for OTP request/verify, login, registration, password reset, favourites, upload and `/api/search/suggest`; strict limits on webhook endpoints by source IP. Use Redis/edge rate limiting with exponential backoff, temporary lockouts and CAPTCHA after repeated failures. Alert on spikes.
- **Payment webhooks**: verify HMAC/signature over the raw body with constant-time comparison, enforce timestamp tolerance and idempotency, trust only server-verified amounts, and never treat success/failure redirects as payment confirmation. See `docs/DEPLOYMENT.md#webhook-expectations`. Routes and verification are **not implemented**.
- **File storage**: `local` storage writes to `.uploads` and is development-only; use Cloudinary (or an implemented private object store) in production with restricted CORS, signed delivery where needed, virus scanning and per-user upload quotas.
- **Email/SMS**: use a verified sending domain (SPF/DKIM/DMARC) and a reputable SMS provider. Set `SMS_PROVIDER` away from `console` — the dev provider returns the OTP to the caller and must never be enabled publicly.
- **Database hardening**: least-privilege DB role, TLS, network isolation/private networking, connection limits, encrypted backups and tested restores. Avoid raw SQL; if unavoidable, use parameterized queries only.
- **Moderation/abuse operations**: staff admin access must be behind RBAC plus a separate identity control (SSO/MFA recommended), all privileged actions written to `AdminLog`, and reported listings reviewed with an audit trail. Admin UI is not implemented yet.
- **Monitoring**: centralised logs with redaction of phone/email/OTP/webhook payloads, alerting on auth failure spikes, 5xx rates, DB saturation, webhook signature failures and unexpected admin role changes. Add Sentry/LOG_LEVEL wiring.
- **Dependency hygiene**: keep Next.js/Prisma patched, run `npm audit`, enable Dependabot/renovate, approve install scripts only from the declared allowlist, and run `npm run typecheck`, `npm test` and `npm run test:e2e` in CI.

## Known gaps to close before public launch

1. `/sell`, admin/moderation, messages, payments and most navigation routes do not exist; do not advertise them as secured features.
2. No rate limiting, CAPTCHA, HSTS/CSP configuration, health endpoint or audit/monitoring pipeline.
3. No session rotation on privilege change/login and no device/session management UI.
4. Demo accounts share a known password and the seeder duplicates listings when re-run; strip demo data in production.
5. `console` SMS and SMTP-without-host modes leak sensitive content into logs/responses.
6. Form labels in the shared `Field` component are not associated with inputs, hurting accessibility and automated name-based testing.
