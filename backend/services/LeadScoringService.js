/**
 * Lead Scoring Service
 * AI-powered lead scoring with demographic, firmographic, and quality signals
 *
 * Scoring Components:
 * 1. Demographic Score (0-100): Based on job title, seniority, function
 * 2. Firmographic Score (0-100): Based on company size, industry, revenue
 * 3. Quality Score (0-100): Based on data completeness and verification
 * 4. Engagement Score (0-100): Based on social presence and activity
 *
 * Final Score: Weighted average of all components
 * - Demographic: 30%
 * - Firmographic: 30%
 * - Quality: 25%
 * - Engagement: 15%
 */

const logger = require('../utils/logger');

class LeadScoringService {
  constructor() {
    // Seniority keywords (higher = more senior)
    this.seniorityLevels = {
      'c-level': 100, // CEO, CTO, CFO, COO, CMO
      'vp': 90, // VP, Vice President
      'director': 80, // Director, Head of
      'senior': 70, // Senior Manager, Senior Engineer
      'manager': 60, // Manager, Team Lead
      'lead': 55, // Team Lead, Tech Lead
      'specialist': 50, // Specialist, Expert
      'associate': 40, // Associate, Junior
      'coordinator': 30, // Coordinator, Assistant
      'intern': 20 // Intern, Trainee
    };

    // Job functions (score based on buying power)
    this.jobFunctions = {
      'executive': 100, // Executive, C-Suite
      'sales': 90, // Sales, Business Development
      'product': 85, // Product Management
      'engineering': 80, // Engineering, Development
      'marketing': 75, // Marketing, Growth
      'operations': 70, // Operations, COO
      'finance': 65, // Finance, Accounting
      'hr': 50, // Human Resources
      'admin': 40, // Administrative
      'support': 35 // Customer Support
    };

    // Company size ranges (employees)
    this.companySizeScores = {
      '1-10': 40, // Micro
      '11-50': 55, // Small
      '51-200': 70, // Medium
      '201-500': 80, // Large
      '501-1000': 90, // Enterprise
      '1001-5000': 95, // Large Enterprise
      '5001+': 100 // Fortune 500
    };

    // Industry scores (based on typical B2B value)
    this.industryScores = {
      'technology': 95,
      'software': 95,
      'finance': 90,
      'healthcare': 85,
      'manufacturing': 80,
      'professional services': 80,
      'telecommunications': 75,
      'retail': 70,
      'education': 65,
      'government': 60,
      'non-profit': 50
    };

    // Revenue ranges
    this.revenueScores = {
      '< $1M': 40,
      '$1M - $10M': 60,
      '$10M - $50M': 75,
      '$50M - $100M': 85,
      '$100M - $500M': 90,
      '$500M - $1B': 95,
      '> $1B': 100
    };
  }

  /**
   * Calculate composite lead score
   * @param {Object} lead - Lead object with all data
   * @returns {Object} Scoring breakdown
   */
  score(lead) {
    try {
      // Calculate individual scores
      const demographicScore = this.calculateDemographicScore(lead);
      const firmographicScore = this.calculateFirmographicScore(lead);
      const qualityScore = this.calculateQualityScore(lead);
      const engagementScore = this.calculateEngagementScore(lead);

      // Weighted composite score
      const compositeScore = Math.round(
        demographicScore * 0.30 +
        firmographicScore * 0.30 +
        qualityScore * 0.25 +
        engagementScore * 0.15
      );

      // Determine lead grade
      const grade = this.getLeadGrade(compositeScore);

      // Generate insights
      const insights = this.generateInsights(lead, {
        demographicScore,
        firmographicScore,
        qualityScore,
        engagementScore,
        compositeScore
      });

      return {
        leadScore: compositeScore,
        grade,
        breakdown: {
          demographic: demographicScore,
          firmographic: firmographicScore,
          quality: qualityScore,
          engagement: engagementScore
        },
        weights: {
          demographic: 0.30,
          firmographic: 0.30,
          quality: 0.25,
          engagement: 0.15
        },
        insights,
        scoredAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Lead scoring error:', error);
      return {
        leadScore: 0,
        grade: 'F',
        breakdown: {
          demographic: 0,
          firmographic: 0,
          quality: 0,
          engagement: 0
        },
        error: error.message
      };
    }
  }

  /**
   * Calculate demographic score (title, seniority, function)
   */
  calculateDemographicScore(lead) {
    if (!lead.title) return 0;

    let score = 0;
    const title = lead.title.toLowerCase();

    // Seniority scoring
    let seniorityScore = 30; // default
    for (const [keyword, points] of Object.entries(this.seniorityLevels)) {
      if (title.includes(keyword)) {
        seniorityScore = Math.max(seniorityScore, points);
      }
    }

    // Job function scoring
    let functionScore = 50; // default
    for (const [keyword, points] of Object.entries(this.jobFunctions)) {
      if (title.includes(keyword)) {
        functionScore = Math.max(functionScore, points);
      }
    }

    // Decision maker keywords
    const decisionMakerKeywords = ['ceo', 'cto', 'cfo', 'coo', 'president', 'owner', 'founder', 'director', 'vp', 'head'];
    const isDecisionMaker = decisionMakerKeywords.some(kw => title.includes(kw));

    // Calculate weighted score
    score = Math.round(
      seniorityScore * 0.50 +
      functionScore * 0.40 +
      (isDecisionMaker ? 10 : 0)
    );

    return Math.min(100, score);
  }

  /**
   * Calculate firmographic score (company size, industry, revenue)
   */
  calculateFirmographicScore(lead) {
    let score = 0;
    let components = 0;

    // Company size score
    if (lead.company_size) {
      const sizeScore = this.companySizeScores[lead.company_size] || 50;
      score += sizeScore;
      components++;
    }

    // Industry score
    if (lead.company_industry) {
      const industry = lead.company_industry.toLowerCase();
      let industryScore = 50; // default
      for (const [keyword, points] of Object.entries(this.industryScores)) {
        if (industry.includes(keyword)) {
          industryScore = Math.max(industryScore, points);
        }
      }
      score += industryScore;
      components++;
    }

    // Revenue score
    if (lead.company_revenue) {
      const revenueScore = this.revenueScores[lead.company_revenue] || 50;
      score += revenueScore;
      components++;
    }

    // Company name presence (indicates real company)
    if (lead.company_name) {
      score += 70;
      components++;
    }

    // Domain score (custom domain = better)
    if (lead.company_domain) {
      const isCustomDomain = !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(
        lead.company_domain.toLowerCase()
      );
      score += isCustomDomain ? 80 : 40;
      components++;
    }

    return components > 0 ? Math.round(score / components) : 0;
  }

  /**
   * Calculate quality score (data completeness, verification)
   */
  calculateQualityScore(lead) {
    let score = 0;
    let maxScore = 0;

    // Email presence and verification
    maxScore += 25;
    if (lead.email) {
      if (lead.email_verified && lead.email_verification_score) {
        score += (lead.email_verification_score / 100) * 25;
      } else if (lead.email) {
        score += 15; // Has email but not verified
      }
    }

    // Phone presence and verification
    maxScore += 15;
    if (lead.phone) {
      score += lead.phone_verified ? 15 : 10;
    }

    // Name completeness
    maxScore += 10;
    if (lead.first_name && lead.last_name) {
      score += 10;
    } else if (lead.full_name) {
      score += 7;
    }

    // Company information
    maxScore += 20;
    let companyInfo = 0;
    if (lead.company_name) companyInfo += 8;
    if (lead.company_domain) companyInfo += 7;
    if (lead.company_industry) companyInfo += 5;
    score += companyInfo;

    // Social profiles
    maxScore += 15;
    let socialCount = 0;
    if (lead.linkedin_url) socialCount++;
    if (lead.twitter_url) socialCount++;
    if (lead.github_url) socialCount++;
    score += Math.min(15, socialCount * 5);

    // Location data
    maxScore += 10;
    if (lead.location) score += 10;

    // Title/position
    maxScore += 5;
    if (lead.title) score += 5;

    // Normalize to 0-100
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  /**
   * Calculate engagement score (social presence, activity)
   */
  calculateEngagementScore(lead) {
    let score = 0;

    // LinkedIn presence (strongest signal)
    if (lead.linkedin_url) {
      score += 50;
    }

    // Twitter presence
    if (lead.twitter_url) {
      score += 20;
    }

    // GitHub presence (for technical leads)
    if (lead.github_url) {
      score += 15;
    }

    // Facebook presence
    if (lead.facebook_url) {
      score += 10;
    }

    // Instagram presence
    if (lead.instagram_url) {
      score += 5;
    }

    // Enrichment data bonus
    if (lead.enriched && lead.enrichment_data) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Get lead grade from score
   */
  getLeadGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D';
    return 'F';
  }

  /**
   * Generate actionable insights
   */
  generateInsights(lead, scores) {
    const insights = {
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    // Demographic insights
    if (scores.demographicScore >= 80) {
      insights.strengths.push('High-value decision maker');
    } else if (scores.demographicScore < 50) {
      insights.weaknesses.push('Low seniority or unclear job function');
      insights.recommendations.push('Verify job title and role');
    }

    // Firmographic insights
    if (scores.firmographicScore >= 80) {
      insights.strengths.push('Enterprise-level company');
    } else if (scores.firmographicScore < 50) {
      insights.weaknesses.push('Limited company information');
      insights.recommendations.push('Enrich company data');
    }

    // Quality insights
    if (scores.qualityScore >= 80) {
      insights.strengths.push('Complete and verified contact data');
    } else if (scores.qualityScore < 50) {
      insights.weaknesses.push('Incomplete or unverified data');
      insights.recommendations.push('Verify email and phone');
    }

    // Email verification
    if (!lead.email_verified) {
      insights.recommendations.push('Verify email address');
    }

    // Missing critical data
    if (!lead.linkedin_url) {
      insights.recommendations.push('Find LinkedIn profile');
    }

    if (!lead.phone) {
      insights.recommendations.push('Find phone number');
    }

    if (!lead.company_domain) {
      insights.recommendations.push('Find company website');
    }

    // Enrichment suggestion
    if (!lead.enriched) {
      insights.recommendations.push('Enrich with company and technographic data');
    }

    return insights;
  }

  /**
   * Bulk scoring
   */
  async scoreBulk(leads) {
    return leads.map(lead => ({
      leadId: lead.id,
      ...this.score(lead)
    }));
  }

  /**
   * Re-score lead (for when data is updated)
   */
  async rescore(leadId, leadData) {
    const scores = this.score(leadData);

    // Update in database would happen here
    logger.info(`Lead ${leadId} rescored: ${scores.leadScore}/100 (${scores.grade})`);

    return scores;
  }

  /**
   * Get ICP (Ideal Customer Profile) match score
   * @param {Object} lead
   * @param {Object} icpCriteria - Custom ICP criteria
   */
  matchICP(lead, icpCriteria) {
    let matchScore = 0;
    let checks = 0;

    // Check company size
    if (icpCriteria.companySizes && icpCriteria.companySizes.length > 0) {
      checks++;
      if (icpCriteria.companySizes.includes(lead.company_size)) {
        matchScore += 25;
      }
    }

    // Check industry
    if (icpCriteria.industries && icpCriteria.industries.length > 0) {
      checks++;
      const leadIndustry = (lead.company_industry || '').toLowerCase();
      const matchesIndustry = icpCriteria.industries.some(industry =>
        leadIndustry.includes(industry.toLowerCase())
      );
      if (matchesIndustry) {
        matchScore += 25;
      }
    }

    // Check seniority
    if (icpCriteria.minSeniority) {
      checks++;
      const leadTitle = (lead.title || '').toLowerCase();
      const seniorityKeywords = Object.keys(this.seniorityLevels);
      const matchesSeniority = seniorityKeywords.some(kw =>
        leadTitle.includes(kw) && this.seniorityLevels[kw] >= icpCriteria.minSeniority
      );
      if (matchesSeniority) {
        matchScore += 25;
      }
    }

    // Check location
    if (icpCriteria.locations && icpCriteria.locations.length > 0) {
      checks++;
      const leadLocation = (lead.location || lead.company_location || '').toLowerCase();
      const matchesLocation = icpCriteria.locations.some(loc =>
        leadLocation.includes(loc.toLowerCase())
      );
      if (matchesLocation) {
        matchScore += 25;
      }
    }

    const finalScore = checks > 0 ? Math.round(matchScore / checks * 4) : 0; // Normalize to 0-100

    return {
      matchScore: finalScore,
      isMatch: finalScore >= (icpCriteria.threshold || 70),
      checks: checks,
      criteria: icpCriteria
    };
  }
}

module.exports = new LeadScoringService();
