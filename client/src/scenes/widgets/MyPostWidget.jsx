import { EditOutlined, DeleteOutlined, GifBoxOutlined, ImageOutlined, MicOutlined, StopCircleOutlined, PlayArrow, Pause, MoreHorizOutlined } from "@mui/icons-material";
import { Box, Divider, Typography, InputBase, useTheme, IconButton, useMediaQuery } from "@mui/material";
import { useNotify } from "components/NotificationProvider";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useRef, useState } from "react";
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
  // Support multiple media files (images or videos)
  const [mediaFiles, setMediaFiles] = useState([]); // Array<File>
  const MAX_MEDIA_FILES = 5;
  const [post, setPost] = useState("");
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const maxSeconds = 60;
  const { palette } = useTheme();
  const notify = useNotify();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  const handlePost = async () => {
    setSubmitError("");
    if (!post.trim() && mediaFiles.length === 0 && !audioBlob) return; // require either text or media
    const formData = new FormData();
    formData.append("userId", _id);
    formData.append("description", post);
    if (mediaFiles.length > 0) {
      // For backward compatibility with current backend (single picturePath/audioPath fields),
      // we will send the first file in legacy fields and all files as an array 'media[]'
      mediaFiles.forEach((file, idx) => {
        formData.append('media', file, file.name);
        if (idx === 0) {
          // Use original field names so existing server still attaches one
          formData.append('picture', file); // server picks first image/video via mime check
          formData.append('picturePath', file.name);
        }
      });
    }
    if (audioBlob) {
      const fileName = `audio-${Date.now()}.webm`;
      const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' });
      formData.append("audio", audioFile);
      formData.append("audioPath", fileName);
    }
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitError(data?.message || data?.error || "Failed to create post.");
        return;
      }
      const posts = Array.isArray(data) ? data : [];
      dispatch(setPosts({ posts }));
      // Revoke generated object URLs for previews
      mediaFiles.forEach(f => {
        if (f.__previewUrl) {
          try { URL.revokeObjectURL(f.__previewUrl); } catch {}
        }
      });
      setMediaFiles([]);
      setPost("");
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl("");
    } catch (e) {
      setSubmitError("Cannot reach server. Please try again.");
    }
  };

  const insertGifIntoPost = (gifUrl) => {
    setPost((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + gifUrl + ' ');
  };

  // Draw waveform bars using AnalyserNode
  const drawWave = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // Fit to device pixel ratio for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 300;
    const cssHeight = 48;
    canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
    canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
    ctx.scale(dpr, dpr);
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = '#eee';
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#888';
      ctx.beginPath();
      const sliceWidth = cssWidth / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * cssHeight) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(cssWidth, cssHeight / 2);
      ctx.stroke();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const cleanupRecordingGraphics = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
    audioCtxRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try { rec.stop(); } catch {}
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // stop mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    cleanupRecordingGraphics();
  };

  const startRecording = async () => {
    try {
      // reset any previous audio clip
      if (audioUrl) { try { URL.revokeObjectURL(audioUrl); } catch {}
      }
      setAudioBlob(null);
      setAudioUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      mediaRecorderRef.current = rec;
      rec.start(100);
      setIsRecording(true);
      setRecordSecs(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordSecs((s) => {
          if (s + 1 >= maxSeconds) {
            stopRecording();
            return maxSeconds;
          }
          return s + 1;
        });
      }, 1000);
  // Setup analyser for waveform drawing
  audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
  analyserRef.current = audioCtxRef.current.createAnalyser();
  analyserRef.current.fftSize = 1024;
  sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
  sourceRef.current.connect(analyserRef.current);
    } catch (e) {
      notify('Microphone permission is required to record audio.', { severity: 'error' });
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start drawing waveform after the recording UI and analyser are ready
  useEffect(() => {
    if (isRecording) {
      // wait a frame so the canvas mounts
      const id = requestAnimationFrame(() => drawWave());
      return () => cancelAnimationFrame(id);
    } else {
      // stop drawing when not recording
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

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
      {/* Recording popup */}
      {isRecording && (
        <Box mt={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: `1px solid ${medium}`, borderRadius: 1, background: palette.neutral.light }}>
          <canvas ref={canvasRef} width={300} height={48} style={{ width: '100%', height: 48, background: 'transparent' }} />
          <Typography sx={{ minWidth: 64, textAlign: 'right' }}>
            {String(Math.floor(recordSecs/60)).padStart(2,'0')}:{String(recordSecs%60).padStart(2,'0')}
          </Typography>
        </Box>
      )}
      {/* Audio preview block */}
      {audioBlob && (
        <Box mt={1} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: `1px solid ${medium}`, borderRadius: 1 }}>
          <IconButton onClick={() => {
            if (!audioElRef.current) return;
            if (audioElRef.current.paused) {
              audioElRef.current.play();
            } else {
              audioElRef.current.pause();
            }
          }} aria-label="Play/Pause">
            {isPlayingPreview ? <Pause /> : <PlayArrow />}
          </IconButton>
          <Typography sx={{ flex: 1 }}>Voice message</Typography>
          <IconButton onClick={() => { setAudioBlob(null); if (audioUrl) URL.revokeObjectURL(audioUrl); setAudioUrl(""); }} aria-label="Remove audio">
            <DeleteOutlined />
          </IconButton>
          <audio ref={audioElRef} src={audioUrl || undefined} onPlay={() => setIsPlayingPreview(true)} onPause={() => setIsPlayingPreview(false)} onEnded={() => setIsPlayingPreview(false)} />
        </Box>
      )}
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
            multiple
            onDrop={(acceptedFiles) => {
              if (!acceptedFiles?.length) return;
              if (audioBlob) {
                notify('Audio recording present; remove it first if you want only media.', { severity: 'warning' });
              }
              // Enforce max count
              const remainingSlots = MAX_MEDIA_FILES - mediaFiles.length;
              if (remainingSlots <= 0) {
                notify(`Maximum of ${MAX_MEDIA_FILES} media files reached.`, { severity: 'warning' });
                return;
              }
              const slice = acceptedFiles.slice(0, remainingSlots);
              // Prevent mixing audio & media (audio handled separately)
              const maxMB = 25;
              const valid = [];
              for (const file of slice) {
                if (file.size > maxMB * 1024 * 1024) {
                  notify(`${file.name} too large. Max ${maxMB}MB`, { severity: 'warning' });
                  continue;
                }
                const preview = URL.createObjectURL(file);
                file.__previewUrl = preview; // attach for later revocation
                valid.push(file);
              }
              setMediaFiles(prev => [...prev, ...valid]);
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween alignItems="flex-start" gap={1}>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p="1rem"
                  width="100%"
                  sx={{ "&:hover": { cursor: "pointer" }, minHeight: '4rem' }}
                >
                  <input {...getInputProps()} />
                  {mediaFiles.length === 0 ? (
                    <p>Add Media (images/videos) - up to {MAX_MEDIA_FILES}</p>
                  ) : (
                    <Typography>{mediaFiles.length}/{MAX_MEDIA_FILES} file{mediaFiles.length > 1 ? 's' : ''} selected</Typography>
                  )}
                </Box>
                {mediaFiles.length > 0 && (
                  <IconButton
                    onClick={() => {
                      mediaFiles.forEach(f => { if (f.__previewUrl) { try { URL.revokeObjectURL(f.__previewUrl); } catch {} } });
                      setMediaFiles([]);
                    }}
                    sx={{ width: "15%" }}
                    aria-label="Clear media"
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
          {/* Inline previews grid */}
          {mediaFiles.length > 0 && (
            <Box mt={1} sx={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
              {mediaFiles.map((file, idx) => {
                const isVideo = file.type?.startsWith('video/');
                const url = file.__previewUrl || URL.createObjectURL(file);
                if (!file.__previewUrl) file.__previewUrl = url;
                return (
                  <Box key={idx} sx={{ position: 'relative', border: '1px solid #ccc', borderRadius: 1, overflow: 'hidden' }}>
                    {isVideo ? (
                      <Box component="video" src={url} controls sx={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    ) : (
                      <Box component="img" src={url} alt={file.name} sx={{ width: '100%', height: 100, objectFit: 'cover' }} />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setMediaFiles(prev => {
                          const copy = [...prev];
                          const [removed] = copy.splice(idx, 1);
                          if (removed?.__previewUrl) { try { URL.revokeObjectURL(removed.__previewUrl); } catch {} }
                          return copy;
                        });
                      }}
                      sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
                      aria-label="Remove file"
                    >
                      <DeleteOutlined fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
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

            {/* Audio recording control */}
            <FlexBetween
              gap="0.25rem"
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              sx={{ cursor: 'pointer', '&:hover .audio-hover': { color: medium } }}
            >
              {isRecording ? (
                <StopCircleOutlined className="audio-hover" sx={{ color: mediumMain }} />
              ) : (
                <MicOutlined className="audio-hover" sx={{ color: mediumMain }} />
              )}
              <Typography color={mediumMain}>
                {isRecording ? `Stop (${String(Math.floor(recordSecs/60)).padStart(2,'0')}:${String(recordSecs%60).padStart(2,'0')})` : 'Audio'}
              </Typography>
            </FlexBetween>
          </>
        ) : (
          <FlexBetween gap="0.25rem">
            <MoreHorizOutlined sx={{ color: mediumMain }} />
          </FlexBetween>
        )}

        {submitError && (
          <Typography color="error" sx={{ mr: 2 }}>{submitError}</Typography>
        )}
        <PostActionButton
          disabled={!post?.trim() && mediaFiles.length === 0 && !audioBlob}
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
