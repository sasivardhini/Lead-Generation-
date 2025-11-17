/**
 * Lead Generator Pro - Production API Server
 * Enterprise-grade lead generation platform
 *
 * Features:
 * - Email verification with A+ to F grading
 * - Lead scoring (demographic + firmographic + quality)
 * - Data enrichment (company, technographics, funding)
 * - CRM integrations (Salesforce, HubSpot, Pipedrive)
 * - Stripe subscription management
 * - Analytics and reporting
 * - Rate limiting and security
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const db = require('./config/database');
const redis = require('./config/redis');

// Route imports
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const verificationRoutes = require('./routes/verification');
const enrichmentRoutes = require('./routes/enrichment');
const exportRoutes = require('./routes/export');
const analyticsRoutes = require('./routes/analytics');
const subscriptionRoutes = require('./routes/subscriptions');
const integrationRoutes = require('./routes/integrations');
const webhookRoutes = require('./routes/webhooks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware Configuration
// ============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    const redisStatus = await redis.ping();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      services: {
        database: 'connected',
        redis: redisStatus === 'PONG' ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// API version prefix
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/leads`, leadsRoutes);
app.use(`${API_PREFIX}/verify`, verificationRoutes);
app.use(`${API_PREFIX}/enrich`, enrichmentRoutes);
app.use(`${API_PREFIX}/export`, exportRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/subscriptions`, subscriptionRoutes);
app.use(`${API_PREFIX}/integrations`, integrationRoutes);
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);

// API documentation
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    name: 'Lead Generator Pro API',
    version: process.env.API_VERSION || 'v1',
    description: 'Enterprise lead generation and verification platform',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      leads: `${API_PREFIX}/leads`,
      verification: `${API_PREFIX}/verify`,
      enrichment: `${API_PREFIX}/enrich`,
      export: `${API_PREFIX}/export`,
      analytics: `${API_PREFIX}/analytics`,
      subscriptions: `${API_PREFIX}/subscriptions`,
      integrations: `${API_PREFIX}/integrations`,
      webhooks: `${API_PREFIX}/webhooks`
    },
    documentation: 'https://docs.leadgenpro.com/api',
    support: 'support@leadgenpro.com'
  });
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: isDevelopment ? err.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('✓ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✓ Redis connected');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`✓ API endpoint: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`✓ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.end();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await db.end();
  await redis.quit();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
