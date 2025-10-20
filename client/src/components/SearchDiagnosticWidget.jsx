import { useState } from "react";
import { Box, Typography, Paper, Button, TextField, CircularProgress, List, ListItem, ListItemText, Alert } from "@mui/material";
import { searchApi } from "../api/searchApi";
import { useSelector } from "react-redux";
import { getCurrentToken } from "../utils/reduxUtils";

const SearchDiagnosticWidget = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDetail, setApiDetail] = useState("");
  
  // Get token from Redux store to verify it's available
  const token = useSelector((state) => state.token);
  const [tokenDebugInfo, setTokenDebugInfo] = useState("");

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";
  
  // Function to check token from multiple sources
  const debugTokenSources = () => {
    let debugInfo = "";
    
    // Check Redux token via useSelector
    debugInfo += `Redux token (via useSelector): ${token ? "Present" : "Missing"}\n`;
    if (token) debugInfo += `Token length: ${token.length}\n`;
    
    // Check localStorage token
    const localStorageToken = localStorage.getItem("token");
    debugInfo += `localStorage token: ${localStorageToken ? "Present" : "Missing"}\n`;
    if (localStorageToken) debugInfo += `Token length: ${localStorageToken.length}\n`;
    
    // Check Redux via getCurrentToken utility
    try {
      const storeToken = getCurrentToken();
      debugInfo += `Redux token (via getCurrentToken): ${storeToken ? "Present" : "Missing"}\n`;
      if (storeToken) debugInfo += `Token length: ${storeToken.length}\n`;
    } catch (e) {
      debugInfo += `Error getting token via getCurrentToken: ${e.message}\n`;
    }
    
    // Check window.__APP_STORE__
    if (window.__APP_STORE__) {
      debugInfo += "window.__APP_STORE__: Present\n";
      try {
        const state = window.__APP_STORE__.getState();
        debugInfo += `Store state has token: ${state.token ? "Yes" : "No"}\n`;
      } catch (e) {
        debugInfo += `Error reading from store: ${e.message}\n`;
      }
    } else {
      debugInfo += "window.__APP_STORE__: Missing\n";
    }
    
    // Try a direct fetch to the API without using searchApi
    debugInfo += "\nTesting direct API access...\n";
    
    // First test the public endpoint
    fetch(`${API_URL}/auth/test`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      if (response.ok) {
        debugInfo += "Public API test (/auth/test): Success\n";
        return response.json();
      } else {
        debugInfo += `Public API test (/auth/test): Failed (${response.status})\n`;
        return response.text().then(text => ({ error: text }));
      }
    })
    .then(data => {
      debugInfo += `Public API response: ${JSON.stringify(data)}\n\n`;
      
      // Now test the authenticated endpoint
      debugInfo += "Testing authenticated endpoint...\n";
      return fetch(`${API_URL}/auth/test-auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token || localStorageToken}`,
          "Content-Type": "application/json"
        }
      });
    })
    .then(response => {
      if (response.ok) {
        debugInfo += "Direct API test: Success\n";
        return response.json();
      } else {
        debugInfo += `Direct API test: Failed (${response.status})\n`;
        return response.text().then(text => ({ error: text }));
      }
    })
    .then(data => {
      debugInfo += `API response: ${JSON.stringify(data)}\n`;
      setTokenDebugInfo(debugInfo);
    })
    .catch(err => {
      debugInfo += `Direct API test error: ${err.message}\n`;
      setTokenDebugInfo(debugInfo);
    });
    
    setTokenDebugInfo(debugInfo + "Waiting for API response...");
  };
  
  // Function to directly test the search endpoint
  const testDirectSearchEndpoint = async () => {
    if (!query.trim() || query.trim().length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);
    setApiDetail("Making direct API request to search endpoint...");
    
    const localStorageToken = localStorage.getItem("token");
    const activeToken = token || localStorageToken;
    
    if (!activeToken) {
      setError("No authentication token available");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/search?query=${encodeURIComponent(query.trim())}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setApiDetail("Direct search request successful");
      } else {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
        } catch (e) {
          const text = await response.text();
          errorMessage = `Error ${response.status}: ${text}`;
        }
        setError(errorMessage);
        setApiDetail(`Direct search request failed: ${response.status}`);
      }
    } catch (err) {
      setError(err.message);
      setApiDetail(`Direct search request error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    if (!query.trim() || query.trim().length < 2) {
      setError("Search query must be at least 2 characters");
      return;
    }

    setLoading(true);
    setResults(null);
    setError(null);
    setApiDetail("");
    
    // Check if token exists before making the API call
    if (!token) {
      setError("Authentication token is missing");
      setApiDetail("The search API requires authentication, but no token was found in the Redux store. Try logging in again.");
      setLoading(false);
      return;
    }

    try {
      const startTime = Date.now();
      
      // Log token presence for debugging (first 10 chars only)
      console.log(`Search with token: ${token.substring(0, 10)}...`);
      
      const data = await searchApi(query.trim());
      const responseTime = Date.now() - startTime;
      
      setResults(data);
      setApiDetail(`Search completed in ${responseTime}ms`);
    } catch (err) {
      setError(err.message || "Search failed");
      setApiDetail(`Error: ${err.message || "Unknown error"}`);
      console.error("Search diagnostic error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: "#e1f5fe",
        border: "1px solid #b3e5fc"
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: "#0277bd" }}>
        Search Diagnostics Tool
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Search API Endpoint:</Typography>
        <Typography>{`${API_URL}/search`}</Typography>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          label="Test Search Query"
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && testSearch()}
          sx={{ flexGrow: 1 }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={testSearch}
          disabled={loading}
          sx={{ mr: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : "Test Search"}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={testDirectSearchEndpoint}
          disabled={loading}
        >
          Direct API
        </Button>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Button 
          variant="outlined" 
          color="info" 
          size="small" 
          onClick={debugTokenSources}
          sx={{ mb: 1 }}
        >
          Debug Authentication
        </Button>
        {tokenDebugInfo && (
          <Paper sx={{ p: 1, bgcolor: "#f0f8ff", whiteSpace: "pre-wrap" }}>
            <Typography variant="body2" fontFamily="monospace">
              {tokenDebugInfo}
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Token status display */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Authentication Status:</Typography>
        {token ? (
          <Alert severity="success" sx={{ mb: 1 }}>
            Authentication token is present
          </Alert>
        ) : (
          <Alert severity="error" sx={{ mb: 1 }}>
            Authentication token is missing
          </Alert>
        )}
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        </Box>
      )}

      {apiDetail && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">{apiDetail}</Typography>
        </Box>
      )}

      {results && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Results Summary:</Typography>
          <Typography>
            Users found: {results.users?.length || 0}
          </Typography>
          <Typography>
            Posts found: {results.posts?.length || 0}
          </Typography>
          
          {results.users?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Users:</Typography>
              <List dense>
                {results.users.slice(0, 3).map(user => (
                  <ListItem key={user._id}>
                    <ListItemText 
                      primary={`${user.firstName} ${user.lastName}`} 
                      secondary={user.occupation || user.location || "No details"} 
                    />
                  </ListItem>
                ))}
                {results.users.length > 3 && (
                  <ListItem>
                    <ListItemText primary={`... and ${results.users.length - 3} more`} />
                  </ListItem>
                )}
              </List>
            </>
          )}
          
          {results.posts?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Posts:</Typography>
              <List dense>
                {results.posts.slice(0, 3).map(post => (
                  <ListItem key={post._id}>
                    <ListItemText 
                      primary={`${post.firstName} ${post.lastName}`} 
                      secondary={post.description ? 
                        (post.description.length > 40 ? 
                          `${post.description.substring(0, 40)}...` : 
                          post.description) : 
                        "No description"} 
                    />
                  </ListItem>
                ))}
                {results.posts.length > 3 && (
                  <ListItem>
                    <ListItemText primary={`... and ${results.posts.length - 3} more`} />
                  </ListItem>
                )}
              </List>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default SearchDiagnosticWidget;