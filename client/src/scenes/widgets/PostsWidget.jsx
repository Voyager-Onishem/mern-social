import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts, setPostsLoading, incrementPostImpression, markPostSeenThisSession } from "state";
import { Box, Skeleton } from '@mui/material';
import { useSearchParams } from "react-router-dom";
import PostWidget from "./PostWidget";

const API_URL = process.env.REACT_APP_API_URL;

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const loading = useSelector((state) => state.postsLoading);
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get("post");
  const targetPostRef = useRef({});

  const getPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = []; }
      if (!response.ok) {
        console.warn('Failed to load feed posts:', data);
        dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
        return;
      }
      dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.warn('Error fetching feed posts:', e);
      dispatch(setPosts({ posts: [] }));
    }
  };

  const getUserPosts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/posts/${userId}/posts`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = []; }
      if (!response.ok) {
        console.warn('Failed to load user posts:', data);
        dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
        return;
      }
      dispatch(setPosts({ posts: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.warn('Error fetching user posts:', e);
      dispatch(setPosts({ posts: [] }));
    }
  };

  useEffect(() => {
    dispatch(setPostsLoading(true));
    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
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
    <>
      {loading && posts.length === 0 && (
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
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            audioPath={audioPath}
            userPicturePath={userPicturePath}
            likes={likes}
            comments={comments}
            createdAt={createdAt}
            impressions={impressions}
            ref={targetPostId === _id ? (el) => { 
              if (el) targetPostRef.current[_id] = el; 
            } : undefined}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
