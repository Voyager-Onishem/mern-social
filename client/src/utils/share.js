// Utility for sharing a post link with progressive enhancement.
// Returns a promise that resolves with a status string: 'shared' | 'copied' | 'canceled' | 'error'
export async function sharePost({ postId, description, authorName }) {
  const shareUrl = `${window.location.origin}/home#post-${postId}`;
  const text = description && typeof description === 'string' && description.trim()
    ? description.slice(0, 120)
    : 'Check out this post';
  try {
    if (navigator.share) {
      await navigator.share({ title: `${authorName || 'Post'}`, text, url: shareUrl });
      return 'shared';
    }
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
      return 'copied';
    }
    // Fallback: execCommand copy
    const el = document.createElement('textarea');
    el.value = shareUrl;
    el.style.position = 'fixed';
    el.style.top = '-1000px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      return 'copied';
    } catch (e) {
      return 'error';
    } finally {
      document.body.removeChild(el);
    }
  } catch (err) {
    return 'canceled';
  }
}

export function statusToMessage(status) {
  switch (status) {
    case 'shared': return 'Shared';
    case 'copied': return 'Link copied';
    case 'canceled': return 'Share canceled';
    default: return 'Unable to share';
  }
}