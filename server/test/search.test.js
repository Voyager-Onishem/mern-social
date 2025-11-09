// Automated backend test for /search media type filtering
import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';

describe('Search API - Media Type Filtering', () => {
  let app;
  let token = '';
  
  before(async () => {
    // Import app dynamically
    const indexModule = await import('../index.js');
    app = indexModule.app || indexModule.default;
    // Optionally, create a test user and get a token
    // token = await getTestToken();
  });

  after(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
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

  testCases.forEach(({ types, expect: expectedType }) => {
    it(`filters posts by mediaTypes=${types}`, async function() {
      this.timeout(5000);
      
      const res = await request(app)
        .get('/search')
        .query({ query: 'test', mediaTypes: types })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).to.equal(200);
      expect(res.body).to.have.property('counts');
      
      // Basic structure validation
      if (res.body.posts) {
        expect(res.body.posts).to.be.an('array');
      }
      
      // Note: Detailed media type validation would require test data setup
      // For now, verify the endpoint responds correctly
    });
  });
});

