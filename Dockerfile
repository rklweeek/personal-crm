# syntax=docker/dockerfile:1

# One image for the app and for one-off jobs from deploy/compose.yaml
# (migrations, test data). It keeps the full node_modules, because those jobs
# run drizzle-kit and tsx.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install the exact pnpm version from package.json "packageManager".
RUN npm install --global "$(node -p 'require("./package.json").packageManager')" \
  && pnpm install --frozen-lockfile

FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
# src/db reads DATABASE_URL on import; the build itself never connects to it.
# public/ is empty for now and so not in git; the runtime stage copies it.
RUN mkdir -p public \
  && DATABASE_URL=postgresql://build@localhost:5432/build pnpm build \
  && rm -rf .next/cache

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1

# Dependencies first: this layer only changes with pnpm-lock.yaml,
# so the server downloads it again only after a dependency update.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/next.config.ts /app/tsconfig.json /app/drizzle.config.ts ./
COPY --from=build /app/public ./public
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src/db ./src/db
# The Next.js server writes its runtime cache into .next.
COPY --from=build --chown=node:node /app/.next ./.next

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
