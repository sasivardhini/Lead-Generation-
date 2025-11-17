/**
 * Data Enrichment Service
 * Enriches leads with company information, technographics, and funding data
 *
 * Data Sources:
 * - Clearbit API: Company information, logos, social profiles
 * - FullContact API: Person enrichment, social profiles
 * - Crunchbase API: Funding data, company details
 * - BuiltWith API: Technographics, technology stack
 * - Hunter.io API: Email finder and verification
 *
 * Enrichment Types:
 * 1. Person Enrichment: Social profiles, work history, education
 * 2. Company Enrichment: Size, revenue, industry, description
 * 3. Technographics: Tech stack, tools used
 * 4. Funding Data: Investments, valuation, investors
 */

const axios = require('axios');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class DataEnrichmentService {
  constructor() {
    this.clearbitApiKey = process.env.CLEARBIT_API_KEY;
    this.fullcontactApiKey = process.env.FULLCONTACT_API_KEY;
    this.hunterApiKey = process.env.HUNTER_API_KEY;
    this.crunchbaseApiKey = process.env.CRUNCHBASE_API_KEY;
    this.builtwithApiKey = process.env.BUILTWITH_API_KEY;

    // Cache TTL (24 hours for most data)
    this.cacheTTL = 24 * 60 * 60;
  }

  /**
   * Enrich lead with all available data
   */
  async enrichLead(lead) {
    try {
      const enrichmentData = {
        person: null,
        company: null,
        technographics: null,
        funding: null,
        enrichedAt: new Date().toISOString()
      };

      // Run enrichment in parallel
      const [personData, companyData, techData, fundingData] = await Promise.allSettled([
        lead.email ? this.enrichPerson(lead.email) : Promise.resolve(null),
        lead.company_domain ? this.enrichCompany(lead.company_domain) : Promise.resolve(null),
        lead.company_domain ? this.getTechnographics(lead.company_domain) : Promise.resolve(null),
        lead.company_name ? this.getFundingData(lead.company_name) : Promise.resolve(null)
      ]);

      // Process results
      if (personData.status === 'fulfilled') enrichmentData.person = personData.value;
      if (companyData.status === 'fulfilled') enrichmentData.company = companyData.value;
      if (techData.status === 'fulfilled') enrichmentData.technographics = techData.value;
      if (fundingData.status === 'fulfilled') enrichmentData.funding = fundingData.value;

      logger.info(`Lead enriched successfully: ${lead.email || lead.id}`);

      return enrichmentData;

    } catch (error) {
      logger.error('Lead enrichment error:', error);
      throw error;
    }
  }

  /**
   * Enrich person data using email
   */
  async enrichPerson(email) {
    const cacheKey = `enrich:person:${email}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Person enrichment cache hit: ${email}`);
      return cached;
    }

    try {
      // Try Clearbit first
      const clearbitData = await this.clearbitPersonLookup(email);
      if (clearbitData) {
        await redis.set(cacheKey, clearbitData, this.cacheTTL);
        return clearbitData;
      }

      // Fallback to FullContact
      const fullcontactData = await this.fullcontactPersonLookup(email);
      if (fullcontactData) {
        await redis.set(cacheKey, fullcontactData, this.cacheTTL);
        return fullcontactData;
      }

      return null;

    } catch (error) {
      logger.error(`Person enrichment failed for ${email}:`, error);
      return null;
    }
  }

  /**
   * Clearbit Person API
   */
  async clearbitPersonLookup(email) {
    if (!this.clearbitApiKey) return null;

    try {
      const response = await axios.get(`https://person.clearbit.com/v2/people/find`, {
        params: { email },
        headers: { Authorization: `Bearer ${this.clearbitApiKey}` },
        timeout: 5000
      });

      const data = response.data;

      return {
        name: {
          full: data.name?.fullName,
          first: data.name?.givenName,
          last: data.name?.familyName
        },
        email: data.email,
        location: data.location,
        timezone: data.timeZone,
        employment: {
          title: data.employment?.title,
          role: data.employment?.role,
          seniority: data.employment?.seniority,
          company: data.employment?.name,
          domain: data.employment?.domain
        },
        social: {
          linkedin: data.linkedin?.handle,
          twitter: data.twitter?.handle,
          github: data.github?.handle,
          facebook: data.facebook?.handle
        },
        avatar: data.avatar,
        bio: data.bio,
        site: data.site,
        source: 'clearbit'
      };

    } catch (error) {
      if (error.response?.status !== 404) {
        logger.error('Clearbit Person API error:', error.message);
      }
      return null;
    }
  }

  /**
   * FullContact Person API
   */
  async fullcontactPersonLookup(email) {
    if (!this.fullcontactApiKey) return null;

    try {
      const response = await axios.post(`https://api.fullcontact.com/v3/person.enrich`, {
        email: email
      }, {
        headers: { Authorization: `Bearer ${this.fullcontactApiKey}` },
        timeout: 5000
      });

      const data = response.data;

      return {
        name: {
          full: data.fullName,
          first: data.details?.name?.given,
          last: data.details?.name?.family
        },
        email: email,
        location: data.details?.locations?.[0]?.formatted,
        employment: {
          title: data.details?.employment?.[0]?.title,
          company: data.details?.employment?.[0]?.name,
          domain: data.details?.employment?.[0]?.domain
        },
        social: {
          linkedin: data.details?.profiles?.linkedin?.url,
          twitter: data.details?.profiles?.twitter?.url,
          github: data.details?.profiles?.github?.url,
          facebook: data.details?.profiles?.facebook?.url
        },
        avatar: data.details?.photos?.[0]?.url,
        bio: data.details?.bio,
        demographics: data.demographics,
        source: 'fullcontact'
      };

    } catch (error) {
      if (error.response?.status !== 404) {
        logger.error('FullContact API error:', error.message);
      }
      return null;
    }
  }

  /**
   * Enrich company data using domain
   */
  async enrichCompany(domain) {
    const cacheKey = `enrich:company:${domain}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Company enrichment cache hit: ${domain}`);
      return cached;
    }

    try {
      const clearbitData = await this.clearbitCompanyLookup(domain);
      if (clearbitData) {
        await redis.set(cacheKey, clearbitData, this.cacheTTL);
        return clearbitData;
      }

      return null;

    } catch (error) {
      logger.error(`Company enrichment failed for ${domain}:`, error);
      return null;
    }
  }

  /**
   * Clearbit Company API
   */
  async clearbitCompanyLookup(domain) {
    if (!this.clearbitApiKey) return null;

    try {
      const response = await axios.get(`https://company.clearbit.com/v2/companies/find`, {
        params: { domain },
        headers: { Authorization: `Bearer ${this.clearbitApiKey}` },
        timeout: 5000
      });

      const data = response.data;

      return {
        name: data.name,
        legalName: data.legalName,
        domain: data.domain,
        url: data.url,
        description: data.description,
        foundedYear: data.foundedYear,
        location: data.location,
        timezone: data.timeZone,
        employees: {
          range: data.metrics?.employeesRange,
          count: data.metrics?.employees
        },
        revenue: {
          range: data.metrics?.estimatedAnnualRevenue,
          estimated: data.metrics?.annualRevenue
        },
        industry: data.category?.industry,
        sector: data.category?.sector,
        subIndustry: data.category?.subIndustry,
        tags: data.tags,
        tech: data.tech,
        type: data.type,
        logo: data.logo,
        social: {
          linkedin: data.linkedin?.handle,
          twitter: data.twitter?.handle,
          facebook: data.facebook?.handle,
          crunchbase: data.crunchbase?.handle
        },
        parent: data.parent,
        ultimateParent: data.ultimateParent,
        emailProvider: data.emailProvider,
        phone: data.phone,
        metrics: {
          alexaUsRank: data.metrics?.alexaUsRank,
          alexaGlobalRank: data.metrics?.alexaGlobalRank,
          marketCap: data.metrics?.marketCap,
          raised: data.metrics?.raised,
          employees: data.metrics?.employees
        },
        source: 'clearbit'
      };

    } catch (error) {
      if (error.response?.status !== 404) {
        logger.error('Clearbit Company API error:', error.message);
      }
      return null;
    }
  }

  /**
   * Get technographics (tech stack)
   */
  async getTechnographics(domain) {
    const cacheKey = `enrich:tech:${domain}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Technographics cache hit: ${domain}`);
      return cached;
    }

    try {
      const builtwithData = await this.builtwithLookup(domain);
      if (builtwithData) {
        await redis.set(cacheKey, builtwithData, this.cacheTTL * 7); // Cache for 7 days
        return builtwithData;
      }

      return null;

    } catch (error) {
      logger.error(`Technographics failed for ${domain}:`, error);
      return null;
    }
  }

  /**
   * BuiltWith API
   */
  async builtwithLookup(domain) {
    if (!this.builtwithApiKey) return null;

    try {
      const response = await axios.get(`https://api.builtwith.com/v20/api.json`, {
        params: {
          KEY: this.builtwithApiKey,
          LOOKUP: domain
        },
        timeout: 5000
      });

      const data = response.data;
      const technologies = [];

      // Parse technology groups
      if (data.Results && data.Results[0]) {
        const result = data.Results[0];
        const paths = result.Result?.Paths || [];

        paths.forEach(path => {
          if (path.Technologies) {
            path.Technologies.forEach(tech => {
              technologies.push({
                name: tech.Name,
                category: tech.Categories?.[0],
                tag: tech.Tag,
                firstDetected: tech.FirstDetected,
                lastDetected: tech.LastDetected
              });
            });
          }
        });
      }

      // Categorize technologies
      const categorized = {
        analytics: technologies.filter(t => t.category?.includes('Analytics')),
        advertising: technologies.filter(t => t.category?.includes('Advertising')),
        cms: technologies.filter(t => t.category?.includes('CMS')),
        ecommerce: technologies.filter(t => t.category?.includes('Shop')),
        javascript: technologies.filter(t => t.category?.includes('JavaScript')),
        frameworks: technologies.filter(t => t.category?.includes('Framework')),
        hosting: technologies.filter(t => t.category?.includes('Hosting')),
        cdn: technologies.filter(t => t.category?.includes('CDN')),
        all: technologies
      };

      return {
        domain,
        technologies: categorized,
        totalTechnologies: technologies.length,
        source: 'builtwith'
      };

    } catch (error) {
      logger.error('BuiltWith API error:', error.message);
      return null;
    }
  }

  /**
   * Get funding data
   */
  async getFundingData(companyName) {
    const cacheKey = `enrich:funding:${companyName}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Funding data cache hit: ${companyName}`);
      return cached;
    }

    try {
      const crunchbaseData = await this.crunchbaseLookup(companyName);
      if (crunchbaseData) {
        await redis.set(cacheKey, crunchbaseData, this.cacheTTL * 7);
        return crunchbaseData;
      }

      return null;

    } catch (error) {
      logger.error(`Funding data failed for ${companyName}:`, error);
      return null;
    }
  }

  /**
   * Crunchbase API
   */
  async crunchbaseLookup(companyName) {
    if (!this.crunchbaseApiKey) return null;

    try {
      // Search for company
      const searchResponse = await axios.get(`https://api.crunchbase.com/api/v4/autocompletes`, {
        params: {
          query: companyName,
          collection_ids: 'organizations',
          user_key: this.crunchbaseApiKey
        },
        timeout: 5000
      });

      if (!searchResponse.data?.entities || searchResponse.data.entities.length === 0) {
        return null;
      }

      const orgId = searchResponse.data.entities[0].identifier.uuid;

      // Get organization details
      const orgResponse = await axios.get(`https://api.crunchbase.com/api/v4/entities/organizations/${orgId}`, {
        params: {
          user_key: this.crunchbaseApiKey,
          card_ids: 'fields,funding_rounds,investors'
        },
        timeout: 5000
      });

      const org = orgResponse.data.properties;
      const cards = orgResponse.data.cards || {};

      return {
        name: org.legal_name || org.name,
        description: org.short_description,
        website: org.website_url,
        founded: org.founded_on,
        status: org.status,
        categories: org.categories,
        location: {
          city: org.location_identifiers?.[0]?.city,
          region: org.location_identifiers?.[0]?.region,
          country: org.location_identifiers?.[0]?.country
        },
        employees: org.num_employees_enum,
        fundingRounds: {
          total: org.num_funding_rounds,
          totalRaised: org.funding_total?.value,
          currency: org.funding_total?.currency,
          lastFundingType: org.last_funding_type,
          lastFundingAt: org.last_funding_at,
          rounds: cards.funding_rounds?.map(round => ({
            type: round.funding_type,
            amount: round.money_raised?.value,
            currency: round.money_raised?.currency,
            date: round.announced_on,
            leadInvestors: round.lead_investor_identifiers
          })) || []
        },
        investors: cards.investors?.map(inv => ({
          name: inv.investor_identifier?.value,
          type: inv.investor_type
        })) || [],
        ipo: {
          status: org.ipo_status,
          stockSymbol: org.stock_symbol,
          stockExchange: org.stock_exchange_symbol
        },
        valuation: org.valuation,
        source: 'crunchbase'
      };

    } catch (error) {
      logger.error('Crunchbase API error:', error.message);
      return null;
    }
  }

  /**
   * Find email using Hunter.io
   */
  async findEmail(firstName, lastName, domain) {
    if (!this.hunterApiKey) return null;

    const cacheKey = `email:find:${firstName}.${lastName}@${domain}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`https://api.hunter.io/v2/email-finder`, {
        params: {
          domain,
          first_name: firstName,
          last_name: lastName,
          api_key: this.hunterApiKey
        },
        timeout: 5000
      });

      const result = {
        email: response.data.data.email,
        score: response.data.data.score,
        sources: response.data.data.sources,
        confidence: response.data.data.confidence,
        firstName: response.data.data.first_name,
        lastName: response.data.data.last_name,
        position: response.data.data.position,
        department: response.data.data.department,
        source: 'hunter'
      };

      await redis.set(cacheKey, result, this.cacheTTL);
      return result;

    } catch (error) {
      logger.error('Hunter.io Email Finder error:', error.message);
      return null;
    }
  }

  /**
   * Domain search using Hunter.io
   */
  async domainSearch(domain, options = {}) {
    if (!this.hunterApiKey) return null;

    const cacheKey = `domain:search:${domain}`;

    try {
      const response = await axios.get(`https://api.hunter.io/v2/domain-search`, {
        params: {
          domain,
          api_key: this.hunterApiKey,
          limit: options.limit || 10,
          offset: options.offset || 0,
          type: options.type || 'personal' // personal or generic
        },
        timeout: 10000
      });

      const data = response.data.data;

      return {
        domain: data.domain,
        organization: data.organization,
        pattern: data.pattern,
        emails: data.emails.map(email => ({
          value: email.value,
          type: email.type,
          confidence: email.confidence,
          firstName: email.first_name,
          lastName: email.last_name,
          position: email.position,
          department: email.department,
          linkedin: email.linkedin,
          twitter: email.twitter,
          sources: email.sources
        })),
        source: 'hunter'
      };

    } catch (error) {
      logger.error('Hunter.io Domain Search error:', error.message);
      return null;
    }
  }

  /**
   * Bulk enrichment
   */
  async enrichBulk(leads, options = {}) {
    const results = [];

    for (const lead of leads) {
      try {
        const enriched = await this.enrichLead(lead);
        results.push({
          leadId: lead.id,
          success: true,
          data: enriched
        });

        // Rate limiting delay
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }

      } catch (error) {
        results.push({
          leadId: lead.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new DataEnrichmentService();
