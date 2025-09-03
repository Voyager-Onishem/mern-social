// Utilities for detecting and extracting Giphy GIF URLs in free-form text

// Matches URLs like:
// - https://media.giphy.com/media/<id>/giphy.gif
// - https://i.giphy.com/media/<id>/giphy.gif
// - https://giphy.com/gifs/<slug>
// Captures until whitespace or a common closing punctuation.
export const GIPHY_URL_REGEX = /https?:\/\/(?:[a-z0-9-]+\.)?giphy\.com\/[\w\-./?=&%#]+/gi;

// Common trailing punctuation that may be stuck to a pasted URL
const TRAILING_PUNCTUATION = /[).,\]\}!?:;]+$/;

export function isGiphyUrl(value) {
  if (!value || typeof value !== "string") return false;
  return /https?:\/\/(?:[a-z0-9-]+\.)?giphy\.com\//i.test(value);
}

export function extractGiphyUrls(text, maxCount = Infinity) {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(GIPHY_URL_REGEX) || [];
  const cleaned = [];
  for (const m of matches) {
    let url = m.trim().replace(TRAILING_PUNCTUATION, "");
    if (isGiphyUrl(url)) cleaned.push(url);
    if (cleaned.length >= maxCount) break;
  }
  return cleaned;
}

export function extractFirstGiphyUrl(text) {
  const [first] = extractGiphyUrls(text, 1);
  return first || null;
}

export default isGiphyUrl;
