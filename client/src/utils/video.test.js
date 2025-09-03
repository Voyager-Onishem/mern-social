import { extractFirstVideo, getEmbedForVideo } from './video';

describe('video utils', () => {
  test('extracts youtube id', () => {
    const text = 'watch https://youtu.be/abcdefghijk now';
    const meta = extractFirstVideo(text);
    expect(meta).toEqual({ type: 'youtube', id: 'abcdefghijk', url: 'https://youtu.be/abcdefghijk' });
  });

  test('extracts vimeo id', () => {
    const text = 'see https://vimeo.com/12345678 cool';
    const meta = extractFirstVideo(text);
    expect(meta).toEqual({ type: 'vimeo', id: '12345678', url: 'https://vimeo.com/12345678' });
  });

  test('extracts direct video', () => {
    const text = 'file https://example.com/video.mp4?x=1';
    const meta = extractFirstVideo(text);
    expect(meta).toEqual({ type: 'direct', url: 'https://example.com/video.mp4?x=1' });
  });

  test('getEmbedForVideo builds embed data', () => {
    expect(getEmbedForVideo({ type: 'youtube', id: 'abcdefghijk' }).src).toContain('youtube.com');
    expect(getEmbedForVideo({ type: 'vimeo', id: '1234' }).src).toContain('player.vimeo.com');
    expect(getEmbedForVideo({ type: 'direct', url: 'x.mp4' }).tag).toBe('video');
  });
});
