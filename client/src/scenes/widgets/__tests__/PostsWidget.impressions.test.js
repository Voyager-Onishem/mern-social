import React from 'react';
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import reducer, { setPosts } from 'state';
import { themeSettings } from 'theme';
import PostsWidget from '../PostsWidget';

// Mock IntersectionObserver
class IOStub {
  constructor(cb, options) {
    this._cb = cb;
    this.options = options;
    this.elements = new Set();
  }
  observe(el) { this.elements.add(el); }
  unobserve(el) { this.elements.delete(el); }
  disconnect() { this.elements.clear(); }
  // Helper to simulate visibility change
  trigger(el, ratio) {
    this._cb([{ target: el, intersectionRatio: ratio }]);
  }
}

let ioInstance;
beforeAll(() => {
  global.IntersectionObserver = class extends IOStub {
    constructor(cb, options) { super(cb, options); ioInstance = this; }
  };
});

// Mock fetch for impressions endpoint
const fetchMock = jest.fn(async (url, opts) => {
  if (url.includes('/analytics/post-impressions')) {
    const body = JSON.parse(opts.body || '{}');
    const postIds = body.postIds || [];
    return {
      ok: true,
      json: async () => ({ impressions: postIds.map(id => ({ postId: id, impressions: 1 })) }),
    };
  }
  if (url.endsWith('/posts')) {
    return { ok: true, text: async () => JSON.stringify([]) };
  }
  return { ok: true, json: async () => ({}), text: async () => '{}' };
});

beforeEach(() => {
  fetchMock.mockClear();
  global.fetch = fetchMock;
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function setupWithPosts(posts) {
  const preloaded = { mode: 'light', posts: [], postsLoading: false, sessionSeenPostIds: {}, user: { _id: 'viewer', friends: [] }, token: 't' };
  const store = configureStore({ reducer, preloadedState: preloaded });
  const theme = createTheme(themeSettings('light'));
  const ui = (
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <PostsWidget />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
  const utils = render(ui);
  // Inject posts into store after render so observer hook runs with them
  act(() => { store.dispatch(setPosts({ posts })); });
  return { store, ...utils };
}

describe('PostsWidget impressions batching', () => {
  test('records a single impression after dwell and debounce', () => {
    const postId = '507f1f77bcf86cd799439011'; // valid ObjectId shape
    const { store } = setupWithPosts([{ _id: postId, userId: 'u1', firstName: 'A', lastName: 'B', description: 'Desc', location: 'Loc', picturePath: null, audioPath: null, userPicturePath: null, likes: {}, comments: [], createdAt: new Date().toISOString(), impressions: 0 }]);
    const el = document.querySelector(`#post-${postId}`);
    expect(el).toBeTruthy();

    // Simulate intersection >= 0.5
  act(() => { ioInstance.trigger(el, 0.6); });

    // Advance dwell timer (300ms)
    act(() => { jest.advanceTimersByTime(310); });
    // Debounce window not yet flushed (800ms). Queue exists but no fetch yet.
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/analytics/post-impressions'), expect.anything());

    // Advance to surpass debounce flush
    act(() => { jest.advanceTimersByTime(800); });

    // Fetch should have been called once for impressions
    const impressionCall = fetchMock.mock.calls.find(c => c[0].includes('/analytics/post-impressions'));
    expect(impressionCall).toBeTruthy();

    // Optimistic increment should reflect in store
    const state = store.getState();
  const updated = state.posts.find(p => p._id === postId);
  expect(updated.impressions).toBe(1);
  });

  test('does not double-count when element stays visible across debounce cycles', () => {
    const postId = '507f1f77bcf86cd799439012';
    const { store } = setupWithPosts([{ _id: postId, userId: 'u1', firstName: 'A', lastName: 'B', description: 'Desc', location: 'Loc', picturePath: null, audioPath: null, userPicturePath: null, likes: {}, comments: [], createdAt: new Date().toISOString(), impressions: 0 }]);
    const el = document.querySelector(`#post-${postId}`);
    act(() => { ioInstance.trigger(el, 0.7); });
    act(() => { jest.advanceTimersByTime(310); }); // dwell
    act(() => { jest.advanceTimersByTime(800); }); // first flush
    // Trigger again (should not queue because seenRef marks it)
    act(() => { ioInstance.trigger(el, 0.75); });
    act(() => { jest.advanceTimersByTime(310); });
    act(() => { jest.advanceTimersByTime(800); });
    const state = store.getState();
    const updated = state.posts.find(p => p._id === postId);
    expect(updated.impressions).toBe(1); // still one
  });

  test('cancels dwell timer if visibility drops before 300ms', () => {
    const postId = '507f1f77bcf86cd799439013';
    const { store } = setupWithPosts([{ _id: postId, userId: 'u1', firstName: 'A', lastName: 'B', description: 'Desc', location: 'Loc', picturePath: null, audioPath: null, userPicturePath: null, likes: {}, comments: [], createdAt: new Date().toISOString(), impressions: 0 }]);
    const el = document.querySelector(`#post-${postId}`);
    act(() => { ioInstance.trigger(el, 0.55); });
    // Leave viewport before dwell completes
    act(() => { jest.advanceTimersByTime(150); });
    act(() => { ioInstance.trigger(el, 0.2); });
    act(() => { jest.advanceTimersByTime(200); }); // total 350ms elapsed but second part not visible
    // Advance debounce just in case
    act(() => { jest.advanceTimersByTime(800); });
    const state = store.getState();
    const updated = state.posts.find(p => p._id === postId);
    expect(updated.impressions).toBe(0);
  });
});
