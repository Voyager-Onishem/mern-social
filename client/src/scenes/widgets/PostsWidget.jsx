import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  setPosts, 
  setPostsLoading, 
  incrementPostImpression, 
  markPostSeenThisSession,
  appendPosts,
  setPagination
} from "state";
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';
import { useSearchParams } from "react-router-dom";
import PostWidget from "./PostWidget";
import AnimatedPostEntry from "components/AnimatedPostEntry";
import LoadingSpinner from "components/LoadingSpinner";

const API_URL = process.env.REACT_APP_API_URL;

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const loading = useSelector((state) => state.postsLoading);
  const pagination = useSelector((state) => state.pagination);
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get("post");
  const targetPostRef = useRef({});
  const loaderRef = useRef(null);
  const postsContainerRef = useRef(null);
  
  // Track if we're loading the initial page or additional pages
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const MIN_PULL_DISTANCE = 100;
  
  // Scroll position memory
  const scrollPositionKey = `scrollPosition_${isProfile ? userId : 'feed'}`;
  const previousScrollPosition = useRef(parseInt(sessionStorage.getItem(scrollPositionKey) || '0'));

  // Track last fetch time to prevent overfetching
  const lastFetchRef = useRef(0);
  const FETCH_COOLDOWN = 300; // milliseconds between fetches
  
  // Scroll tracking refs for enhanced infinite scrolling
  const scrollPositions = useRef([]);
  const scrollTimer = useRef(null);
  const isScrollingFast = useRef(false);
  const scrollDirection = useRef("down"); // "up" or "down"
  const lastPosition = useRef(0);
  const scrollPauseTimer = useRef(null);
  const observerInstance = useRef(null);
  
  const getPosts = async (page = 1, append = false) => {
    if (loading) return;
    
    // Throttle fetches to prevent overwhelming the server
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    if (timeSinceLastFetch < FETCH_COOLDOWN && append) {
      // If fetching too soon, delay the request slightly
      await new Promise(resolve => setTimeout(resolve, FETCH_COOLDOWN - timeSinceLastFetch));
    }
    
    // Update last fetch time
    lastFetchRef.current = Date.now();
    
    // Set loading state
    dispatch(setPostsLoading(true));
    
    try {
      // Add a small random offset to limit for more natural loading
      const adjustedLimit = pagination.limit + (append ? Math.floor(Math.random() * 3) : 0);
      
      const response = await fetch(`${API_URL}/posts?page=${page}&limit=${adjustedLimit}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { posts: [], pagination: { ...pagination, hasMore: false } }; }
      
      if (!response.ok) {
        console.warn('Failed to load feed posts:', data);
        if (append) {
          dispatch(appendPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
        } else {
          dispatch(setPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
        }
        return;
      }
      
      // Introduce a small delay to ensure smooth transitions for appends
      if (append) {
        // Small delay for smoother appearance
        await new Promise(resolve => setTimeout(resolve, 300));
        
        dispatch(appendPosts({ 
          posts: Array.isArray(data.posts) ? data.posts : [], 
          pagination: data.pagination 
        }));
      } else {
        dispatch(setPosts({ 
          posts: Array.isArray(data.posts) ? data.posts : [], 
          pagination: data.pagination 
        }));
      }
    } catch (e) {
      console.warn('Error fetching feed posts:', e);
      if (append) {
        dispatch(appendPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
      } else {
        dispatch(setPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
      }
    } finally {
      dispatch(setPostsLoading(false));
      setInitialLoading(false);
    }
  };

  const getUserPosts = async (page = 1, append = false) => {
    if (loading) return;
    
    // Throttle fetches to prevent overwhelming the server
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    if (timeSinceLastFetch < FETCH_COOLDOWN && append) {
      // If fetching too soon, delay the request slightly
      await new Promise(resolve => setTimeout(resolve, FETCH_COOLDOWN - timeSinceLastFetch));
    }
    
    // Update last fetch time
    lastFetchRef.current = Date.now();
    
    dispatch(setPostsLoading(true));
    
    try {
      // Add a small random offset to limit for more natural loading
      const adjustedLimit = pagination.limit + (append ? Math.floor(Math.random() * 3) : 0);
      
      const response = await fetch(
        `${API_URL}/posts/${userId}/posts?page=${page}&limit=${adjustedLimit}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { posts: [], pagination: { ...pagination, hasMore: false } }; }
      
      if (!response.ok) {
        console.warn('Failed to load user posts:', data);
        if (append) {
          dispatch(appendPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
        } else {
          dispatch(setPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
        }
        return;
      }
      
      // Introduce a small delay to ensure smooth transitions for appends
      if (append) {
        // Small delay for smoother appearance
        await new Promise(resolve => setTimeout(resolve, 300));
        
        dispatch(appendPosts({ 
          posts: Array.isArray(data.posts) ? data.posts : [], 
          pagination: data.pagination 
        }));
      } else {
        dispatch(setPosts({ 
          posts: Array.isArray(data.posts) ? data.posts : [], 
          pagination: data.pagination 
        }));
      }
    } catch (e) {
      console.warn('Error fetching user posts:', e);
      if (append) {
        dispatch(appendPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
      } else {
        dispatch(setPosts({ posts: [], pagination: { ...pagination, hasMore: false } }));
      }
    } finally {
      dispatch(setPostsLoading(false));
      setInitialLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    setInitialLoading(true);
    dispatch(setPostsLoading(true));
    
    // Reset pagination when switching between profile and feed
    dispatch(setPagination({
      page: 1,
      hasMore: true
    }));
    
    if (isProfile) {
      getUserPosts(1, false);
    } else {
      getPosts(1, false);
    }
  }, [userId, isProfile]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Enhanced infinite scrolling with Intersection Observer and adaptive preloading
  useEffect(() => {
    // Initialize rootMargin with a default value
    // We'll adjust this dynamically based on scroll behavior
    let rootMargin = "800px";
    
    const options = {
      root: null,
      rootMargin,
      threshold: 0.1
    };
    
    // Define the handler function outside of the IntersectionObserver constructor
    const handleObserver = (entries) => {
      const target = entries[0];
      if (target.isIntersecting && pagination.hasMore && !loading && !initialLoading) {
        const nextPage = pagination.page + 1;
        
        // Adaptive loading: Consider scroll speed, direction, and position
        const scrolledPercentage = (window.innerHeight + window.scrollY) / document.body.scrollHeight;
        const shouldPrefetch = isScrollingFast.current || 
          (scrollDirection.current === "down" && scrolledPercentage > 0.6);
        
        if (isProfile) {
          getUserPosts(nextPage, true);
        } else {
          getPosts(nextPage, true);
        }
      }
    };
    
    // Function to update the observer with new settings
    const updateIntersectionObserver = (margin) => {
      if (observerInstance.current) {
        observerInstance.current.disconnect();
      }
      
      observerInstance.current = new IntersectionObserver(handleObserver, {
        root: null,
        rootMargin: margin,
        threshold: 0.1
      });
      
      if (loaderRef.current) {
        observerInstance.current.observe(loaderRef.current);
      }
    };
    
    // Track scroll metrics for adaptive loading
    const trackScrollMetrics = () => {
      const currentPosition = window.scrollY;
      const timestamp = Date.now();
      
      // Determine scroll direction
      if (currentPosition > lastPosition.current) {
        scrollDirection.current = "down";
      } else if (currentPosition < lastPosition.current) {
        scrollDirection.current = "up";
      }
      
      // Save current position for next comparison
      lastPosition.current = currentPosition;
      
      // Save position with timestamp for speed calculation
      scrollPositions.current.push({ position: currentPosition, time: timestamp });
      
      // Keep only the last 5 positions
      if (scrollPositions.current.length > 5) {
        scrollPositions.current.shift();
      }
      
      // Calculate scroll speed if we have enough data points
      if (scrollPositions.current.length >= 2) {
        const oldestMeasurement = scrollPositions.current[0];
        const newestMeasurement = scrollPositions.current[scrollPositions.current.length - 1];
        
        const pixelsMoved = newestMeasurement.position - oldestMeasurement.position;
        const timeTaken = newestMeasurement.time - oldestMeasurement.time;
        
        // Speed in pixels per millisecond
        const speed = Math.abs(pixelsMoved / timeTaken);
        
        // Dynamic speed thresholds based on device performance
        const performanceNow = window.performance.now;
        const fastScrollThreshold = performanceNow ? 0.4 : 0.3; // Lower threshold on slower devices
        
        // If scrolling faster than a threshold, prefetch more aggressively
        isScrollingFast.current = speed > fastScrollThreshold;
        
        // Dynamically adjust rootMargin based on scroll speed and direction
        if (observerInstance.current && loaderRef.current) {
          let newMargin;
          
          if (isScrollingFast.current && scrollDirection.current === "down") {
            // Much more aggressive prefetching when scrolling down quickly
            newMargin = `${Math.min(1500, 800 + speed * 1000)}px`;
          } else if (scrollDirection.current === "down") {
            // Normal prefetching when scrolling down at normal speed
            newMargin = "800px";
          } else {
            // Reduced prefetching when scrolling up
            newMargin = "400px";
          }
          
          // Only update observer if margin changed significantly
          if (Math.abs(parseInt(newMargin) - parseInt(rootMargin)) > 200) {
            rootMargin = newMargin;
            updateIntersectionObserver(rootMargin);
          }
        }
      }
      
      // Clear the old timer and set a new one to detect when scrolling stops
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      
      scrollTimer.current = setTimeout(() => {
        isScrollingFast.current = false;
      }, 100);
      
      // Detect when user pauses scrolling and check if we should preload
      if (scrollPauseTimer.current) {
        clearTimeout(scrollPauseTimer.current);
      }
      
      scrollPauseTimer.current = setTimeout(() => {
        // If user has paused scrolling and we're close to the bottom, load more
        const scrolledPercentage = (window.innerHeight + window.scrollY) / document.body.scrollHeight;
        if (scrolledPercentage > 0.7 && pagination.hasMore && !loading && !initialLoading) {
          const nextPage = pagination.page + 1;
          if (isProfile) {
            getUserPosts(nextPage, true);
          } else {
            getPosts(nextPage, true);
          }
        }
      }, 400);
    };
    
    window.addEventListener('scroll', trackScrollMetrics);
    
    // Initialize observer using our function
    updateIntersectionObserver(rootMargin);
    
    return () => {
      if (observerInstance.current) {
        observerInstance.current.disconnect();
      }
      window.removeEventListener('scroll', trackScrollMetrics);
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
      if (scrollPauseTimer.current) {
        clearTimeout(scrollPauseTimer.current);
      }
    };
  }, [pagination.hasMore, pagination.page, loading, initialLoading, isProfile]);
  
  // Scroll position restoration & memory
  useEffect(() => {
    // Save scroll position when unmounting
    const handleScroll = () => {
      sessionStorage.setItem(scrollPositionKey, window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Restore scroll position after initial load
    if (!initialLoading && posts.length > 0 && previousScrollPosition.current > 0) {
      // Short delay to ensure posts are rendered
      setTimeout(() => {
        window.scrollTo({
          top: previousScrollPosition.current,
          behavior: 'auto'
        });
        previousScrollPosition.current = 0; // Reset after use
      }, 100);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Save position when unmounting
      sessionStorage.setItem(scrollPositionKey, window.scrollY.toString());
    };
  }, [initialLoading, posts.length, scrollPositionKey]);
  
  // Handle pull-to-refresh for mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
    
    // Calculate pull distance
    const pullDistance = touchEndY.current - touchStartY.current;
    
    // Only show refresh indicator if pulled down from top of page
    if (pullDistance > MIN_PULL_DISTANCE && window.scrollY === 0) {
      setRefreshing(true);
    }
  };

  const handleTouchEnd = () => {
    const pullDistance = touchEndY.current - touchStartY.current;
    
    // Trigger refresh if pulled down enough from top of page
    if (pullDistance > MIN_PULL_DISTANCE && window.scrollY === 0) {
      // Reset page to 1 and reload
      dispatch(setPagination({
        page: 1,
        hasMore: true
      }));
      
      if (isProfile) {
        getUserPosts(1, false);
      } else {
        getPosts(1, false);
      }
    }
    
    // Reset refreshing state
    setRefreshing(false);
  };
  
  // Scroll to target post if specified in URL
  useEffect(() => {
    if (targetPostId && posts.length > 0) {
      const post = posts.find(p => p._id === targetPostId);
      if (post) {
        // Use a small delay to ensure the post is rendered
        setTimeout(() => {
          const element = targetPostRef.current[targetPostId];
          if (element && element.scrollIntoView) {
            // Scroll the element into view
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add highlight effect using direct DOM manipulation
            const postElement = document.getElementById(`post-${targetPostId}`);
            if (postElement) {
              postElement.classList.add('highlight');
              setTimeout(() => {
                postElement.classList.remove('highlight');
              }, 2000);
            }
          }
        }, 500);
      }
    }
  }, [posts, targetPostId]);

  // Feature 26 Phase 1: batch impressions when posts enter viewport (>=50% visible for ~300ms)
  const observerRef = useRef(null);
  const pendingRef = useRef({});
  const timeoutRef = useRef(null);
  const sessionSeenPostIds = useSelector(state => state.sessionSeenPostIds);
  const seenRef = useRef(sessionSeenPostIds);
  useEffect(() => { seenRef.current = sessionSeenPostIds; }, [sessionSeenPostIds]);

  useEffect(() => {
    if (!token) return;
    if (typeof IntersectionObserver === 'undefined') return; // environment guard
    // Cleanup any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    const visibilityMap = new Map();
    const handleFlush = async () => {
      const ids = Object.keys(pendingRef.current);
      if (!ids.length) return;
      const payload = ids;
      pendingRef.current = {};
      try {
        // optimistic local increment (only once per session)
        payload.forEach(id => {
          dispatch(markPostSeenThisSession({ postId: id }));
          dispatch(incrementPostImpression({ postId: id, amount: 1 }));
        });
        const resp = await fetch(`${API_URL}/analytics/post-impressions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ postIds: payload })
        });
        await resp.json().catch(()=>({}));
        // We rely on server counts later (Phase 2) for reconciliation if needed.
      } catch {
        // swallow: non-critical
      }
    };
    const scheduleFlush = () => {
      if (timeoutRef.current) return; // already scheduled
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        handleFlush();
      }, 800); // debounce window
    };
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        const id = el.getAttribute('data-post-id');
        if (!id) return;
        const atLeastHalf = entry.intersectionRatio >= 0.5;
        if (atLeastHalf) {
          // Start a dwell timer (300ms) before recording impression
          if (!visibilityMap.has(id)) {
            const t = setTimeout(() => {
              // Only queue if still visible
              const stillVisible = visibilityMap.get(id)?.visible;
              if (stillVisible) {
                // Ensure not already seen this session
                const seen = seenRef.current?.[id];
                if (!seen && !pendingRef.current[id]) {
                  pendingRef.current[id] = true;
                  scheduleFlush();
                }
              }
            }, 300);
            visibilityMap.set(id, { visible: true, timer: t });
          } else {
            const rec = visibilityMap.get(id);
            rec.visible = true;
            visibilityMap.set(id, rec);
          }
        } else {
          // No longer sufficiently visible; cancel timer if pending
            const rec = visibilityMap.get(id);
            if (rec) {
              rec.visible = false;
              if (rec.timer) clearTimeout(rec.timer);
              visibilityMap.set(id, rec);
            }
        }
      });
    };
    
    observerRef.current = new IntersectionObserver(handleIntersection, 
      { threshold: [0, 0.5, 1] });

    // Observe existing post elements
    posts.forEach(p => {
      const el = document.querySelector(`#post-${p._id}`);
      if (el) {
        el.setAttribute('data-post-id', p._id);
        observerRef.current.observe(el);
      }
    });
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      for (const rec of visibilityMap.values()) {
        if (rec?.timer) clearTimeout(rec.timer);
      }
    };
  }, [posts, token, dispatch]);

  return (
    <Box 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <LoadingSpinner 
            size={30} 
            message="Refreshing..." 
            style="dots" 
          />
        </Box>
      )}
      
      {initialLoading && posts.length === 0 && (
        <Box>
          {/* Centered loading spinner during initial load */}
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <LoadingSpinner 
              size={50} 
              message="Loading posts..." 
              style="ripple" 
            />
          </Box>
          
          {/* Skeleton placeholders for visual stability */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ 
              mb: 3,
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: '0.75rem',
              boxShadow: 3,
              animation: `pulse 1.5s infinite ease-in-out ${i * 0.2}s`,
              '@keyframes pulse': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 0.8 },
                '100%': { opacity: 0.6 },
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={50} height={50} sx={{ mr: 2 }} />
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 0.5 }} />
                  <Skeleton variant="text" width="25%" height={16} />
                </Box>
              </Box>
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="95%" />
              <Skeleton variant="rectangular" height={250} sx={{ mt: 1.5, borderRadius: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="rounded" width={80} height={30} />
                <Skeleton variant="rounded" width={80} height={30} />
                <Skeleton variant="rounded" width={80} height={30} />
              </Box>
            </Box>
          ))}
        </Box>
      )}
      
      {posts.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          audioPath,
          userPicturePath,
          likes,
          comments,
          createdAt,
          impressions,
          mediaPaths
        }, index) => (
          <AnimatedPostEntry key={_id} index={index}>
            <PostWidget
              postId={_id}
              postUserId={userId}
              name={`${firstName} ${lastName}`}
              description={description}
              location={location}
              picturePath={picturePath}
              audioPath={audioPath}
              mediaPaths={mediaPaths}
              userPicturePath={userPicturePath}
              likes={likes}
              comments={comments}
              createdAt={createdAt}
              impressions={impressions}
              ref={targetPostId === _id ? (el) => { 
                if (el) targetPostRef.current[_id] = el; 
              } : undefined}
            />
          </AnimatedPostEntry>
        )
      )}
      
      {/* Enhanced loading indicator for more posts */}
      {loading && !initialLoading && (
        <Box sx={{ 
          my: 2, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center'
        }}>
          {/* Custom animated loading spinner with default style */}
          <LoadingSpinner 
            size={40} 
            message="Loading more posts..." 
            style="default" 
          />
        </Box>
      )}
      
      {/* Invisible element for intersection observer */}
      {pagination.hasMore && (
        <Box ref={loaderRef} height="20px" width="100%" />
      )}
      
      {/* End of feed message */}
      {!pagination.hasMore && posts.length > 0 && !loading && (
        <Box sx={{ 
          textAlign: 'center', 
          my: 3,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          borderRadius: 2
        }}>
          <Box sx={{ 
            width: 40, 
            height: 3, 
            bgcolor: 'divider',
            borderRadius: 2,
            mb: 1
          }} />
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            You've reached the end of the feed
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ opacity: 0.7 }}
          >
            Check back later for more posts
          </Typography>
        </Box>
      )}
      
      {/* No posts message */}
      {!loading && posts.length === 0 && !initialLoading && (
        <Box sx={{ 
          textAlign: 'center', 
          my: 4,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'background.paper',
          borderRadius: '0.75rem',
          boxShadow: 2
        }}>
          <Box sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* You could add an icon here for empty state */}
            <Typography variant="h5" color="text.secondary">🤔</Typography>
          </Box>
          <Typography variant="h6">
            No posts to display
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isProfile ? "This user hasn't posted anything yet." : "Your feed is empty. Follow more people to see their posts."}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PostsWidget;
