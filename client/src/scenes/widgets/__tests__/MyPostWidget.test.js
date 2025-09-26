import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from 'components/NotificationProvider';
import { themeSettings } from 'theme';
import reducer from 'state';
import MyPostWidget from '../MyPostWidget';

// simple localStorage mock for draft restore
beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function renderWithProviders(ui, { preloadedState } = { preloadedState: {} }) {
  const store = configureStore({ reducer, preloadedState });
  const theme = createTheme(themeSettings(preloadedState.mode || 'light'));
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            {ui}
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
}

function setupWithDraft(text='Draft text') {
  localStorage.setItem('post_draft_u1', JSON.stringify({ text, mediaNames: [], hasAudio: false, ts: Date.now(), v:1 }));
  renderWithProviders(<MyPostWidget picturePath={null} />, { preloadedState: { user: { _id: 'u1', friends: [] }, token: 't', posts: [], postsLoading: false, sessionSeenPostIds: {}, mode: 'light' } });
}

describe('MyPostWidget', () => {
  test('restores draft text if present', async () => {
    setupWithDraft('Hello draft');
    const input = await screen.findByLabelText(/Post text/i);
    expect(input.value).toMatch(/Hello draft/);
  });

  test('clear draft link shows when content present', () => {
    renderWithProviders(<MyPostWidget picturePath={null} />, { preloadedState: { user: { _id: 'u1', friends: [] }, token: 't', posts: [], postsLoading: false, sessionSeenPostIds: {}, mode: 'light' } });
    const input = screen.getByLabelText(/Post text/i);
    fireEvent.change(input, { target: { value: 'Something' } });
    // advance debounce timer for draft save (400ms)
    jest.advanceTimersByTime(500);
    expect(screen.getByText(/Clear Draft/i)).toBeInTheDocument();
  });
});
