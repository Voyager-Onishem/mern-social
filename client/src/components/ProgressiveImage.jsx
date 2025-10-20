import React, { useState, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';

// Component for progressive image loading with blur-up effect
const ProgressiveImage = ({ src, alt, style, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    // Reset state when src changes
    setImageLoaded(false);
    setImageSrc('');
    
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
    
    return () => {
      img.onload = null;
    };
  }, [src]);

  return (
    <Box sx={{ 
      position: 'relative',
      overflow: 'hidden',
      borderRadius: style?.borderRadius || '0.75rem',
      cursor: onClick ? 'pointer' : 'default',
      ...(!imageLoaded && { 
        backgroundColor: 'rgba(0, 0, 0, 0.08)', 
        minHeight: 200 
      })
    }}>
      {!imageLoaded && (
        <Skeleton 
          variant="rectangular" 
          width="100%" 
          height={style?.height || 280}
          animation="wave" 
          sx={{ borderRadius: style?.borderRadius || '0.75rem' }}
        />
      )}
      
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          onClick={onClick}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            ...style
          }}
        />
      )}
    </Box>
  );
};

export default ProgressiveImage;