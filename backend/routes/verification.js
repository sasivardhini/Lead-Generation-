/**
 * Email Verification Routes
 * Verify emails with A+ to F grading
 */

const express = require('express');
const router = express.Router();
const { authenticate, checkQuota, updateUsage, requireTier } = require('../middleware/auth');
const emailVerificationService = require('../services/EmailVerificationService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/v1/verify/email
 * Verify single email
 */
router.post('/email', authenticate, checkQuota('verify'), async (req, res) => {
  try {
    const { email, leadId } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    // Verify email
    const result = await emailVerificationService.verify(email);

    // Save verification result
    await db.query(
      `INSERT INTO email_verifications (
        user_id, lead_id, email, status, score, grade,
        format_valid, mx_records_valid, smtp_valid,
        is_disposable, is_role_based, is_free_provider, is_catch_all,
        provider, domain, suggestion, reason, response_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        req.user.id,
        leadId || null,
        result.email,
        result.status,
        result.score,
        result.grade,
        result.checks.formatValid,
        result.checks.mxRecordsValid,
        result.checks.smtpValid,
        result.checks.isDisposable,
        result.checks.isRoleBased,
        result.checks.isFreeProvider,
        result.checks.isCatchAll,
        result.details.provider,
        result.details.domain,
        result.details.suggestion,
        result.details.reason,
        result.metadata.responseTimeMs
      ]
    );

    // Update lead if leadId provided
    if (leadId) {
      await db.query(
        `UPDATE leads
         SET email_verified = $1,
             email_verification_status = $2,
             email_verification_score = $3,
             email_verification_grade = $4,
             verified_at = NOW()
         WHERE id = $5 AND user_id = $6`,
        [
          result.status === 'valid',
          result.status,
          result.score,
          result.grade,
          leadId,
          req.user.id
        ]
      );
    }

    // Update usage
    await updateUsage(req.user.id, 'verify');

    logger.info(`Email verified: ${email} - ${result.grade} (${result.score}/100)`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      result
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Verification failed'
    });
  }
});

/**
 * POST /api/v1/verify/bulk
 * Verify multiple emails
 */
router.post('/bulk', authenticate, requireTier('pro'), checkQuota('verify'), async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Emails array is required'
      });
    }

    // Verify all emails
    const results = await emailVerificationService.verifyBulk(emails);

    // Save results
    for (const result of results) {
      await db.query(
        `INSERT INTO email_verifications (
          user_id, email, status, score, grade,
          format_valid, mx_records_valid, smtp_valid,
          is_disposable, is_role_based, is_free_provider, is_catch_all,
          provider, domain, reason, response_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          req.user.id,
          result.email,
          result.status,
          result.score,
          result.grade,
          result.checks.formatValid,
          result.checks.mxRecordsValid,
          result.checks.smtpValid,
          result.checks.isDisposable,
          result.checks.isRoleBased,
          result.checks.isFreeProvider,
          result.checks.isCatchAll,
          result.details.provider,
          result.details.domain,
          result.details.reason,
          result.metadata.responseTimeMs
        ]
      );
    }

    // Update usage
    await updateUsage(req.user.id, 'verify', results.length);

    logger.info(`Bulk verification: ${results.length} emails verified`);

    res.json({
      success: true,
      message: `Verified ${results.length} emails`,
      results
    });

  } catch (error) {
    logger.error('Bulk verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Bulk verification failed'
    });
  }
});

/**
 * GET /api/v1/verify/history
 * Get verification history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT * FROM email_verifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM email_verifications WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      verifications: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });

  } catch (error) {
    logger.error('Get verification history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get history'
    });
  }
});

module.exports = router;
