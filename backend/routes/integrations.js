/**
 * CRM Integration Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireTier } = require('../middleware/auth');

router.get('/', authenticate, requireTier('pro'), async (req, res) => {
  res.json({ success: true, integrations: [] });
});

module.exports = router;
