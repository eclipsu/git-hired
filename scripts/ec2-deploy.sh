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
