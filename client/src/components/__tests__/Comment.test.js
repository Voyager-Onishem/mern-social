import React from 'react';
import { render, screen } from '@testing-library/react';
import Comment from '../../components/Comment';

describe('Comment', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });
  test('renders multiple GIFs and text', () => {
    const text = 'Check this out https://media.giphy.com/media/abc123/giphy.gif and also https://media.giphy.com/media/xyz987/giphy.gif';
    render(<Comment username="Tester" text={text} createdAt={new Date().toISOString()} />);
    expect(screen.getAllByAltText(/GIF/i).length).toBe(2);
    expect(screen.getByText(/Check this out/)).toBeInTheDocument();
  });
});
