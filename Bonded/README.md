This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain`](https://www.npmjs.com/package/create-onchain).


## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Next, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.


## Learn More

To learn more about OnchainKit, see our [documentation](https://docs.base.org/onchainkit).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).

## Environment Configuration

Copy `.env.example` to `.env.local` (for development) or `.env.production` (for deployments) and populate each value with the appropriate secret or API key. The server-side configuration is validated at runtime by `lib/config/env.ts`, while public values are checked via `lib/config/public-env.ts`.

Key variables include:

- `DATABASE_URL` / `DIRECT_URL` – Postgres connection strings.
- `AUTH_SECRET` – JWT signing secret (required in production).
- `NEXT_PUBLIC_URL` – Fully qualified application URL used for callbacks and frame metadata.
- `ALCHEMY_BASE_API_KEY`, `OPENAI_API_KEY`, and other third-party integration keys.
- Monitoring and analytics tokens (`MONITORING_LOGTAIL_SOURCE_TOKEN`, `ANALYTICS_POSTHOG_API_KEY`, etc.).

## Production Deployment

The repository ships with a production-ready Dockerfile and a reference Compose stack under `infra/production`:

```bash
# Build the standalone application image
docker build -t bonded-app:latest .

# Provision the full stack (database, backups, application)
cd infra/production
POSTGRES_PASSWORD=super-secure docker compose up -d
```

Database backups can be created manually by running `./scripts/backup-database.sh` with a configured `DATABASE_URL`. Automated daily backups are handled by the `backup` service in the Compose file.

## Continuous Integration & Delivery

GitHub Actions automate linting, testing, container publishing, and optional Vercel deployments. The `Deploy` workflow (`.github/workflows/deploy.yml`) runs on pushes to `main` or manual triggers and will:

1. Install dependencies (`npm ci`).
2. Run `npm run lint` and `npm test`.
3. Build the Next.js app (`npm run build`).
4. Upload the standalone build artifacts.
5. Build and push a container image to GHCR.
6. Deploy to Vercel when the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` secrets are provided.

Set the required repository secrets before enabling deployments:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for Vercel.
- Optional `POSTGRES_*` secrets for production stacks if you reuse the Compose file in automation.
