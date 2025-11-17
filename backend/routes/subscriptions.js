/**
 * Subscription Routes
 * Stripe integration for managing subscriptions
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /api/v1/subscriptions/tiers
 * Get available subscription tiers
 */
router.get('/tiers', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscription_tiers WHERE is_active = true ORDER BY price_monthly ASC'
    );

    res.json({
      success: true,
      tiers: result.rows
    });

  } catch (error) {
    logger.error('Get tiers error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get subscription tiers'
    });
  }
});

/**
 * POST /api/v1/subscriptions/create
 * Create new subscription
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { tier, paymentMethodId } = req.body;
    const userId = req.user.id;

    // Get user
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Get tier information
    const tierResult = await db.query(
      'SELECT * FROM subscription_tiers WHERE tier = $1',
      [tier]
    );

    if (tierResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscription tier not found'
      });
    }

    const tierInfo = tierResult.rows[0];

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        metadata: {
          userId: userId
        }
      });

      customerId = customer.id;

      // Update user with customer ID
      await db.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, userId]
      );
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: tierInfo.stripe_price_id // You would set this in your DB
      }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    // Save subscription to database
    await db.query(
      `INSERT INTO subscriptions (
        user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id,
        tier, status, amount, currency, interval,
        current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        subscription.id,
        customerId,
        tierInfo.stripe_price_id,
        tier,
        subscription.status,
        tierInfo.price_monthly,
        'usd',
        'month',
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000)
      ]
    );

    // Update user subscription tier
    await db.query(
      `UPDATE users
       SET subscription_tier = $1,
           subscription_status = $2,
           stripe_subscription_id = $3
       WHERE id = $4`,
      [tier, subscription.status, subscription.id, userId]
    );

    logger.info(`Subscription created: ${subscription.id} for user ${userId}`);

    res.json({
      success: true,
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        tier: tier
      }
    });

  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/subscriptions/current
 * Get current subscription
 */
router.get('/current', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription'
      });
    }

    res.json({
      success: true,
      subscription: result.rows[0]
    });

  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get subscription'
    });
  }
});

/**
 * POST /api/v1/subscriptions/cancel
 * Cancel subscription
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get active subscription
    const result = await db.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active subscription found'
      });
    }

    const subscription = result.rows[0];

    // Cancel in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update database
    await db.query(
      'UPDATE subscriptions SET canceled_at = NOW() WHERE id = $1',
      [subscription.id]
    );

    logger.info(`Subscription canceled: ${subscription.id}`);

    res.json({
      success: true,
      message: 'Subscription will be canceled at period end'
    });

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;
