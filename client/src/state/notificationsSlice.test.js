import notificationsReducer, {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setLoading,
} from './notificationsSlice';

describe('notificationsSlice', () => {
  const initialState = {
    notifications: [],
    unreadCount: 0,
    loading: false,
  };

  test('should return initial state', () => {
    expect(notificationsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('setNotifications updates state correctly', () => {
    const notifications = [
      { _id: '1', message: 'Test 1', read: false },
      { _id: '2', message: 'Test 2', read: true },
    ];
    
    const state = notificationsReducer(
      initialState,
      setNotifications({ notifications, unreadCount: 1 })
    );
    
    expect(state.notifications).toEqual(notifications);
    expect(state.unreadCount).toBe(1);
    expect(state.loading).toBe(false);
  });

  test('addNotification adds to beginning of list', () => {
    const existingState = {
      notifications: [{ _id: '1', message: 'Old', read: true }],
      unreadCount: 0,
      loading: false,
    };
    
    const newNotification = { _id: '2', message: 'New', read: false };
    
    const state = notificationsReducer(existingState, addNotification(newNotification));
    
    expect(state.notifications[0]).toEqual(newNotification);
    expect(state.notifications.length).toBe(2);
    expect(state.unreadCount).toBe(1);
  });

  test('addNotification does not increment unreadCount for read notifications', () => {
    const existingState = {
      notifications: [],
      unreadCount: 0,
      loading: false,
    };
    
    const readNotification = { _id: '1', message: 'Already read', read: true };
    
    const state = notificationsReducer(existingState, addNotification(readNotification));
    
    expect(state.unreadCount).toBe(0);
  });

  test('markAsRead marks notification as read and decrements unreadCount', () => {
    const existingState = {
      notifications: [
        { _id: '1', message: 'Test 1', read: false },
        { _id: '2', message: 'Test 2', read: false },
      ],
      unreadCount: 2,
      loading: false,
    };
    
    const state = notificationsReducer(existingState, markAsRead('1'));
    
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  test('markAsRead does not decrement unreadCount if already read', () => {
    const existingState = {
      notifications: [{ _id: '1', message: 'Test', read: true }],
      unreadCount: 0,
      loading: false,
    };
    
    const state = notificationsReducer(existingState, markAsRead('1'));
    
    expect(state.unreadCount).toBe(0);
  });

  test('markAsRead does not go below zero', () => {
    const existingState = {
      notifications: [{ _id: '1', message: 'Test', read: false }],
      unreadCount: 0, // Already at zero
      loading: false,
    };
    
    const state = notificationsReducer(existingState, markAsRead('1'));
    
    expect(state.unreadCount).toBe(0);
  });

  test('markAllAsRead marks all notifications as read', () => {
    const existingState = {
      notifications: [
        { _id: '1', message: 'Test 1', read: false },
        { _id: '2', message: 'Test 2', read: false },
        { _id: '3', message: 'Test 3', read: true },
      ],
      unreadCount: 2,
      loading: false,
    };
    
    const state = notificationsReducer(existingState, markAllAsRead());
    
    expect(state.notifications.every(n => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  test('removeNotification removes notification and updates unreadCount', () => {
    const existingState = {
      notifications: [
        { _id: '1', message: 'Test 1', read: false },
        { _id: '2', message: 'Test 2', read: true },
      ],
      unreadCount: 1,
      loading: false,
    };
    
    const state = notificationsReducer(existingState, removeNotification('1'));
    
    expect(state.notifications.length).toBe(1);
    expect(state.notifications[0]._id).toBe('2');
    expect(state.unreadCount).toBe(0);
  });

  test('removeNotification does not affect unreadCount if notification was read', () => {
    const existingState = {
      notifications: [
        { _id: '1', message: 'Test 1', read: false },
        { _id: '2', message: 'Test 2', read: true },
      ],
      unreadCount: 1,
      loading: false,
    };
    
    const state = notificationsReducer(existingState, removeNotification('2'));
    
    expect(state.notifications.length).toBe(1);
    expect(state.unreadCount).toBe(1);
  });

  test('setLoading updates loading state', () => {
    const state = notificationsReducer(initialState, setLoading(true));
    expect(state.loading).toBe(true);
    
    const state2 = notificationsReducer(state, setLoading(false));
    expect(state2.loading).toBe(false);
  });
});
