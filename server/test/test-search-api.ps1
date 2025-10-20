# Search API Test Script for PowerShell

# Parse command line arguments
param (
    [string]$url = "http://localhost:6001",
    [string]$query = "test",
    [string]$token = ""
)

# Default values
$ApiUrl = $url
$SearchQuery = $query
$Token = $token

# Show help if requested
if ($args -contains "-h" -or $args -contains "--help") {
    Write-Host "MERN Social Search API Test Tool"
    Write-Host ""
    Write-Host "Usage: .\test-search-api.ps1 [-url <API_URL>] [-query <SEARCH_QUERY>] [-token <AUTH_TOKEN>]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -h, --help         Show this help message"
    Write-Host "  -url URL           API URL (default: http://localhost:6001)"
    Write-Host "  -query QUERY       Search query (default: test)"
    Write-Host "  -token TOKEN       Auth token (will prompt if not provided)"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\test-search-api.ps1 -query 'John' -url 'http://localhost:6001'"
    Write-Host ""
    exit 0
}

# Prompt for token if not provided
if ([string]::IsNullOrEmpty($Token)) {
    $Token = Read-Host "Enter your authentication token"
}

# Display test information
Write-Host ""
Write-Host "MERN Social Search API Test"
Write-Host "=========================="
Write-Host "API URL:      $ApiUrl"
Write-Host "Search Query: $SearchQuery"
Write-Host "Token:        $($Token.Substring(0, [Math]::Min(10, $Token.Length)))... (truncated)"
Write-Host ""

# Make the API call
Write-Host "Making API call to $ApiUrl/search?query=$SearchQuery"
Write-Host ""

try {
    $headers = @{
        Authorization = "Bearer $Token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$ApiUrl/search?query=$SearchQuery" -Headers $headers -Method Get

    # Format and display the response
    $responseJson = $response | ConvertTo-Json -Depth 10
    Write-Host $responseJson

    # Summary
    Write-Host ""
    Write-Host "Results Summary:"
    Write-Host "Users found: $($response.users.Length)"
    Write-Host "Posts found: $($response.posts.Length)"
    Write-Host "Total results: $($response.counts.total)"
}
catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $responseBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($responseBody)
        $responseText = $reader.ReadToEnd()
        Write-Host "Response details: $responseText" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed."