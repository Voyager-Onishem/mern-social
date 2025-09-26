// Feature 22: Centralized embed sanitization utilities
// Restricts iframe embeds to a strict provider whitelist and safe attributes.

const PROVIDERS = {
  youtube(id) {
    if (!/^[\w-]{11}$/.test(id)) return null;
    return `https://www.youtube.com/embed/${id}`;
  },
  vimeo(id) {
    if (!/^\d+$/.test(id)) return null;
    return `https://player.vimeo.com/video/${id}`;
  }
};

export function sanitizeIframeSrc(provider, id) {
  if (!provider || !id) return null;
  const fn = PROVIDERS[provider];
  if (!fn) return null;
  try {
    return fn(String(id));
  } catch {
    return null;
  }
}

export const SAFE_IFRAME_ATTRS = Object.freeze({
  allow: 'encrypted-media; picture-in-picture',
  allowFullScreen: true,
  sandbox: 'allow-same-origin allow-scripts allow-presentation allow-popups'
});

export function isTrustedEmbedUrl(url) {
  try {
    const u = new URL(url);
    return ['www.youtube.com', 'youtube.com', 'player.vimeo.com'].includes(u.host) && u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function detectSuspiciousEmbed(url) {
  if (!url) return 'Missing embed URL';
  if (!isTrustedEmbedUrl(url)) return 'Untrusted video embed blocked';
  return null;
}

export default { sanitizeIframeSrc, SAFE_IFRAME_ATTRS, isTrustedEmbedUrl, detectSuspiciousEmbed };
