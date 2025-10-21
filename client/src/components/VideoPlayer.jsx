import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { getMediaUrl, isVideoFile } from "../utils/mediaHelpers";

/**
 * Enhanced video player component with error handling and fallbacks
 * Supports multiple source types and handles loading states
 */
const VideoPlayer = ({ 
  src, 
  alt = "Video content",
  width = "100%",
  height = "auto",
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
  sx = {},
  fallbackContent = null
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const videoRef = useRef(null);

  // Process the source to get the correct URL
  const processVideoSrc = () => {
    if (!src) return '';
    
    // If the URL has the pattern /assets/https://cloudinary.com/...
    if (src.includes('/assets/https://') && src.includes('cloudinary.com')) {
      // Extract just the Cloudinary URL
      const cloudinaryUrlMatch = src.match(/(https:\/\/.*cloudinary\.com\/.*)/);
      if (cloudinaryUrlMatch && cloudinaryUrlMatch[1]) {
        return cloudinaryUrlMatch[1];
      }
    }
    
    // If it's a normal video file
    if (isVideoFile(src)) {
      return getMediaUrl(src, { useVideoEndpoint: true });
    }
    
    // Otherwise just return the source
    return src;
  };
  
  const videoSrc = processVideoSrc();

  useEffect(() => {
    // Reset states when src changes
    setLoading(true);
    setError(false);
    setCanPlay(false);
  }, [src]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleCanPlay = () => {
    setLoading(false);
    setCanPlay(true);
  };

  const handleError = (e) => {
    console.error("Video loading error:", e);
    setLoading(false);
    setError(true);
  };

  // If it's an error and we have fallback content, show it
  if (error && fallbackContent) {
    return <>{fallbackContent}</>;
  }

  return (
    <Box position="relative" width={width} height={height} sx={sx}>
      {loading && (
        <Box 
          position="absolute" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          width="100%" 
          height="100%" 
          bgcolor="rgba(0, 0, 0, 0.1)"
          zIndex={1}
        >
          <CircularProgress size={40} />
        </Box>
      )}
      
      {error && (
        <Box 
          position="absolute" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          width="100%" 
          height="100%"
          bgcolor="rgba(0, 0, 0, 0.1)"
          zIndex={1}
        >
          <Typography color="error">
            Unable to load video. Please try again later.
          </Typography>
        </Box>
      )}
      
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay={autoPlay}
        controls={controls && canPlay}
        muted={muted}
        loop={loop}
        width="100%"
        height="100%"
        style={{ 
          display: error ? 'none' : 'block',
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.3s ease' 
        }}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        playsInline
      >
        <Typography>Your browser does not support the video tag.</Typography>
      </video>
    </Box>
  );
};

export default VideoPlayer;