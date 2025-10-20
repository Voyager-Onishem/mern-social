import { createSlice } from "@reduxjs/toolkit";

// Sample initial ads for demonstration
const initialState = [
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

export const adsSlice = createSlice({
  name: "ads",
  initialState,
  reducers: {
    setAds: (state, action) => {
      return action.payload;
    },
    addAd: (state, action) => {
      state.push(action.payload);
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
    const newAd = {
      id: Date.now().toString(),
      ...adData
    };
    dispatch(addAd(newAd));
  } catch (error) {
    console.error("Error creating ad:", error);
  }
};

export default adsSlice.reducer;
