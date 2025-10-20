import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import { useSelector } from "react-redux";

const DiagnosticsWidget = () => {
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [apiDetail, setApiDetail] = useState("");
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const posts = useSelector((state) => state.posts);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:6001";

  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      // Basic connection test
      const startTime = Date.now();
      const response = await fetch(`${API_URL}/auth/test`, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        setApiStatus(`Connected (${responseTime}ms)`);
        setApiDetail("API server is reachable and responding.");
      } else {
        setApiStatus(`Error: ${response.status}`);
        const text = await response.text();
        setApiDetail(`Server responded with: ${text || "No response body"}`);
      }
    } catch (error) {
      setApiStatus("Failed");
      setApiDetail(`Error: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2, 
        backgroundColor: "#fff7e6",
        border: "1px solid #ffe0b2"
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: "#e65100" }}>
        Diagnostics Tool
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">API Connection:</Typography>
        <Typography>
          URL: {API_URL} - Status: <strong>{apiStatus}</strong>
        </Typography>
        <Typography variant="body2">{apiDetail}</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Authentication:</Typography>
        <Typography>
          Token: <strong>{token ? "Present" : "Missing"}</strong>
        </Typography>
        <Typography>
          User Data: <strong>{user ? "Loaded" : "Missing"}</strong>
          {user ? ` (${user.firstName} ${user.lastName})` : ""}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Content:</Typography>
        <Typography>
          Posts: <strong>{posts ? `${posts.length} loaded` : "Missing"}</strong>
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        color="warning" 
        size="small"
        onClick={checkApiConnection}
      >
        Recheck API Connection
      </Button>
    </Paper>
  );
};

export default DiagnosticsWidget;