import React, { useState } from 'react';
import { Box, IconButton, Modal, Tooltip, useTheme } from '@mui/material';
import { Map, LocationOn } from '@mui/icons-material';

/**
 * Component to display a map preview for a location with coordinates
 * Appears as an icon button that opens a map modal when clicked
 */
const LocationMap = ({ latitude, longitude, location }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  // Only show the component if coordinates are provided
  if (!latitude || !longitude) {
    return null;
  }

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Create OpenStreetMap embed URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  return (
    <>
      <Tooltip title="View on map">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            ml: 1,
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.dark,
            },
          }}
        >
          <Map sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="map-modal"
        aria-describedby="map-of-post-location"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '70%' },
            maxWidth: 800,
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            overflow: 'hidden',
            p: 0,
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: 400,
            }}
          >
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              title={`Map of ${location || 'post location'}`}
              style={{ border: 0 }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 1.5,
              px: 2,
              backgroundColor: theme.palette.background.alt,
              borderTop: `1px solid ${theme.palette.neutral.light}`,
            }}
          >
            <LocationOn sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Box component="span" sx={{ fontWeight: 500 }}>
              {location || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default LocationMap;