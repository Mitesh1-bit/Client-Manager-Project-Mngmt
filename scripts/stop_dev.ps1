Set-Location (Split-Path $PSScriptRoot -Parent)

$Port = 3000
if ($env:FRONTEND_PORT) {
    $Port = [int]$env:FRONTEND_PORT
}
elseif (Test-Path ".dev-port") {
    $fromFile = (Get-Content ".dev-port" -Raw).Trim()
    if ($fromFile -match '^\d+$') {
        $Port = [int]$fromFile
    }
}

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\kill-port.ps1 -Port $Port
Remove-Item ".dev-port" -ErrorAction SilentlyContinue
