/**
 * PostgreSQL Database Configuration
 * Connection pool management with automatic reconnection
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'leadgen_pro',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection event handlers
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

// Query helper with logging
pool.query = (function(originalQuery) {
  return async function(...args) {
    const start = Date.now();
    try {
      const result = await originalQuery.apply(pool, args);
      const duration = Date.now() - start;
      logger.debug('Query executed', {
        text: args[0].substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
      return result;
    } catch (error) {
      logger.error('Database query error:', {
        query: args[0].substring(0, 100),
        error: error.message
      });
      throw error;
    }
  };
})(pool.query);

module.exports = pool;
