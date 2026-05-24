# GitHired

Turn your GitHub activity into an ATS-optimized resume. Connect GitHub, select repositories, generate AI-powered bullet points, tailor to a job description, and export a Jake LaTeX PDF.

**Deploy:** [DEPLOY.md](./DEPLOY.md) — Vercel frontend + EC2 backend (free tier, no domain).

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeORM, SQLite
- **Auth:** GitHub OAuth (Passport)
- **AI:** Google Gemini
- **Export:** LaTeX → PDF (`moderncv` + `pdflatex`)

## Prerequisites

- Node.js 20 (`nvm use` — see `.nvmrc`)
- GitHub OAuth app ([create one](https://github.com/settings/developers))
- Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey))

For PDF export outside Docker:

```bash
sudo apt install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended texlive-fonts-extra
```

## Setup

```bash
cp .env.example .env
# Fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GEMINI_API_KEY,
# SESSION_SECRET, and ENCRYPTION_KEY (openssl rand -hex 32)

npm install
npm install --prefix client
npm run dev
```

- **App:** http://localhost:5173
- **API:** http://localhost:3000

Set your GitHub OAuth callback URL to `http://localhost:5173/auth/github/callback`.

## Docker

```bash
cp .env.docker.example .env   # or use your existing .env
npm run docker:dev            # dev — ports 5173 + 3000, includes TeX Live
npm run docker:prod           # production — port 3000 only
```

The Docker image includes `pdflatex`, `moderncv`, and `fontawesome5` — no local LaTeX install needed.

## App flow

1. **Connect** — Sign in with GitHub on the landing page
2. **Analyze** — Select repos, generate resume bullets with Gemini
3. **Enrich** — Review bullets, upload existing resume, add notes
4. **Tailor** — Paste a job description, generate tailored resume
5. **Export** — Edit LaTeX, compile PDF, download

All steps run on a single page at `/app`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Express + Vite dev servers |
| `npm run build` | Build client and server for production |
| `npm start` | Run production server |
| `npm run docker:dev` | Dev via Docker Compose |
| `npm run docker:prod` | Production via Docker Compose |

## Environment variables

See `.env.example` for all required variables.

## License

Private — all rights reserved.
