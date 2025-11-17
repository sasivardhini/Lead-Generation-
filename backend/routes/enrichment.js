/**
 * Data Enrichment Routes
 * Enrich leads with company data, technographics, funding info
 */

const express = require('express');
const router = express.Router();
const { authenticate, checkQuota, updateUsage, requireTier } = require('../middleware/auth');
const enrichmentService = require('../services/DataEnrichmentService');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/v1/enrich/lead/:id
 * Enrich lead with all available data
 */
router.post('/lead/:id', authenticate, requireTier('pro'), checkQuota('enrich'), async (req, res) => {
  try {
    const leadId = req.params.id;
    const userId = req.user.id;

    // Get lead
    const leadResult = await db.query(
      'SELECT * FROM leads WHERE id = $1 AND user_id = $2',
      [leadId, userId]
    );

    if (leadResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    const lead = leadResult.rows[0];

    // Enrich lead
    const enrichmentData = await enrichmentService.enrichLead(lead);

    // Update lead with enriched data
    await db.query(
      `UPDATE leads
       SET enriched = true,
           enrichment_data = $1,
           technographics = $2,
           funding_data = $3,
           enriched_at = NOW()
       WHERE id = $4`,
      [
        JSON.stringify(enrichmentData),
        JSON.stringify(enrichmentData.technographics || []),
        JSON.stringify(enrichmentData.funding || {}),
        leadId
      ]
    );

    // Update company information if available
    if (enrichmentData.company) {
      const company = enrichmentData.company;
      await db.query(
        `UPDATE leads
         SET company_size = COALESCE(company_size, $1),
             company_industry = COALESCE(company_industry, $2),
             company_revenue = COALESCE(company_revenue, $3),
             company_location = COALESCE(company_location, $4)
         WHERE id = $5`,
        [
          company.employees?.range,
          company.industry,
          company.revenue?.range,
          company.location,
          leadId
        ]
      );
    }

    // Update usage
    await updateUsage(userId, 'enrich');

    logger.info(`Lead enriched: ${leadId}`);

    res.json({
      success: true,
      message: 'Lead enriched successfully',
      enrichmentData
    });

  } catch (error) {
    logger.error('Lead enrichment error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Enrichment failed'
    });
  }
});

/**
 * POST /api/v1/enrich/person
 * Enrich person by email
 */
router.post('/person', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email is required'
      });
    }

    const personData = await enrichmentService.enrichPerson(email);

    res.json({
      success: true,
      personData
    });

  } catch (error) {
    logger.error('Person enrichment error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Person enrichment failed'
    });
  }
});

/**
 * POST /api/v1/enrich/company
 * Enrich company by domain
 */
router.post('/company', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Domain is required'
      });
    }

    const companyData = await enrichmentService.enrichCompany(domain);

    res.json({
      success: true,
      companyData
    });

  } catch (error) {
    logger.error('Company enrichment error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Company enrichment failed'
    });
  }
});

/**
 * POST /api/v1/enrich/technographics
 * Get tech stack for domain
 */
router.post('/technographics', authenticate, requireTier('business'), async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Domain is required'
      });
    }

    const techData = await enrichmentService.getTechnographics(domain);

    res.json({
      success: true,
      technographics: techData
    });

  } catch (error) {
    logger.error('Technographics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Technographics fetch failed'
    });
  }
});

/**
 * POST /api/v1/enrich/funding
 * Get funding data for company
 */
router.post('/funding', authenticate, requireTier('business'), async (req, res) => {
  try {
    const { companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Company name is required'
      });
    }

    const fundingData = await enrichmentService.getFundingData(companyName);

    res.json({
      success: true,
      fundingData
    });

  } catch (error) {
    logger.error('Funding data error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Funding data fetch failed'
    });
  }
});

/**
 * POST /api/v1/enrich/email/find
 * Find email using Hunter.io
 */
router.post('/email/find', authenticate, requireTier('pro'), async (req, res) => {
  try {
    const { firstName, lastName, domain } = req.body;

    if (!firstName || !lastName || !domain) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'firstName, lastName, and domain are required'
      });
    }

    const emailData = await enrichmentService.findEmail(firstName, lastName, domain);

    res.json({
      success: true,
      emailData
    });

  } catch (error) {
    logger.error('Email finder error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Email finder failed'
    });
  }
});

module.exports = router;
