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
            acceptedFiles=".jpg,.jpeg,.png"
            multiple={false}
            onDrop={(acceptedFiles) => setImage(acceptedFiles[0])}
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
                    <p>Add Image Here</p>
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
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        <FlexBetween gap="0.25rem" onClick={() => setIsImage(!isImage)}>
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ "&:hover": { cursor: "pointer", color: medium } }}
          >
            Image
          </Typography>
        </FlexBetween>

        {isNonMobileScreens ? (
          <>
            <FlexBetween gap="0.25rem" onClick={() => setGiphyOpen(true)} sx={{ cursor: 'pointer' }}>
              <GifBoxOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>GIF</Typography>
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
          disabled={!post?.trim()}
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
