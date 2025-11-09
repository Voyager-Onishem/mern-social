// Database connection service with clear, configurable behavior
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  constructor() {
    this.connection = null;
    this.memoryServer = null;
    this.connectionType = null;
    this.isConnected = false;
  }

  /**
   * Connect to database based on configuration
   * @param {Object} options - Connection options
   * @param {boolean} options.allowFallback - Allow fallback to in-memory (default: false)
   * @param {number} options.timeout - Connection timeout in ms (default: 10000)
   * @returns {Promise<string>} Connection type ('atlas', 'local', 'memory')
   */
  async connect(options = {}) {
    const {
      allowFallback = false,
      timeout = 10000
    } = options;

    // If already connected, return existing connection
    if (this.isConnected) {
      console.log(`Already connected to ${this.connectionType} database`);
      return this.connectionType;
    }

    const mongoUrl = process.env.MONGO_URL;
    const nodeEnv = process.env.NODE_ENV || 'development';

    // TEST ENVIRONMENT: Always use in-memory
    if (nodeEnv === 'test') {
      return await this.connectToMemory();
    }

    // PRODUCTION: Strict mode - no fallbacks allowed
    if (nodeEnv === 'production') {
      if (!mongoUrl) {
        throw new Error('MONGO_URL is required in production environment');
      }
      return await this.connectToAtlas(mongoUrl, timeout);
    }

    // DEVELOPMENT: Try Atlas first, then local, then memory (if allowed)
    if (mongoUrl) {
      try {
        return await this.connectToAtlas(mongoUrl, timeout);
      } catch (error) {
        console.warn('Atlas connection failed:', error.message);
        
        if (allowFallback) {
          console.log('Attempting fallback to local MongoDB...');
          try {
            return await this.connectToLocal(timeout);
          } catch (localError) {
            console.warn('Local MongoDB connection failed:', localError.message);
            console.log('Falling back to in-memory database...');
            return await this.connectToMemory();
          }
        } else {
          throw error;
        }
      }
    } else {
      // No MONGO_URL provided
      if (allowFallback) {
        console.log('No MONGO_URL configured, trying local MongoDB...');
        try {
          return await this.connectToLocal(timeout);
        } catch (localError) {
          console.warn('Local MongoDB connection failed:', localError.message);
          console.log('Falling back to in-memory database...');
          return await this.connectToMemory();
        }
      } else {
        throw new Error('MONGO_URL not configured. Set MONGO_URL environment variable or enable fallback mode.');
      }
    }
  }

  /**
   * Connect to MongoDB Atlas (cloud)
   */
  async connectToAtlas(mongoUrl, timeout) {
    console.log('Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: timeout,
    });
    
    this.connectionType = 'atlas';
    this.isConnected = true;
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    return this.connectionType;
  }

  /**
   * Connect to local MongoDB
   */
  async connectToLocal(timeout) {
    const localMongoUrl = process.env.LOCAL_MONGO_URL || 'mongodb://localhost:27017/mern-social';
    console.log('Connecting to local MongoDB...');
    
    await mongoose.connect(localMongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: timeout,
    });
    
    this.connectionType = 'local';
    this.isConnected = true;
    console.log('✅ Successfully connected to local MongoDB');
    
    return this.connectionType;
  }

  /**
   * Connect to in-memory MongoDB (for testing/development)
   */
  async connectToMemory() {
    console.log('Starting in-memory MongoDB server...');
    
    this.memoryServer = await MongoMemoryServer.create();
    const memoryUri = this.memoryServer.getUri();
    
    await mongoose.connect(memoryUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    this.connectionType = 'memory';
    this.isConnected = true;
    console.log('⚠️  Connected to in-memory MongoDB (data will be lost on restart)');
    
    // Setup cleanup on process exit
    const cleanup = async () => {
      await this.disconnect();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    return this.connectionType;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
      }
      
      if (this.memoryServer) {
        await this.memoryServer.stop();
        console.log('In-memory MongoDB server stopped');
      }
      
      this.isConnected = false;
      this.connectionType = null;
      this.memoryServer = null;
    } catch (error) {
      console.error('Error during database disconnect:', error);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
      nodeEnv: process.env.NODE_ENV || 'development',
      mongooseState: mongoose.connection.readyState,
      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
    };
  }

  /**
   * Check if database is ready
   */
  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection type
   */
  getConnectionType() {
    return this.connectionType;
  }
}

// Export singleton instance
export const database = new DatabaseService();

// Export class for testing
export { DatabaseService };
