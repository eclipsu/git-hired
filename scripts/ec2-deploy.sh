#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker-compose"
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
fi

if [[ ! -f .env ]]; then
  echo "Missing .env in $ROOT"
  echo "  cp .env.production.example .env && nano .env"
  exit 1
fi

echo "Disk space before build:"
df -h / | tail -1

# Small EC2 instances often fill up on repeated docker builds (ENOSPC during npm ci).
if command -v docker &>/dev/null; then
  echo "Pruning unused Docker images and build cache..."
  docker builder prune -af >/dev/null 2>&1 || true
  docker image prune -af >/dev/null 2>&1 || true
fi

echo "Disk space after prune:"
df -h / | tail -1

AVAIL_KB="$(df --output=avail / | tail -1 | tr -d ' ')"
if [[ "$AVAIL_KB" -lt 2097152 ]]; then
  echo "ERROR: Less than 2GB free on /. Free space then retry, e.g.:"
  echo "  docker system prune -af"
  echo "  sudo journalctl --vacuum-size=100M"
  exit 1
fi

echo "Building and starting production container..."
$COMPOSE -f docker-compose.prod.yml up -d --build

echo ""
$COMPOSE -f docker-compose.prod.yml ps
echo ""
echo "Health check:"
curl -sf http://localhost:4000/api/health && echo || {
  echo "Health check failed — logs:"
  $COMPOSE -f docker-compose.prod.yml logs --tail 40 app
  exit 1
}

echo ""
echo "Public landing stats:"
curl -sf http://localhost:4000/api/stats/public && echo || echo "(stats endpoint not ready yet)"

echo ""
echo "Seeding landing stats from saved resume versions (safe to re-run)..."
$COMPOSE -f docker-compose.prod.yml exec -T app node dist/cli/backfillPlatformStats.js || {
  echo "Backfill skipped or failed — run manually after first tailor events:"
  echo "  $COMPOSE -f docker-compose.prod.yml exec app node dist/cli/backfillPlatformStats.js"
}
