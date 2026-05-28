# GitApply — System Design
## Overview**GitApply** is a full-stack SaaS application that turns a developer's **GitHub activity** into an **ATS-optimized resume**. Users authenticate with GitHub, select repositories, generate AI-powered bullet points, upload an existing resume for contact/context, tailor content to a job description, and export a **Jake Gutierrez LaTeX PDF**.
---
## High-Level Architecture
┌─────────────────────────────────────────────────────────────┐ │ React SPA (Vite) │ │ / /connect /app /dashboard /post/:code │ └──────────────────────────┬──────────────────────────────────┘ │ credentials: include (session cookie) ┌──────────────────────────▼──────────────────────────────────┐ │ Express API (:3000) │ │ Auth · REST /api/* · LaTeX compile (pdflatex) │ └──────┬─────────────────┬─────────────────┬───────────────────┘ │ │ │ ▼ ▼ ▼ SQLite GitHub API Google Gemini (TypeORM) (Octokit) (generateContent)

**Pattern:** Monorepo with a React SPA (dev on `:5173`, production served from Express) and a single Express backend talking to SQLite, GitHub, and Gemini.
---
## Tech Stack
| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, React Router, lucide-react, Font Awesome |
| Backend | Node.js, Express, TypeScript |
| ORM / DB | TypeORM, SQLite (`better-sqlite3`) |
| Auth | Passport + `passport-github2`, express-session (SQLite store) |
| AI | `@google/generative-ai` (default `gemini-2.0-flash`) |
| GitHub | `@octokit/rest` |
| Resume parse | `pdf-parse`, `mammoth` (DOCX) |
| PDF export | Jake LaTeX template + `node-latex` / `pdflatex` |
| Deploy | Docker Compose (includes TeX Live) |
---
## Frontend Structure
### Routes
| Route | Purpose |
|-------|---------|
| `/` | Landing / marketing hero |
| `/connect` | GitHub OAuth entry |
| `/app` | Main resume builder wizard |
| `/dashboard` | Stats, projects, sidebar nav |
| `/dashboard/versions` | Saved tailored resumes |
| `/dashboard/analytics` | Share-link click tracking |
| `/post/:code` | Public shared resume PDF viewer |
### Builder Flow (`/app`)
Single-page wizard with steps managed by `useAppState`:
1. **Connect** — implicit via OAuth redirect to `/app`
2. **Analyze** — pick repos → `POST /api/analyze`
3. **Enrich** — upload resume, contact chat, bullet toggles, Jake preview
4. **Tailor** — paste job description → `POST /api/tailor`
5. **Export** — PDF compile, download, copy, share link, save version
State lives in React (`useAppState`, `useContactChat`); session is restored from `GET /api/session`.
### UI Preview vs PDF
- **`ResumePreview`** — HTML/CSS mirror of Jake `example.tex` (centered header, section rules, Education / Experience / Projects / Skills)
- **PDF** — same content via `generateLatex()` + `pdflatex`
---
## Backend API Surface
| Prefix | Role |
|--------|------|
| `/auth/*` | GitHub OAuth login / logout |
| `/api/me` | Current user profile |
| `/api/repos` | List user repos (cached 24h) |
| `/api/analyze` | Gemini bullet generation per repo |
| `/api/parse-resume` | Upload PDF/DOCX → text + contact extract |
| `/api/extract-profile` | Contact extraction from resume text |
| `/api/session` | Get/restore session; PUT contact & notes |
| `/api/tailor` | JD-aware resume structuring + LaTeX generation |
| `/api/compile` | TeX → PDF blob |
| `/api/versions` | CRUD saved resume versions |
| `/api/share` | Create/list share links; public `GET /:code` + PDF |
| `/api/dashboard/stats` | Repo/commit/tech aggregates (auth) |
| `/api/stats/public` | Landing page metrics — resumes, ATS pass rate, avg time (public) |
All `/api/*` routes (except public share and `/api/stats/public`) use **`requireAuth`** + cookie session.
---
## Data Model
User ├── ResumeSession (working draft, persisted across refreshes) └── ResumeVersion (saved snapshot: name + tex + JD + contact) └── ShareLink (short code /post/:code, click analytics)

### ResumeSession (working state)
| Field | Purpose |
|-------|---------|
| `cachedRepos` | GitHub repo metadata (24h cache) |
| `repoAnalysisCache` | Per-repo bullets + fingerprint |
| `selectedRepos` | User-selected repo names |
| `rawBullets` | Generated bullet text by repo |
| `contactInfo` | Name, phone, email, LinkedIn, GitHub |
| `tailoredResume` | Structured JSON from Gemini tailor step |
| `generatedTex` | Final LaTeX string |
| `jobDescription` | Pasted JD |
| `uploadedResumeText` | Parsed existing resume |
### ResumeVersion
Immutable saved export: `name`, `generatedTex`, `jobDescription`, `contactInfo`.
### ShareLink
Public short code with `clickCount` for analytics.
---
## AI Pipeline (Gemini)
| Step | Route | Input | Output |
|------|-------|-------|--------|
| Repo analysis | `POST /api/analyze` | GitHub repo data | JSON bullets per repo |
| Contact extract | parse / extract routes | Resume text | Contact fields |
| Tailoring | `POST /api/tailor` | Bullets + JD + notes | `TailoredResume` JSON → LaTeX |
**Quota handling** (`src/lib/gemini.ts`):
- Default model: `gemini-2.0-flash` (override via `GEMINI_MODEL`)
- Retry with backoff on rate limits
- HTTP 429 with friendly message on daily free-tier quota
- Single API call per operation (JSON parsed locally)
---
## Caching Strategy
| Cache | TTL / Invalidation | Purpose |
|-------|-------------------|---------|
| Repo list | 24 hours | Avoid repeated GitHub list calls |
| Bullet analysis | Keyed by repo `pushedAt` fingerprint | Re-analyze only when repo changes |
| Session | DB-backed | Restore wizard state on reload |
On analyze: cached repos skip GitHub fetch and Gemini; only changed repos are re-analyzed.
---
## Auth & Security
- **GitHub OAuth** → encrypted access token stored on `User`
- **HTTP-only session cookie** (7-day, `secure` in production)
- **Helmet** for HTTP headers
- **Encrypted tokens** via `ENCRYPTION_KEY`
- Share links are **public** (no auth) but only expose compiled PDF metadata
---
## PDF Generation Pipeline
TailoredResume JSON + ContactInfo ↓ generateLatex() ← preamble from tex/resume-template.tex (Jake style) ↓ generatedTex (.tex string) ↓ POST /api/compile → node-latex → pdflatex → PDF blob ↓ Download / iframe preview / share link PDF

Template: **Jake Gutierrez / sb2nov** (`tex/resume-template.tex`).
---
## Key User Journeys
**New user:** Landing → Connect → OAuth → Analyze repos → Enrich (upload + contact) → Tailor (JD) → Export PDF → Save version → Share link
**Returning user:** Session restore from DB → cached bullets/repos → dashboard stats → view saved versions
**Recruiter:** `/post/:code` → view/download PDF → click count increments
---
## Deployment
| Mode | Command | Notes |
|------|---------|-------|
| Dev | `npm run dev` | Express `:3000` + Vite `:5173` |
| Prod | `npm run build && npm start` | Express serves `client/dist` + API |
| Docker | `npm run docker:dev` / `docker:prod` | TeX Live bundled |
**Required env:** `GITHUB_*`, `GEMINI_API_KEY`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `FRONTEND_URL`
---
## Design Tradeoffs
| Choice | Rationale |
|--------|-----------|
| SQLite | Simple single-node deploy; fine for MVP |
| Session in DB + cookie | Stateful wizard without JWT complexity |
| LaTeX server-side | Pixel-perfect ATS template; HTML preview is approximation |
| One Gemini call per repo | Simple but burns free-tier quota on many repos |
| Monolith | No separate worker/queue; analyze/tailor are synchronous HTTP |
---
## Platform Landing Stats

Public marketing metrics on `/` are loaded from **`GET /api/stats/public`** (no auth, 5-minute in-memory cache, rate-limited).

| Stat | Source |
|------|--------|
| Resumes generated | Count of successful `POST /api/tailor` completions |
| ATS pass rate | % of generations where `pageCount === 1` and (no JD or keyword match ≥ 70%) |
| Avg time to resume | Mean ms from `ResumeSession.analyzeCompletedAt` to tailor success |

**Write path:** `POST /api/analyze` sets `analyzeCompletedAt`; `POST /api/tailor` inserts `ResumeGenerationEvent` and increments `PlatformStats` singleton (`src/lib/platformStats.ts`).

**Bootstrap:** `npm run backfill:stats` seeds resume count from `ResumeVersion` rows. In Docker prod: `docker compose -f docker-compose.prod.yml exec app node dist/cli/backfillPlatformStats.js`

**Entities:** `ResumeGenerationEvent` (audit log), `PlatformStats` (id=1 counters), `ResumeSession.analyzeCompletedAt`.

---
## Key File Paths

| Path | Role |
|------|------|
| `src/routes/publicStats.ts` | Public stats API |
| `src/lib/platformStats.ts` | Counter updates + cache |
| `src/lib/atsMatch.ts` | Server-side ATS keyword match |
| `src/cli/backfillPlatformStats.ts` | One-time stats seed (compiled to `dist/cli/`) |
| `client/src/pages/Landing.tsx` | Fetches and displays live stats |
