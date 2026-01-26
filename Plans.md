# Plans (Build Step-by-Step)

This plan is intentionally **incremental**: we’ll implement each piece one at a time for learning, keeping the repo runnable at each stage.

## Guiding principles

- **Learning-first**: prefer clarity over cleverness.
- **Separation of concerns**: `apps/web` and `apps/api` are independent deployables.
- **Production-minded**: environment-driven config, least-privilege, observability hooks, good defaults.
- **Testable**: each milestone adds tests and CI coverage.

## Milestones

### 0) Repository scaffold (this step)

- ~~Create monorepo layout: `apps/web`, `apps/api`, `packages`, `infra`, `.github/workflows`.~~
- ~~Add high-level docs (`README.md`, this file).~~
- ~~Add baseline tooling configs:~~
  - ~~Biome for JS/TS~~
  - ~~Ruff for Python~~
  - ~~CI workflow skeleton (PR checks)~~
  - ~~Docker Compose skeleton~~

### 1) Web app foundation (Next.js + TS + shadcn/ui)

- ~~Initialize Next.js app (App Router) with TypeScript.~~
- ~~Add shadcn/ui + Tailwind setup.~~
- ~~Add Biome + Vitest setup and a first “smoke” test.~~
- ~~Add Playwright setup and a first e2e smoke test (runs locally + in CI).~~

### 2) API foundation (FastAPI)

- ~~Create FastAPI app with:~~
  - ~~structured settings/config~~
  - ~~health endpoint~~
  - ~~OpenAPI docs defaults~~
- ~~Add Ruff + Pytest setup and a first “smoke” test~~

### 3) Database foundation (Postgres + SQLModel)

- ~~Add Postgres via Docker Compose for local development.~~
- ~~Introduce SQLModel models + session management patterns.~~
- ~~Add migrations strategy (Alembic with autogenerate support).~~
- ~~Add API endpoints that read/write to DB with tests.~~

### 4) Authentication (FastAPI + JWT)

- ~~Implement auth endpoints (register/login/refresh/logout as decided).~~
- ~~Define JWT claims and token lifetimes.~~
- ~~Add auth middleware/dependencies for protected endpoints.~~
- ~~Add tests for auth flows and edge cases.~~

### 5) REST API conventions

- ~~Standardize:~~
  - ~~request/response schemas~~
  - ~~pagination patterns~~
  - ~~error format~~
  - ~~versioning strategy~~
- ~~Add API client strategy in `apps/web` (simple fetch wrapper at first).~~

### 6) Realtime: SSE

- Add SSE endpoints to API (connection lifecycle, heartbeats, backpressure).
- Add client support in web (EventSource wrapper + reconnection strategy).
- Add tests around SSE behavior where feasible.

### 7) File uploads via presigned URLs (multi-cloud)

- Create an AWS account
- Define a provider interface:
  - **S3** default provider
  - **GCS** provider (learning)
  - **Azure Blob** provider (learning)
- Implement “create upload” API endpoint that returns:
  - presigned URL
  - required headers/fields
  - upload metadata
- Add a simple web UI for uploading a file using the presigned flow.
- Add local-dev story (options: MinIO or local stub provider; decide when implementing).

### 8) Email pipeline (Jinja2 + MJML)

- Create email templates with Jinja2 inputs.
- Render MJML → HTML in Python.
- Add a development email sink (console/logging or local SMTP like MailHog; decide when implementing).
- Add tests that validate rendered output and template inputs.

### 9) Docker Compose “dev environment”

- Add compose profiles for:
  - DB
  - optional dev email sink
  - optional storage emulator
- Add documented `.env` usage and local boot sequence.

### 10) CI/CD (GitHub Actions)

- On every PR:
  - Biome check (web)
  - Ruff check (api)
  - Vitest
  - Pytest
  - (optional later) Playwright
- Add deploy workflow (target TBD):
  - Web deploy (Next.js)
  - API deploy (FastAPI)
  - DB migrations strategy + safety checks

## Open decisions (we’ll resolve when we reach them)

- Package manager for web tooling (pnpm vs npm vs yarn)
- Migration tool and workflow (Alembic vs alternatives)
- Local storage/dev emulator choice (MinIO vs stubs)
- Email delivery provider (SES, SendGrid, etc.) vs dev-only sinks
- Deployment targets (Vercel/Render/Fly/Railway/AWS/GCP/Azure)
