param(
  [string]$Archive = "$env:TEMP\finora-site.tgz"
)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$openNext = Join-Path $project ".open-next"
$dist = Join-Path $project "dist"

if (-not (Test-Path (Join-Path $openNext "worker.js"))) {
  throw "Run npm run build:cloudflare before packaging."
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null
Copy-Item -Recurse -Force (Join-Path $openNext "*") $dist
New-Item -ItemType Directory -Force -Path (Join-Path $dist "server"), (Join-Path $dist ".openai") | Out-Null
Copy-Item -Recurse -Force (Join-Path $openNext "*") (Join-Path $dist "server")
Copy-Item -Force (Join-Path $openNext "worker.js") (Join-Path $dist "server\index.js")
Copy-Item -Force (Join-Path $project ".openai\hosting.json") (Join-Path $dist ".openai\hosting.json")

tar -czf $Archive -C $project dist
Write-Output $Archive
