# Deploy: Vercel (frontend) + EC2 (backend)

Free-tier layout: **one EC2 micro** runs the API; **Vercel** gives you `https://your-app.vercel.app` (no domain purchase).

```
Browser → https://your-app.vercel.app
            ├─ static React (Vercel)
            └─ /api/*, /auth/* → http://EC2_IP:4000 (rewrites)
```

---

## Checklist

### Code (repo) — done in this branch

- [x] `client/vercel.json` — rewrites `/api` and `/auth` to EC2 + SPA fallback for `/app`, `/dashboard`, etc.
- [x] `src/index.ts` — `trust proxy` in production (session cookies behind Vercel)
- [x] `Dockerfile` — copies `tex/` for LaTeX PDF generation
- [x] `docker-compose.yml` — prod profile on port **4000**

### You still need to do

#### 1. EC2 (one instance)

- [ ] Attach an **Elastic IP** (so Vercel rewrites don’t break when instance reboots)
- [ ] Security group: open **22** (SSH, your IP) and **4000** (HTTP from internet)
- [ ] Install Docker + Docker Compose
- [ ] Clone repo, create `.env` from template:
  ```bash
  cp .env.production.example .env
  nano .env
  ```
  **`.env` is not in git** — you must create it on the server.
- [ ] Run: `docker-compose -f docker-compose.prod.yml up -d --build`
  (or `./scripts/ec2-deploy.sh` — no `--profile` flag needed)
- [ ] Verify: `curl http://localhost:4000/api/health` → `{"ok":true}`
- [ ] Optional: add **swap** (1–2 GB) if PDF compile runs out of memory on t3.micro

#### 2. Vercel

- [ ] Import repo → **Root Directory:** `client`
- [ ] Build: `npm run build` → Output: `dist`
- [ ] **Environment variables on Vercel: not required** (API runs on EC2; rewrites handle `/api` and `/auth`)
- [ ] Update `client/vercel.json` → set your **Elastic IP** and port **4000**
- [ ] Deploy → note URL: `https://YOUR-PROJECT.vercel.app`

#### 3. EC2 `.env` (after you have the Vercel URL)

```env
NODE_ENV=production
PORT=4000

FRONTEND_URL=https://YOUR-PROJECT.vercel.app
GITHUB_CALLBACK_URL=https://YOUR-PROJECT.vercel.app/auth/github/callback

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
SESSION_SECRET=...    # openssl rand -hex 32
ENCRYPTION_KEY=...    # openssl rand -hex 32
```

Restart container after editing: `docker-compose -f docker-compose.prod.yml up -d --build`

#### 4. GitHub OAuth app

- [ ] [Developer settings → OAuth Apps](https://github.com/settings/developers)
- [ ] Homepage: `https://YOUR-PROJECT.vercel.app`
- [ ] Callback: `https://YOUR-PROJECT.vercel.app/auth/github/callback`

#### 5. Smoke test

- [ ] Open Vercel URL → Connect GitHub → lands on `/app`
- [ ] Analyze a repo (Gemini free tier is limited)
- [ ] Tailor + export PDF

---

## Quick EC2 commands

```bash
git clone https://github.com/eclipsu/git-hired.git
cd git-hired
cp .env.production.example .env
nano .env   # fill in values — required before docker will work

# Install standalone compose if needed (Amazon Linux):
# sudo curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
#   -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose

# Option A — helper script
chmod +x scripts/ec2-deploy.sh
sudo ./scripts/ec2-deploy.sh

# Option B — direct (no --profile flag)
sudo docker-compose -f docker-compose.prod.yml up -d --build
sudo docker-compose -f docker-compose.prod.yml logs -f app
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **"no env" / `.env` not found** | On EC2 run `cp .env.production.example .env` and fill in all values. `.env` is gitignored — it is never cloned from GitHub. |
| Docker warns `env file .env not found` | Same as above — create `.env` in repo root on EC2 |
| Vercel shows no environment variables | **OK for frontend-only deploy** — secrets go in EC2 `.env`, not Vercel |
| Container exits immediately | `docker-compose -f docker-compose.prod.yml logs app` — likely missing env vars |
| OAuth redirects to wrong place | `FRONTEND_URL` + GitHub callback must match Vercel URL exactly |
| 401 on all API calls after login | Ensure `trust proxy` is set (production) and you use **HTTPS Vercel URL** |
| Vercel 502 / timeout | EC2 security group must allow **4000**; container must be running |
| Docker build stuck at `npm run build` | t3.micro OOM/slow — pull latest (prod Docker skips client/Vite build). Add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| PDF compile fails | Check `docker compose logs`; ensure `tex/` is in image (rebuild) |
| IP changed, app broken | Use Elastic IP; update `client/vercel.json` and redeploy Vercel |

---

## Cost (free tier)

| Service | Cost |
|---------|------|
| 1× EC2 t3.micro (free tier) | $0 first 12 months |
| Elastic IP (attached) | $0 |
| Vercel hobby | $0 |
| Domain | Not required |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design.
