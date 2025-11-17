/**
 * Authentication Routes
 * User registration, login, password reset
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, companyName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, company_name, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, subscription_tier, created_at`,
      [email, passwordHash, firstName, lastName, companyName, crypto.randomBytes(32).toString('hex')]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Get user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        subscriptionTier: user.subscription_tier,
        subscriptionStatus: user.subscription_status
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, company_name, role,
              subscription_tier, subscription_status, created_at, last_login_at,
              email_verified
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user'
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticate, (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      token
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
});

module.exports = router;
