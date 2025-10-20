// No direct API calls in this file, all handled by widgets already updated.
import { Box, useMediaQuery, Button } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "scenes/navbar";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import AdvertWidget from "scenes/widgets/AdvertWidget";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import DiagnosticsWidget from "components/DiagnosticsWidget";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const user = useSelector((state) => state.auth?.user); // Updated to use auth.user
  const { _id, picturePath } = user || {};
  const location = useLocation();
  const [showDiagnostics, setShowDiagnostics] = useState(true);

  // Handle post query parameter and hash for scrolling to specific posts
  useEffect(() => {
    // Parse query parameter ?post=postId
    const searchParams = new URLSearchParams(location.search);
    const postId = searchParams.get('post');
    
    // Check for post hash
    if (window.location.hash && window.location.hash.startsWith('#post-')) {
      scrollToPost(window.location.hash.substring(6)); // Remove #post- prefix
    } 
    // Check for query parameter
    else if (postId) {
      scrollToPost(postId);
    }
  }, [location]);

  // Function to scroll to a post by ID
  const scrollToPost = (postId) => {
    if (!postId) return;
    
    // First check if the post element already exists
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }
    
    // If not found immediately, set up a mutation observer to wait for it
    const observer = new MutationObserver((mutations, obs) => {
      const el = document.getElementById(`post-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        obs.disconnect();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true,
      subtree: true
    });
    
    // Disconnect after 5 seconds if post not found
    setTimeout(() => observer.disconnect(), 5000);
  };
  
  const postWidgetRef = useRef(null);

  // Observe visibility of the main MyPostWidget to inform Navbar
  useEffect(() => {
    const el = postWidgetRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        window.dispatchEvent(new CustomEvent('mypostwidget:inview', { detail: { inView: entry.isIntersecting } }));
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    obs.observe(el);
    return () => {
      obs.disconnect();
    };
  }, []);

  return (
    <Box>
      <Navbar />
      {showDiagnostics && (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 2, px: 2 }}>
          <DiagnosticsWidget />
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mb: 2 }}
            onClick={() => setShowDiagnostics(false)}
          >
            Hide Diagnostics
          </Button>
        </Box>
      )}
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="0.5rem"
        justifyContent="space-between"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          {_id && <UserWidget userId={_id} picturePath={picturePath} openInlineEdit />}
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <div ref={postWidgetRef} />
          {picturePath && <MyPostWidget picturePath={picturePath} />}
          {_id && <PostsWidget userId={_id} />}
        </Box>
        {isNonMobileScreens && (
          <Box flexBasis="26%">
            <AdvertWidget />
            <Box m="2rem 0" />
            <FriendListWidget userId={_id} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
