# Fullstack Template (Learning-First)

This repo is a **fullstack template** designed for learning by building each piece incrementally.

## Stack

- **Web**: Next.js + TypeScript + **shadcn/ui**
- **API**: Python **FastAPI** + JWT auth + REST
- **DB**: PostgreSQL + **SQLModel**
- **Realtime**: Server-Sent Events (SSE)
- **File uploads**: Presigned URLs
  - S3 by default
  - Extensible adapters planned for Google Cloud Storage + Azure Blob (for learning)
- **Emails**: Python + Jinja2 templates + MJML rendering
- **Testing**: Vitest (unit) + Pytest (unit/integration) + Playwright (e2e)
- **Tooling**: Biome (JS/TS lint+format) + Ruff (Python lint+format)
- **Dev**: Docker Compose
- **CI/CD**: GitHub Actions (PR checks + deploy pipeline)

## Repo Layout

```
.
├─ apps/
│  ├─ web/                  # Next.js + TS + shadcn/ui
│  └─ api/                  # FastAPI + SQLModel
├─ packages/                # Optional shared packages (types, utils) as we grow
├─ infra/                   # Deployment + infra notes (S3/GCS/Azure, etc.)
├─ .github/workflows/       # CI/CD workflows
├─ config/                  # Non-secret templates and local config docs
├─ docker-compose.yml       # Local dev services (Postgres, etc.)
├─ Plans.md                 # Step-by-step build plan
└─ config/env.example       # Example environment variables
```

## How we’ll build this (high level)

See `Plans.md` for the incremental roadmap and the decisions we’ll make at each step.

## Pre-commit hooks

This repo uses [`pre-commit`](https://pre-commit.com/) to run **Ruff** (Python) and **Biome** (JS/TS) before commits.

After you’ve installed dependencies for both apps, enable hooks:

```bash
python -m pip install -e "apps/api[dev]"
pre-commit install
pre-commit run --all-files
```

## Local Development (later)

We’ll add concrete commands once each app is scaffolded and wired up (web dev server, API dev server, migrations, tests, etc.).
