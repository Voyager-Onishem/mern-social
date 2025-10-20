import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';

// Pulsating animation for the loading text
const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

// Expanding circle animation
const expandCircle = keyframes`
  0% { transform: scale(0.8); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(0.8); opacity: 0.3; }
`;

// Ripple effect animation
const ripple = keyframes`
  0% { transform: scale(0.1); opacity: 1; }
  70% { transform: scale(3); opacity: 0.2; }
  100% { transform: scale(3.5); opacity: 0; }
`;

// Dot bounce animation for the dots in "Loading..."
const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
`;

/**
 * Enhanced LoadingSpinner component with multiple animation styles
 * 
 * @param {Object} props Component props
 * @param {boolean} [props.visible=true] Whether the spinner is visible
 * @param {string} [props.message="Loading more posts..."] Loading message to display
 * @param {number} [props.size=38] Size of the spinner in pixels
 * @param {string} [props.style="default"] Animation style: "default", "ripple", "dots", "minimal"
 * @param {string} [props.color="primary"] Color theme to use
 * @returns {React.ReactElement} The LoadingSpinner component
 */
const LoadingSpinner = ({ 
  visible = true, 
  message = "Loading more posts...", 
  size = 38,
  style = "default",
  color = "primary"
}) => {
  if (!visible) return null;

  // Calculate dimensions based on size
  const circleSize = size * 1.6;
  const spinnerSize = size;
  const thickness = Math.max(2, size * 0.1);
  
  // Dynamically adjust box height
  const boxHeight = message ? (size + 40) : size;
  
  const renderSpinner = () => {
    switch (style) {
      case 'ripple':
        return (
          <Box sx={{ position: 'relative', width: size, height: size }}>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: `${size * 0.8}px`,
                  height: `${size * 0.8}px`,
                  border: `2px solid ${color}.main`,
                  borderRadius: '50%',
                  opacity: 0,
                  animation: `${ripple} ${1.6 + i * 0.2}s infinite cubic-bezier(0.65, 0, 0.35, 1)`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
            <CircularProgress 
              size={spinnerSize} 
              thickness={thickness}
              sx={{ color: `${color}.main` }}
            />
          </Box>
        );
        
      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: `${size * 0.25}px`,
                  height: `${size * 0.25}px`,
                  backgroundColor: `${color}.main`,
                  borderRadius: '50%',
                  animation: `${bounce} 1.4s infinite ease-in-out`,
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </Box>
        );
        
      case 'minimal':
        return (
          <CircularProgress 
            size={spinnerSize} 
            thickness={thickness}
            sx={{ 
              color: `${color}.main`,
            }}
          />
        );
        
      default:
        return (
          <>
            {/* Background expanding circle effect */}
            <Box
              sx={{
                position: 'absolute',
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                borderRadius: '50%',
                backgroundColor: `${color}.light`,
                opacity: 0.2,
                animation: `${expandCircle} 2s infinite ease-in-out`,
                zIndex: 0,
              }}
            />
            
            {/* Main spinner */}
            <CircularProgress 
              size={spinnerSize} 
              thickness={thickness}
              sx={{ 
                zIndex: 1,
                color: `${color}.main`,
              }}
            />
          </>
        );
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        marginTop: 2,
        marginBottom: 2,
        height: `${boxHeight}px`,
      }}
    >
      {renderSpinner()}
      
      {/* Loading text - only render if message is provided */}
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mt: 1,
            animation: `${pulse} 1.5s infinite ease-in-out`,
            fontWeight: 500,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;