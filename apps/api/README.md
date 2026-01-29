# API (`apps/api`)

FastAPI + SQLModel scaffold.

## What exists now

- `GET /health` endpoint
- Pytest smoke tests with coverage
- Ruff linting and formatting configured
- Pre-commit hooks for code quality

## Development

### Setup

```bash
# From repository root, activate the venv
source .venv/bin/activate

# Install dependencies (including dev dependencies)
uv pip install -e "apps/api[dev]"
```

### First run (no Docker)

```bash
# From repository root
cp config/env.example .env

# Ensure DATABASE_URL or POSTGRES_* values match your local database
# Then start the API from apps/api so .env is picked up
cd apps/api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- Settings read `.env` from the current working directory.
- If you don't have Postgres locally, use `pnpm dev:db` from the repo root.

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run only unit tests
pytest -m unit

# Run tests excluding slow tests
pytest -m "not slow"

# Run a specific test file
pytest tests/test_health.py
```

### Linting and Formatting

```bash
# Check code with Ruff
ruff check app/ tests/

# Format code with Ruff
ruff format app/ tests/

# Auto-fix linting issues
ruff check --fix app/ tests/
```

### Pre-commit Hooks

Pre-commit hooks are configured at the repository root. To install:

```bash
# From repository root
pre-commit install
```

This will automatically run Ruff checks and formatting before each commit.

## Later additions (planned)

- Postgres wiring + migrations
- JWT auth + protected routes
- SSE endpoints
- Presigned upload URL endpoints (S3 + GCS + Azure)
- Email rendering pipeline (Jinja2 + MJML)
