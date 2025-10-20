import { useEffect, useState, useRef } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  useTheme,
  useMediaQuery,
  Popover,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import {
  Search,
  Message,
  DarkMode,
  LightMode,
  Notifications,
  Help,
  Menu,
  Close,
} from "@mui/icons-material";
import { searchApi } from "../../api/searchApi.js";
import SearchResultsWidget from "components/SearchResultsWidget.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";

// The Navbar listens for a custom event 'mypostwidget:inview' dispatched by pages containing the inline MyPostWidget.
// When the widget scrolls out of view, the event detail { inView: false } triggers a compact "Post" button.
// Clicking that button opens a modal with the MyPostWidget (portal rendering avoided for simplicity by conditional inline render at top). 
const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user); // Updated to use auth.user
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const searchInputRef = useRef(null);

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const primaryLight = theme.palette.primary.light;
  const alt = theme.palette.background.alt;

  // Safely access user properties with optional chaining
  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}` : "User";
  const [showFloatingPost, setShowFloatingPost] = useState(false);
  const [openPostModal, setOpenPostModal] = useState(false);

  // Handle search submit
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    setSearchError(null);
    setAnchorEl(searchInputRef.current);
    
    try {
      const results = await searchApi(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError(error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input keypress
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  // Close search results
  const handleCloseResults = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const handler = (e) => {
      if (typeof e.detail?.inView === 'boolean') {
        setShowFloatingPost(!e.detail.inView); // show when not in view
      }
    };
    window.addEventListener('mypostwidget:inview', handler);
    return () => window.removeEventListener('mypostwidget:inview', handler);
  }, []);

  return (
    <FlexBetween padding="1rem 6%" backgroundColor={alt} sx={{ position: 'sticky', top: 0, zIndex: 100, }}>
      <FlexBetween gap="1.75rem">
        <Typography
          fontWeight="bold"
          fontSize="clamp(1rem, 2rem, 2.25rem)"
          color="primary"
          onClick={() => navigate("/home")}
          sx={{
            "&:hover": {
              color: primaryLight,
              cursor: "pointer",
            },
          }}
        >
          Alucon
        </Typography>
        {isNonMobileScreens && (
          <FlexBetween
            backgroundColor={neutralLight}
            borderRadius="9px"
            gap="3rem"
            padding="0.1rem 1.5rem"
          >
            <InputBase 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              inputRef={searchInputRef}
            />
            <IconButton 
              aria-label="Search"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <CircularProgress size={24} /> : <Search />}
            </IconButton>
          </FlexBetween>
        )}
        
        {/* Search Results Popover */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseResults}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            style: {
              width: isNonMobileScreens ? '400px' : '90vw',
              maxHeight: '70vh',
              overflow: 'auto',
              marginTop: '8px',
              boxShadow: '0px 5px 15px rgba(0,0,0,0.2)'
            }
          }}
        >
          <SearchResultsWidget 
            searchResults={searchResults} 
            isLoading={isSearching} 
            error={searchError}
            onClose={handleCloseResults}
          />
        </Popover>
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="1.25rem">
          <FlexBetween gap="0.5rem">
            {showFloatingPost && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setOpenPostModal(true)}
                sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
                aria-label="Create a post"
              >
                Post
              </Button>
            )}
            <IconButton onClick={() => dispatch(setMode())} aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
          </FlexBetween>
          <Message sx={{ fontSize: "25px" }} />
          <Notifications sx={{ fontSize: "25px" }} />
          <Help sx={{ fontSize: "25px" }} />
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
                "& .MuiSvgIcon-root": {
                  pr: "0.25rem",
                  width: "3rem",
                },
                "& .MuiSelect-select:focus": {
                  backgroundColor: neutralLight,
                },
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Log Out</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <IconButton
          onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
          aria-label={isMobileMenuToggled ? 'Close menu' : 'Open menu'}
        >
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          zIndex="10"
          maxWidth="500px"
          minWidth="300px"
          backgroundColor={background}
        >
          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end" p="1rem">
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
              aria-label="Close navigation menu"
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap="3rem"
          >
            {/* Mobile Search */}
            <FlexBetween
              backgroundColor={neutralLight}
              borderRadius="9px"
              gap="1rem"
              padding="0.1rem 1.5rem"
              width="80%"
              mb="1rem"
            >
              <InputBase 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                sx={{ width: '100%' }}
                ref={searchInputRef}
              />
              <IconButton 
                aria-label="Search"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? <CircularProgress size={24} /> : <Search />}
              </IconButton>
            </FlexBetween>
            <IconButton
              onClick={() => dispatch(setMode())}
              sx={{ fontSize: "25px" }}
              aria-label={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
            <Message sx={{ fontSize: "25px" }} />
            <Notifications sx={{ fontSize: "25px" }} />
            <Help sx={{ fontSize: "25px" }} />
            <FormControl variant="standard" value={fullName}>
              <Select
                value={fullName}
                sx={{
                  backgroundColor: neutralLight,
                  width: "150px",
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                  "& .MuiSvgIcon-root": {
                    pr: "0.25rem",
                    width: "3rem",
                  },
                  "& .MuiSelect-select:focus": {
                    backgroundColor: neutralLight,
                  },
                }}
                input={<InputBase />}
              >
                <MenuItem value={fullName}>
                  <Typography>{fullName}</Typography>
                </MenuItem>
                <MenuItem onClick={() => dispatch(setLogout())}>
                  Log Out
                </MenuItem>
              </Select>
            </FormControl>
          </FlexBetween>
        </Box>
      )}
      {/* Lightweight modal for post creation when original widget scrolled away */}
      {openPostModal && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            overflowY: 'auto',
            paddingTop: '5vh'
          }}
          aria-modal="true"
          role="dialog"
        >
          <Box sx={{ position: 'relative', width: 'min(760px,90%)' }}>
            <IconButton
              onClick={() => setOpenPostModal(false)}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' } }}
              aria-label="Close post dialog"
            >
              <CloseIcon />
            </IconButton>
            {/* Lazy import alternative skipped; reuse component directly to keep state logic consistent */}
            <Box sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
              {/* MyPostWidget is imported at page level normally; to avoid circular deps we inline dynamic require */}
              {(() => {
                try {
                  const MyPostWidget = require('scenes/widgets/MyPostWidget').default;
                  return <MyPostWidget picturePath={user.picturePath} />;
                } catch (e) {
                  return <Box p={2}><Typography color="error">Failed to load post widget.</Typography></Box>;
                }
              })()}
            </Box>
          </Box>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;
