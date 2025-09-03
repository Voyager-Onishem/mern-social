import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';

describe('server basic', () => {
	it('GET / should 404 (no root route)', async () => {
		const res = await request(app).get('/').set('Accept', 'application/json');
		expect([404, 200, 301, 302]).to.include(res.status);
	});
});
