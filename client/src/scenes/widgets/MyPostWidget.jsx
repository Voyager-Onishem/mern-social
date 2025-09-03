import {
  EditOutlined,
  DeleteOutlined,
  AttachFileOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MoreHorizOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import GiphyPicker from "components/GiphyPicker";
import { extractFirstGiphyUrl, isGiphyUrl } from "utils/isGiphyUrl";
import { extractFirstVideo, getEmbedForVideo } from "utils/video";
import PostActionButton from "components/PostActionButton";

const API_URL = process.env.REACT_APP_API_URL;

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [isImage, setIsImage] = useState(false);
  const [image, setImage] = useState(null);
  const [post, setPost] = useState("");
  const [giphyOpen, setGiphyOpen] = useState(false);
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
  if (!post.trim() && !image) return; // require either text or media
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("description", post);
    if (image) {
      formData.append("picture", image);
      formData.append("picturePath", image.name);
    }

    const response = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const posts = await response.json();
    dispatch(setPosts({ posts }));
    setImage(null);
    setPost("");
  };

  const insertGifIntoPost = (gifUrl) => {
    setPost((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + gifUrl + ' ');
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <InputBase
          placeholder="What's on your mind..."
          onChange={(e) => setPost(e.target.value)}
          value={post}
          sx={{
            width: "100%",
            backgroundColor: palette.neutral.light,
            borderRadius: "2rem",
            padding: "1rem 2rem",
          }}
        />
      </FlexBetween>
      {/* Simple preview if a video or GIF URL is present in the post text */}
      {typeof post === 'string' && (() => {
        const v = extractFirstVideo(post);
        if (v) {
          const embed = getEmbedForVideo(v);
          return (
            <Box mt={1} sx={{ position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '16/9' }}>
              {embed.tag === 'iframe' ? (
                <Box component="iframe" src={embed.src} allow={embed.allow} allowFullScreen={embed.allowFullScreen} sx={{ width: '100%', height: '100%', border: 0, borderRadius: 1 }} />
              ) : (
                <Box component="video" src={embed.src} controls sx={{ width: '100%', height: '100%', borderRadius: 1 }} />
              )}
            </Box>
          );
        }
        if (isGiphyUrl(post)) {
          return (
            <Box mt={1}>
              <img
                src={extractFirstGiphyUrl(post) || undefined}
                alt="GIF Preview"
                style={{ maxWidth: 200, borderRadius: 8 }}
              />
            </Box>
          );
        }
        return null;
      })()}
      {isImage && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            acceptedFiles="image/*,video/mp4,video/webm,video/ogg"
            multiple={false}
            onDrop={(acceptedFiles) => {
              const file = acceptedFiles[0];
              if (!file) return;
              const maxMB = 25; // mirror server default
              if (file.size > maxMB * 1024 * 1024) {
                alert(`File too large. Max ${maxMB}MB`);
                return;
              }
              setImage(file);
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" } }}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <p>Add Media Here</p>
                  ) : (
                    <FlexBetween>
                      <Typography>{image.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {image && (
                  <IconButton
                    onClick={() => setImage(null)}
                    sx={{ width: "15%" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
          {/* Inline preview for selected media */}
          {image && (
            <Box mt={1}>
              {image.type?.startsWith('video/') ? (
                <Box component="video" src={URL.createObjectURL(image)} controls sx={{ width: '100%', maxWidth: '640px', borderRadius: 1 }} />
              ) : (
                <Box component="img" src={URL.createObjectURL(image)} alt="Preview" sx={{ maxWidth: '100%', borderRadius: 1 }} />
              )}
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween
          gap="0.25rem"
          onClick={() => setIsImage(!isImage)}
          sx={{ cursor: 'pointer', '&:hover .media-hover': { color: medium } }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsImage((v) => !v);
            }
          }}
          aria-label="Add media"
        >
          <ImageOutlined className="media-hover" sx={{ color: mediumMain, transition: 'color 0.2s ease' }} />
          <Typography className="media-hover" color={mediumMain} sx={{ transition: 'color 0.2s ease' }}>
            Media
          </Typography>
        </FlexBetween>

        {isNonMobileScreens ? (
          <>
            <FlexBetween
              gap="0.25rem"
              onClick={() => setGiphyOpen(true)}
              sx={{
                cursor: 'pointer',
                '&:hover .gif-hover': { color: medium },
              }}
            >
              <GifBoxOutlined className="gif-hover" sx={{ color: mediumMain, transition: 'color 0.2s ease' }} />
              <Typography className="gif-hover" color={mediumMain} sx={{ transition: 'color 0.2s ease' }}>GIF</Typography>
            </FlexBetween>

            <FlexBetween gap="0.25rem">
              <AttachFileOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>Attachment</Typography>
            </FlexBetween>

            <FlexBetween gap="0.25rem">
              <MicOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>Audio</Typography>
            </FlexBetween>
          </>
        ) : (
          <FlexBetween gap="0.25rem">
            <MoreHorizOutlined sx={{ color: mediumMain }} />
          </FlexBetween>
        )}

        <PostActionButton
          disabled={!post?.trim() && !image}
          onClick={handlePost}
          label="Post"
        />
      </FlexBetween>

      <GiphyPicker
        open={giphyOpen}
        onClose={() => setGiphyOpen(false)}
        onSelect={(url) => {
          insertGifIntoPost(url);
          setGiphyOpen(false);
        }}
      />
    </WidgetWrapper>
  );
};

export default MyPostWidget;
