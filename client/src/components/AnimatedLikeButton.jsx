import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { FavoriteBorderOutlined, FavoriteOutlined } from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// Keyframes for the like animation
const likeAnimation = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const AnimatedLikeButton = ({ isLiked, onClick, color }) => {
  const [animating, setAnimating] = useState(false);
  const [prevLiked, setPrevLiked] = useState(isLiked);
  
  // Trigger animation when like state changes from false to true
  useEffect(() => {
    if (!prevLiked && isLiked) {
      setAnimating(true);
      
      // Reset animation state after animation completes
      const timer = setTimeout(() => {
        setAnimating(false);
      }, 600); // Match this to the total animation duration
      
      return () => clearTimeout(timer);
    }
    
    setPrevLiked(isLiked);
  }, [isLiked, prevLiked]);

  return (
    <IconButton 
      onClick={onClick} 
      aria-label={isLiked ? 'Unlike post' : 'Like post'}
      sx={{
        animation: animating ? `${likeAnimation} 0.6s ease` : 'none',
        transition: 'transform 0.2s ease'
      }}
    >
      {isLiked ? (
        <FavoriteOutlined sx={{ color }} />
      ) : (
        <FavoriteBorderOutlined />
      )}
    </IconButton>
  );
};

export default AnimatedLikeButton;