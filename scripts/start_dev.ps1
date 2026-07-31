# DEV ONLY — hot reload. Does not build. Stop port 3000 first if busy: npm run stop
Set-Location $PSScriptRoot\..

Write-Host "=== FRONTEND DEV ===" -ForegroundColor Cyan
Write-Host "URL: http://localhost:3000"
Write-Host "Stop: npm run stop  (or Ctrl+C in this window)"
Write-Host ""
npm run dev
