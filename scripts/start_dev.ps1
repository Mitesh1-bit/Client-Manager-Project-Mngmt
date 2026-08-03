# DEV ONLY — hot reload. Does not build. Stop port 3000 first if busy: npm run stop
Set-Location $PSScriptRoot\..

Write-Host "=== FRONTEND DEV ===" -ForegroundColor Cyan
Write-Host "Local:  http://localhost:3000"
Write-Host "LAN:    http://192.168.0.174:3000  (or your PC IP — same WiFi)"
Write-Host ""
Write-Host "LAN tip: If another device shows broken clicks/animations, set NEXT_DEV_LAN_HOST"
Write-Host "         in .env.local to your IP and restart dev. See next.config.mjs allowedDevOrigins."
Write-Host "Stop: npm run stop  (or Ctrl+C in this window)"
Write-Host ""
npm run dev
