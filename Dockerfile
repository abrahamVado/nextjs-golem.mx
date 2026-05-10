FROM node:20-bookworm-slim AS deps

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

ARG NPM_CONFIG_STRICT_SSL=true
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL
RUN npm config set strict-ssl $NPM_CONFIG_STRICT_SSL \
    && npm config set fund false \
    && npm config set audit false

COPY package*.json ./

RUN npm ci --no-audit --no-fund


FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NPM_CONFIG_STRICT_SSL=true
ENV NPM_CONFIG_STRICT_SSL=$NPM_CONFIG_STRICT_SSL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


FROM node:20-bookworm-slim AS runner

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
