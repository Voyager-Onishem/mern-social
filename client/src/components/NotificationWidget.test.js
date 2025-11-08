import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from '../state/notificationsSlice';
import NotificationWidget from './NotificationWidget';
import { BrowserRouter } from 'react-router-dom';
import * as apiClient from '../utils/apiClient';

// Mock the apiClient
jest.mock('../utils/apiClient');

// Mock the socketClient to prevent real connections
jest.mock('../utils/socketClient', () => ({
  getSocket: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    connected: false,
  })),
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
}));

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { token: 'test-token', user: { _id: 'user1' } }) => state,
      notifications: notificationsReducer,
    },
    preloadedState: {
      auth: { token: 'test-token', user: { _id: 'user1' } },
      notifications: {
        notifications: initialState.notifications || [],
        unreadCount: initialState.unreadCount || 0,
        loading: false,
      },
    },
  });
};

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('NotificationWidget', () => {
  beforeAll(() => {
    // Use real timers for these tests
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore fake timers after these tests
    jest.useFakeTimers();
  });

  test('renders notification bell icon', () => {
    const store = createMockStore();
    renderWithProviders(<NotificationWidget />, store);
    
    const bellIcon = screen.getByRole('button');
    expect(bellIcon).toBeInTheDocument();
  });

  test('displays unread count badge', () => {
    const store = createMockStore({
      notifications: [
        { _id: '1', message: 'Test notification', read: false, type: 'like', createdAt: new Date(), fromUserName: 'John', fromUserPicture: '' },
        { _id: '2', message: 'Another notification', read: false, type: 'comment', createdAt: new Date(), fromUserName: 'Jane', fromUserPicture: '' },
      ],
      unreadCount: 2,
    });
    
    renderWithProviders(<NotificationWidget />, store);
    
    // Badge should show count of 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('opens notification menu on click', () => {
    const store = createMockStore();
    renderWithProviders(<NotificationWidget />, store);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('displays notifications in dropdown', () => {
    const store = createMockStore({
      notifications: [
        {
          _id: '1',
          message: 'John liked your post',
          read: false,
          type: 'like',
          fromUserName: 'John Doe',
          fromUserPicture: '/avatar.jpg',
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
    });
    
    renderWithProviders(<NotificationWidget />, store);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('John liked your post')).toBeInTheDocument();
  });

  test('shows "No notifications yet" when empty', () => {
    const store = createMockStore({ notifications: [], unreadCount: 0 });
    renderWithProviders(<NotificationWidget />, store);
    
    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});

