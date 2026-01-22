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
# Install dependencies (including dev dependencies)
pip install -e ".[dev]"

# Or if using the virtualenv from the root
cd apps/api
pip install -e ".[dev]"
```

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
