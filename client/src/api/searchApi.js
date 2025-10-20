import { getCurrentToken } from "../utils/reduxUtils";

// API client for search functionality
export const searchApi = async (query) => {
  try {
    // Get token from Redux store directly if possible
    let token = null;
    
    // WORKAROUND: Use the token from Redux store via window.__APP_STORE__
    // (This is more reliable than the getCurrentToken function)
    if (window.__APP_STORE__) {
      try {
        const state = window.__APP_STORE__.getState();
        token = state.token;
        console.log("Got token from Redux store via window.__APP_STORE__");
      } catch (e) {
        console.error("Error accessing Redux store:", e.message);
      }
    }
    
    // If still no token, try getCurrentToken as backup
    if (!token) {
      try {
        token = getCurrentToken();
        console.log("Got token from getCurrentToken function");
      } catch (e) {
        console.log("Could not get token from getCurrentToken:", e.message);
      }
    }
    
    // Last resort: localStorage
    if (!token) {
      token = localStorage.getItem("token");
      if (token) {
        console.log("Got token from localStorage");
      }
    }
    
    if (!token) {
      console.error("Search API: No authentication token found from any source");
      throw new Error("Not authenticated");
    }
    
    // Log the beginning of the request for debugging
    console.log(`Making search request to: ${process.env.REACT_APP_API_URL || "http://localhost:6001"}/search?query=${encodeURIComponent(query)}`);
    console.log(`Token available: ${token ? "Yes (first 10 chars: " + token.substring(0, 10) + "...)" : "No"}`);
    
    // Add a test endpoint first to verify server is reachable
    try {
      // Test root endpoint first - this should always exist
      const rootResponse = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:6001"}/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      if (rootResponse.ok) {
        console.log("Server is reachable");
        
        // Now try the test endpoint if available
        try {
          const testResponse = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:6001"}/auth/test`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });
          
          if (testResponse.ok) {
            console.log("Public API test endpoint is working");
          } else {
            console.warn(`Public API test endpoint failed: ${testResponse.status}`);
          }
        } catch (testErr) {
          console.warn("Test endpoint error (this is ok if endpoint doesn't exist):", testErr.message);
        }
      } else {
        console.error(`Server is unreachable: ${rootResponse.status}`);
      }
    } catch (e) {
      console.error("Error testing server connection:", e.message);
    }
    
    // Now proceed with the actual search request
    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:6001"}/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      // Try to parse as JSON first, but handle text response if it's not JSON
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || "Failed to search";
      } catch (e) {
        // Not JSON, get as text
        const errorText = await response.text();
        errorMessage = `Failed to search (${response.status}): ${errorText}`;
      }
      console.error(`Search API error: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};