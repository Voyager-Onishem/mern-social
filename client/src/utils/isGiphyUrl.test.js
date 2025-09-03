import { isGiphyUrl, extractFirstGiphyUrl, extractGiphyUrls } from './isGiphyUrl';

describe('isGiphyUrl utils', () => {
  test('detects giphy url', () => {
    expect(isGiphyUrl('https://media.giphy.com/media/abc123/giphy.gif')).toBe(true);
    expect(isGiphyUrl('http://giphy.com/gifs/fun-abc')).toBe(true);
    expect(isGiphyUrl('https://example.com/x.gif')).toBe(false);
  });

  test('extracts first giphy url from mixed text', () => {
    const text = 'lol check this https://media.giphy.com/media/abc123/giphy.gif now!';
    expect(extractFirstGiphyUrl(text)).toBe('https://media.giphy.com/media/abc123/giphy.gif');
  });

  test('removes trailing punctuation stuck to url', () => {
    const text = 'see https://media.giphy.com/media/abc123/giphy.gif) wow';
    expect(extractFirstGiphyUrl(text)).toBe('https://media.giphy.com/media/abc123/giphy.gif');
  });

  test('extracts multiple urls', () => {
    const text = 'a https://giphy.com/gifs/a b https://media.giphy.com/media/b/giphy.gif';
    expect(extractGiphyUrls(text)).toEqual([
      'https://giphy.com/gifs/a',
      'https://media.giphy.com/media/b/giphy.gif',
    ]);
  });
});
