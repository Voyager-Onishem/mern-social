/**
 * Geocoding service for location suggestions and current location
 */

// Cache for geocoding results to reduce API calls
const geocodeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get location suggestions based on user input
 * @param {string} query - User's location search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of location suggestions
 */
export const getLocationSuggestions = async (query, options = {}) => {
  if (!query || query.length < 2) return [];
  
  // Check cache first
  const cacheKey = `suggestions:${query.toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  try {
    // This example uses OpenStreetMap's Nominatim API which is free but has usage limits
    // In production, you might want to use a paid service like Google Places API
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MernSocialApp/1.0', // Required by Nominatim's usage policy
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch location suggestions');
    }
    
    const data = await response.json();
    
    // Format results
    const suggestions = data.map(item => ({
      id: item.place_id,
      name: item.display_name.split(',')[0],
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      // Create a simplified location name for display
      formattedName: formatLocationName(item),
    }));
    
    // Cache results
    geocodeCache.set(cacheKey, {
      data: suggestions,
      expiry: Date.now() + CACHE_EXPIRY,
    });
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

/**
 * Format a location name from Nominatim response
 * @param {Object} item - Nominatim response item
 * @returns {string} Formatted location name
 */
const formatLocationName = (item) => {
  const parts = [];
  
  if (item.address) {
    // Add the most specific part first
    if (item.type === 'city' || item.type === 'administrative') {
      parts.push(item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0]);
    } else {
      parts.push(item.display_name.split(',')[0]);
    }
    
    // Add city/town if applicable and not already added
    if (item.address.city && !parts.includes(item.address.city)) {
      parts.push(item.address.city);
    } else if (item.address.town && !parts.includes(item.address.town)) {
      parts.push(item.address.town);
    } else if (item.address.village && !parts.includes(item.address.village)) {
      parts.push(item.address.village);
    }
    
    // Add state/province
    if (item.address.state) {
      parts.push(item.address.state);
    }
    
    // Add country
    if (item.address.country) {
      parts.push(item.address.country);
    }
  } else {
    // Fallback if address details aren't available
    const nameParts = item.display_name.split(',');
    parts.push(nameParts[0]);
    if (nameParts.length > 2) {
      parts.push(nameParts[nameParts.length - 2].trim());
      parts.push(nameParts[nameParts.length - 1].trim());
    } else if (nameParts.length > 1) {
      parts.push(nameParts[nameParts.length - 1].trim());
    }
  }
  
  // Filter out duplicates and return formatted string
  return [...new Set(parts)].join(', ');
};

/**
 * Get the user's current location
 * @returns {Promise<Object>} Location object with coordinates and formatted address
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address details
          const formattedLocation = await reverseGeocode(latitude, longitude);
          resolve({
            ...formattedLocation,
            latitude,
            longitude,
            isCurrentLocation: true,
          });
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error('Unable to retrieve your location: ' + error.message));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Location details
 */
export const reverseGeocode = async (latitude, longitude) => {
  // Check cache first
  const cacheKey = `reverse:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MernSocialApp/1.0', // Required by Nominatim's usage policy
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to reverse geocode location');
    }
    
    const data = await response.json();
    
    const result = {
      id: data.place_id,
      name: data.display_name.split(',')[0],
      displayName: data.display_name,
      formattedName: formatLocationName(data),
    };
    
    // Cache results
    geocodeCache.set(cacheKey, {
      data: result,
      expiry: Date.now() + CACHE_EXPIRY,
    });
    
    return result;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    // Fallback to coordinates if geocoding fails
    return {
      id: `coords:${latitude},${longitude}`,
      name: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      displayName: `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      formattedName: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };
  }
};

export default {
  getLocationSuggestions,
  getCurrentLocation,
  reverseGeocode,
};