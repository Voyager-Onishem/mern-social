import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  GifBoxOutlined,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme, Snackbar, Tooltip } from "@mui/material";
import Comment from "components/Comment";
import FlexBetween from "components/FlexBetween";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { extractFirstGiphyUrl, isGiphyUrl } from "utils/isGiphyUrl";
import { extractFirstVideo, getEmbedForVideo } from "utils/video";
import { timeAgo } from "utils/timeAgo";
import { objectIdToDate } from "utils/objectId";
import GiphyPicker from "components/GiphyPicker";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "state";
import PostActionButton from "components/PostActionButton";
import { sharePost, statusToMessage } from "utils/share";

const API_URL = process.env.REACT_APP_API_URL;

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  audioPath,
  userPicturePath,
  likes,
  comments,
  createdAt,
}) => {
  const [isComments, setIsComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentComments, setCurrentComments] = useState(comments || []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  // Editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  // Fetch latest comments for this post
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setCurrentComments(data.comments || []);
    } catch (err) {
      setCurrentComments([]);
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
    if (!commentText.trim()) return;
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loggedInUserId,
          text: commentText,
        }),
      });
      const updatedPost = await response.json();
      dispatch(setPost({ post: updatedPost }));
      setCurrentComments(updatedPost.comments || []);
      setCommentText("");
    } catch (err) {
      // Optionally handle error
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
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment/edit`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId, userId: loggedInUserId, text: newText })
      });
      const updatedPost = await response.json();
      if (updatedPost && updatedPost._id) {
        dispatch(setPost({ post: updatedPost }));
        setCurrentComments(updatedPost.comments || []);
        handleCancelEdit();
      }
    } catch (e) {
      // silently fail for now
    }
    setIsSavingEdit(false);
  }

  async function handleDeleteComment(commentId) {
    if (!commentId) return;
    setIsDeletingId(commentId);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comment/delete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId, userId: loggedInUserId })
      });
      const updatedPost = await response.json();
      if (updatedPost && updatedPost._id) {
        dispatch(setPost({ post: updatedPost }));
        setCurrentComments(updatedPost.comments || []);
      }
    } catch (e) {
      // handle error
    }
    setIsDeletingId(null);
  }

  // Insert GIF URL into comment
  function handleGifSelect(gifUrl) {
    setCommentText((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + gifUrl + ' ');
  }

  // Like handler
  const patchLike = async () => {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  const handleShare = async () => {
    const status = await sharePost({ postId, description, authorName: name });
    setShareMessage(statusToMessage(status));
    setShareOpen(true);
  };

  return (
    <WidgetWrapper id={`post-${postId}`} m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={[location, timeAgo(createdAt || objectIdToDate(postId))].filter(Boolean).join(" · ")}
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
                  <Box component="iframe" src={embed.src} allow={embed.allow} allowFullScreen={embed.allowFullScreen} sx={{ width: '100%', height: '100%', border: 0, borderRadius: 1 }} />
                ) : (
                  <Box component="video" src={embed.src} controls sx={{ width: '100%', height: '100%', borderRadius: 1 }} />
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
      {picturePath && (() => {
        const lower = String(picturePath).toLowerCase();
        const isVideo = /\.(mp4|webm|ogg)$/i.test(lower);
        const src = `${API_URL}/assets/${picturePath}`;
        return isVideo ? (
          <Box mt={1}>
            <Box component="video" src={src} controls sx={{ width: '100%', borderRadius: '0.75rem' }} />
          </Box>
        ) : (
          <img
            width="100%"
            height="auto"
            alt="post"
            style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
            src={src}
          />
        );
      })()}
      {!picturePath && audioPath && (
        <Box mt={1}>
          <Box component="audio" src={`${API_URL}/assets/${audioPath}`} controls sx={{ width: '100%' }} />
        </Box>
      )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={handleToggleComments}>
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
      {isComments && (
        <Box mt="0.5rem">
          {loadingComments ? (
            <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
              Loading comments...
            </Typography>
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
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "1rem", border: `1px solid ${main}` }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                />
                <IconButton onClick={() => setGiphyOpen(true)} title="Add GIF">
                  <GifBoxOutlined />
                </IconButton>
                <PostActionButton
                  size="small"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  label="Post"
                  sx={{ borderRadius: '1rem', padding: '0.35rem 0.9rem' }}
                />
                <GiphyPicker open={giphyOpen} onClose={() => setGiphyOpen(false)} onSelect={handleGifSelect} />
              </Box>
            </>
          )}
        </Box>
      )}
      <Snackbar
        open={shareOpen}
        autoHideDuration={2500}
        onClose={() => setShareOpen(false)}
        message={shareMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </WidgetWrapper>
  );
};

export default PostWidget;
