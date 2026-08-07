Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $frontendRoot -Parent
$backendPortFile = Join-Path $repoRoot "backend\.dev-port"
$healthScript = Join-Path $repoRoot "backend\scripts\dev-health.ps1"

. $healthScript

$DefaultPort = if ($env:BACKEND_PORT) { [int]$env:BACKEND_PORT } else { 8000 }
$Port = $DefaultPort

if (Test-Path $backendPortFile) {
    $fromFile = (Get-Content $backendPortFile -Raw).Trim()
    if ($fromFile -match '^\d+$') {
        $Port = [int]$fromFile
    }
}

if (-not (Test-AgencyCrmHealth -Port $Port)) {
    $found = $false
    for ($offset = 0; $offset -lt 20; $offset++) {
        $candidate = $DefaultPort + $offset
        if (Test-AgencyCrmHealth -Port $candidate) {
            $Port = $candidate
            $found = $true
            break
        }
    }

    if (-not $found) {
        Write-Host "Warning: Agency CRM backend not detected on ports $DefaultPort-$($DefaultPort + 19). Proxy will target http://127.0.0.1:$Port/graphql" -ForegroundColor Yellow
    }
}

$env:BACKEND_GRAPHQL_URL = "http://127.0.0.1:$Port/graphql"
Write-Host "Backend GraphQL proxy -> $env:BACKEND_GRAPHQL_URL" -ForegroundColor Cyan
