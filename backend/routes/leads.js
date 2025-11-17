/**
 * Leads Routes
 * Create, retrieve, update, delete leads
 */

const express = require('express');
const router = express.Router();
const { authenticate, checkQuota, updateUsage } = require('../middleware/auth');
const leadScoringService = require('../services/LeadScoringService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/v1/leads
 * Create new lead
 */
router.post('/', authenticate, checkQuota('extract'), async (req, res) => {
  try {
    const userId = req.user.id;
    const lead = req.body;

    // Validate required fields
    if (!lead.email && !lead.phone) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'At least email or phone is required'
      });
    }

    // Insert lead
    const result = await db.query(
      `INSERT INTO leads (
        user_id, first_name, last_name, full_name, email, phone, title,
        company_name, company_domain, company_size, company_industry,
        linkedin_url, twitter_url, github_url, location, source_url, source_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        userId,
        lead.firstName || lead.first_name,
        lead.lastName || lead.last_name,
        lead.fullName || lead.full_name || `${lead.firstName} ${lead.lastName}`.trim(),
        lead.email,
        lead.phone,
        lead.title,
        lead.companyName || lead.company_name,
        lead.companyDomain || lead.company_domain,
        lead.companySize || lead.company_size,
        lead.companyIndustry || lead.company_industry,
        lead.linkedinUrl || lead.linkedin_url,
        lead.twitterUrl || lead.twitter_url,
        lead.githubUrl || lead.github_url,
        lead.location,
        lead.sourceUrl || lead.source_url,
        lead.sourceType || lead.source_type || 'manual'
      ]
    );

    const newLead = result.rows[0];

    // Calculate lead score
    const scoring = leadScoringService.score(newLead);

    // Update lead with scores
    await db.query(
      `UPDATE leads
       SET lead_score = $1, demographic_score = $2, firmographic_score = $3,
           quality_score = $4, engagement_score = $5
       WHERE id = $6`,
      [
        scoring.leadScore,
        scoring.breakdown.demographic,
        scoring.breakdown.firmographic,
        scoring.breakdown.quality,
        scoring.breakdown.engagement,
        newLead.id
      ]
    );

    // Update usage counter
    await updateUsage(userId, 'extract');

    // Track action
    await db.query(
      `INSERT INTO usage_tracking (user_id, action_type, resource_type, resource_id, success)
       VALUES ($1, 'extract', 'lead', $2, true)`,
      [userId, newLead.id]
    );

    logger.info(`Lead created: ${newLead.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: {
        ...newLead,
        scoring
      }
    });

  } catch (error) {
    logger.error('Create lead error:', error);

    // Track failure
    await db.query(
      `INSERT INTO usage_tracking (user_id, action_type, resource_type, success, error_message)
       VALUES ($1, 'extract', 'lead', false, $2)`,
      [req.user.id, error.message]
    ).catch(() => {});

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create lead'
    });
  }
});

/**
 * POST /api/v1/leads/bulk
 * Create multiple leads
 */
router.post('/bulk', authenticate, checkQuota('extract'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Leads array is required'
      });
    }

    const created = [];
    const errors = [];

    for (const lead of leads) {
      try {
        const result = await db.query(
          `INSERT INTO leads (
            user_id, first_name, last_name, email, phone, title,
            company_name, company_domain, source_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            userId,
            lead.firstName,
            lead.lastName,
            lead.email,
            lead.phone,
            lead.title,
            lead.companyName,
            lead.companyDomain,
            lead.sourceType || 'import'
          ]
        );

        const newLead = result.rows[0];

        // Score lead
        const scoring = leadScoringService.score(newLead);
        await db.query(
          `UPDATE leads SET lead_score = $1 WHERE id = $2`,
          [scoring.leadScore, newLead.id]
        );

        created.push(newLead);

      } catch (error) {
        errors.push({
          lead,
          error: error.message
        });
      }
    }

    // Update usage
    await updateUsage(userId, 'extract', created.length);

    logger.info(`Bulk lead creation: ${created.length} created, ${errors.length} errors`);

    res.status(201).json({
      success: true,
      message: `Created ${created.length} leads`,
      created: created.length,
      errors: errors.length,
      leads: created,
      ...(errors.length > 0 && { failedLeads: errors })
    });

  } catch (error) {
    logger.error('Bulk create error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Bulk creation failed'
    });
  }
});

/**
 * GET /api/v1/leads
 * Get all leads for user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      status,
      minScore,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = 'SELECT * FROM leads WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (minScore) {
      query += ` AND lead_score >= $${paramIndex}`;
      params.push(parseInt(minScore));
      paramIndex++;
    }

    if (search) {
      query += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      query.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    // Get leads
    const result = await db.query(query, params);

    res.json({
      success: true,
      leads: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get leads'
    });
  }
});

/**
 * GET /api/v1/leads/:id
 * Get single lead
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM leads WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead: result.rows[0]
    });

  } catch (error) {
    logger.error('Get lead error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get lead'
    });
  }
});

/**
 * PATCH /api/v1/leads/:id
 * Update lead
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const leadId = req.params.id;
    const userId = req.user.id;
    const updates = req.body;

    // Check ownership
    const checkResult = await db.query(
      'SELECT id FROM leads WHERE id = $1 AND user_id = $2',
      [leadId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    // Build update query
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'title',
      'company_name', 'company_domain', 'location', 'status', 'notes', 'tags'
    ];

    const setClause = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No valid fields to update'
      });
    }

    params.push(leadId);

    // Update lead
    const result = await db.query(
      `UPDATE leads SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    logger.info(`Lead updated: ${leadId}`);

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead: result.rows[0]
    });

  } catch (error) {
    logger.error('Update lead error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update lead'
    });
  }
});

/**
 * DELETE /api/v1/leads/:id
 * Delete lead
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM leads WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    logger.info(`Lead deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    logger.error('Delete lead error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete lead'
    });
  }
});

/**
 * GET /api/v1/leads/stats
 * Get lead statistics
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await db.query(
      `SELECT
        COUNT(*) as total_leads,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as last_30_days,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_leads,
        COUNT(CASE WHEN enriched = true THEN 1 END) as enriched_leads,
        AVG(lead_score) as avg_lead_score,
        COUNT(CASE WHEN lead_score >= 80 THEN 1 END) as high_quality_leads
       FROM leads WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      stats: stats.rows[0]
    });

  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get statistics'
    });
  }
});

module.exports = router;
