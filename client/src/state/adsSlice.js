import { createSlice } from "@reduxjs/toolkit";

// Default ads for demonstration
const defaultAds = [
  {
    id: "1",
    title: "MikaCosmetics",
    link: "mikacosmetics.com",
    description: "Your pathway to stunning and immaculate beauty and made sure your skin is exfoliating skin and shining like light.",
    picturePath: "info4.jpeg"
  },
  {
    id: "2",
    title: "TechGadgets",
    link: "techgadgets.com",
    description: "Discover the latest technology at unbeatable prices. New arrivals every week!",
    picturePath: "info1.jpeg"
  },
  {
    id: "3",
    title: "FitLife Gym",
    link: "fitlifegym.com",
    description: "Join our community and transform your body with expert trainers and state-of-the-art equipment.",
    picturePath: "info2.jpeg"
  }
];

// Load saved ads from localStorage or use default ads
const loadAdsFromStorage = () => {
  try {
    const savedAds = localStorage.getItem('ads');
    return savedAds ? JSON.parse(savedAds) : defaultAds;
  } catch (error) {
    console.error('Error loading ads from localStorage:', error);
    return defaultAds;
  }
};

const initialState = loadAdsFromStorage();

export const adsSlice = createSlice({
  name: "ads",
  initialState,
  reducers: {
    setAds: (state, action) => {
      const newState = action.payload;
      localStorage.setItem('ads', JSON.stringify(newState));
      return newState;
    },
    addAd: (state, action) => {
      state.push(action.payload);
      localStorage.setItem('ads', JSON.stringify(state));
    }
  }
});

export const { setAds, addAd } = adsSlice.actions;

// Thunks for async operations
export const fetchAds = () => async (dispatch) => {
  try {
    // In a real app, this would be an API call
    // For now, we'll use the initial state
    // Example: const response = await fetch("/api/ads");
    // dispatch(setAds(await response.json()));
  } catch (error) {
    console.error("Error fetching ads:", error);
  }
};

export const createAd = (adData) => async (dispatch) => {
  try {
    // In a real app, this would be an API call
    // For now, we'll just add the ad locally
    // Example: const response = await fetch("/api/ads", { method: "POST", body: JSON.stringify(adData) });
    
    // Validate and sanitize image path
    let sanitizedPicturePath = adData.picturePath;
    
    // Make sure we have a valid picture path
    if (!sanitizedPicturePath) {
      // Default to a known working image
      sanitizedPicturePath = "info1.jpeg";
    }
    
    // Remove any path prefixes if they exist
    if (sanitizedPicturePath.includes('/')) {
      sanitizedPicturePath = sanitizedPicturePath.split('/').pop();
    }
    
    // Create a new ad with a unique ID and sanitized path
    const newAd = {
      id: Date.now().toString(),
      ...adData,
      picturePath: sanitizedPicturePath
    };
    
    console.log("Creating new ad:", newAd);
    dispatch(addAd(newAd));
    
    return newAd; // Return the created ad
  } catch (error) {
    console.error("Error creating ad:", error);
    throw error;
  }
};

export default adsSlice.reducer;
