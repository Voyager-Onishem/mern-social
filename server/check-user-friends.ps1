# Script to diagnose user and friends
param(
  [Parameter(Mandatory=$true)]
  [string]$userId
)

Write-Host "Checking user with ID: $userId" -ForegroundColor Cyan
Write-Host "Running diagnostic script..." -ForegroundColor Yellow

# Run the script with Node.js
node scripts/check-user-friends.js $userId

Write-Host "`nIf there are issues with friend IDs, you can fix them with:" -ForegroundColor Green
Write-Host "node scripts/fix-friends-array.js <userId>" -ForegroundColor White