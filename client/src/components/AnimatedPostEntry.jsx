import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

// Component that animates posts as they enter the viewport
const AnimatedPostEntry = ({ children, index = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const postRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When post enters viewport
        if (entry.isIntersecting) {
          // Add slight delay based on index for staggered effect
          setTimeout(() => {
            setIsVisible(true);
          }, index * 100); // Stagger by 100ms per post
          
          // Once animated, no need to observe anymore
          if (postRef.current) {
            observer.unobserve(postRef.current);
          }
        }
      },
      { threshold: 0.1 } // Trigger when 10% visible
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => {
      if (postRef.current) {
        observer.unobserve(postRef.current);
      }
    };
  }, [index]);

  return (
    <Box
      ref={postRef}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedPostEntry;