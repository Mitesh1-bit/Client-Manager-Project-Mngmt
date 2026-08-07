# DEV ONLY - hot reload. Does not build.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path $PSScriptRoot -Parent
Set-Location $frontendRoot

& (Join-Path $PSScriptRoot "prepare-dev-cache.ps1")
. (Join-Path $PSScriptRoot "sync-backend-port.ps1")

$repoRoot = Split-Path $frontendRoot -Parent
$resolveScript = Join-Path $repoRoot "backend/scripts/resolve-port.ps1"
$PreferredPort = if ($env:FRONTEND_PORT) { [int]$env:FRONTEND_PORT } else { 3000 }
$Port = & $resolveScript -PreferredPort $PreferredPort

if ($Port -ne $PreferredPort) {
    Write-Host ("Port {0} is busy - starting frontend on {1}" -f $PreferredPort, $Port) -ForegroundColor Yellow
}

Set-Content -Path ".dev-port" -Value $Port -NoNewline

$cacheTarget = Join-Path $env:LOCALAPPDATA "agency-crm-next/dev/cache"

Write-Host ""
Write-Host "=== FRONTEND DEV ===" -ForegroundColor Cyan
Write-Host ("Local:  http://localhost:{0}" -f $Port)
Write-Host ("LAN:    http://<your-ip>:{0}  (same WiFi)" -f $Port)
Write-Host ""
Write-Host "LAN tip: If another device shows broken clicks/animations, set NEXT_DEV_LAN_HOST"
Write-Host "         in .env.local to your IP and restart dev. See next.config.mjs allowedDevOrigins."
Write-Host "Stop: npm run stop  (or Ctrl+C in this window)"
Write-Host ""
Write-Host ("Turbopack cache: junction .next/dev/cache -> {0}" -f $cacheTarget)
Write-Host "                 (override root with NEXT_DEV_DIST_DIR; npm run dev:clean to reset)"
Write-Host ""

& npx next dev --hostname 0.0.0.0 --port $Port
