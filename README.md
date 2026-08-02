# LovTokens

Your AI Token Portfolio. LovTokens reads aggregate usage from local Codex and
Claude Code session files, builds a private dashboard, and creates opt-in public
leaderboards, profiles, share cards, and usage certificates.

LovTokens never uploads prompts, responses, source code, repository names, or
file paths. The collector is open source and `lovtokens show-data` prints the
exact payload before it is sent.

## Workspace

- `apps/web`: Next.js application and Cloudflare API routes.
- `packages/collector`: cross-platform `lovtokens` CLI.
- `packages/token-schema`: versioned usage schema and normalization helpers.
- `migrations`: Cloudflare D1 schema.

## Local development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm db:migrate:local
pnpm dev
```

The local web app and collector use `http://localhost:3100` by default. Browser
E2E tests use the isolated `3107` port and never reuse an existing service.

Email/password registration is enabled automatically for localhost and does
not require GitHub OAuth. Keep `EMAIL_PASSWORD_AUTH_ENABLED` unset or `false`
in production until an email-verification provider is configured; set it to
`true` only when you intentionally want that login method.

Account routes are available at `/login`, `/register`, `/forgot-password`, and
`/settings/account`, with matching `/zh/*` routes. Configure `RESEND_API_KEY`
and a verified `AUTH_EMAIL_FROM` sender to enable verification and password
reset delivery. When email delivery is configured, new email/password accounts
must verify their address before signing in.

Without D1 bindings, public pages render an honest empty state. LovTokens does
not create demo users or fabricated leaderboard totals.

## Collector

```bash
pnpm --filter lovtokens build
node packages/collector/dist/index.js show-data
node packages/collector/dist/index.js sync --dry-run
```

## Verification

```bash
pnpm check
pnpm test:e2e
pnpm cf-build
```

## Production

Create a D1 database and two R2 buckets, update the binding IDs in
`apps/web/wrangler.jsonc`, optionally configure GitHub OAuth, and set the secrets listed in
`apps/web/.env.example`. Public URLs and OAuth callbacks are derived from
`PUBLIC_SITE_URL`.

Apply every D1 migration before deploying the matching application build. The
rank-history migration is required by the personal dashboard:

```bash
pnpm db:migrate:local
# production: pnpm --filter @lovtokens/web exec wrangler d1 migrations apply lovtokens-db --remote
```

The Worker runs a ten-minute Cron trigger that refreshes all leaderboard
snapshots and issues eligible frozen certificates. Configure `CRON_SECRET` and
an ECDSA P-256 private JWK in `CERTIFICATE_PRIVATE_JWK` before production. Run
the D1 migration and verify the production query plans before opening the
public board.
