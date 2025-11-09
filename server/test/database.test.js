// Database service tests
import { expect } from 'chai';
import mongoose from 'mongoose';
import { DatabaseService } from '../services/database.js';

describe('DatabaseService', () => {
  let dbService;
  let originalEnv;
  
  beforeEach(() => {
    dbService = new DatabaseService();
    // Save original env
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(async () => {
    await dbService.disconnect();
    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  describe('Test Environment', () => {
    it('should use in-memory database in test mode', async () => {
      const connectionType = await dbService.connect();
      
      expect(connectionType).toBe('memory');
      expect(dbService.isConnected).toBe(true);
      expect(dbService.memoryServer).toBeDefined();
    });

    it('should be ready after connection', async () => {
      await dbService.connect();
      
      expect(dbService.isReady()).toBe(true);
      expect(dbService.getConnectionType()).toBe('memory');
    });
  });

  describe('Connection Status', () => {
    it('should return correct status', async () => {
      await dbService.connect();
      const status = dbService.getStatus();
      
      expect(status).toEqual({
        isConnected: true,
        connectionType: 'memory',
        nodeEnv: 'test',
        mongooseState: 1, // connected
        stateText: 'connected'
      });
    });

    it('should return disconnected status initially', () => {
      const status = dbService.getStatus();
      
      expect(status.isConnected).toBe(false);
      expect(status.connectionType).toBe(null);
    });
  });

  describe('Singleton Pattern', () => {
    it('should not reconnect if already connected', async () => {
      const firstConnect = await dbService.connect();
      const secondConnect = await dbService.connect();
      
      expect(firstConnect).toBe('memory');
      expect(secondConnect).toBe('memory');
      expect(dbService.isConnected).toBe(true);
    });
  });

  describe('Disconnect', () => {
    it('should disconnect successfully', async () => {
      await dbService.connect();
      expect(dbService.isConnected).toBe(true);
      
      await dbService.disconnect();
      
      expect(dbService.isConnected).toBe(false);
      expect(dbService.connectionType).toBe(null);
      expect(dbService.memoryServer).toBe(null);
    });

    it('should handle disconnect when not connected', async () => {
      await expect(dbService.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Production Environment', () => {
    it('should require MONGO_URL in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      delete process.env.MONGO_URL;
      
      const newService = new DatabaseService();
      
      await expect(newService.connect()).rejects.toThrow(
        'MONGO_URL is required in production environment'
      );
    });

    it('should not allow fallback in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URL = 'mongodb://invalid-url';
      
      const newService = new DatabaseService();
      
      try {
        await newService.connect();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.exist;
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should throw error when no MONGO_URL and fallback disabled', async () => {
      const originalUrl = process.env.MONGO_URL;
      delete process.env.MONGO_URL;
      const newService = new DatabaseService();
      
      try {
        await newService.connect({ allowFallback: false });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('MONGO_URL not configured');
      } finally {
        if (originalUrl) process.env.MONGO_URL = originalUrl;
      }
    });

    it('should use in-memory when fallback allowed and no MONGO_URL', async () => {
      const originalUrl = process.env.MONGO_URL;
      delete process.env.MONGO_URL;
      const newService = new DatabaseService();
      
      const connectionType = await newService.connect({ allowFallback: true });
      
      expect(connectionType).to.equal('memory');
      
      await newService.disconnect();
      if (originalUrl) process.env.MONGO_URL = originalUrl;
    });
  });

  describe('Connection Timeout', () => {
    it.skip('should respect custom timeout', async function() {
      this.timeout(10000);
      const originalEnv = process.env.NODE_ENV;
      const originalUrl = process.env.MONGO_URL;
      
      process.env.NODE_ENV = 'development';
      process.env.MONGO_URL = 'mongodb://invalid-url-that-will-timeout';
      
      const newService = new DatabaseService();
      const startTime = Date.now();
      
      try {
        await newService.connect({
          allowFallback: false,
          timeout: 2000 // 2 seconds
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        // Should timeout around 2000ms (allow some margin)
        expect(elapsed).to.be.greaterThan(1500);
        expect(elapsed).to.be.lessThan(4000);
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalUrl) process.env.MONGO_URL = originalUrl;
      }
    });
  });
});

describe('Database Configuration', () => {
  it('should import database config', async () => {
    const { databaseConfig, printDatabaseConfig } = await import('../config/database.js');
    
    expect(databaseConfig).to.exist;
    expect(databaseConfig.nodeEnv).to.exist;
    expect(printDatabaseConfig).to.be.a('function');
  });
});
