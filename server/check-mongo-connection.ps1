# Script to check MongoDB Atlas connection
# This script helps diagnose MongoDB connection issues

Write-Host "Running MongoDB Connection Checker..." -ForegroundColor Cyan

# Check if chalk package is installed
$chalkInstalled = npm list chalk | Select-String "chalk"

if (-not $chalkInstalled) {
    Write-Host "Installing required packages for connection checker..." -ForegroundColor Yellow
    npm install --no-save chalk node-fetch
}

# Run the connection checker script
Write-Host "Starting connection check..." -ForegroundColor Cyan
node scripts/check-mongodb-connection.js

Write-Host "`nTo fix MongoDB Atlas IP whitelist issues:" -ForegroundColor Green
Write-Host "1. Go to MongoDB Atlas: https://cloud.mongodb.com" -ForegroundColor White
Write-Host "2. Select your project and cluster" -ForegroundColor White
Write-Host "3. Go to Network Access under Security" -ForegroundColor White
Write-Host "4. Click 'Add IP Address' and add your current IP" -ForegroundColor White
Write-Host "5. Or click 'Add Current IP Address' button" -ForegroundColor White
Write-Host "6. Run this script again to verify the connection" -ForegroundColor White

Write-Host "`nAlternatively, you can restart the server which will now use a local MongoDB instance automatically if Atlas is unavailable." -ForegroundColor Cyan