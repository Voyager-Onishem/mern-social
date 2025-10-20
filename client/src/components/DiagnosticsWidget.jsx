import { useState, useEffect } from "react";
import { Box, Typography, Paper, Button, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector } from "react-redux";
import SearchDiagnosticWidget from "./SearchDiagnosticWidget";

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
      // Try to connect directly to server root first
      const startTime = Date.now();
      const rootResponse = await fetch(`${API_URL}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json" 
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      // If the server root responds with 404, that's actually good - means the server is running but no route defined
      if (rootResponse.status === 404 || rootResponse.ok) {
        setApiStatus(`Connected (${responseTime}ms)`);
        setApiDetail("API server is reachable and responding.");
        
        // Now try to use a known endpoint
        try {
          const postsResponse = await fetch(`${API_URL}/posts`, {
            method: "GET",
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json" 
            }
          });
          
          if (postsResponse.ok) {
            setApiStatus(`Connected (${responseTime}ms)`);
            setApiDetail("API server is reachable and responding. Posts endpoint is accessible.");
          }
        } catch (e) {
          // We already know the server is up, so no need to update status on failure
          console.log("Error testing posts endpoint:", e.message);
        }
      } else {
        setApiStatus(`Error: ${rootResponse.status}`);
        const text = await rootResponse.text();
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
        sx={{ mb: 2 }}
      >
        Recheck API Connection
      </Button>
      
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="search-diagnostics-content"
          id="search-diagnostics-header"
        >
          <Typography>Search Functionality Testing</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SearchDiagnosticWidget />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default DiagnosticsWidget;