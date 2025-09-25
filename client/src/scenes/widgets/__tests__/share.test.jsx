import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostWidget from '../PostWidget';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer, { setLogin, setPosts } from 'state';

// Minimal store with required slices/shape
function makeStore() {
  return configureStore({ reducer });
}

describe('Share action', () => {
  beforeEach(() => {
    // Clear any mocks
    delete navigator.share;
    navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
  });

  test('falls back to clipboard when Web Share API is unavailable', async () => {
  const store = makeStore();
  // Provide a logged in user & token expected by PostWidget logic
  store.dispatch(setLogin({ user: { _id: 'u1', friends: [] }, token: 'TEST_TOKEN' }));
  store.dispatch(setPosts({ posts: [] }));
    const likes = {}; // no likes
    render(
      <Provider store={store}>
        <PostWidget
          postId={'abc123abc123abc123abc123'}
          postUserId={'u1'}
          name={'Alice'}
          description={'A sample description for sharing'}
          location={''}
          picturePath={''}
          audioPath={''}
          userPicturePath={''}
          likes={likes}
          comments={[]}
          createdAt={Date.now()}
        />
      </Provider>
    );

    const shareBtn = screen.getByLabelText(/share post/i);
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    // Snackbar message should appear
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
  });
});
