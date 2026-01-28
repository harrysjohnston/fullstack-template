FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=development

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

RUN pnpm install --filter apps/web...

COPY apps/web apps/web

WORKDIR /app/apps/web

CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
