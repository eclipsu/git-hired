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
# fontawesome5 is vendored in tex/texmf/ (PFB + TFM + map, ~850KB).

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
RUN npm ci \
  && npm cache clean --force

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
# Reuse deps from build stage — avoids a second npm ci (saves ~1GB peak disk during build).
COPY --from=deps-server /app/node_modules ./node_modules
RUN npm prune --omit=dev \
  && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/tex ./tex

# Fail the image build if vendored Font Awesome is incomplete (prod has no texlive-fonts-extra).
RUN test -f tex/texmf/fonts/tfm/public/fontawesome5/fa5free2solid.tfm \
  && test -f tex/texmf/fonts/map/dvips/fontawesome5/fontawesome5.map \
  && printf '%s\n' \
    '\documentclass{article}' \
    '\pdfmapfile{+fontawesome5}' \
    '\usepackage{fontawesome5}' \
    '\begin{document}' \
    '\faPhone' \
    '\end{document}' \
    > /tmp/fa-test.tex \
  && TEXMFHOME=/app/tex/texmf pdflatex -halt-on-error -jobname=fa-test -output-directory=/tmp /tmp/fa-test.tex \
  && test -f /tmp/fa-test.pdf \
  && rm -rf /tmp/fa-test.*

RUN mkdir -p data

EXPOSE 4000

CMD ["node", "dist/index.js"]
