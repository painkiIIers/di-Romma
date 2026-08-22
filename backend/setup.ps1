$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker nije instaliran ili nije dodat u PATH."
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw "Node.js/npm nije instaliran ili nije dodat u PATH."
}

Set-Location -LiteralPath $PSScriptRoot

if (-not (Test-Path -LiteralPath ".env")) {
  Copy-Item -LiteralPath ".env.example" -Destination ".env"
  Write-Warning "Napravljen je .env. Promeni JWT_SECRET i ADMIN_PASSWORD, pa ponovo pokreni skriptu."
  exit 1
}

Write-Host "Pokrećem PostgreSQL..."
docker compose up -d

Write-Host "Instaliram pakete..."
npm.cmd install

Write-Host "Generišem Prisma klijent i primenjujem migracije..."
npm.cmd run prisma:generate
npx.cmd prisma migrate deploy

Write-Host "Kreiram admina i, ako je meni prazan, uvozim proizvode..."
npm.cmd run prisma:seed

Write-Host "Sve je spremno. Pokreni API komandom: npm run dev"
