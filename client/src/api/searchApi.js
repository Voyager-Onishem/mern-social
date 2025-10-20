// API client for search functionality
export const searchApi = async (query) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    
    const response = await fetch(`${process.env.REACT_APP_API_URL || ""}/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to search");
    }

    return await response.json();
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};