import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  GifBoxOutlined,
  Close,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, Snackbar, Tooltip, Alert, Skeleton } from "@mui/material";
import Comment from "components/Comment";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import ProgressiveImage from "components/ProgressiveImage";
import AnimatedLikeButton from "components/AnimatedLikeButton";
import VideoPlayer from "components/VideoPlayer";
import React, { useState, useRef, forwardRef, useEffect } from "react";
import { extractFirstGiphyUrl, isGiphyUrl, extractGiphyUrls } from "utils/isGiphyUrl";
import { extractFirstVideo, getEmbedForVideo } from "utils/video";
import { timeAgo } from "utils/timeAgo";
import { objectIdToDate } from "utils/objectId";
import GiphyPicker from "components/GiphyPicker";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";
import PostActionButton from "components/PostActionButton";
import Lightbox from "components/Lightbox";
import { sharePost, statusToMessage } from "utils/share";
import { isVideoFile, getMediaUrl } from "utils/mediaHelpers";

const API_URL = process.env.REACT_APP_API_URL;

const PostWidget = forwardRef(({
  postId,
  postUserId,
  name,
  description,
  location,
  locationData, // Add locationData prop
  picturePath,
  audioPath,
  mediaPaths = [],
  userPicturePath,
  likes,
  comments,
  createdAt,
  impressions, // Feature 26 Phase 1 (may be undefined for legacy posts)
}, ref) => {
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentGifUrls, setCommentGifUrls] = useState([]); // store selected / pasted GIFs separately so URLs are hidden
  const [currentComments, setCurrentComments] = useState(comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  // Lazy loading state
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const mediaRef = useRef(null);
  const [errorSnack, setErrorSnack] = useState({ open: false, message: "" });
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.token);
  const loggedInUserId = useSelector((state) => state.auth?.user?._id);
  // Normalize likes in case backend sent a Map or null
  const normalizedLikes = (() => {
    if (!likes) return {};
    if (likes instanceof Map) return Object.fromEntries(likes);
    if (typeof likes === 'object') return likes;
    return {};
  })();
  const isLiked = Boolean(normalizedLikes[loggedInUserId]);
  const likeCount = Object.keys(normalizedLikes).length;
  const MAX_COMMENT_CHARS = 300;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;
  const inputBg = palette.mode === 'dark' ? palette.background.alt : '#fff';
  const inputBorder = palette.mode === 'dark' ? palette.neutral.light : palette.neutral.medium;
  const inputFocus = palette.primary.main;

  // Setup intersection observer for lazy loading media
  useEffect(() => {
    // Skip if no media to load
    if ((!Array.isArray(mediaPaths) || mediaPaths.length === 0) && !picturePath) {
      return;
    }
    
    const options = {
      root: null,
      rootMargin: '100px', // Load before scrolling into view (100px threshold)
      threshold: 0.1 // Trigger when 10% of element is visible
    };
    
    let observerInstance = null;
    
    // Function to set up the observer
    const setupObserver = () => {
      // Clean up any existing observer first
      if (observerInstance) {
        observerInstance.disconnect();
      }
      
      observerInstance = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setMediaLoaded(true);
            observerInstance.unobserve(entry.target);
          }
        });
      }, options);
      
      if (mediaRef.current) {
        observerInstance.observe(mediaRef.current);
      }
    };
    
    // Set up the observer
    setupObserver();
    
    // For newly created posts at the top of the feed, also load media immediately if they're already visible
    const checkIfAlreadyVisible = () => {
      if (mediaRef.current) {
        const rect = mediaRef.current.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          // Element is fully visible in the viewport
          setMediaLoaded(true);
        }
      }
    };
    
    // Check visibility after a short delay to ensure the DOM has updated
    const timeoutId = setTimeout(checkIfAlreadyVisible, 50);
    
    return () => {
      if (observerInstance && mediaRef.current) {
        observerInstance.unobserve(mediaRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [picturePath, mediaPaths, postId]); // Added postId to ensure proper re-evaluation

  // Fetch latest comments for this post
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorSnack({ open: true, message: data?.message || data?.error || 'Failed to load comments' });
        setCurrentComments([]);
      } else {
        setCurrentComments(data.comments || []);
      }
    } catch (err) {
      setCurrentComments([]);
      setErrorSnack({ open: true, message: 'Network error loading comments' });
    }
    setLoadingComments(false);
  };

  // Toggle comments section and fetch latest comments
  function handleToggleComments() {
    if (!isComments) {
      fetchComments();
    }
    setIsComments((prev) => !prev);
  }

  // Submit a new comment
  async function handleAddComment() {
    const trimmed = commentText.trim();
    if (!trimmed && commentGifUrls.length === 0) return; // allow GIF-only comment
    const toSend = [trimmed, commentGifUrls.join(' ')].filter(Boolean).join(' ');
    const optimistic = {
      _id: `temp-${Date.now()}`,
      userId: loggedInUserId,
      username: '',
      text: toSend,
      createdAt: new Date(),
      __optimistic: true,
    };
    setCurrentComments(prev => [...prev, optimistic]);
    setCommentText('');
    setCommentGifUrls([]);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUserId, text: toSend }),
      });
      const updatedPost = await response.json().catch(() => ({}));
      if (!response.ok || !updatedPost?._id) {
        setErrorSnack({ open: true, message: updatedPost?.message || 'Failed to add comment' });
        // rollback
        setCurrentComments(prev => prev.filter(c => c !== optimistic));
        // restore original input state as best effort (text part only; GIFs lost unless we re-extract)
        const lostGifs = extractGiphyUrls(toSend);
        const textOnly = toSend.split(/\s+/).filter(t => !lostGifs.includes(t)).join(' ');
        setCommentText(textOnly);
        setCommentGifUrls(lostGifs);
        return;
      }
      dispatch(setPost({ post: updatedPost }));
      setCurrentComments(updatedPost.comments || []);
    } catch (err) {
      setErrorSnack({ open: true, message: 'Network error adding comment' });
      setCurrentComments(prev => prev.filter(c => c !== optimistic));
      const lostGifs = extractGiphyUrls(toSend);
      const textOnly = toSend.split(/\s+/).filter(t => !lostGifs.includes(t)).join(' ');
      setCommentText(textOnly);
      setCommentGifUrls(lostGifs);
    }
  }

  // Start editing a comment
  function handleStartEdit(commentId, text) {
    setEditingCommentId(commentId);
    setEditingText(text || "");
  }

  function handleCancelEdit() {
    setEditingCommentId(null);
    setEditingText("");
  }

  async function handleSaveEdit(commentId, newText) {
    if (!newText.trim()) return;
    setIsSavingEdit(true);
    const original = currentComments.find(c => String(c._id) === String(commentId));
    const originalText = original?.text;
    setCurrentComments(prev => prev.map(c => String(c._id) === String(commentId) ? { ...c, text: newText, editedAt: new Date(), __optimistic: true } : c));
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment/edit`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId, userId: loggedInUserId, text: newText }) });
      const updatedPost = await response.json().catch(() => ({}));
      if (!response.ok || !updatedPost?._id) {
        setErrorSnack({ open: true, message: updatedPost?.message || 'Failed to save edit' });
        // rollback
        setCurrentComments(prev => prev.map(c => String(c._id) === String(commentId) ? { ...c, text: originalText, editedAt: original?.editedAt } : c));
      } else {
        dispatch(setPost({ post: updatedPost }));
        setCurrentComments(updatedPost.comments || []);
        handleCancelEdit();
      }
    } catch (e) {
      setErrorSnack({ open: true, message: 'Network error saving edit' });
      setCurrentComments(prev => prev.map(c => String(c._id) === String(commentId) ? { ...c, text: originalText, editedAt: original?.editedAt } : c));
    }
    setIsSavingEdit(false);
  }

  async function handleDeleteComment(commentId) {
    if (!commentId) return;
    setIsDeletingId(commentId);
    const existing = currentComments.find(c => String(c._id) === String(commentId));
    setCurrentComments(prev => prev.filter(c => String(c._id) !== String(commentId)));
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment/delete`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId, userId: loggedInUserId }) });
      const updatedPost = await response.json().catch(() => ({}));
      if (!response.ok || !updatedPost?._id) {
        setErrorSnack({ open: true, message: updatedPost?.message || 'Failed to delete comment' });
        // rollback
        setCurrentComments(prev => [...prev, existing].sort((a,b)=> String(a._id).localeCompare(String(b._id))));
      } else {
        dispatch(setPost({ post: updatedPost }));
        setCurrentComments(updatedPost.comments || []);
      }
    } catch (e) {
      setErrorSnack({ open: true, message: 'Network error deleting comment' });
      setCurrentComments(prev => [...prev, existing].sort((a,b)=> String(a._id).localeCompare(String(b._id))));
    }
    setIsDeletingId(null);
  }

  // Insert GIF URL into comment
  function handleGifSelect(gifUrl) {
    setCommentGifUrls(prev => (prev.includes(gifUrl) ? prev : [...prev, gifUrl]));
    setGiphyOpen(false);
  }

  function handleRemoveGif(gifUrl) {
    setCommentGifUrls(prev => prev.filter(u => u !== gifUrl));
  }

  // Like handler with optimistic updates
  const patchLike = async () => {
    // Create optimistic update for instant feedback
    const optimisticLikes = { ...normalizedLikes };
    
    if (isLiked) {
      // Optimistically remove the like
      delete optimisticLikes[loggedInUserId];
    } else {
      // Optimistically add the like
      optimisticLikes[loggedInUserId] = true;
    }
    
    // Extract firstName and lastName from name prop
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create an optimistically updated post object
    const optimisticPost = {
      _id: postId,
      userId: postUserId,
      firstName,
      lastName,
      description,
      location,
      picturePath,
      audioPath,
      mediaPaths,
      userPicturePath,
      likes: optimisticLikes,
      comments: currentComments,
      createdAt,
      impressions,
    };
    
    // Immediately update UI (optimistically)
    dispatch(setPost({ post: optimisticPost }));
    
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });
      const updatedPost = await response.json().catch(() => ({}));
      
      if (!response.ok || !updatedPost?._id) {
        // Revert to original state if request fails
        setErrorSnack({ open: true, message: updatedPost?.message || 'Failed to like post' });
        dispatch(setPost({ post: {
          _id: postId,
          likes: normalizedLikes,
        } }));
        return;
      }
      
      // Update with actual server response
      dispatch(setPost({ post: updatedPost }));
    } catch (e) {
      // Revert to original state on error
      setErrorSnack({ open: true, message: 'Network error liking post' });
      dispatch(setPost({ post: {
        _id: postId,
        likes: normalizedLikes,
      } }));
    }
  };

  const handleShare = async () => {
    const status = await sharePost({ postId, description, authorName: name });
    setShareMessage(statusToMessage(status));
    setShareOpen(true);
  };

  // Build lightbox items array (images/videos only)
  const lightboxItems = (() => {
    const paths = Array.isArray(mediaPaths) && mediaPaths.length > 0 ? mediaPaths : (picturePath ? [picturePath] : []);
    return paths.map(p => {
      const lower = String(p).toLowerCase();
      const isVideo = /\.(mp4|webm|ogg)$/i.test(lower);
      return { 
        src: getMediaUrl(p, { useVideoEndpoint: isVideo }), 
        type: isVideo ? 'video' : 'image' 
      };
    });
  })();

  return (
    <WidgetWrapper 
      id={`post-${postId}`} 
      m="2rem 0"
      ref={ref}
    >
      <Friend
        friendId={postUserId}
        name={name}
        location={location}
        locationCoords={locationData}
        subtitle={timeAgo(createdAt || objectIdToDate(postId))}
        userPicturePath={userPicturePath}
      />
      {(() => {
        const rawDesc = typeof description === 'string' ? description : '';
        const videoMeta = extractFirstVideo(rawDesc);
        const embed = getEmbedForVideo(videoMeta);
        const gifUrl = !videoMeta ? extractFirstGiphyUrl(rawDesc) : null;
        const toRemove = embed ? videoMeta?.url : gifUrl;
        const textWithoutMedia = toRemove ? rawDesc.replace(toRemove, '').trim() : rawDesc;
        return (
          <>
            {textWithoutMedia && (
              <Typography color={main} sx={{ mt: "1rem" }}>
                {textWithoutMedia}
              </Typography>
            )}
            {embed && (
              <Box mt={textWithoutMedia ? 1 : 0.5} sx={{ position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '16/9' }}>
                {embed.tag === 'iframe' ? (
                  <Box
                    component="iframe"
                    src={embed.src}
                    allow={embed.allow}
                    sandbox={embed.sandbox}
                    allowFullScreen={embed.allowFullScreen}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    title="Embedded video"
                    sx={{ width: '100%', height: '100%', border: 0, borderRadius: 1 }}
                  />
                ) : (
                  <VideoPlayer 
                    src={embed.src} 
                    width="100%" 
                    height="100%" 
                    sx={{ borderRadius: 1 }} 
                    controls
                  />
                )}
              </Box>
            )}
            {!embed && gifUrl && (
              <Box mt={textWithoutMedia ? 1 : 0.5}>
                <img
                  src={gifUrl}
                  alt="GIF"
                  style={{ maxWidth: 200, borderRadius: 8 }}
                />
              </Box>
            )}
          </>
        );
      })()}
      {/* Render mediaPaths if any; else fall back to legacy picturePath */}
      {(Array.isArray(mediaPaths) && mediaPaths.length > 0) || picturePath ? (
        <Box ref={mediaRef} sx={{ position: 'relative', mt: 1 }}>
          {!mediaLoaded ? (
            // Show skeleton while media is not in viewport
            <Skeleton 
              variant="rectangular" 
              height={280} 
              animation="wave" 
              sx={{ borderRadius: "0.75rem" }}
            />
          ) : (
            // Once in viewport, load the actual media with progressive loading
            Array.isArray(mediaPaths) && mediaPaths.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1}>
                {/* Deduplicate media paths to prevent showing the same file twice */}
                {[...new Set(mediaPaths)].map((mp, idx) => {
                  if (!mp) return null;
                  const lower = String(mp).toLowerCase();
                  const isVideo = /\.(mp4|webm|ogg)$/i.test(lower);
                  const src = getMediaUrl(mp, { useVideoEndpoint: isVideo });
                  return isVideo ? (
                    <Box key={idx} onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }} sx={{ cursor: 'pointer' }}>
                      <VideoPlayer 
                        src={src} 
                        width="100%" 
                        sx={{ borderRadius: '0.75rem' }} 
                        controls
                      />
                    </Box>
                  ) : (
                    <Box key={idx}>
                      <ProgressiveImage 
                        src={src}
                        alt={`media-${idx}`}
                        style={{ borderRadius: "0.75rem" }}
                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : picturePath ? (
              (() => {
                const lower = String(picturePath).toLowerCase();
                const isVideo = /\.(mp4|webm|ogg)$/i.test(lower);
                const src = getMediaUrl(picturePath, { useVideoEndpoint: isVideo });
                return isVideo ? (
                  <Box mt={1} sx={{ cursor: 'pointer' }} onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}>
                    <VideoPlayer 
                      src={src} 
                      width="100%" 
                      sx={{ borderRadius: '0.75rem' }} 
                      controls
                    />
                  </Box>
                ) : (
                  <ProgressiveImage 
                    src={src}
                    alt="post"
                    style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                  />
                );
              })()
            ) : null
          )}
        </Box>
      ) : null}
      {/* Only show audio when no other media is present */}
      {(!picturePath || (Array.isArray(mediaPaths) && mediaPaths.length === 0)) && audioPath && (
        <Box mt={1}>
          <Box component="audio" src={getMediaUrl(audioPath)} controls sx={{ width: '100%' }} />
        </Box>
      )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <AnimatedLikeButton 
              isLiked={isLiked}
              onClick={patchLike}
              color={primary}
            />
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={handleToggleComments} aria-label={isComments ? 'Hide comments' : 'Show comments'}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{currentComments.length}</Typography>
          </FlexBetween>
        </FlexBetween>

        <Tooltip title="Share" arrow>
          <IconButton aria-label="Share post" onClick={handleShare}>
            <ShareOutlined />
          </IconButton>
        </Tooltip>
      </FlexBetween>
      {typeof impressions === 'number' && impressions >= 0 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: main }} aria-label={`Post impressions ${impressions}`}>
          Impressions: {impressions}
        </Typography>
      )}
      {isComments && (
        <Box mt="0.5rem">
          {loadingComments ? (
            <Box sx={{ display: 'flex', flexDirection: 'column-reverse', mb: 1 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: '0.5rem 0' }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width={120} height={16} />
                    <Skeleton variant="text" width="90%" height={18} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column-reverse",
                  mb: 1,
                }}
              >
                {(() => {
                  // Helper to validate a timestamp-like value
                  const isValidTs = (val) => {
                    if (!val) return false;
                    if (val instanceof Date) return !isNaN(val.getTime());
                    if (typeof val === 'number') {
                      const ms = Math.abs(val) < 1e12 ? val * 1000 : val;
                      return !isNaN(new Date(ms).getTime());
                    }
                    if (typeof val === 'string') {
                      const s = val.trim();
                      if (/^[a-fA-F0-9]{24}$/.test(s)) {
                        const d = objectIdToDate(s);
                        return !!(d && !isNaN(d.getTime()));
                      }
                      if (/^\d+$/.test(s)) {
                        const num = Number(s);
                        const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
                        return !isNaN(new Date(ms).getTime());
                      }
                      return !isNaN(new Date(s).getTime());
                    }
                    return false;
                  };

                  const postFallbackTs = isValidTs(createdAt) ? createdAt : objectIdToDate(postId);
                  const getCommentTs = (c) => (isValidTs(c?.createdAt) ? c.createdAt : postFallbackTs);

                  return [...currentComments].reverse().map((comment, i) => {
                    const isOwner = typeof comment === 'object' && comment?.userId === loggedInUserId;
                    const isEditingThis = editingCommentId === String(comment?._id);
                    return (
                  <Box key={comment?._id || i} opacity={isDeletingId === comment?._id ? 0.5 : 1}>
                    <Divider />
                    {/* If comment is an object, pass props; else fallback to string */}
                    {typeof comment === 'object' && comment !== null ? (
                      <Comment 
                        commentId={comment._id}
                        username={comment.username || "Unknown"}
                        text={comment.text || comment.comment || ""}
                        userPicturePath={comment.userPicturePath}
                        createdAt={getCommentTs(comment)}
                        editedAt={comment.editedAt}
                        canEdit={isOwner}
                        isEditing={isEditingThis}
                        editText={isEditingThis ? editingText : ''}
                        onStartEdit={handleStartEdit}
                        onEditTextChange={setEditingText}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onDelete={handleDeleteComment}
                      />
                    ) : (
                      <Comment username="" text={comment} createdAt={postFallbackTs} />
                    )}
                  </Box>
                    );
                  });
                })()}
                <Divider />
              </Box>
              <Box display="flex" alignItems="flex-start" gap={1} mt={1}>
                <Box sx={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => {
                      let val = e.target.value;
                      const pastedGifs = extractGiphyUrls(val);
                      if (pastedGifs.length) {
                        // remove all occurrences from the visible input
                        pastedGifs.forEach(u => { val = val.split(u).join(' '); });
                        val = val.replace(/\s+/g, ' ').trimStart();
                        setCommentGifUrls(prev => {
                          const merged = [...prev];
                          pastedGifs.forEach(u => { if (!merged.includes(u)) merged.push(u); });
                          return merged;
                        });
                      }
                      setCommentText(val);
                    }}
                    placeholder="Write a comment..."
                    aria-label="Comment text"
                    maxLength={MAX_COMMENT_CHARS + 200}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      paddingRight: '4.5rem',
                      borderRadius: '1rem',
                      border: `1px solid ${inputBorder}`,
                      background: inputBg,
                      color: main,
                      outline: 'none',
                      transition: 'border-color 120ms ease, box-shadow 120ms ease',
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                    onFocus={e => { e.target.style.borderColor = inputFocus; e.target.style.boxShadow = `0 0 0 2px ${inputFocus}33`; }}
                    onBlur={e => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = 'none'; }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ position: 'absolute', bottom: 4, right: 10, fontWeight: 500, color: commentText.length > MAX_COMMENT_CHARS ? 'error.main' : (commentText.length > MAX_COMMENT_CHARS * 0.85 ? 'warning.main' : main), userSelect: 'none' }}
                    aria-live="polite"
                  >
                    {commentText.length}/{MAX_COMMENT_CHARS}
                  </Typography>
                  {commentGifUrls.length > 0 && (
                    <Box mt={1} display="flex" flexWrap="wrap" gap={1} aria-label={`Attached GIFs (${commentGifUrls.length})`}>
                      {commentGifUrls.map(u => (
                        <Box key={u} sx={{ position: 'relative' }}>
                          <img src={u} alt="GIF preview" style={{ maxWidth: 100, borderRadius: 6, display: 'block' }} />
                          <IconButton size="small" aria-label="Remove GIF" onClick={() => handleRemoveGif(u)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}>
                            <Close fontSize="inherit" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                <IconButton onClick={() => setGiphyOpen(true)} title="Add GIF" aria-label="Add a GIF to your comment">
                  <GifBoxOutlined />
                </IconButton>
                <PostActionButton
                  size="small"
                  onClick={handleAddComment}
                  disabled={(commentText.trim().length === 0 && commentGifUrls.length === 0) || commentText.length > MAX_COMMENT_CHARS}
                  label="Post"
                  sx={{ borderRadius: '1rem', padding: '0.35rem 0.9rem' }}
                />
                <GiphyPicker open={giphyOpen} onClose={() => setGiphyOpen(false)} onSelect={handleGifSelect} />
              </Box>
            </>
          )}
        </Box>
      )}
      <Snackbar open={shareOpen} autoHideDuration={2500} onClose={() => setShareOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="info" variant="filled" onClose={() => setShareOpen(false)} sx={{ width: '100%' }}>{shareMessage}</Alert>
      </Snackbar>
      <Snackbar open={errorSnack.open} autoHideDuration={3500} onClose={() => setErrorSnack({ open: false, message: '' })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setErrorSnack({ open: false, message: '' })} sx={{ width: '100%' }}>{errorSnack.message}</Alert>
      </Snackbar>
      <Lightbox
        open={lightboxOpen}
        items={lightboxItems}
        index={lightboxIndex}
        onIndexChange={(idx) => setLightboxIndex(idx)}
        onClose={() => setLightboxOpen(false)}
      />
    </WidgetWrapper>
  );
});

// Add a display name to the forwardRef component
PostWidget.displayName = 'PostWidget';

export default PostWidget;
