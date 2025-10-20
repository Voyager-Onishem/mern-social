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
import { Box, Skeleton, CircularProgress, Typography } from '@mui/material';
import { useSearchParams } from "react-router-dom";
import PostWidget from "./PostWidget";
import AnimatedPostEntry from "components/AnimatedPostEntry";

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

  const getPosts = async (page = 1, append = false) => {
    if (loading) return;
    dispatch(setPostsLoading(true));
    
    try {
      const response = await fetch(`${API_URL}/posts?page=${page}&limit=${pagination.limit}`, {
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
      
      if (append) {
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
    dispatch(setPostsLoading(true));
    
    try {
      const response = await fetch(
        `${API_URL}/posts/${userId}/posts?page=${page}&limit=${pagination.limit}`,
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
      
      if (append) {
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
  
  // Handle infinite scrolling with Intersection Observer
  useEffect(() => {
    const options = {
      root: null,
      // Increase rootMargin to load more aggressively before user reaches the end
      // This makes the experience more seamless as new posts are loaded before user reaches the bottom
      rootMargin: "500px", // Load when within 500px of the bottom
      threshold: 0.1
    };
    
    const handleObserver = (entries) => {
      const target = entries[0];
      if (target.isIntersecting && pagination.hasMore && !loading && !initialLoading) {
        // Calculate how many pages to potentially preload based on scroll speed
        const nextPage = pagination.page + 1;
        if (isProfile) {
          getUserPosts(nextPage, true);
        } else {
          getPosts(nextPage, true);
        }
      }
    };
    
    const observer = new IntersectionObserver(handleObserver, options);
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
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
    observerRef.current = new IntersectionObserver((entries) => {
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
    }, { threshold: [0, 0.5, 1] });

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
          <CircularProgress size={24} />
        </Box>
      )}
      
      {initialLoading && posts.length === 0 && (
        <Box>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Skeleton variant="rectangular" height={24} width={160} sx={{ mb: 1, borderRadius: 1 }} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="rectangular" height={250} sx={{ mt: 1, borderRadius: 2 }} />
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
        <Box sx={{ my: 2 }}>
          {/* Use skeleton placeholders that look like posts being loaded */}
          {Array.from({ length: 1 }).map((_, i) => (
            <Box key={i} sx={{ 
              mb: 3, 
              p: 2, 
              bgcolor: 'background.paper',
              borderRadius: '0.75rem',
              boxShadow: 3,
              animation: 'pulse 1.5s infinite ease-in-out',
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
              <Skeleton variant="rectangular" height={200} sx={{ mt: 1.5, borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      )}
      
      {/* Invisible element for intersection observer */}
      {pagination.hasMore && (
        <Box ref={loaderRef} height="20px" width="100%" />
      )}
      
      {/* End of feed message */}
      {!pagination.hasMore && posts.length > 0 && !loading && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You've reached the end of the feed
          </Typography>
        </Box>
      )}
      
      {/* No posts message */}
      {!loading && posts.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="body1">
            No posts to display
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PostsWidget;
