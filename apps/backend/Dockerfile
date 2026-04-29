ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends stockfish openssl ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g yarn@1.22.22 --force
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock .yarnrc ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN yarn install --frozen-lockfile --ignore-engines --network-timeout 600000

FROM deps AS build
COPY . .
RUN yarn workspace @chess/backend prisma:generate
RUN yarn workspace @chess/shared build || true
WORKDIR /app/apps/backend
RUN npx nest build
WORKDIR /app

FROM base AS runtime
ENV NODE_ENV=production
ENV STOCKFISH_PATH=/usr/games/stockfish
# Default to absolute path so the value is the same locally and in
# Render/Fly. Render mounts a persistent disk on top of this directory,
# Fly mounts a volume; either way the .db file survives redeploys.
ENV DATABASE_URL=file:/app/apps/backend/prisma/data/chess.db
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/packages/shared/src /app/packages/shared/src
COPY --from=build /app/apps/backend/dist /app/apps/backend/dist
COPY --from=build /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/package.json /app/yarn.lock ./
# data/ is the SQLite home — always exists in the image, but Render/Fly will
# overlay a persistent volume here so the .db survives redeploys.
RUN mkdir -p /app/apps/backend/prisma/data
EXPOSE 4000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "echo \"[boot] DATABASE_URL=$DATABASE_URL\" && npx prisma db push --schema=apps/backend/prisma/schema.prisma --accept-data-loss --skip-generate && node apps/backend/dist/apps/backend/src/main.js"]
