# Script to fix user's friends array
param(
  [Parameter(Mandatory=$true)]
  [string]$userId
)

Write-Host "Fixing friends array for user: $userId" -ForegroundColor Cyan
Write-Host "Running fix script..." -ForegroundColor Yellow

# Run the script with Node.js
node scripts/fix-friends-array.js $userId

Write-Host "`nTo verify the changes, run:" -ForegroundColor Green
Write-Host "./check-user-friends.ps1 $userId" -ForegroundColor White