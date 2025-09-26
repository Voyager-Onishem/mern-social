import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import reducer from 'state';
import { themeSettings } from 'theme';
import PostWidget from '../PostWidget';

function setup(extraState = {}) {
  const preloaded = { mode: 'light', posts: [], postsLoading: false, sessionSeenPostIds: {}, user: { _id: 'viewer', friends: [] }, token: 't', ...extraState };
  const store = configureStore({ reducer, preloadedState: preloaded });
  const theme = createTheme(themeSettings(store.getState().mode || 'light'));
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
    setup({ user: { _id: 'viewer', friends: [] }, token: 't' });
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Post impressions 5/i)).toBeInTheDocument();
  });
});
