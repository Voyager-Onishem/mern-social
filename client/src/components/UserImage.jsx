import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { getMediaUrl } from "../utils/mediaHelpers";

const UserImage = ({ image, size = "60px" }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Process the image source when the component mounts or image changes
    const processedSrc = getMediaUrl(image);
    setImgSrc(processedSrc);
    setHasError(false);
  }, [image]);
  
  const handleError = () => {
    console.error("Image failed to load:", imgSrc, "Original image path:", image);
    setHasError(true);
    
    // If the image is a Cloudinary URL that failed, try a different approach
    if (image && image.includes('cloudinary.com')) {
      // Extract the Cloudinary URL parts and reconstruct it
      try {
        const parts = image.match(/cloudinary\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)/);
        if (parts) {
          const [, cloudName, resourceType, uploadType, id] = parts;
          const fixedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/${uploadType}/${id}`;
          console.log("Attempting with fixed URL:", fixedUrl);
          setImgSrc(fixedUrl);
          return;
        }
      } catch (e) {
        console.error("Error parsing Cloudinary URL:", e);
      }
    }
    
    // Fallback to default avatar
    setImgSrc("/assets/default-avatar.png");
  };
  
  return (
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
        src={imgSrc}
        onError={handleError}
      />
    </Box>
  );
};

export default UserImage;
