import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer from 'state';
import PostWidget from '../PostWidget';

function setup(extraState = {}) {
  const store = configureStore({ reducer, preloadedState: { ...extraState } });
  const utils = render(
    <Provider store={store}>
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
    </Provider>
  );
  return { store, ...utils };
}

describe('PostWidget', () => {
  test('renders basic post info', () => {
    setup({ user: { _id: 'viewer', friends: [] }, token: 't' });
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Post impressions 5/i)).toBeInTheDocument();
  });
});
