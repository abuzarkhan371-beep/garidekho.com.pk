# Production deployment runbook — Garidekho.com.pk

This runbook covers container/Node hosts (Vercel, Railway, Render or similar) and Hostinger Node.js hosting with a managed PostgreSQL database. Replace `<host>` with the canonical production hostname. Commands use the project toolchain: `export PATH="$PWD/.toolchain/node/bin:$PATH"`.

> **Hostinger note:** Garidekho uses PostgreSQL and Prisma. Hostinger's phpMyAdmin is MySQL/MariaDB-only and **cannot** import this schema or browse these tables. Use the Hostinger **PostgreSQL** database panel to create the database/role, connect with `psql`, and apply Prisma migrations or reviewed SQL. Do not export a MySQL dump or try to import `schema.prisma` through phpMyAdmin.

## 0. Pre-flight

- [ ] Production domain and TLS certificate issued; `https://<host>` serves the app.
- [ ] Managed PostgreSQL 14+ provisioned with TLS enforced, automated backups and PITR enabled.
- [ ] Secrets available in the platform secret manager (never in the repository or build logs).
- [ ] Previous known-good release artifact/tag identified for rollback.
- [ ] On-call owner and change window agreed.

## 1. Provision and verify the database

1. Create a dedicated database and least-privilege role. The application role needs DML plus schema/migration rights **only during the migration step**; use a separate migration role where your provider supports it.
2. Obtain two connection strings where applicable:
   - `DATABASE_URL` — used by the app (pooled/transaction mode is fine for runtime).
   - `DIRECT_URL` — reserved for direct migration connections; note the current `prisma.config.ts` uses `DATABASE_URL` for both, so until that changes, `DATABASE_URL` must be able to apply migrations.
3. Verify connectivity from the deploy environment:

   ```bash
   psql "$DATABASE_URL" -c 'SELECT version();'
   psql "$DATABASE_URL" -c 'SELECT 1;'
   ```

4. Confirm TLS: `psql "$DATABASE_URL" -c 'SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();'` should return `t`.

### Hostinger PostgreSQL + Node.js

1. In **Hostinger → Databases → PostgreSQL**, create the database and a dedicated user. Copy the host, port, database name, user and password; enable SSL/TLS if offered. Keep the credentials out of the repository.
2. Build the URL (percent-encode special characters in the password):

   ```text
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require
   ```

   Set it as `DATABASE_URL` (and `DIRECT_URL` if your platform requires both) in the Hostinger **Node.js → Application → Environment variables** screen. Set `NODE_ENV=production` and `NEXT_PUBLIC_SITE_URL=https://garidekho.com.pk`.
3. Run `npm ci`, `npm run db:generate`, `npx prisma migrate deploy`, then `npm run build` in a deploy shell or CI job that can reach the database. `npm run build` uses the webpack build because the native SWC binary is unavailable in the local toolchain; keep that script unchanged.
4. If Hostinger does not allow outbound migration connections from its build shell, generate reviewed SQL on a machine that can connect and apply it with `psql`:

   ```bash
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > garidekho-schema.sql
   psql "$DATABASE_URL" -f garidekho-schema.sql
   ```

   For an existing database, use `--from-migrations prisma/migrations` instead of `--from-empty` so only pending migrations are generated. Prisma has no down migrations: take a backup before applying SQL, and record which migrations have been applied.
5. After import, verify with `psql "$DATABASE_URL" -c '\dt'` and `npx prisma migrate status`. Apply reference data only once with `npm run db:seed` in a non-public environment first, then rotate or remove the demo accounts.
6. Configure the Hostinger Node.js app with Node 20+, install command `npm ci`, build command `npm run db:generate && npm run build`, and start command `npm run start`. Confirm the app binds to the port supplied by Hostinger via `PORT` (Next.js does this automatically).
7. Point the domain's DNS/A record at Hostinger, issue the SSL certificate, and recheck `NEXT_PUBLIC_SITE_URL`, Google OAuth redirect URIs and payment webhook URLs for `https://garidekho.com.pk`.

## 2. Configure environment secrets

Set in the platform (server-side unless marked public):

| Variable | Notes |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | Production PostgreSQL with TLS. |
| `NEXT_PUBLIC_SITE_URL` | Exact `https://<host>`; used for metadata, OAuth and link generation. |
| `AUTH_SECRET` | `openssl rand -base64 48`, unique per environment; OTP HMACs depend on it. |
| `SESSION_TTL_DAYS` | Session lifetime; changing it invalidates expectations for existing cookies. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Redirect URI must exactly equal `https://<host>/api/auth/google/callback`. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Real SMTP credentials; verify SPF/DKIM/DMARC. |
| `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` | `console` is forbidden in production (it returns the OTP). Use `webhook` or `twilio`. |
| `STORAGE_DRIVER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `local` storage is not durable on serverless platforms. |
| `REDIS_URL` | When rate limiting/caching is enabled. |
| `CRON_SECRET` | Required before exposing scheduled endpoints. |
| Payment secrets | See [Webhook expectations](#webhook-expectations). |
| `SENTRY_DSN`, `LOG_LEVEL` | Observability once wired up. |

Also set `NODE_ENV=production` (most platforms do this automatically). Never prefix a secret with `NEXT_PUBLIC_`.

## 3. Build and migrate

1. Install with scripts approved (same allowlist as `package.json`): `npm ci`. If npm blocks scripts, run `npm approve-scripts` and re-run `npm ci`; confirm `prisma`, `@prisma/engines`, `sharp` and `esbuild` completed.
2. Generate the client: `npm run db:generate`.
3. Apply migrations as a separate, observable release step:

   ```bash
   npx prisma migrate deploy
   ```

   Do **not** use `npm run db:migrate` (`prisma migrate dev`) in production — it is interactive and can reset development databases.
4. Run `npm run build`, then `npm run start` (or your platform's build/start commands). Keep `npm run db:generate` before the build so generated types exist.

### Migration and seed strategy

- Migrations are additive where possible (expand/contract). Add new columns as nullable, backfill, then constrain in a later release.
- The generated client is checked against the schema in CI via `npm run typecheck`; migration drift should fail the release.
- **Seeding**: run `npm run db:seed` only for a brand-new environment or an explicitly approved data-restore drill. The seeder upserts roles, permissions, locations, taxonomy, users, plans, articles and pages, but it **creates listings and images every time**, so re-running it duplicates marketplace data. It also assigns the shared demo password `Admin@12345`; rotate or remove those accounts before public traffic.
- If the production environment must have reference data without demo content, split the seeder into a reference-data step and a demo-data step (code change required) rather than running the existing script repeatedly.

## 4. Health checks

`GET /api/health` is implemented and returns:

- `200 { "status": "ok", "database": "connected", ... }` when `SELECT 1` against `DATABASE_URL` succeeds;
- `503 { "status": "degraded", "database": "unavailable", ... }` on database failure, with no secrets in the body;
- `Cache-Control: no-store`, and it is excluded from authentication redirects and rate limits.

Configure platform health checks/synthetic monitors on `GET /api/health`, expecting HTTP 200 and `"status":"ok"`. Also expect `GET /` to render the hero and `GET /search?q=healthcheck` to return the search page. Alert on 5xx rate, p95 latency, DB connection saturation and failed deploys. Use `psql "$DATABASE_URL" -c 'SELECT 1;'` from the deploy shell for a direct DB check.

## 5. Webhook expectations

Payment routes are **not implemented**. When they are added, each webhook handler must:

1. Read the **raw request body** before JSON parsing; HMAC/signature verification must cover the exact bytes received.
2. Verify signatures with a constant-time comparison:
   - JazzCash: HMAC-SHA-256 over the defined integrity fields using `JAZZCASH_HASH_KEY` / `JAZZCASH_INTEGRITY_SALT`; also validate the merchant ID (`JAZZCASH_MERCHANT_ID`) and password/token.
   - Easypaisa: HMAC-SHA-256 using `EASYPAISA_HASH_KEY` and the store ID (`EASYPAISA_STORE_ID`).
   - Stripe/card: verify the `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET` with `stripe.webhooks.constructEvent` (timestamp tolerance included).
   - Bank transfers: verify the provider's signed callback or, failing that, poll/reconcile against the bank statement API — never trust a browser redirect.
3. Reject stale timestamps and replayed ids; store processed event/idempotency keys with a unique constraint.
4. Trust only server-verified amounts/currencies/statuses; compare with the stored `Payment` record and re-query the provider for high-value events.
5. Return `2xx` quickly after durable persistence; return `400/401` for invalid signatures and `409` for duplicates so providers stop retrying.
6. Scope the webhook route to `POST` logs with redacted bodies, and apply per-IP rate limiting (marketing redirects such as `PAYMENT_SUCCESS_URL`/`PAYMENT_FAILURE_URL` must never be treated as proof of payment).

Register these HTTPS URLs in each provider dashboard only after handlers exist:

```
https://<host>/api/payments/jazzcash/webhook
https://<host>/api/payments/easypaisa/webhook
https://<host>/api/payments/bank/webhook
https://<host>/api/payments/card/webhook
```

Rotate signing secrets in the provider dashboard and the platform secret store together; expect a brief overlap window where both old and new secrets are accepted.

## 6. Verification checklist after deploy

- [ ] `GET /` renders the hero and `Featured listings`; `GET /search?q=toyota` returns results.
- [ ] `GET /search?q=<impossible-term>` renders the empty state.
- [ ] `GET /login` renders; invalid email is blocked; a seeded demo login works in a non-public test environment.
- [ ] Migrations recorded: `npx prisma migrate status` reports no pending migrations.
- [ ] SMTP sends a verification email; SMS OTP delivers via the configured provider (not `console`).
- [ ] Image upload succeeds through the configured storage driver and the resulting URL is public only where intended.
- [ ] OAuth callback works with the exact registered redirect URI.
- [ ] Security headers present: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] Logs, metrics and alerts show data; backups verified.

## 7. Rollback

1. **Application**: redeploy the previous immutable release artifact/tag. Do not rebuild from a mutated working tree. If a feature flag caused the incident, disable it first.
2. **Database**: prefer forward fixes. If a migration must be reversed, use an expand/contract down migration reviewed by a second engineer; never run `prisma migrate reset` on production. Prisma has no automatic down migration — for a failed migration record, use `npx prisma migrate resolve --rolled-back <migration_name>` only after confirming the DDL was not applied.
3. **Last resort**: restore from PITR backup to a new database, verify data integrity, flip `DATABASE_URL`, and restart the app. Record the restore point and invalidate stale caches/sessions if user data was lost.
4. **Sessions**: to force all users to re-authenticate after a token-signing or account compromise, delete rows from `Session` (and `OtpCode` where appropriate) after the application rollback.
5. **Post-rollback**: re-run the verification checklist, confirm webhook retry queues drain, and write an incident timeline.

## 8. Incident response

1. **Detect & declare**: page the on-call owner; assign an incident commander and a scribe. Severity P1 = signup/login broken, data breach, payment discrepancy or site-wide 5xx; P2 = degraded search/uploads; P3 = cosmetic.
2. **Stabilise**: stop the offending deploy/feature, scale out only if capacity is the cause, and check DB connections, locks and replication lag. Use `SELECT pid, state, wait_event_type, query FROM pg_stat_activity;` and the platform's error-rate graph.
3. **Contain**: rotate exposed secrets (start with `AUTH_SECRET`, provider API keys and webhook secrets), revoke sessions via the `Session` table, disable the affected integration, and block abusive IPs/ranges at the edge.
4. **Diagnose**: correlate request IDs, deploy timeline, migration status and provider webhook delivery logs. Do not paste secrets or raw PII into tickets.
5. **Recover**: apply the forward fix or rollback per §7; verify with §6; resume queued webhooks only after signature verification is confirmed.
6. **Communicate**: update stakeholders at a fixed cadence; notify affected users and regulators where required by applicable Pakistani data-protection obligations and the provider contracts.
7. **Postmortem**: within 48 hours, document cause, impact, detection gap, corrective actions and owners. Add regression tests and monitoring for the failure mode.
