# Removes Turbopack cache junction, legacy full-dev junctions, and local cache.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path $PSScriptRoot -Parent
$devDir = Join-Path $frontendRoot ".next\dev"
$cacheLink = Join-Path $devDir "cache"
$localCacheRoot = if ($env:NEXT_DEV_DIST_DIR) {
  Join-Path ($env:NEXT_DEV_DIST_DIR.TrimEnd('\', '/')) "dev\cache"
} else {
  Join-Path $env:LOCALAPPDATA "agency-crm-next\dev\cache"
}

function Test-ReparsePoint([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  return ([IO.FileAttributes]::ReparsePoint -band (Get-Item -LiteralPath $Path -Force).Attributes) -ne 0
}

function Stop-DevServerIfRunning {
  $killPortScript = Join-Path $PSScriptRoot "kill-port.ps1"
  if (-not (Test-Path -LiteralPath $killPortScript)) { return }

  & $killPortScript -Port 3000
  Start-Sleep -Milliseconds 750
}

function Remove-PathSafe([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Host "  skip (missing) $Path"
    return $true
  }

  if (Test-ReparsePoint $Path) {
    cmd /c rmdir "$Path" | Out-Null
    Write-Host "  removed junction $Path"
    return $true
  }

  $attempts = 3
  for ($i = 1; $i -le $attempts; $i++) {
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      Write-Host "  removed $Path"
      return $true
    } catch {
      if ($i -lt $attempts) {
        Write-Host "  retry $i/$attempts (files may still be locked)..."
        Start-Sleep -Milliseconds 750
        continue
      }

      Write-Host ""
      Write-Host "Could not remove $Path" -ForegroundColor Red
      Write-Host "Turbopack cache files are locked while npm run dev is running." -ForegroundColor Yellow
      Write-Host "Stop dev first (Ctrl+C or: npm run stop), then run npm run dev:clean again." -ForegroundColor Yellow
      throw
    }
  }

  return $false
}

Write-Host "Cleaning Turbopack dev caches..." -ForegroundColor Cyan
Stop-DevServerIfRunning

if (Test-Path -LiteralPath $devDir) {
  if (Test-ReparsePoint $devDir) {
    Remove-PathSafe $devDir | Out-Null
  } else {
    Remove-PathSafe $cacheLink | Out-Null
  }
} else {
  Write-Host "  skip (missing) $devDir"
}

Remove-PathSafe $localCacheRoot | Out-Null

Write-Host "Done. Run npm run dev to rebuild the cache on local disk." -ForegroundColor Green
