// giphyApi.js - Handles Giphy API requests

const GIPHY_API_KEY = process.env.REACT_APP_GIPHY_API_KEY;
export const hasGiphyKey = Boolean(GIPHY_API_KEY);

const SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';
const TRENDING_URL = 'https://api.giphy.com/v1/gifs/trending';

const commonParams = (params = {}) => {
  const searchParams = new URLSearchParams({
    api_key: GIPHY_API_KEY || '',
    limit: String(params.limit ?? 24),
    rating: params.rating || 'pg-13',
    lang: params.lang || 'en',
  });
  if (params.q) searchParams.set('q', params.q);
  return searchParams.toString();
};

export async function searchGifs(query, limit = 24) {
  if (!hasGiphyKey || !query?.trim()) return [];
  const url = `${SEARCH_URL}?${commonParams({ q: query, limit })}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch GIFs');
  const data = await response.json();
  return data.data;
}

export async function trendingGifs(limit = 24) {
  if (!hasGiphyKey) return [];
  const url = `${TRENDING_URL}?${commonParams({ limit })}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch trending GIFs');
  const data = await response.json();
  return data.data;
}
