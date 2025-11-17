/**
 * Webhook Routes (Stripe, etc.)
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info(`Stripe webhook received: ${event.type}`);

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle successful payment
        break;
      case 'customer.subscription.updated':
        // Handle subscription update
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

module.exports = router;
