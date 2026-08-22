#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Greška: Docker nije instaliran ili nije dostupan iz WSL-a."
  echo "U Docker Desktop-u uključi Settings > Resources > WSL Integration."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Greška: Node.js/npm nije instaliran unutar WSL-a."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Napravljen je backend/.env."
  echo "Promeni JWT_SECRET, ADMIN_EMAIL i ADMIN_PASSWORD, pa ponovo pokreni: bash setup.sh"
  exit 1
fi

echo "Pokrećem PostgreSQL..."
docker compose up -d

echo "Instaliram pakete..."
npm install

echo "Generišem Prisma klijent i primenjujem migracije..."
npm run prisma:generate
npx prisma migrate deploy

echo "Kreiram admina i uvozim proizvode ako je meni prazan..."
npm run prisma:seed

echo "Sve je spremno. Pokreni API komandom: npm run dev"
