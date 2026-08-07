# Redirect only Turbopack's filesystem cache to local SSD (not compiled server chunks).
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

New-Item -ItemType Directory -Force -Path $localCacheRoot | Out-Null

function Test-ReparsePoint([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  return ([IO.FileAttributes]::ReparsePoint -band (Get-Item -LiteralPath $Path -Force).Attributes) -ne 0
}

if (Test-Path -LiteralPath $devDir) {
  if (Test-ReparsePoint $devDir) {
    Write-Host "Removing legacy full .next/dev junction ..."
    cmd /c rmdir "$devDir" | Out-Null
  }
}

New-Item -ItemType Directory -Force -Path $devDir | Out-Null

if (Test-Path -LiteralPath $cacheLink) {
  if (Test-ReparsePoint $cacheLink) {
    Write-Host "Turbopack cache already linked to local disk."
    exit 0
  }

  Write-Host "Removing old project-local Turbopack cache at $cacheLink ..."
  Remove-Item -LiteralPath $cacheLink -Recurse -Force
}

Write-Host "Linking $cacheLink -> $localCacheRoot"
cmd /c mklink /J "$cacheLink" "$localCacheRoot" | Out-Null
Write-Host "Turbopack cache ready on local disk."
