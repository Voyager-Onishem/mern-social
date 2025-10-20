
import { Typography, useTheme } from "@mui/material";
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
      <img
        width="100%"
        height="auto"
        alt="advert"
        src={`${API_URL}/assets/${adData.picturePath}`}
        style={{ borderRadius: "0.75rem", margin: "0.75rem 0" }}
      />
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
