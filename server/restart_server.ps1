# Server Restart Script

$serverDir = "c:\projects\mern social\server"
$logFile = "c:\projects\mern social\server\restart.log"

# Record date and time
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "[$timestamp] Restarting server..."

# Kill any existing node process running on port 6001
$existingProcess = netstat -ano | findstr ":6001"
if ($existingProcess) {
    $pid = ($existingProcess -split ' ')[-1]
    if ($pid -ne "0") {
        Write-Host "Killing process $pid running on port 6001"
        Add-Content -Path $logFile -Value "[$timestamp] Killing process $pid"
        taskkill /PID $pid /F
    }
}

# Switch to the server directory
Set-Location $serverDir

# Start the server
Write-Host "Starting server..."
Add-Content -Path $logFile -Value "[$timestamp] Starting server"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $serverDir && npm run dev" -WindowStyle Normal

Write-Host "Server restart attempted. Check terminal window for server output."
Add-Content -Path $logFile -Value "[$timestamp] Server restart script completed"