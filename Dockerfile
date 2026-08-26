FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

COPY package.json bun.lock* .npmrc ./
RUN bun install --frozen-lockfile \
  && npm rebuild better-sqlite3

ARG SESSION_SECRET
ARG AUTH_ISSUER=https://auth.haelp.dev/api/auth
ARG AUTH_CLIENT_ID
ARG AUTH_CLIENT_SECRET
ARG AUTH_REDIRECT_URI=https://link.haelp.dev/auth/callback
ARG PUBLIC_BASE_URL=https://link.haelp.dev
ENV SESSION_SECRET=$SESSION_SECRET \
  AUTH_ISSUER=$AUTH_ISSUER \
  AUTH_CLIENT_ID=$AUTH_CLIENT_ID \
  AUTH_CLIENT_SECRET=$AUTH_CLIENT_SECRET \
  AUTH_REDIRECT_URI=$AUTH_REDIRECT_URI \
  PUBLIC_BASE_URL=$PUBLIC_BASE_URL

COPY . .
RUN bun run build

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production \
  ADDRESS_HEADER=cf-connecting-ip \
  PROTOCOL_HEADER=x-forwarded-proto \
  HOST_HEADER=host \
  ORIGIN=https://link.haelp.dev

COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "build"]
