import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import reducer from 'state';
import MyPostWidget from '../MyPostWidget';

// simple localStorage mock for draft restore
beforeEach(() => {
  localStorage.clear();
});

function setupWithDraft(text='Draft text') {
  localStorage.setItem('post_draft_u1', JSON.stringify({ text, mediaNames: [], hasAudio: false, ts: Date.now(), v:1 }));
  const store = configureStore({ reducer, preloadedState: { user: { _id: 'u1' }, token: 't', posts: [] } });
  render(
    <Provider store={store}>
      <MyPostWidget picturePath={null} />
    </Provider>
  );
}

describe('MyPostWidget', () => {
  test('restores draft text if present', async () => {
    setupWithDraft('Hello draft');
    const input = await screen.findByLabelText(/Post text/i);
    expect(input.value).toMatch(/Hello draft/);
  });

  test('clear draft link shows when content present', () => {
    const store = configureStore({ reducer, preloadedState: { user: { _id: 'u1' }, token: 't', posts: [] } });
    render(
      <Provider store={store}>
        <MyPostWidget picturePath={null} />
      </Provider>
    );
    const input = screen.getByLabelText(/Post text/i);
    fireEvent.change(input, { target: { value: 'Something' } });
    expect(screen.getByText(/Clear Draft/i)).toBeInTheDocument();
  });
});
