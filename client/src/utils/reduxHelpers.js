/**
 * Redux selector helper functions for safely accessing nested state
 * after store restructuring
 */

// User-related selectors
export const getUser = (state) => state.auth?.user || null;
export const getUserId = (state) => state.auth?.user?._id || null;
export const getFirstName = (state) => state.auth?.user?.firstName || '';
export const getLastName = (state) => state.auth?.user?.lastName || '';
export const getFullName = (state) => {
  const user = state.auth?.user;
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
};
export const getLocation = (state) => state.auth?.user?.location || null;
export const getOccupation = (state) => state.auth?.user?.occupation || null;
export const getPicturePath = (state) => state.auth?.user?.picturePath || null;
export const getFriends = (state) => state.auth?.user?.friends || [];

// Auth-related selectors
export const getToken = (state) => state.auth?.token || null;
export const getMode = (state) => state.auth?.mode || "light";

// Posts-related selectors
export const getPosts = (state) => state.auth?.posts || [];
export const getPostsLoading = (state) => state.auth?.postsLoading || false;
export const getPagination = (state) => state.auth?.pagination || { page: 1, limit: 10, total: 0, pages: 0, hasMore: false };
export const getSessionSeenPostIds = (state) => state.auth?.sessionSeenPostIds || {};

// Ads-related selectors
export const getAds = (state) => state.ads?.items || [];

// Legacy methods - maintained for backward compatibility
export const fixUserState = (state) => getUser(state);
export const fixTokenState = (state) => getToken(state);
export const fixModeState = (state) => getMode(state);
export const fixPostsState = (state) => getPosts(state);
export const fixPaginationState = (state) => getPagination(state);
export const fixSessionSeenPostIdsState = (state) => getSessionSeenPostIds(state);
export const fixPostsLoadingState = (state) => getPostsLoading(state);