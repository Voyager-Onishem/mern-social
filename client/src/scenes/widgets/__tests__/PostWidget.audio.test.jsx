import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { themeSettings } from 'theme';
import PostWidget from '../PostWidget';

function makeStore(preloadedState) {
  // Simple reducer passthrough for test
  const reducer = (state = preloadedState, action) => state;
  return configureStore({ reducer });
}

describe('PostWidget audio rendering', () => {
  const API_URL_OLD = process.env.REACT_APP_API_URL;
  beforeAll(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:6001';
  });
  afterAll(() => {
    process.env.REACT_APP_API_URL = API_URL_OLD;
  });

  it('renders audio element when audioPath exists and no picturePath', () => {
    const store = makeStore({
      mode: 'light',
      token: 'test-token',
      user: { _id: 'u1', friends: [] },
      posts: [],
      postsLoading: false,
      sessionSeenPostIds: {},
    });

    const theme = createTheme(themeSettings('light'));
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ThemeProvider theme={theme}>
          <PostWidget
            postId={'507f1f77bcf86cd799439011'}
            postUserId={'u2'}
            name={'Test User'}
            description={'Audio only post'}
            location={'Somewhere'}
            picturePath={''}
            audioPath={'test-audio.webm'}
            userPicturePath={''}
            likes={{}}
            comments={[]}
            createdAt={Date.now()}
          />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    );

  const audioEl = document.querySelector('audio');
    expect(audioEl).toBeTruthy();
    expect(audioEl.getAttribute('src')).toContain('/assets/test-audio.webm');
  });
});
