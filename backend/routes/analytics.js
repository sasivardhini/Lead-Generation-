/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const db = require('../config/database');

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const stats = await db.query(
      'SELECT * FROM user_dashboard_stats WHERE user_id = $1',
      [req.user.id]
    );

    res.json({ success: true, stats: stats.rows[0] || {} });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
