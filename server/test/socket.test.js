const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { initializeSocket } = require('../config/socket');

describe('Socket.io Notification System', () => {
  let httpServer;
  let ioServer;
  let clientSocket;
  const TEST_PORT = 6002;
  const JWT_SECRET = 'test-secret';
  const userId = 'test-user-123';

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = initializeSocket(httpServer);
    httpServer.listen(TEST_PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    if (ioServer) {
      ioServer.close();
    }
    if (httpServer) {
      httpServer.close(done);
    }
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('should connect with valid token', (done) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token },
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    clientSocket.on('connect_error', (error) => {
      done(error);
    });
  });

  test('should reject connection without token', (done) => {
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: {},
    });

    clientSocket.on('connect', () => {
      done(new Error('Should not connect without token'));
    });

    clientSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication error');
      done();
    });
  });

  test('should reject connection with invalid token', (done) => {
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token: 'invalid-token' },
    });

    clientSocket.on('connect', () => {
      done(new Error('Should not connect with invalid token'));
    });

    clientSocket.on('connect_error', (error) => {
      expect(error.message).toContain('Authentication error');
      done();
    });
  });

  test('should receive notification event', (done) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token },
    });

    clientSocket.on('connect', () => {
      // Listen for notification
      clientSocket.on('notification', (data) => {
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('type');
        expect(data.message).toBe('Test notification');
        done();
      });

      // Simulate server sending notification
      setTimeout(() => {
        ioServer.to(userId).emit('notification', {
          message: 'Test notification',
          type: 'like',
          fromUserId: 'other-user',
        });
      }, 100);
    });
  });

  test('should join user room on connect', (done) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token },
    });

    clientSocket.on('connect', () => {
      // The socket should automatically join a room with the userId
      // We can test this by emitting to that room
      clientSocket.on('test-room', (data) => {
        expect(data.message).toBe('Room test');
        done();
      });

      setTimeout(() => {
        ioServer.to(userId).emit('test-room', { message: 'Room test' });
      }, 100);
    });
  });

  test('should handle disconnect', (done) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token },
    });

    clientSocket.on('connect', () => {
      clientSocket.disconnect();
    });

    clientSocket.on('disconnect', (reason) => {
      expect(reason).toBeDefined();
      done();
    });
  });

  test('should not receive notifications meant for other users', (done) => {
    const token1 = jwt.sign({ id: 'user-1' }, JWT_SECRET);
    const token2 = jwt.sign({ id: 'user-2' }, JWT_SECRET);
    
    const client1 = io(`http://localhost:${TEST_PORT}`, {
      auth: { token: token1 },
    });

    const client2 = io(`http://localhost:${TEST_PORT}`, {
      auth: { token: token2 },
    });

    let client1Received = false;
    let client2Received = false;

    client1.on('connect', () => {
      client1.on('notification', () => {
        client1Received = true;
      });
    });

    client2.on('connect', () => {
      client2.on('notification', (data) => {
        client2Received = true;
        expect(data.message).toBe('For user 2 only');
        
        setTimeout(() => {
          expect(client1Received).toBe(false);
          expect(client2Received).toBe(true);
          
          client1.disconnect();
          client2.disconnect();
          done();
        }, 200);
      });

      // Send notification only to user-2
      setTimeout(() => {
        ioServer.to('user-2').emit('notification', {
          message: 'For user 2 only',
          type: 'like',
        });
      }, 100);
    });
  });

  test('should maintain connection with ping/pong', (done) => {
    const token = jwt.sign({ id: userId }, JWT_SECRET);
    
    clientSocket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token },
    });

    let pongReceived = false;

    clientSocket.on('connect', () => {
      clientSocket.on('pong', () => {
        pongReceived = true;
      });

      // Manually send ping
      clientSocket.emit('ping');

      setTimeout(() => {
        expect(pongReceived).toBe(true);
        done();
      }, 500);
    });
  });
});
