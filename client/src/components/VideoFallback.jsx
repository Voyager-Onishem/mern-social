import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { PlayArrow, Pause, VolumeUp, VolumeMute } from '@mui/icons-material';

const VideoFallback = ({ src, poster, fallbackImage, alt, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [directSrc, setDirectSrc] = useState(src);
  const videoRef = useRef(null);

  // Set up video source with error handling
  useEffect(() => {
    if (!src) {
      setError("No video source provided");
      setLoading(false);
      return;
    }

    // Create a new URL that uses the dedicated video endpoint
    if (src.includes('/assets/') && src.endsWith('.mp4')) {
      // Replace /assets/ with /videos/ for better streaming
      const videoEndpointSrc = src.replace('/assets/', '/videos/').split('/').pop();
      setDirectSrc(`${process.env.REACT_APP_API_URL || 'http://localhost:6001'}/videos/${videoEndpointSrc}`);
    }

    setLoading(true);
    setError(null);
  }, [src]);

  // Handle video events
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError("Failed to load video");
    setLoading(false);
  };

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Try alternative source if main source fails
  const tryAlternateSource = () => {
    // If we're already using the video endpoint, try the original assets path
    if (directSrc.includes('/videos/')) {
      setDirectSrc(src);
    } else {
      // Try a different format or path
      const baseSrc = src.substring(0, src.lastIndexOf('.')) || src;
      if (src.endsWith('.mp4')) {
        setDirectSrc(`${baseSrc}.webm`);
      } else if (src.endsWith('.webm')) {
        setDirectSrc(`${baseSrc}.mp4`);
      }
    }
    setError(null);
    setLoading(true);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', ...props.sx }}>
      {/* Video element */}
      <video
        ref={videoRef}
        src={directSrc}
        poster={poster}
        controls={false}
        muted={isMuted}
        playsInline
        loop
        style={{ 
          width: '100%', 
          display: loading || error ? 'none' : 'block',
          borderRadius: '8px',
        }}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
      />
      
      {/* Loading indicator */}
      {loading && !error && (
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: '8px',
            minHeight: '200px',
            width: '100%'
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}
      
      {/* Error fallback */}
      {error && (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: '8px',
            minHeight: '200px',
            width: '100%',
            padding: 2
          }}
        >
          <Typography variant="body1" color="error" gutterBottom>
            {error}
          </Typography>
          
          {/* Fallback image if provided */}
          {fallbackImage && (
            <img 
              src={fallbackImage} 
              alt={alt || "Video thumbnail"} 
              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
            />
          )}
          
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={tryAlternateSource}
            sx={{ mt: 2 }}
          >
            Try Alternate Source
          </Button>
        </Box>
      )}
      
      {/* Custom video controls */}
      {!loading && !error && (
        <Box 
          sx={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
          }}
        >
          <Button 
            onClick={handlePlay} 
            variant="text" 
            sx={{ minWidth: 'auto', color: 'white' }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </Button>
          
          <Button 
            onClick={handleMute} 
            variant="text" 
            sx={{ minWidth: 'auto', color: 'white' }}
          >
            {isMuted ? <VolumeMute /> : <VolumeUp />}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default VideoFallback;