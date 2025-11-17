/**
 * Authentication Middleware
 * JWT-based authentication with role-based access control
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await db.query(
      'SELECT id, email, role, subscription_tier, subscription_status FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive'
      });
    }

    // Attach user to request
    req.user = result.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Check subscription tier
 */
function requireTier(minTier) {
  const tierLevels = {
    'free': 0,
    'starter': 1,
    'pro': 2,
    'business': 3,
    'enterprise': 4
  };

  return (req, res, next) => {
    const userTier = req.user.subscription_tier || 'free';
    const userLevel = tierLevels[userTier] || 0;
    const requiredLevel = tierLevels[minTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This feature requires ${minTier} tier or higher`,
        currentTier: userTier,
        requiredTier: minTier
      });
    }

    next();
  };
}

/**
 * Check user role
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
}

/**
 * Check usage quota
 */
async function checkQuota(action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const tier = req.user.subscription_tier || 'free';
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Get or create monthly usage record
      let usage = await db.query(
        'SELECT * FROM monthly_usage WHERE user_id = $1 AND year = $2 AND month = $3',
        [userId, year, month]
      );

      if (usage.rows.length === 0) {
        // Create new usage record
        const limits = await getSubscriptionLimits(tier);
        await db.query(
          `INSERT INTO monthly_usage
           (user_id, year, month, leads_limit, verifications_limit, enrichments_limit)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, year, month, limits.leads, limits.verifications, limits.enrichments]
        );

        usage = await db.query(
          'SELECT * FROM monthly_usage WHERE user_id = $1 AND year = $2 AND month = $3',
          [userId, year, month]
        );
      }

      const currentUsage = usage.rows[0];

      // Check quota based on action
      let exceeded = false;
      let currentCount = 0;
      let limit = 0;

      switch (action) {
        case 'extract':
          currentCount = currentUsage.leads_extracted;
          limit = currentUsage.leads_limit;
          exceeded = currentCount >= limit;
          break;
        case 'verify':
          currentCount = currentUsage.emails_verified;
          limit = currentUsage.verifications_limit;
          exceeded = currentCount >= limit;
          break;
        case 'enrich':
          currentCount = currentUsage.leads_enriched;
          limit = currentUsage.enrichments_limit;
          exceeded = currentCount >= limit;
          break;
      }

      if (exceeded) {
        return res.status(429).json({
          error: 'Quota Exceeded',
          message: `Monthly ${action} limit reached`,
          usage: {
            current: currentCount,
            limit: limit,
            tier: tier
          },
          upgradeUrl: '/subscriptions/upgrade'
        });
      }

      // Attach usage to request for later update
      req.usage = currentUsage;
      next();

    } catch (error) {
      logger.error('Quota check error:', error);
      next(error);
    }
  };
}

/**
 * Update usage counter
 */
async function updateUsage(userId, action, count = 1) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const fields = {
    'extract': 'leads_extracted',
    'verify': 'emails_verified',
    'enrich': 'leads_enriched',
    'export': 'exports_created',
    'api': 'api_calls'
  };

  const field = fields[action];
  if (!field) return;

  await db.query(
    `UPDATE monthly_usage
     SET ${field} = ${field} + $1, updated_at = NOW()
     WHERE user_id = $2 AND year = $3 AND month = $4`,
    [count, userId, year, month]
  );
}

/**
 * Get subscription limits
 */
async function getSubscriptionLimits(tier) {
  const result = await db.query(
    'SELECT leads_limit, verifications_limit, enrichments_limit FROM subscription_tiers WHERE tier = $1',
    [tier]
  );

  if (result.rows.length === 0) {
    // Default to free tier
    return {
      leads: 25,
      verifications: 25,
      enrichments: 0
    };
  }

  return {
    leads: result.rows[0].leads_limit,
    verifications: result.rows[0].verifications_limit,
    enrichments: result.rows[0].enrichments_limit
  };
}

module.exports = {
  authenticate,
  requireTier,
  requireRole,
  checkQuota,
  updateUsage
};
