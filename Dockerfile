# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*
# latex-extra: titlesec, enumitem, etc. Do NOT add texlive-fonts-extra (~500MB).
# fontawesome5 icons are vendored in tex/texmf/ (~750KB).

WORKDIR /app

# --- dependencies (dev — full monorepo) ---
FROM base AS deps

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

RUN npm ci \
  && npm ci --prefix client

# --- dependencies (prod API only — no Vite client build) ---
FROM base AS deps-server

COPY package.json package-lock.json ./
RUN npm ci

# --- development ---
FROM deps AS dev

COPY . .

RUN mkdir -p data

EXPOSE 3000 5173

CMD ["npm", "run", "dev"]

# --- production build (API + CLI; frontend on Vercel) ---
FROM deps-server AS build

COPY tsconfig.json ./
COPY src ./src
COPY tex ./tex

ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm run build:server
# compiles src/cli/backfillPlatformStats.ts → dist/cli/ for Docker backfill

# --- production runtime ---
FROM base AS production

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/tex ./tex

RUN mkdir -p data

EXPOSE 4000

CMD ["node", "dist/index.js"]
