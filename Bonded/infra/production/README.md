# Production Infrastructure

This directory contains a reference Docker Compose stack for running Bonded in production.

## Services

- **postgres** – primary application database with persistent storage and health checks.
- **backup** – scheduled logical backups using [`prodrigestivill/postgres-backup-local`](https://github.com/prodrigestivill/docker-postgres-backup-local). Backups are retained daily, weekly, and monthly.
- **app** – Bonded application container built from the repository `Dockerfile`. The service waits for Postgres to become healthy before starting.

## Usage

```bash
# Ensure the required environment variables exist (see ../../.env.example)
cp ../../.env.example ../../.env.production
# Customize secrets such as POSTGRES_PASSWORD before continuing.

# Start the stack in the background
POSTGRES_PASSWORD=super-secure docker compose -f docker-compose.yml up -d

# Tail application logs
docker compose -f docker-compose.yml logs -f app
```

Backups are written to the `postgres-backups` volume. Mount this volume to a secure location or export it to external storage according to your retention policy.
