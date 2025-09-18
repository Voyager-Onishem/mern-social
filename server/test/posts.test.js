import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function makeToken(id = '507f1f77bcf86cd799439011') {
  return jwt.sign({ id }, JWT_SECRET);
}

describe('posts routes', () => {
  it('rejects unauthorized access', async () => {
    const res = await request(app).get('/posts');
    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error');
  });

  it('returns empty feed initially with auth', async () => {
    const token = makeToken();
    const res = await request(app).get('/posts').set('Authorization', `Bearer ${token}`);
    // May be 200 with [] or 200 with array
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('fails create without userId', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .field('description', 'missing userId');
    expect([400,500]).to.include(res.status);
  });
});
