import { useState } from "react";
import { Box, Typography, Paper, Button, TextField, CircularProgress, List, ListItem, ListItemText, Alert } from "@mui/material";
import { searchApi } from "../api/searchApi";
import { useSelector } from "react-redux";

const SearchDiagnosticWidget = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDetail, setApiDetail] = useState("");
  
  // Get token from Redux store to verify it's available
  const token = useSelector((state) => state.token);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";

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
        >
          {loading ? <CircularProgress size={24} /> : "Test Search"}
        </Button>
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