// API client for search functionality
export const searchApi = async (query) => {
  try {
    // Get token from Redux store instead of localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      console.error("Search API: No token found in localStorage");
      throw new Error("Not authenticated");
    }
    
    // Log the beginning of the request for debugging
    console.log(`Making search request to: ${process.env.REACT_APP_API_URL || "http://localhost:6001"}/search?query=${encodeURIComponent(query)}`);
    
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