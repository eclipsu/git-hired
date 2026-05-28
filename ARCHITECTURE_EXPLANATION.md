# GitApply — Architecture Explanation

This document describes the system as it exists in the codebase today. GitApply is a **monolithic** full-stack application: one Express server handles auth, API routes, AI orchestration, and PDF compilation. There are **no message queues, background workers, or Redis instances** — long-running work (repo analysis, tailoring, page-fit loops) runs synchronously inside HTTP request handlers.

---

## Client Tier

### Browser

Users interact with GitApply through a React single-page application. Authenticated requests send the session cookie (`credentials: include`). Public routes (`/`, `/post/:code`) work without login.

### React SPA (Vite + TypeScript)

The frontend lives in `client/`. React Router defines the main surfaces:

| Route | Purpose |
|-------|---------|
| `/` | Landing page; fetches public stats |
| `/connect` | GitHub sign-in entry |
| `/app` | Resume builder wizard (analyze → enrich → tailor → export) |
| `/dashboard/*` | User stats, saved versions, share-link analytics |
| `/post/:code` | Public shared resume viewer |

Wizard state is held in React hooks (`useAppState`, `useContactChat`) and restored from `GET /api/session` on load.

### Vite Dev Server (development only)

During local development, `npm run dev` runs Express on port **3000** and Vite on port **5173**. Vite proxies `/api` and `/auth` to Express (`client/vite.config.ts`), so the browser always talks to `:5173` while the API runs separately.

### Vercel CDN (production frontend)

In production, the React build is deployed to Vercel. `client/vercel.json` rewrites `/api/*` and `/auth/*` to the EC2 backend (port **4000**) while serving static assets and SPA fallbacks locally. Express sets `trust proxy` in production so session cookies work behind Vercel.

**Alternative prod path:** If `client/dist` is built into the same deployment, Express can also serve the static SPA directly from `src/index.ts` — useful for Docker-only deployments without Vercel.

---

## Application Tier

### Express API Monolith

A single Node.js process (`src/index.ts`) mounts all backend functionality:

| Mount | Role |
|-------|------|
| `/auth/*` | GitHub OAuth via Passport |
| `/api/me` | Current user profile |
| `/api/repos` | List user repos (with 24h cache) |
| `/api/analyze` | Fetch GitHub repo data → Gemini bullet generation |
| `/api/parse-resume` | Upload PDF/DOCX → text + contact extraction |
| `/api/extract-profile` | Contact extraction from resume text |
| `/api/session` | Read/restore wizard state; update contact, notes, bullets |
| `/api/tailor` | JD-aware resume structuring, page-fit loop, LaTeX generation |
| `/api/compile` | On-demand TeX → PDF |
| `/api/versions` | Save/list resume versions; create share links |
| `/api/share` | Public share metadata + PDF; authenticated link listing |
| `/api/dashboard/stats` | Per-user dashboard aggregates |
| `/api/stats/public` | Landing page metrics (no auth) |
| `/api/health` | Liveness check |

**Middleware stack:** Helmet (security headers), JSON body parser, SQLite-backed `express-session`, Passport session integration, centralized error handler (including `GeminiQuotaError` → HTTP 429).

**Auth model:** GitHub OAuth stores an encrypted access token on the `User` row. `requireAuth` guards all `/api/*` routes except public share endpoints and `/api/stats/public`.

There is no separate API gateway, BFF, or microservice layer.

---

## In-Process Processing

These run inside the Express process — not as separate services.

### Resume Parser (mammoth · pdf-parse)

`POST /api/parse-resume` accepts multipart uploads (max 10 MB). PDFs are parsed with `pdf-parse`; DOCX files with `mammoth.extractRawText`. The extracted plain text is stored on `ResumeSession.uploadedResumeText`, then passed to Gemini for contact field extraction.

### LaTeX Pipeline (generateLatex · node-latex · pdflatex)

Resume export uses a Jake Gutierrez-style template (`tex/resume-template.tex`) with vendored Font Awesome assets (`tex/texmf/`).

1. **`generateLatex()`** — converts structured `TailoredResume` JSON + contact info into a `.tex` string.
2. **`node-latex`** — streams the TeX source to a **`pdflatex`** subprocess (TeX Live installed in Docker or locally).
3. **`pdf-parse`** — reads page count from compiled PDFs during the page-fit loop.

Used by:

- `POST /api/tailor` — `fitResumeToOnePage()` compiles repeatedly (up to 3 trim passes, optional expand pass), calling Gemini between passes when content is too long or sparse.
- `POST /api/compile` — user-triggered recompile from edited LaTeX.
- `GET /api/share/:code/pdf` — public PDF for share links.

If `pdflatex` is unavailable, compile routes return **503**; the tailor step skips the fit loop and returns generated TeX with a warning.

---

## External Dependencies

### GitHub OAuth

Passport GitHub strategy (`src/lib/passport.ts`) handles login at `/auth/github` and callback at `/auth/github/callback`. Scope includes `read:user` and `repo`. On success, the user is redirected to `/app`.

### GitHub REST API (Octokit)

The encrypted token on `User` is decrypted per request to create an Octokit client (`src/lib/github.ts`):

- **Repo list** — public repos, commit counts (90-day window), sorted by activity.
- **Repo analysis** — commits, languages, merged PRs, README for each selected repo.

API calls are rate-conscious: 100 ms delay between repos during analyze; empty/missing repos are skipped gracefully.

### Google Gemini API

All AI work goes through `src/lib/gemini.ts` (`@google/generative-ai`, default model `gemini-2.0-flash`):

| Step | Trigger | Purpose |
|------|---------|---------|
| Repo analysis | `POST /api/analyze` | Bullets + skills JSON per repo |
| Contact extract | parse-resume / extract-profile | Name, email, phone, LinkedIn |
| Tailoring | `POST /api/tailor` | Full resume JSON from bullets + JD + upload |
| Page-fit trim/expand | Inside tailor | Shorten or expand content to fit one page |

**Failure handling:** Retries with backoff on transient rate limits. Daily quota exhaustion throws `GeminiQuotaError` → HTTP 429 with a user-facing message. Non-quota Gemini errors return HTTP 500.

---

## Data Layer

### SQLite App DB (`data/git-apply.db`)

TypeORM with `better-sqlite3`, schema auto-synced at startup. Entities:

| Entity | Purpose |
|--------|---------|
| `User` | GitHub identity + encrypted access token |
| `ResumeSession` | Working wizard state (bullets, contact, LaTeX, caches) |
| `ResumeVersion` | Saved resume snapshots |
| `ShareLink` | Public short codes (`/post/:code`) with click counts |
| `ResumeGenerationEvent` | Audit log for each successful tailor |
| `PlatformStats` | Singleton counters for landing page metrics |

### SQLite Session Store (`data/sessions.db`)

Managed by `connect-sqlite3` for Passport/express-session. Separate file from the app DB. Cookies are HTTP-only, 7-day max age, `secure` in production.

### Docker Volume (`app_data`)

Production Docker Compose mounts `app_data:/app/data` so both SQLite files survive container restarts on EC2.

---

## Caching & Rate Limiting

### ResumeSession Caches (DB-backed)

Stored as JSON columns on `ResumeSession` — not a separate cache server:

| Cache | TTL / Invalidation | Purpose |
|-------|-------------------|---------|
| `cachedRepos` + `reposCachedAt` | 24 hours | Skip GitHub repo list fetch |
| `repoAnalysisCache` | Invalidated when repo `pushedAt` fingerprint changes | Skip GitHub deep fetch + Gemini for unchanged repos |

On `POST /api/analyze`, repos with valid cache entries return instantly; only stale repos hit GitHub and Gemini.

### In-Memory Public Stats Cache

`src/lib/platformStats.ts` caches derived landing metrics for **5 minutes**. Invalidated when a new generation is recorded after `POST /api/tailor`.

### In-Memory Rate Limiter

`src/routes/publicStats.ts` tracks request counts per IP in a process-local `Map` (60 requests/minute on `GET /api/stats/public`). Returns HTTP 429 when exceeded.

---

## One-Off CLI (not a background worker)

### Stats Backfill CLI

`npm run backfill:stats` runs `src/cli/backfillPlatformStats.ts` once to seed `PlatformStats.resumesGenerated` from existing `ResumeVersion` row counts. It is a manual bootstrap tool, not a scheduled job.

---

## Main Request Flows

### New user: analyze → tailor → export

1. User signs in via GitHub OAuth → session cookie set, `User` upserted.
2. `GET /api/repos` → GitHub API (or 24h cache) → repo grid in UI.
3. `POST /api/analyze` → for each repo: GitHub deep fetch (if needed) → Gemini → bullets stored in `ResumeSession`.
4. User uploads resume → `POST /api/parse-resume` → mammoth/pdf-parse → Gemini contact extract.
5. `POST /api/tailor` → Gemini structures resume → page-fit loop (pdflatex + optional Gemini trim/expand) → LaTeX saved → `PlatformStats` updated.
6. `POST /api/compile` → pdflatex → PDF preview/download.
7. `POST /api/versions` + `POST /api/versions/:id/share` → saved snapshot + public link.

### Returning user

`GET /api/session` restores wizard state from `ResumeSession`. Cached repos and bullets avoid redundant GitHub/Gemini calls until repos change.

### Recruiter (public)

`GET /api/share/:code` returns metadata and increments `clickCount`. `GET /api/share/:code/pdf` compiles stored LaTeX to PDF — no auth required.

### Landing page

`GET /api/stats/public` → rate limit check → in-memory cache or `PlatformStats` row → resumes generated, ATS pass rate, avg time to resume.

---

## Failure Handling Philosophy

GitApply favors **fail visibly inside the request** over background retry infrastructure:

| Failure | Behavior |
|---------|----------|
| Gemini quota / rate limit | HTTP 429, retry hints where available |
| Gemini other errors | HTTP 500 with message |
| pdflatex missing | HTTP 503 on compile; tailor skips fit loop |
| LaTeX compile error | HTTP 422 with error message |
| Empty resume upload | HTTP 422 — cannot extract text |
| Missing auth | HTTP 401 |
| GitHub repo deleted | Skipped silently during fingerprint refresh |
| Contact extraction failure | Logged; parse-resume still succeeds with text |
| Page-fit exceeds 1 page after 3 trims | Tailor succeeds with `fitWarning` in response |

There is no dead-letter queue, circuit breaker service, or external monitoring stack in the codebase. Operational visibility is via server `console.log` / `console.warn` and HTTP health check at `/api/health`.

---

## Deployment Topology

| Mode | Frontend | Backend | Data |
|------|----------|---------|------|
| Local dev | Vite `:5173` | Express `:3000` | `./data/*.db` |
| Docker dev | Vite `:5173` | Express `:3000` | `./data/*.db` + TeX Live in image |
| Prod (documented) | Vercel CDN | EC2 Docker `:4000` | `app_data` volume |
| Prod (monolith) | Express serves `client/dist` | Same process `:4000` | `app_data` volume |

Required environment: `GITHUB_*`, `GEMINI_API_KEY`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `FRONTEND_URL`. See `.env.example`.

---

## Intentional Omissions

The following are **not** part of this codebase and are excluded from the architecture diagram:

- Message queues (Redis, RabbitMQ, SQS)
- Background workers or cron schedulers
- Separate auth service or API gateway
- Nginx (mentioned in older VPS notes but not in Docker Compose)
- `csurf` (listed in `package.json` but not wired in `src/index.ts`)
- MarkItDown or other document conversion services
