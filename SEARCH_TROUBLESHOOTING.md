# MERN Social Search Functionality

## Troubleshooting Guide

If you're experiencing issues with the search functionality in MERN Social, follow this troubleshooting guide to diagnose and resolve the problem.

## Prerequisites

Before troubleshooting, make sure:

1. The server is running at `http://localhost:6001` (or your custom URL)
2. You're logged in (authentication token exists in local storage)
3. The MongoDB database is accessible and contains data

## Using the Diagnostics Widget

The Diagnostics Widget has been enhanced with a specific Search Testing Tool:

1. Go to the Home Page
2. Look for the "Diagnostics Tool" at the top
3. Expand the "Search Functionality Testing" section
4. Enter a search term (at least 2 characters) and click "Test Search"
5. The tool will display the results or any errors encountered

## Testing the API Directly

You can also test the search API endpoint directly using the provided PowerShell script:

```powershell
# Navigate to the server/test directory
cd c:\projects\mern social\server\test

# Run the test script (replace with your auth token)
.\test-search-api.ps1 -query "test" -token "your-auth-token"
```

## Common Issues and Solutions

### Authentication Issues

- **Symptom**: "Not authenticated" error
- **Solution**: Make sure you're logged in. The token may have expired or been removed. Try logging out and logging back in.

### API Connection Issues

- **Symptom**: Connection failed or timeout
- **Solution**: Verify the server is running and accessible. Check if the API URL is correctly set in the .env file.

### No Search Results

- **Symptom**: The search works but returns no results
- **Solution**: Make sure your database contains data matching the search terms. Try searching for more general terms.

### Search Results Not Displaying

- **Symptom**: Search succeeds but results don't display
- **Solution**: Check the browser console for rendering errors. Ensure the SearchResultsWidget component is correctly imported.

## Search Implementation Details

The search functionality is implemented across several files:

- **Backend**:
  - `/server/controllers/search.js` - Handles search logic
  - `/server/routes/search.js` - Defines the API endpoint
  
- **Frontend**:
  - `/client/src/api/searchApi.js` - Makes API requests
  - `/client/src/components/SearchResultsWidget.jsx` - Displays results
  - `/client/src/scenes/navbar/index.jsx` - Contains search input UI

If you continue experiencing issues, check the implementation in these files.