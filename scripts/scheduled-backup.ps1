param(
  [string]$SiteUrl = 'https://gramin-home-services.revanthvelaga.chatgpt.site',
  [string]$Destination = '.\backups\scheduled',
  [string]$BearerToken = $env:GRAMIN_SIWC_BEARER_TOKEN
)
if (-not $BearerToken) { throw 'Set GRAMIN_SIWC_BEARER_TOKEN to the owner Sites token before scheduling.' }
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$file = Join-Path $Destination "gramin-$stamp.json"
$headers = @{ 'OAI-Sites-Authorization' = "Bearer $BearerToken" }
Invoke-WebRequest -Uri "$SiteUrl/api/backup" -Headers $headers -OutFile $file
node scripts/verify-backup.mjs $file
Write-Output "Backup verified: $file"
