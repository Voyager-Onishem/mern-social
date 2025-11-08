const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

// Import app and models
let app;
let User;
let Post;
let Notification;

describe('Notification System Integration Tests', () => {
  let mongoServer;
  let testUser1;
  let testUser2;
  let token1;
  let token2;
  let testPost;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Import models after connection
    User = require('../models/User').default;
    Post = require('../models/Post').default;
    Notification = require('../models/Notification').default;
    
    // Import app
    app = require('../index').app;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Post.deleteMany({});
    await Notification.deleteMany({});

    // Create test users
    testUser1 = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'hashedpassword',
      picturePath: 'john.jpg',
      friends: [],
      location: 'Test City',
      occupation: 'Tester',
    });

    testUser2 = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      password: 'hashedpassword',
      picturePath: 'jane.jpg',
      friends: [],
      location: 'Test City',
      occupation: 'Tester',
    });

    // Generate tokens
    token1 = jwt.sign({ id: testUser1._id.toString() }, process.env.JWT_SECRET || 'test-secret');
    token2 = jwt.sign({ id: testUser2._id.toString() }, process.env.JWT_SECRET || 'test-secret');

    // Create a test post
    testPost = await Post.create({
      userId: testUser1._id.toString(),
      firstName: testUser1.firstName,
      lastName: testUser1.lastName,
      description: 'Test post',
      picturePath: '',
      mediaPaths: [],
      likes: {},
      comments: [],
    });
  });

  describe('GET /notifications', () => {
    test('should return empty array when no notifications', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications).toEqual([]);
      expect(res.body.unreadCount).toBe(0);
    });

    test('should return user notifications', async () => {
      // Create notifications for user1
      await Notification.create({
        userId: testUser1._id.toString(),
        type: 'like',
        fromUserId: testUser2._id.toString(),
        fromUserName: 'Jane Smith',
        fromUserPicture: 'jane.jpg',
        postId: testPost._id.toString(),
        message: 'Jane Smith liked your post',
        read: false,
      });

      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications.length).toBe(1);
      expect(res.body.notifications[0].message).toBe('Jane Smith liked your post');
      expect(res.body.unreadCount).toBe(1);
    });

    test('should return notifications in reverse chronological order', async () => {
      await Notification.create({
        userId: testUser1._id.toString(),
        type: 'like',
        fromUserId: testUser2._id.toString(),
        fromUserName: 'Jane Smith',
        message: 'First notification',
        read: false,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await Notification.create({
        userId: testUser1._id.toString(),
        type: 'comment',
        fromUserId: testUser2._id.toString(),
        fromUserName: 'Jane Smith',
        message: 'Second notification',
        read: false,
      });

      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.notifications[0].message).toBe('Second notification');
      expect(res.body.notifications[1].message).toBe('First notification');
    });

    test('should count unread notifications correctly', async () => {
      await Notification.create([
        {
          userId: testUser1._id.toString(),
          type: 'like',
          fromUserId: testUser2._id.toString(),
          fromUserName: 'Jane',
          message: 'Unread 1',
          read: false,
        },
        {
          userId: testUser1._id.toString(),
          type: 'comment',
          fromUserId: testUser2._id.toString(),
          fromUserName: 'Jane',
          message: 'Unread 2',
          read: false,
        },
        {
          userId: testUser1._id.toString(),
          type: 'like',
          fromUserId: testUser2._id.toString(),
          fromUserName: 'Jane',
          message: 'Read notification',
          read: true,
        },
      ]);

      const res = await request(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.unreadCount).toBe(2);
    });
  });

  describe('PATCH /notifications/:notificationId/read', () => {
    test('should mark notification as read', async () => {
      const notification = await Notification.create({
        userId: testUser1._id.toString(),
        type: 'like',
        fromUserId: testUser2._id.toString(),
        fromUserName: 'Jane Smith',
        message: 'Test notification',
        read: false,
      });

      const res = await request(app)
        .patch(`/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.read).toBe(true);

      const updated = await Notification.findById(notification._id);
      expect(updated.read).toBe(true);
    });

    test('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .patch(`/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(404);
    });

    test('should not mark another user\'s notification as read', async () => {
      const notification = await Notification.create({
        userId: testUser2._id.toString(),
        type: 'like',
        fromUserId: testUser1._id.toString(),
        fromUserName: 'John Doe',
        message: 'Test notification',
        read: false,
      });

      const res = await request(app)
        .patch(`/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token1}`); // User1 trying to mark user2's notification

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    test('should mark all user notifications as read', async () => {
      await Notification.create([
        {
          userId: testUser1._id.toString(),
          type: 'like',
          fromUserId: testUser2._id.toString(),
          fromUserName: 'Jane',
          message: 'Notification 1',
          read: false,
        },
        {
          userId: testUser1._id.toString(),
          type: 'comment',
          fromUserId: testUser2._id.toString(),
          fromUserName: 'Jane',
          message: 'Notification 2',
          read: false,
        },
      ]);

      const res = await request(app)
        .patch('/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);

      const notifications = await Notification.find({ userId: testUser1._id.toString() });
      expect(notifications.every(n => n.read)).toBe(true);
    });

    test('should only mark current user\'s notifications', async () => {
      await Notification.create({
        userId: testUser2._id.toString(),
        type: 'like',
        fromUserId: testUser1._id.toString(),
        fromUserName: 'John',
        message: 'Other user notification',
        read: false,
      });

      await request(app)
        .patch('/notifications/read-all')
        .set('Authorization', `Bearer ${token1}`);

      const otherUserNotif = await Notification.findOne({ userId: testUser2._id.toString() });
      expect(otherUserNotif.read).toBe(false);
    });
  });

  describe('DELETE /notifications/:notificationId', () => {
    test('should delete notification', async () => {
      const notification = await Notification.create({
        userId: testUser1._id.toString(),
        type: 'like',
        fromUserId: testUser2._id.toString(),
        fromUserName: 'Jane',
        message: 'Test notification',
        read: false,
      });

      const res = await request(app)
        .delete(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    test('should not delete another user\'s notification', async () => {
      const notification = await Notification.create({
        userId: testUser2._id.toString(),
        type: 'like',
        fromUserId: testUser1._id.toString(),
        fromUserName: 'John',
        message: 'Test notification',
        read: false,
      });

      const res = await request(app)
        .delete(`/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.statusCode).toBe(404);

      const stillExists = await Notification.findById(notification._id);
      expect(stillExists).not.toBeNull();
    });
  });

  describe('Notification Triggers', () => {
    test('should create notification when post is liked', async () => {
      const res = await request(app)
        .patch(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ userId: testUser2._id.toString() });

      expect(res.statusCode).toBe(200);

      const notification = await Notification.findOne({
        userId: testUser1._id.toString(),
        type: 'like',
      });

      expect(notification).not.toBeNull();
      expect(notification.fromUserId).toBe(testUser2._id.toString());
      expect(notification.postId).toBe(testPost._id.toString());
    });

    test('should create notification when post is commented on', async () => {
      const res = await request(app)
        .post(`/posts/${testPost._id}/comment`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          userId: testUser2._id.toString(),
          text: 'Nice post!',
        });

      expect(res.statusCode).toBe(200);

      const notification = await Notification.findOne({
        userId: testUser1._id.toString(),
        type: 'comment',
      });

      expect(notification).not.toBeNull();
      expect(notification.fromUserId).toBe(testUser2._id.toString());
    });

    test('should not create notification when user likes own post', async () => {
      const res = await request(app)
        .patch(`/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: testUser1._id.toString() });

      expect(res.statusCode).toBe(200);

      const notification = await Notification.findOne({
        userId: testUser1._id.toString(),
        type: 'like',
      });

      expect(notification).toBeNull();
    });
  });
});
