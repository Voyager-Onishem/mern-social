
import { Typography, useTheme, Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";

const API_URL = process.env.REACT_APP_API_URL;

const AdvertWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const navigate = useNavigate();
  
  // Get ads from Redux store
  const ads = useSelector((state) => state.ads);
  const [randomAd, setRandomAd] = useState(null);

  useEffect(() => {
    if (ads && ads.length > 0) {
      // Select a random ad from the pool
      const randomIndex = Math.floor(Math.random() * ads.length);
      setRandomAd(ads[randomIndex]);
    }
  }, [ads]);

  // If no ads are available, show a default ad
  const adData = randomAd || {
    title: "MikaCosmetics",
    link: "mikacosmetics.com",
    description: "Your pathway to stunning and immaculate beauty and made sure your skin is exfoliating skin and shining like light.",
    picturePath: "info4.jpeg"
  };

  return (
    <WidgetWrapper>
      <FlexBetween>
        <Typography color={dark} variant="h5" fontWeight="500">
          Sponsored
        </Typography>
        <Typography 
          color={medium}
          sx={{ 
            "&:hover": {
              cursor: "pointer",
              color: main,
            },
          }}
          onClick={() => navigate("/create-ad")}
        >
          Create Ad
        </Typography>
      </FlexBetween>
      {/* Ad Image with multiple fallback strategies */}
      <Box
        sx={{
          width: '100%',
          height: '200px',
          borderRadius: '0.75rem',
          margin: '0.75rem 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
        }}
      >
        <img
          width="100%"
          height="auto"
          alt="advert"
          src={`${API_URL}/assets/${adData.picturePath}`}
          style={{ 
            borderRadius: "0.75rem",
            objectFit: "cover",
            maxHeight: "100%"
          }}
          onError={(e) => {
            console.warn(`Ad image failed to load from API: ${adData.picturePath}`);
            
            // First fallback: Try without the API URL, just the relative path
            if (!e.target.dataset.triedAlternate) {
              e.target.dataset.triedAlternate = "true";
              e.target.src = `/assets/${adData.picturePath}`;
              return;
            }
            
            // Second fallback: Try without the assets folder
            if (!e.target.dataset.triedSecondAlternate) {
              e.target.dataset.triedSecondAlternate = "true";
              e.target.src = `/${adData.picturePath}`;
              return;
            }
            
            // Third fallback: Try one of our known good sample images
            if (!e.target.dataset.triedSampleImage) {
              e.target.dataset.triedSampleImage = "true";
              // Pick a random sample image from our known working images
              const sampleImages = ["info1.jpeg", "info2.jpeg", "info3.jpeg", "info4.jpeg"];
              const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
              e.target.src = `${API_URL}/assets/${randomImage}`;
              return;
            }
            
            // Final fallback: Use a placeholder image service
            e.target.src = "https://via.placeholder.com/600x400?text=Ad+Image";
          }}
        />
      </Box>
      <FlexBetween>
        <Typography color={main}>{adData.title}</Typography>
        <a 
          href={`https://${adData.link}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Typography color={medium}>{adData.link}</Typography>
        </a>
      </FlexBetween>
      <Typography color={medium} m="0.5rem 0">
        {adData.description}
      </Typography>
    </WidgetWrapper>
  );
};

export default AdvertWidget;
