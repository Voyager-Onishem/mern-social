import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import authReducer from 'state';
import postsReducer from 'state/postsSlice';
import { themeSettings } from 'theme';
import PostWidget from '../PostWidget';

const reducer = {
  auth: authReducer,
  posts: postsReducer
};

function setup(extraState = {}) {
  const preloaded = { 
    auth: {
      mode: 'light',
      user: { _id: 'viewer', friends: [] },
      token: 't'
    },
    posts: {
      posts: [],
      loading: false,
      sessionSeenPostIds: {},
      pagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false }
    },
    ...extraState
  };
  const store = configureStore({ reducer, preloadedState: preloaded });
  const theme = createTheme(themeSettings(store.getState().auth?.mode || 'light'));
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
        <PostWidget
          postId="p1"
          postUserId="u1"
          name="Test User"
          description="Hello world"
          location="Somewhere"
          picturePath={null}
          audioPath={null}
          userPicturePath={null}
          likes={{}}
          comments={[]}
          createdAt={new Date().toISOString()}
          impressions={5}
        />
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
  return { store, ...utils };
}

describe('PostWidget', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  test('renders basic post info', () => {
    setup();
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Post impressions 5/i)).toBeInTheDocument();
  });
});
