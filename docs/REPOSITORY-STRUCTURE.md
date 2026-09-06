# Repository structure

The repository intentionally keeps only current operational documentation in the root and `docs/`. Historical release notes are consolidated in the root `CHANGELOG.md`.

## Root

- `README.md` — installation, development, VPS demo and product scope.
- `CHANGELOG.md` — complete historical changelog.
- `Dockerfile` — production image.
- `docker-compose.yml` — local development stack.
- `docker-compose.prod.yml` — production stack.
- `.env.example` — safe environment template; never put real secrets here.

## Application

- `app/` — Next.js App Router pages and API routes.
- `components/` — shared UI components.
- `lib/` — authentication, calculation engines, privacy, AI, mail, security and domain logic.
- `prisma/` — schema, versioned migrations and seeds.
- `public/` — PWA/static assets.
- `tests/` — integration/regression test entry points.

## Operations

- `deploy/installer.sh` — primary Debian 13 installer.
- `deploy/alimenta` — server management CLI.
- `deploy/doctor.sh` — health/security diagnostics.
- `deploy/update.sh` — controlled update path.
- `deploy/backup.sh` / `deploy/restore.sh` — database operations.
- `deploy/nginx.conf` — Nginx configuration template.
- `deploy/preflight-demo.sh` — VPS preflight.

## Documentation

Current operational and product documentation lives under `docs/`. Version-specific historical notes belong in `CHANGELOG.md`, not as separate release files.
