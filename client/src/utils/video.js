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

import { sanitizeIframeSrc, SAFE_IFRAME_ATTRS } from './sanitizeEmbed';

export function getEmbedForVideo(meta) {
  if (!meta) return null;
  switch (meta.type) {
    case 'youtube': {
      const src = sanitizeIframeSrc('youtube', meta.id);
      if (!src) return null;
      return { tag: 'iframe', src, ...SAFE_IFRAME_ATTRS };
    }
    case 'vimeo': {
      const src = sanitizeIframeSrc('vimeo', meta.id);
      if (!src) return null;
      return { tag: 'iframe', src, ...SAFE_IFRAME_ATTRS };
    }
    case 'direct':
      return { tag: 'video', src: meta.url, controls: true };
    default:
      return null;
  }
}

export default extractFirstVideo;
