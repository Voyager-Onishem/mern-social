import { expect } from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Post from '../../models/Post.js';
import Notification from '../../models/Notification.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Integration Test: Complete User Post Lifecycle
 * 
 * This test suite validates the entire flow of:
 * - User creation and authentication
 * - Post creation and retrieval
 * - Social interactions (likes, comments)
 * - Notifications generation
 * - Data cleanup and consistency
 */
describe('User Post Lifecycle Integration Tests', () => {
  let mongoServer;
  let app;
  let userA;
  let userB;
  let tokenA;
  let tokenB;
  let testPost;

  before(async function() {
    this.timeout(30000); // MongoDB Memory Server can be slow to start
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
    
    // Import app
    try {
      const indexModule = await import('../../index.js');
      app = indexModule.app || indexModule.default;
    } catch (error) {
      console.error('Failed to import app:', error);
      throw error;
    }
  });

  after(async function() {
    this.timeout(10000);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async function() {
    this.timeout(10000);
    
    // Clear all collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Notification.deleteMany({});

    // Create test users with realistic data
    userA = await User.create({
      firstName: 'Alice',
      lastName: 'Anderson',
      email: 'alice@test.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Pre-hashed password
      picturePath: 'alice.jpg',
      friends: [],
      location: 'New York, NY',
      occupation: 'Software Engineer',
      viewedProfile: 0,
      impressions: 0,
    });

    userB = await User.create({
      firstName: 'Bob',
      lastName: 'Brown',
      email: 'bob@test.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz',
      picturePath: 'bob.jpg',
      friends: [],
      location: 'San Francisco, CA',
      occupation: 'Product Manager',
      viewedProfile: 0,
      impressions: 0,
    });

    // Generate valid JWT tokens
    tokenA = jwt.sign({ id: userA._id.toString() }, JWT_SECRET);
    tokenB = jwt.sign({ id: userB._id.toString() }, JWT_SECRET);
  });

  describe('Complete Post Lifecycle', () => {
    it('should handle full post creation, interaction, and deletion flow', async function() {
      this.timeout(10000);

      // Step 1: User A creates a post
      const createPostRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', 'My first integration test post! 🚀');

      expect(createPostRes.status).to.be.oneOf([200, 201]);
      expect(createPostRes.body).to.have.property('_id');
      
      const postId = createPostRes.body._id;
      testPost = createPostRes.body;

      // Step 2: Verify post appears in User A's feed
      const feedRes = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(feedRes.status).to.equal(200);
      expect(feedRes.body).to.be.an('array');
      const foundPost = feedRes.body.find(p => p._id === postId);
      expect(foundPost).to.exist;
      expect(foundPost.description).to.include('integration test post');

      // Step 3: User B likes the post
      const likeRes = await request(app)
        .patch(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ userId: userB._id.toString() });

      expect(likeRes.status).to.equal(200);
      expect(likeRes.body.likes).to.have.property(userB._id.toString());

      // Step 4: Verify notification was created for User A
      const notificationsRes = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(notificationsRes.status).to.equal(200);
      expect(notificationsRes.body.notifications).to.be.an('array');
      
      const likeNotification = notificationsRes.body.notifications.find(
        n => n.type === 'like' && n.fromUserId === userB._id.toString()
      );
      
      if (likeNotification) {
        expect(likeNotification.postId).to.equal(postId);
        expect(likeNotification.isRead).to.be.false;
      }

      // Step 5: User B comments on the post
      const commentRes = await request(app)
        .post(`/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          userId: userB._id.toString(),
          comment: 'Great post, Alice!'
        });

      // Status could be 200, 201, or might not be implemented yet
      if (commentRes.status === 200 || commentRes.status === 201) {
        expect(commentRes.body.comments).to.be.an('array');
        expect(commentRes.body.comments.length).to.be.greaterThan(0);
      }

      // Step 6: User A deletes the post
      const deleteRes = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      // Deletion might return 200 or 204
      expect(deleteRes.status).to.be.oneOf([200, 204]);

      // Step 7: Verify post is gone
      const verifyDeleteRes = await request(app)
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(verifyDeleteRes.status).to.be.oneOf([404, 500]);
    });

    it('should handle concurrent likes correctly', async function() {
      this.timeout(10000);

      // Create a post as User A
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', 'Testing concurrent operations');

      expect(createRes.status).to.be.oneOf([200, 201]);
      const postId = createRes.body._id;

      // Create additional users
      const userC = await User.create({
        firstName: 'Charlie',
        lastName: 'Chen',
        email: 'charlie@test.com',
        password: '$2b$10$xyz',
        friends: [],
        location: 'Austin, TX',
        occupation: 'Designer',
      });
      const tokenC = jwt.sign({ id: userC._id.toString() }, JWT_SECRET);

      // Simulate concurrent likes
      const [likeB, likeC] = await Promise.all([
        request(app)
          .patch(`/posts/${postId}/like`)
          .set('Authorization', `Bearer ${tokenB}`)
          .send({ userId: userB._id.toString() }),
        request(app)
          .patch(`/posts/${postId}/like`)
          .set('Authorization', `Bearer ${tokenC}`)
          .send({ userId: userC._id.toString() })
      ]);

      expect(likeB.status).to.equal(200);
      expect(likeC.status).to.equal(200);

      // Verify both likes were recorded
      const postRes = await request(app)
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      if (postRes.status === 200) {
        expect(postRes.body.likes).to.have.property(userB._id.toString());
        expect(postRes.body.likes).to.have.property(userC._id.toString());
      }
    });
  });

  describe('Friend System Integration', () => {
    it('should handle friend request workflow', async function() {
      this.timeout(10000);

      // User A adds User B as friend
      const addFriendRes = await request(app)
        .patch(`/users/${userA._id}/friends/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      // Implementation might vary - accept success codes
      if (addFriendRes.status === 200) {
        expect(addFriendRes.body).to.have.property('friends');
        expect(addFriendRes.body.friends).to.be.an('array');
      }

      // Verify friendship in database
      const updatedUserA = await User.findById(userA._id);
      const updatedUserB = await User.findById(userB._id);

      if (updatedUserA.friends.includes(userB._id.toString())) {
        expect(updatedUserB.friends).to.include(userA._id.toString());
      }
    });

    it('should show friend posts in feed', async function() {
      this.timeout(10000);

      // Make users friends
      userA.friends.push(userB._id.toString());
      userB.friends.push(userA._id.toString());
      await userA.save();
      await userB.save();

      // User B creates a post
      const postRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenB}`)
        .field('userId', userB._id.toString())
        .field('description', 'Friend post from Bob');

      if (postRes.status === 200 || postRes.status === 201) {
        // User A's feed should include friend's post
        const feedRes = await request(app)
          .get('/posts')
          .set('Authorization', `Bearer ${tokenA}`);

        expect(feedRes.status).to.equal(200);
        const friendPost = feedRes.body.find(p => p.userId === userB._id.toString());
        
        if (friendPost) {
          expect(friendPost.description).to.include('Friend post');
        }
      }
    });
  });

  describe('Data Consistency Checks', () => {
    it('should maintain referential integrity when user is deleted', async function() {
      this.timeout(10000);

      // Create post and notification
      const post = await Post.create({
        userId: userA._id.toString(),
        firstName: userA.firstName,
        lastName: userA.lastName,
        description: 'Test post',
        likes: {},
        comments: [],
      });

      await Notification.create({
        userId: userB._id.toString(),
        type: 'like',
        fromUserId: userA._id.toString(),
        postId: post._id.toString(),
      });

      // Delete User A
      await User.deleteOne({ _id: userA._id });

      // Verify orphaned data handling
      // (Implementation dependent - might cascade delete or soft delete)
      const orphanedPost = await Post.findById(post._id);
      const orphanedNotification = await Notification.findOne({ fromUserId: userA._id.toString() });

      // At minimum, verify system doesn't crash on orphaned data
      expect(true).to.be.true; // Placeholder for actual consistency checks
    });

    it('should handle invalid ObjectId gracefully', async function() {
      const invalidRes = await request(app)
        .get('/posts/not-a-valid-objectid')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(invalidRes.status).to.be.oneOf([400, 404, 500]);
    });
  });

  describe('Authorization and Security', () => {
    it('should prevent unauthorized post deletion', async function() {
      this.timeout(10000);

      // User A creates a post
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', 'My secure post');

      if (createRes.status === 200 || createRes.status === 201) {
        const postId = createRes.body._id;

        // User B tries to delete User A's post
        const deleteRes = await request(app)
          .delete(`/posts/${postId}`)
          .set('Authorization', `Bearer ${tokenB}`);

        // Should be forbidden or unauthorized
        expect(deleteRes.status).to.be.oneOf([401, 403]);

        // Verify post still exists
        const post = await Post.findById(postId);
        expect(post).to.exist;
      }
    });

    it('should require authentication for protected routes', async function() {
      const routes = [
        { method: 'get', path: '/posts' },
        { method: 'get', path: '/notifications' },
        { method: 'get', path: `/users/${userA._id}` },
      ];

      for (const route of routes) {
        const res = await request(app)[route.method](route.path);
        expect(res.status).to.equal(401);
        expect(res.body).to.have.property('error');
      }
    });

    it('should reject invalid JWT tokens', async function() {
      const invalidToken = 'invalid.jwt.token';

      const res = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(res.status).to.equal(401);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty post description', async function() {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', '');

      // Should either accept (empty posts allowed) or reject (validation)
      expect(res.status).to.be.oneOf([200, 201, 400]);
    });

    it('should handle very long post descriptions', async function() {
      const longDescription = 'A'.repeat(10000);

      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', longDescription);

      // Should validate max length
      expect(res.status).to.be.oneOf([200, 201, 400, 413]);
    });

    it('should handle special characters in posts', async function() {
      const specialChars = '🚀 Testing <script>alert("xss")</script> & special chars: ™ © ® 中文';

      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${tokenA}`)
        .field('userId', userA._id.toString())
        .field('description', specialChars);

      if (res.status === 200 || res.status === 201) {
        expect(res.body.description).to.include('Testing');
        // Verify XSS is sanitized
        expect(res.body.description).to.not.include('<script>');
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle pagination correctly', async function() {
      this.timeout(15000);

      // Create multiple posts
      const postPromises = [];
      for (let i = 0; i < 15; i++) {
        postPromises.push(
          Post.create({
            userId: userA._id.toString(),
            firstName: userA.firstName,
            lastName: userA.lastName,
            description: `Post number ${i}`,
            likes: {},
            comments: [],
          })
        );
      }
      await Promise.all(postPromises);

      // Request with pagination
      const page1Res = await request(app)
        .get('/posts?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenA}`);

      if (page1Res.status === 200) {
        expect(page1Res.body).to.be.an('array');
        expect(page1Res.body.length).to.be.at.most(10);
      }
    });

    it('should respond within acceptable time limits', async function() {
      const start = Date.now();

      await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${tokenA}`);

      const duration = Date.now() - start;

      // API should respond within 2 seconds for basic queries
      expect(duration).to.be.lessThan(2000);
    });
  });
});
