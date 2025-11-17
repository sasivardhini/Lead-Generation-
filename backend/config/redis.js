/**
 * Redis Cache Configuration
 * Used for caching verification results, API responses, and session data
 */

const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

client.on('connect', () => {
  logger.info('✓ Redis client connected');
});

client.on('ready', () => {
  logger.info('✓ Redis client ready');
});

client.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

// Promisified helper methods
const redisHelpers = {
  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with optional expiration
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  /**
   * Delete key from cache
   * @param {string} key
   */
  async del(key) {
    try {
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   * @param {string} key
   */
  async exists(key) {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  /**
   * Increment counter
   * @param {string} key
   */
  async incr(key) {
    try {
      return await client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return 0;
    }
  },

  /**
   * Get remaining TTL for key
   * @param {string} key
   */
  async ttl(key) {
    try {
      return await client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error:', error);
      return -1;
    }
  }
};

// Connect to Redis
(async () => {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
})();

module.exports = {
  client,
  ...redisHelpers,
  ping: () => client.ping()
};
