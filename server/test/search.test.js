// Automated backend test for /search media type filtering
const request = require('supertest');
const app = require('../index'); // Adjust if your Express app is exported elsewhere
const mongoose = require('mongoose');

describe('Search API - Media Type Filtering', () => {
  let token = '';
  beforeAll(async () => {
    // Optionally, create a test user and get a token
    // token = await getTestToken();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  const testCases = [
    { types: 'text', expect: 'text' },
    { types: 'image', expect: 'image' },
    { types: 'video', expect: 'video' },
    { types: 'audio', expect: 'audio' },
    { types: 'gif', expect: 'gif' },
    { types: 'image,video', expect: ['image', 'video'] },
    { types: 'text,image,video,audio,gif', expect: ['text','image','video','audio','gif'] }
  ];

  testCases.forEach(({ types, expect }) => {
    it(`filters posts by mediaTypes=${types}`, async () => {
      const res = await request(app)
        .get('/search')
        .query({ query: 'test', mediaTypes: types })
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('counts.mediaTypes');
      if (Array.isArray(expect)) {
        expect.forEach(type => {
          expect(res.body.counts.mediaTypes[type]).toBeGreaterThanOrEqual(0);
        });
      } else {
        expect(res.body.counts.mediaTypes[expect]).toBeGreaterThanOrEqual(0);
      }
      // Optionally, check that all returned posts match the filter
      if (res.body.posts.length > 0) {
        res.body.posts.forEach(post => {
          if (expect === 'text') {
            expect(post.mediaPaths.length).toBe(0);
          } else if (expect === 'image') {
            expect(post.mediaPaths.some(p => /\.(jpg|jpeg|png|webp|bmp|svg)$/i.test(p))).toBe(true);
          } else if (expect === 'video') {
            expect(post.mediaPaths.some(p => /\.(mp4|mov|avi|wmv|webm|mkv)$/i.test(p))).toBe(true);
          } else if (expect === 'audio') {
            expect(post.mediaPaths.some(p => /\.(mp3|wav|ogg|aac|flac)$/i.test(p))).toBe(true);
          } else if (expect === 'gif') {
            expect(post.mediaPaths.some(p => /\.gif$/i.test(p))).toBe(true);
          }
        });
      }
    });
  });
});
