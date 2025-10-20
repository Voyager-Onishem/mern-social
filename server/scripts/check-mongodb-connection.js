// MongoDB Connection Test Script
// This script helps diagnose MongoDB connection issues

import mongoose from 'mongoose';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file in parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Helper function to get IP address
async function getPublicIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting public IP address:', error.message);
    return 'unknown';
  }
}

// Helper function to extract cluster info from connection string
function getClusterInfo(connectionString) {
  try {
    // Extract the hostname from the connection string
    const matches = connectionString.match(/mongodb\+srv:\/\/[^:]+:[^@]+@([^\/\?]+)/);
    if (matches && matches[1]) {
      return {
        hostname: matches[1],
        clusterName: matches[1].split('.')[0]
      };
    }
    return { hostname: 'unknown', clusterName: 'unknown' };
  } catch (error) {
    return { hostname: 'unknown', clusterName: 'unknown' };
  }
}

// Main function to check MongoDB connection
async function checkMongoDBConnection() {
  console.log(chalk.blue('=== MongoDB Connection Diagnostics ==='));

  const mongoUrl = process.env.MONGO_URL;
  
  if (!mongoUrl) {
    console.log(chalk.red('❌ Error: MONGO_URL environment variable is not set'));
    console.log('Please add your MongoDB connection string to the .env file:');
    console.log(chalk.gray('MONGO_URL=mongodb+srv://<username>:<password>@<cluster-url>/...'));
    return;
  }

  console.log(chalk.gray('Using MongoDB connection string from .env file'));
  
  const { hostname, clusterName } = getClusterInfo(mongoUrl);
  console.log(chalk.gray(`Cluster hostname: ${hostname}`));
  console.log(chalk.gray(`Cluster name: ${clusterName}`));
  
  // Get public IP
  const publicIp = await getPublicIpAddress();
  console.log(chalk.cyan(`📡 Your current public IP address: ${publicIp}`));
  console.log(chalk.yellow('⚠️ Make sure this IP is whitelisted in MongoDB Atlas'));
  console.log(chalk.gray('   You can whitelist IPs at: https://cloud.mongodb.com/v2/security/network/accessList'));

  // Attempt MongoDB connection
  console.log(chalk.blue('\n--- Connection Test ---'));
  console.log('Attempting to connect to MongoDB...');
  
  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log(chalk.green('✅ Connection successful!'));
    
    // Check if connected to Atlas or elsewhere
    const admin = mongoose.connection.db.admin();
    const serverInfo = await admin.serverInfo();
    
    console.log(chalk.green(`Connected to MongoDB server version: ${serverInfo.version}`));
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    console.log(chalk.green(`Database: ${mongoose.connection.db.databaseName}`));
    console.log(chalk.green(`Collections: ${dbStats.collections}`));
    console.log(chalk.green(`Documents: ${dbStats.objects}`));
    
  } catch (error) {
    console.log(chalk.red(`❌ Connection failed: ${error.message}`));
    
    // Provide helpful advice based on error message
    if (error.message.includes('authentication failed')) {
      console.log(chalk.yellow('This looks like an authentication error. Check your username and password in the connection string.'));
    } else if (error.message.includes('timed out')) {
      console.log(chalk.yellow('Connection timed out. This could be due to:'));
      console.log('1. Your IP address not being whitelisted in MongoDB Atlas');
      console.log('2. Network connectivity issues');
      console.log('3. Firewall blocking the connection');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log(chalk.yellow('Could not resolve the MongoDB hostname. Check your connection string.'));
    }
    
    console.log(chalk.blue('\n--- Troubleshooting Steps ---'));
    console.log('1. Verify your MongoDB Atlas cluster is active');
    console.log(`2. Add your IP address (${publicIp}) to the MongoDB Atlas IP whitelist`);
    console.log('3. Check your network connection and firewall settings');
    console.log('4. Verify your username and password in the connection string');
    console.log('5. Make sure your MongoDB Atlas cluster has not been deleted or paused');
  } finally {
    try {
      await mongoose.disconnect();
      console.log(chalk.gray('Disconnected from MongoDB'));
    } catch (err) {
      // Ignore disconnect errors
    }
  }
}

checkMongoDBConnection().catch(console.error);