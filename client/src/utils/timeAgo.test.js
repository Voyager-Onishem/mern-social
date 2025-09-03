import { timeAgo } from './timeAgo';

describe('timeAgo', () => {
  test('returns empty for invalid input', () => {
    expect(timeAgo(null)).toBe("");
    expect(timeAgo(undefined)).toBe("");
    expect(timeAgo('not a date')).toBe("");
  });

  test('handles Date object', () => {
    const d = new Date(Date.now() - 65 * 1000);
    const out = timeAgo(d);
    expect(out.includes('minute') || out.includes('seconds')).toBe(true);
  });

  test('handles numeric seconds and ms', () => {
    const nowSec = Math.floor(Date.now() / 1000);
    expect(timeAgo(nowSec - 5)).toMatch(/just now|second/);
    expect(timeAgo(Date.now() - 3600_000)).toMatch(/hour/);
  });

  test('handles near-future as just now', () => {
    const nearFuture = new Date(Date.now() + 5 * 1000);
    expect(timeAgo(nearFuture)).toBe('just now');
  });
});
