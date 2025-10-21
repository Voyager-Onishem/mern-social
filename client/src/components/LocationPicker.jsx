import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Typography, IconButton, List, ListItem, ListItemText, Popover, CircularProgress, useTheme } from '@mui/material';
import { MyLocation, LocationOn, Close } from '@mui/icons-material';
import { getLocationSuggestions, getCurrentLocation } from 'utils/geocodingService';

/**
 * LocationPicker component for selecting locations
 * Provides autocomplete suggestions and current location functionality
 */
const LocationPicker = ({ value, onChange, onBlur }) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Initialize input value from passed value
  useEffect(() => {
    if (value?.formattedName) {
      setInputValue(value.formattedName);
    } else if (value && typeof value === 'string' && value.trim()) {
      setInputValue(value);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle input change and fetch suggestions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Only search if there's enough input and user has stopped typing
    if (newValue.length >= 2) {
      setIsLoading(true);
      setError('');
      
      timeoutRef.current = setTimeout(async () => {
        try {
          const results = await getLocationSuggestions(newValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (err) {
          setError('Error fetching locations');
          console.error('Location search error:', err);
        } finally {
          setIsLoading(false);
        }
      }, 500); // Debounce for 500ms
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    // Always call onChange with the raw string input
    onChange(newValue);
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.formattedName);
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Handle getting the current location
  const handleCurrentLocation = async () => {
    setIsLoadingCurrent(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      setInputValue(location.formattedName);
      onChange(location);
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      setError('Unable to get current location');
      console.error('Current location error:', err);
    } finally {
      setIsLoadingCurrent(false);
    }
  };

  // Handle clearing the location
  const handleClearLocation = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <Box position="relative" className="location-picker">
      <Box display="flex" alignItems="center">
        <TextField
          ref={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Add location"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking them
            setTimeout(() => {
              setShowSuggestions(false);
              if (onBlur) onBlur();
            }, 200);
          }}
          InputProps={{
            startAdornment: (
              <LocationOn 
                sx={{ 
                  color: theme.palette.neutral.main, 
                  mr: 1 
                }} 
              />
            ),
            endAdornment: (
              <Box>
                {isLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
                {inputValue && (
                  <IconButton 
                    onClick={handleClearLocation}
                    size="small"
                    sx={{ mr: 0.5 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
                <IconButton 
                  onClick={handleCurrentLocation}
                  disabled={isLoadingCurrent}
                  size="small"
                  title="Use current location"
                >
                  {isLoadingCurrent ? (
                    <CircularProgress size={18} />
                  ) : (
                    <MyLocation fontSize="small" />
                  )}
                </IconButton>
              </Box>
            ),
            sx: {
              bgcolor: theme.palette.neutral.light,
              borderRadius: 2,
              border: 'none',
              '&:hover': {
                bgcolor: theme.palette.background.alt,
              }
            }
          }}
          sx={{
            mb: error ? 0 : 1,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
      </Box>
      
      {error && (
        <Typography color="error" variant="caption" sx={{ pl: 2, mt: 0.5, mb: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
      
      {/* Suggestions popover */}
      {showSuggestions && suggestions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 1300,
            width: '100%',
            maxHeight: '250px',
            overflowY: 'auto',
            mt: 0.5,
            borderRadius: 1,
            boxShadow: 3,
            bgcolor: 'background.paper',
          }}
        >
          <List dense disablePadding>
            {suggestions.map((suggestion) => (
              <ListItem 
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
                button
                sx={{ 
                  px: 2, 
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.neutral.light}`,
                  '&:last-child': { 
                    borderBottom: 'none' 
                  },
                  '&:hover': { 
                    bgcolor: theme.palette.background.alt 
                  } 
                }}
              >
                <ListItemText
                  primary={suggestion.formattedName}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontWeight: 500,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default LocationPicker;