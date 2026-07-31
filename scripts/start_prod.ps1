# PRODUCTION preview — two separate steps in one script (build, then start).
# Prefer running manually:  npm run build   then   npm run start
Set-Location $PSScriptRoot\..

Write-Host "=== STOP port 3000 ===" -ForegroundColor Yellow
npm run stop

Write-Host ""
Write-Host "=== BUILD ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "=== START (production) ===" -ForegroundColor Green
Write-Host "URL: http://localhost:3000"
Write-Host "Stop: npm run stop  (or Ctrl+C)"
Write-Host ""
npm run start
