import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  GifBoxOutlined,
} from "@mui/icons-material";
import { Box, Divider, IconButton, Typography, useTheme } from "@mui/material";
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

const API_URL = process.env.REACT_APP_API_URL;

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
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

  return (
    <WidgetWrapper m="2rem 0">
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
      {picturePath && (
        <img
          width="100%"
          height="auto"
          alt="post"
          style={{ borderRadius: "0.75rem", marginTop: "0.75rem" }}
          src={`${API_URL}/assets/${picturePath}`}
        />
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

        <IconButton>
          <ShareOutlined />
        </IconButton>
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
    {[...currentComments].reverse().map((comment, i) => (
                  <Box key={i}>
                    <Divider />
                    {/* If comment is an object, pass props; else fallback to string */}
                    {typeof comment === 'object' && comment !== null ? (
                      <Comment 
                        username={comment.username || "Unknown"}
                        text={comment.text || comment.comment || ""}
                        userPicturePath={comment.userPicturePath}
                        createdAt={comment.createdAt || comment._id}
                      />
                    ) : (
                      <Comment username="" text={comment} />
                    )}
                  </Box>
                ))}
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
    </WidgetWrapper>
  );
};

export default PostWidget;
