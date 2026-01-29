# Web (`apps/web`)

Next.js + TypeScript scaffold.

## First run (no Docker)

```bash
# From repository root
pnpm install

# Start the dev server
cd apps/web
pnpm dev
```

Notes:
- The app expects `NEXT_PUBLIC_API_URL` to point at the API (default: `http://localhost:8000/api/v1`).
- You can set environment variables in the root `.env` file for local development.

## Later additions (planned)

- shadcn/ui + Tailwind
- Vitest tests
- Playwright e2e
- API client + auth flows
