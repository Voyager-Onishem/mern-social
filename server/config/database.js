// Database configuration
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database configuration based on environment
 */
export const databaseConfig = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Connection URLs
  atlasUrl: process.env.MONGO_URL,
  localUrl: process.env.LOCAL_MONGO_URL || 'mongodb://localhost:27017/mern-social',
  
  // Connection behavior
  allowFallback: process.env.ALLOW_DB_FALLBACK !== 'false', // Default to true, can disable with env var
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  
  // Connection options
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  
  /**
   * Get recommended connection strategy for current environment
   */
  getStrategy() {
    const env = this.nodeEnv;
    
    if (env === 'production') {
      return {
        allowFallback: false,
        preferredSource: 'atlas',
        strictMode: true,
        description: 'Production mode: Atlas required, no fallbacks'
      };
    }
    
    if (env === 'test') {
      return {
        allowFallback: true,
        preferredSource: 'memory',
        strictMode: false,
        description: 'Test mode: Always use in-memory database'
      };
    }
    
    // Development
    return {
      allowFallback: this.allowFallback,
      preferredSource: this.atlasUrl ? 'atlas' : 'local',
      strictMode: false,
      description: 'Development mode: Try Atlas/local, fallback to memory if needed'
    };
  },
  
  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    const strategy = this.getStrategy();
    
    // Production must have Atlas URL
    if (this.nodeEnv === 'production' && !this.atlasUrl) {
      errors.push('MONGO_URL is required in production environment');
    }
    
    // Validate timeout
    if (this.connectionTimeout < 1000) {
      errors.push(`DB_CONNECTION_TIMEOUT too low (${this.connectionTimeout}ms). Minimum: 1000ms`);
    }
    
    // Warn about fallback in production
    if (this.nodeEnv === 'production' && this.allowFallback) {
      errors.push('ALLOW_DB_FALLBACK should be false in production');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strategy
    };
  }
};

/**
 * Print database configuration status
 */
export function printDatabaseConfig() {
  const config = databaseConfig;
  const validation = config.validate();
  
  console.log('\n=== Database Configuration ===');
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Atlas URL: ${config.atlasUrl ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Local URL: ${config.localUrl}`);
  console.log(`Allow Fallback: ${config.allowFallback}`);
  console.log(`Connection Timeout: ${config.connectionTimeout}ms`);
  console.log(`Strategy: ${validation.strategy.description}`);
  
  if (!validation.isValid) {
    console.log('\n⚠️  Configuration Issues:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('==============================\n');
  
  return validation;
}
