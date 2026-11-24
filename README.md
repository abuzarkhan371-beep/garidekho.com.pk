# Garidekho.com.pk

Pakistan's automotive marketplace for buying and selling cars, motorcycles, commercial vehicles and auto parts. The application is a **Next.js 16 App Router** frontend with Server Components and Server Actions, backed by **Prisma 7**, **PostgreSQL** and TypeScript.

> This repository is an early, functional foundation. Several navigation destinations and integrations are intentionally stubbed; see [Known limitations](#known-limitations) before assuming a flow is production-ready.

## Product overview

Implemented today:

- Server-rendered homepage with hero search, category/brand/city discovery, featured and latest listings, dealer/news sections and a `Post your ad` entry point.
- Search page (`/search`) with URL-driven keyword, taxonomy, price, year, mileage, engine, transmission, fuel, body, colour, seller, verified/featured filters, sorting and pagination. Filters are translated to Prisma `where`/`orderBy` objects in `src/lib/search.ts`.
- Credentials sign-in, registration, OTP verification/login, email verification, password reset and optional Google OAuth (`src/app/(auth)` and `src/app/api/auth/google`).
- Database-backed sessions (`gdk_session`, plus a separate guest session cookie), role/permission checks and password hashing with bcrypt.
- Favourites and search-suggestion API routes; email/SMS/storage service abstractions.
- A rich Prisma schema and a seed script providing roles, locations, taxonomy, demo users, 12 listings, dealer plans, news articles and CMS pages.

## Requirements

- **Node.js ≥ 20.9.0**. This checkout ships a local toolchain at `.toolchain/node/bin` (currently Node v26.13.1 / npm 11). Use it for every command in this guide:
  ```bash
  export PATH="$PWD/.toolchain/node/bin:$PATH"
  node -v
  ```
  Add that export to your shell profile, or prefix commands with `export PATH="$PWD/.toolchain/node/bin:$PATH";`.
- **PostgreSQL 14+** (an embedded PostgreSQL 18 helper is provided for local development only).
- npm 11 install-script approvals. `package.json` declares an `allowScripts` allowlist for `esbuild`, `prisma`, `@prisma/engines`, `sharp` and the platform-specific `@embedded-postgres/darwin-x64` package. Approve only those scripts; if npm blocks or skips them, run `npm approve-scripts` (npm 11) and re-run `npm install` / `npm rebuild`. Never approve arbitrary postinstall scripts from unfamiliar packages.
- For E2E: a Chromium browser installed via `npx playwright install chromium`.

## Local setup

1. **Install dependencies**

   ```bash
   export PATH="$PWD/.toolchain/node/bin:$PATH"
   npm install
   ```

2. **Create the environment file**

   ```bash
   cp .env.example .env
   ```

   `prisma.config.ts` and `prisma/seed.ts` load `.env` via `dotenv/config`. Set at minimum:

   - `DATABASE_URL` — PostgreSQL connection string used by the app, Prisma CLI and the seed script.
   - `DIRECT_URL` — kept for deployment documentation/managed providers; the current Prisma datasource does **not** consume a separate direct URL.
   - `AUTH_SECRET` — generate with `openssl rand -base64 48`; used for OTP HMACs and verification-token flows.
   - `SESSION_TTL_DAYS` — session lifetime (default 30).
   - `SMS_PROVIDER="console"` and `STORAGE_DRIVER="local"` for development.
   - `CRON_SECRET` — rotate before any scheduled-job endpoints are exposed.

3. **Start PostgreSQL (local development only)**

   ```bash
   node scripts/dev-db.mjs start   # initialises .toolchain/pgdata and listens on 5432
   node scripts/dev-db.mjs status
   node scripts/dev-db.mjs stop
   ```

   Caveats: this uses `embedded-postgres` binaries (macOS x64 package allowlisted in `package.json`), credentials `postgres`/`postgres`, database `garidekho`, and stores data in the gitignored `.toolchain/pgdata` directory. It is **not** a production database. On other platforms or if port 5432 is taken, use your own PostgreSQL and set `PGPORT` plus a matching `DATABASE_URL`.

4. **Generate the Prisma client, migrate and seed**

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

   `db:generate` writes the client to `src/generated/prisma` (gitignored). `db:migrate` runs `prisma migrate dev` (interactive, development only); use `npx prisma migrate deploy` in production. `db:seed` is safe to re-run for reference data (upserts), but it **creates listings on every run** — do not run it against a database with real listing data.

5. **Run the app**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

### Demo logins

The seed script creates these accounts with the shared development password **`Admin@12345`**:

| Role | Email | Password |
| --- | --- | --- |
| SUPER_ADMIN | `admin@garidekho.com.pk` | `Admin@12345` |
| MODERATOR | `moderator@garidekho.com.pk` | `Admin@12345` |
| DEALER | `dealer@garidekho.com.pk` | `Admin@12345` |
| USER (seller) | `seller@garidekho.com.pk` | `Admin@12345` |
| USER (buyer) | `buyer@garidekho.com.pk` | `Admin@12345` |

These credentials are for local development only. Never deploy the seeded password or demo phone numbers to a public environment.

## Scripts and tests

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev --webpack` | Development server on port 3000 |
| `npm run build` | `next build --webpack` | Production build |
| `npm run start` | `next start` | Serve a production build |
| `npm run lint` | `eslint .` | Lint |
| `npm run typecheck` | `tsc --noEmit` | Type check |
| `npm run db:generate` | `prisma generate` | Regenerate the Prisma client |
| `npm run db:migrate` | `prisma migrate dev` | Development migrations (interactive) |
| `npm run db:push` | `prisma db push` | Prototype schema without migrations |
| `npm run db:seed` | `tsx prisma/seed.ts` | Seed reference and demo data |
| `npm run db:studio` | `prisma studio` | Browse the database |
| `npm test` | `vitest run` | Unit tests (`tests/`, `src/**/*.test.ts`) |
| `npm run test:watch` | `vitest` | Watch-mode unit tests |
| `npm run test:e2e` | `playwright test` | Chromium E2E tests (`e2e/`) |
| `node scripts/dev-db.mjs <start\|stop\|status>` | — | Embedded local PostgreSQL helper |

The `test`/`test:e2e` scripts are already declared, but **`vitest` and `@playwright/test` are not currently listed in `devDependencies`** (see the handoff report). Install them before running:

```bash
npm install -D vitest @playwright/test
npx playwright install chromium
npm test
npm run test:e2e   # starts `npm run dev -- --port 3100` automatically
```

Unit tests use `vitest.config.ts` with the `@` → `src` alias, a Node environment and a no-op stub for Next's `server-only` guard. E2E tests use `playwright.config.ts`: Chromium only, `baseURL` defaults to `http://localhost:3100` (override with `E2E_BASE_URL`/`E2E_PORT`), `reuseExistingServer` outside CI, and traces on the first retry. E2E tests expect a migrated **and seeded** database. Install-script approvals and a running PostgreSQL instance are prerequisites.

## Architecture map

```
.
├── src/app/
│   ├── (auth)/                 # Login, register, OTP, email verify, password reset + Server Actions
│   ├── api/
│   │   ├── auth/google/        # Google OAuth start + callback
│   │   ├── favourites/[id]/    # Saved-vehicle toggle
│   │   └── search/suggest/     # Typeahead suggestions
│   ├── page.tsx                # Homepage (Server Component, revalidated every 120s)
│   └── search/page.tsx         # Filtered results (Server Component)
├── src/components/
│   ├── auth/, home/, layout/, listings/, providers/, search/, ui/
├── src/lib/
│   ├── auth.ts                 # Sessions, RBAC, bcrypt, OTP HMAC helpers
│   ├── constants.ts            # Public site constants, price presets, upload limit
│   ├── db.ts                   # Prisma client with @prisma/adapter-pg
│   ├── search.ts               # Query-param parsing, Prisma filters and sorting
│   ├── utils.ts                # Formatting and class helpers
│   ├── data/listings.ts        # Listing include/select and card mapping
│   └── services/               # mail (SMTP), sms (console/webhook/Twilio), storage (local/Cloudinary)
├── src/generated/prisma/       # Generated Prisma client (gitignored; run db:generate)
├── prisma/                     # schema.prisma, migrations, seed.ts
├── scripts/dev-db.mjs          # Embedded PostgreSQL helper (dev only)
├── tests/                      # Vitest unit tests + server-only stub
├── e2e/                        # Playwright Chromium specs
└── docs/                       # DEPLOYMENT.md, SECURITY.md
```

## Third-party integrations

All variables are documented in `.env.example`. Only put non-public secrets in server-side variables; `NEXT_PUBLIC_*` values are embedded in the browser bundle.

| Integration | Variables | How to configure real credentials |
| --- | --- | --- |
| Cloudinary | `STORAGE_DRIVER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_UPLOAD_MAX_MB` | Create a Cloudinary cloud, copy the three credentials from the dashboard, set the driver to `cloudinary`, and allow-list the upload origin. Uploads are MIME/size-checked, re-encoded to WebP with `sharp` and stored under `garidekho/<userId>`. `local` writes to `.uploads` and is development-only. `S3_*` variables are reserved; the S3 driver is not implemented. |
| SMTP email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Use a transactional provider (e.g. Postmark/Resend SMTP or Gmail app password), set port 465/587 accordingly, verify the sending domain (SPF/DKIM/DMARC). With no `EMAIL_HOST`, mail is only logged to the console. |
| SMS OTP | `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID` | `console` logs the OTP and returns it in the dev action response — never use in production. `webhook` POSTs `{to, message, sender}` to `SMS_API_URL` with a bearer token. `twilio` expects the Account SID inside `SMS_API_URL`, the auth token in `SMS_API_KEY`, and an approved sender in `SMS_SENDER_ID`. |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_SITE_URL` | Register `https://<host>/api/auth/google/callback` in Google Cloud Console, set the exact same value as `GOOGLE_REDIRECT_URI`, and copy the client ID/secret. The login button only renders when `GOOGLE_CLIENT_ID` is set. |
| Payments | `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_HASH_KEY`, `JAZZCASH_INTEGRITY_SALT`, `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY`, `BANK_ACCOUNT_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_IBAN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENT_SUCCESS_URL`, `PAYMENT_FAILURE_URL` | Obtain merchant credentials from each provider, set success/failure URLs to your HTTPS domain, and register webhook endpoints at `https://<host>/api/payments/<provider>/webhook` using each provider's signing secret. **Payment and webhook routes are not implemented yet** — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#webhook-expectations). Do not enable live webhooks until signature verification exists. |
| Redis | `REDIS_URL` | Point at a managed Redis/Valkey instance when rate limiting or caching is added. The current code falls back to in-process behaviour and does not yet consume this value. |
| Analytics / maps | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `NEXT_PUBLIC_MAPS_PROVIDER`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Add the measurement ID or Plausible domain and restrict the Google Maps key by HTTP referrer. These variables are placeholders for upcoming UI work. |
| Cron jobs | `CRON_SECRET` | Set a long random value and require it on scheduled endpoints when they are implemented. |
| Observability | `SENTRY_DSN`, `LOG_LEVEL` | Reserved for error reporting/log-level configuration; wire them into your logging/monitoring layer before relying on them. |

## Production deployment checklist

1. **Database**: use managed PostgreSQL (TLS required) with automated backups and PITR. Set `DATABASE_URL` to the pooled/app connection and ensure migrations can be applied from the release step. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
2. **Build & runtime**: set `NODE_ENV=production`, run `npm ci`, `npm run db:generate`, `npm run build`, then `npm run start`. Approve the same install scripts in CI. Do not run `prisma migrate dev` or the seed script against production data.
3. **Secrets**: set `AUTH_SECRET`, `CRON_SECRET`, OAuth, SMTP, SMS, Cloudinary and payment secrets in the platform's secret store. Rotate seeded demo credentials. Never commit `.env`.
4. **HTTPS/TLS**: enforce HTTPS, HSTS and a canonical `NEXT_PUBLIC_SITE_URL`; update `GOOGLE_REDIRECT_URI`, `PAYMENT_SUCCESS_URL`, `PAYMENT_FAILURE_URL` and every provider webhook URL to HTTPS production hosts.
5. **Hardening**: keep `secure`/`httpOnly` cookies (automatic in production), add edge rate limiting on OTP/login/upload/suggest/webhook routes, consider CSRF tokens for sensitive cookie-authenticated POSTs, add CSP and review third-party script policy. Next.js security headers are already set in `next.config.ts`.
6. **Migrations & seed**: apply migrations with `npx prisma migrate deploy` as a distinct release step. Seed only a fresh environment (the seeder creates duplicate listings when re-run).
7. **Health checks**: a dedicated `/api/health` route (database `SELECT 1` plus dependency checks) **should be added**; it does not exist yet. Until then, use synthetic checks on `/` and `/search` and configure platform restarts/alerts accordingly.
8. **Backups/monitoring**: test restores, monitor DB connections/latency, error rates, OTP/SMS failures and webhook failures; aggregate logs with request IDs and alert on threshold breaches.
9. **Rollback**: keep the previous immutable release artifact and a documented migration strategy (expand/contract). See the [runbook](docs/DEPLOYMENT.md#rollback).

Platform notes: **Vercel** works well for the frontend but requires an external PostgreSQL provider (Neon/Supabase/RDS) and edge/function-friendly secrets; long-running jobs need a separate worker. **Railway** and **Render** can host both the app and a managed PostgreSQL instance; use their internal database host for private traffic, run migrations as a one-off deploy step, and confirm outbound SMTP/SMS access is not blocked. All three require the webhook URLs above to be registered with providers after the final domain is known.

## Known limitations

- Only `/`, `/search`, the auth pages and four API routes exist. Header/footer links such as `/cars`, `/bikes`, `/sell`, `/admin`, `/news`, `/cities` and `/app` currently 404.
- `/sell` (guest posting entry point) and the listing wizard are not implemented. The E2E spec skips the guest-option assertion until the route exists, while still asserting the homepage entry-point link.
- No payment checkout, payment record creation or webhook signature-verification routes exist; payment variables are configuration placeholders only.
- No `/api/health` endpoint, rate limiting, CAPTCHA, virus scanning or dedicated audit/monitoring pipeline yet.
- `REDIS_URL`, `CRON_SECRET`, `SENTRY_DSN`, `LOG_LEVEL`, analytics, maps and `S3_*` variables are reserved but not consumed by application code.
- The console SMS provider returns the OTP in the development action response; SMTP without `EMAIL_HOST` only logs messages.
- The seed script is not fully idempotent (it creates listings and images on every run) and embeds a shared demo password.
- Some form labels are not programmatically associated with their inputs (the `Field` wrapper lacks `htmlFor`), so E2E specs use stable placeholders where necessary. Fixing that would allow name-based selectors.
- Vitest and Playwright devDependencies are not yet declared in `package.json`; add them before running the test suites.

See [docs/SECURITY.md](docs/SECURITY.md) for the threat model and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the production runbook.
