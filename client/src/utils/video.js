// Detects if text contains a video URL and returns metadata

const YT_REGEX = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/i;
const VIMEO_REGEX = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i;
const DIRECT_VIDEO_REGEX = /https?:\/\/[^\s]+\.(mp4|webm|ogg)(?:\?[^\s]*)?$/i;

export function extractFirstVideo(text) {
  if (!text || typeof text !== 'string') return null;
  const yt = text.match(YT_REGEX);
  if (yt) {
    return { type: 'youtube', id: yt[1], url: yt[0] };
  }
  const vimeo = text.match(VIMEO_REGEX);
  if (vimeo) {
    return { type: 'vimeo', id: vimeo[1], url: vimeo[0] };
  }
  const direct = text.match(DIRECT_VIDEO_REGEX);
  if (direct) {
    return { type: 'direct', url: direct[0] };
  }
  return null;
}

export function getEmbedForVideo(meta) {
  if (!meta) return null;
  switch (meta.type) {
    case 'youtube':
      return { tag: 'iframe', src: `https://www.youtube.com/embed/${meta.id}`, allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture', allowFullScreen: true };
    case 'vimeo':
      return { tag: 'iframe', src: `https://player.vimeo.com/video/${meta.id}`, allow: 'autoplay; fullscreen; picture-in-picture', allowFullScreen: true };
    case 'direct':
      return { tag: 'video', src: meta.url, controls: true };
    default:
      return null;
  }
}

export default extractFirstVideo;
