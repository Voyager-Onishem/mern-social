import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import { NotificationProvider } from 'components/NotificationProvider';
import { themeSettings } from 'theme';
import reducer from 'state';
import MyPostWidget from '../MyPostWidget';

// Mock socketClient to prevent real Socket.io connections in tests
jest.mock('utils/socketClient', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    connected: false,
    connecting: false,
  })),
  initializeSocket: jest.fn(),
  disconnectSocket: jest.fn(),
}));

// Mock apiClient to prevent real API calls
jest.mock('utils/apiClient', () => ({
  get: jest.fn(() => Promise.resolve({ notifications: [], unreadCount: 0 })),
  post: jest.fn(() => Promise.resolve({})),
  patch: jest.fn(() => Promise.resolve({})),
  del: jest.fn(() => Promise.resolve({})),
}));

// simple localStorage mock for draft restore
beforeAll(() => {
  // Use real timers for these tests to avoid hanging with async operations
  jest.useRealTimers();
});

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

afterAll(() => {
  // Restore fake timers if needed by other tests
  jest.useFakeTimers();
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
  renderWithProviders(<MyPostWidget picturePath={null} />, { 
    preloadedState: { 
      auth: {
        user: { _id: 'u1', friends: [] }, 
        token: 't',
        mode: 'light',
        posts: [], 
        postsLoading: false, 
        sessionSeenPostIds: {},
        pagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false }
      },
      notifications: {
        notifications: [],
        unreadCount: 0,
        loading: false
      }
    } 
  });
}

describe('MyPostWidget', () => {
  test('restores draft text if present', async () => {
    setupWithDraft('Hello draft');
    const input = await screen.findByLabelText(/Post text/i);
    expect(input.value).toMatch(/Hello draft/);
  });

  test('clear draft link shows when content present', async () => {
    renderWithProviders(<MyPostWidget picturePath={null} />, { 
      preloadedState: { 
        auth: {
          user: { _id: 'u1', friends: [] }, 
          token: 't',
          mode: 'light',
          posts: [], 
          postsLoading: false, 
          sessionSeenPostIds: {},
          pagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false }
        },
        notifications: {
          notifications: [],
          unreadCount: 0,
          loading: false
        }
      } 
    });
    const input = screen.getByLabelText(/Post text/i);
    fireEvent.change(input, { target: { value: 'Something' } });
    
    // Wait for the "Clear Draft" button to appear (debounced save)
    await waitFor(() => {
      expect(screen.getByText(/Clear Draft/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
