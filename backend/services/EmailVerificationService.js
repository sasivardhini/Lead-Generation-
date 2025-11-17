/**
 * Advanced Email Verification Service
 * Multi-layered verification with A+ to F grading system
 *
 * Verification Checks:
 * 1. Format validation (RFC 5322)
 * 2. Disposable email detection
 * 3. Role-based email detection
 * 4. Free provider detection
 * 5. MX record validation
 * 6. SMTP validation
 * 7. Catch-all detection
 * 8. Typo suggestion
 *
 * Grading System:
 * A+ (95-100): Verified deliverable, high confidence
 * A  (85-94):  Deliverable, good confidence
 * B  (75-84):  Likely deliverable, medium confidence
 * C  (65-74):  Risky, may bounce
 * D  (50-64):  High risk, likely bounce
 * F  (<50):    Invalid or undeliverable
 */

const dns = require('dns').promises;
const net = require('net');
const validator = require('validator');
const axios = require('axios');
const logger = require('../utils/logger');
const redis = require('../config/redis');

class EmailVerificationService {
  constructor() {
    // Common disposable email domains
    this.disposableDomains = new Set([
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
      'temp-mail.org', 'throwaway.email', 'yopmail.com',
      'tempmail.com', 'sharklasers.com', 'maildrop.cc',
      'getnada.com', 'trashmail.com', 'fakeinbox.com'
    ]);

    // Role-based email patterns
    this.roleBasedPrefixes = new Set([
      'admin', 'support', 'info', 'sales', 'contact',
      'help', 'noreply', 'no-reply', 'postmaster',
      'webmaster', 'hostmaster', 'abuse', 'marketing',
      'hr', 'jobs', 'careers', 'billing', 'accounts'
    ]);

    // Free email providers
    this.freeProviders = new Set([
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
      'zoho.com', 'yandex.com', 'gmx.com', 'fastmail.com'
    ]);

    // Common typos for email providers
    this.typoMap = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmaiil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmaii.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com'
    };
  }

  /**
   * Main verification method
   * @param {string} email - Email address to verify
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} Verification result
   */
  async verify(email, options = {}) {
    const startTime = Date.now();

    try {
      // Normalize email
      email = email.toLowerCase().trim();

      // Check cache first
      if (!options.skipCache) {
        const cached = await this.getCachedResult(email);
        if (cached) {
          logger.debug(`Email verification cache hit: ${email}`);
          return cached;
        }
      }

      // Run all verification checks
      const checks = await this.runAllChecks(email, options);

      // Calculate composite score
      const score = this.calculateScore(checks);

      // Determine grade
      const grade = this.getGrade(score);

      // Determine status
      const status = this.getStatus(score, checks);

      // Build result object
      const result = {
        email,
        status,
        score,
        grade,
        checks: {
          formatValid: checks.formatValid,
          mxRecordsValid: checks.mxRecords.valid,
          smtpValid: checks.smtp.valid,
          isDisposable: checks.isDisposable,
          isRoleBased: checks.isRoleBased,
          isFreeProvider: checks.isFreeProvider,
          isCatchAll: checks.catchAll
        },
        details: {
          provider: checks.provider,
          domain: checks.domain,
          suggestion: checks.suggestion,
          reason: this.getReason(checks, score),
          mxRecords: checks.mxRecords.records,
          smtpResponse: checks.smtp.message
        },
        metadata: {
          verificationService: 'internal',
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };

      // Cache result for 30 days
      await this.cacheResult(email, result);

      logger.info(`Email verified: ${email} - ${grade} (${score}/100)`);

      return result;

    } catch (error) {
      logger.error(`Email verification error for ${email}:`, error);
      return this.getErrorResult(email, error);
    }
  }

  /**
   * Run all verification checks
   */
  async runAllChecks(email, options) {
    const [localPart, domain] = email.split('@');

    const checks = {
      email,
      localPart,
      domain,
      formatValid: false,
      isDisposable: false,
      isRoleBased: false,
      isFreeProvider: false,
      suggestion: null,
      provider: null,
      mxRecords: { valid: false, records: [] },
      smtp: { valid: false, message: '' },
      catchAll: false
    };

    // 1. Format validation
    checks.formatValid = this.isValidFormat(email);
    if (!checks.formatValid) {
      return checks;
    }

    // 2. Check for typos and suggestions
    checks.suggestion = this.getSuggestion(domain);

    // 3. Disposable email detection
    checks.isDisposable = this.isDisposable(domain);

    // 4. Role-based email detection
    checks.isRoleBased = this.isRoleBased(localPart);

    // 5. Free provider detection
    checks.isFreeProvider = this.isFreeProvider(domain);
    checks.provider = this.getProvider(domain);

    // 6. MX record validation
    if (!options.skipDns) {
      checks.mxRecords = await this.checkMXRecords(domain);
    }

    // 7. SMTP validation
    if (!options.skipSmtp && checks.mxRecords.valid) {
      checks.smtp = await this.checkSMTP(email, checks.mxRecords.records[0]);
    }

    // 8. Catch-all detection
    if (checks.smtp.valid) {
      checks.catchAll = await this.isCatchAllDomain(domain, checks.mxRecords.records[0]);
    }

    return checks;
  }

  /**
   * Validate email format (RFC 5322)
   */
  isValidFormat(email) {
    if (!email || typeof email !== 'string') return false;

    // Basic regex check
    const regex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!regex.test(email)) return false;

    // Use validator library for RFC compliance
    return validator.isEmail(email);
  }

  /**
   * Check if email is from disposable provider
   */
  isDisposable(domain) {
    return this.disposableDomains.has(domain);
  }

  /**
   * Check if email is role-based
   */
  isRoleBased(localPart) {
    return this.roleBasedPrefixes.has(localPart.toLowerCase());
  }

  /**
   * Check if email is from free provider
   */
  isFreeProvider(domain) {
    return this.freeProviders.has(domain);
  }

  /**
   * Get provider name
   */
  getProvider(domain) {
    if (this.freeProviders.has(domain)) {
      return domain.split('.')[0];
    }
    return 'custom';
  }

  /**
   * Get typo suggestion
   */
  getSuggestion(domain) {
    return this.typoMap[domain] || null;
  }

  /**
   * Check MX records for domain
   */
  async checkMXRecords(domain) {
    try {
      const records = await dns.resolveMx(domain);
      return {
        valid: records && records.length > 0,
        records: records.sort((a, b) => a.priority - b.priority).map(r => r.exchange)
      };
    } catch (error) {
      logger.debug(`MX record check failed for ${domain}:`, error.message);
      return { valid: false, records: [] };
    }
  }

  /**
   * SMTP validation
   */
  async checkSMTP(email, mxHost) {
    return new Promise((resolve) => {
      const timeout = parseInt(process.env.VERIFICATION_TIMEOUT_MS) || 5000;
      let socket;

      const cleanup = () => {
        if (socket) {
          socket.destroy();
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve({ valid: false, message: 'SMTP timeout' });
      }, timeout);

      try {
        socket = net.createConnection(25, mxHost);
        let response = '';

        socket.on('data', (data) => {
          response += data.toString();
        });

        socket.on('error', (error) => {
          clearTimeout(timer);
          cleanup();
          resolve({ valid: false, message: error.message });
        });

        socket.on('connect', () => {
          socket.write(`HELO leadgenpro.com\r\n`);

          setTimeout(() => {
            socket.write(`MAIL FROM:<verify@leadgenpro.com>\r\n`);
          }, 500);

          setTimeout(() => {
            socket.write(`RCPT TO:<${email}>\r\n`);
          }, 1000);

          setTimeout(() => {
            socket.write(`QUIT\r\n`);
            clearTimeout(timer);
            cleanup();

            // Check if email was accepted
            const valid = response.includes('250') && !response.includes('550');
            resolve({
              valid,
              message: valid ? 'Email accepted' : 'Email rejected by server'
            });
          }, 1500);
        });

      } catch (error) {
        clearTimeout(timer);
        cleanup();
        resolve({ valid: false, message: error.message });
      }
    });
  }

  /**
   * Check if domain is catch-all
   */
  async isCatchAllDomain(domain, mxHost) {
    try {
      const randomEmail = `${Math.random().toString(36).substring(7)}@${domain}`;
      const result = await this.checkSMTP(randomEmail, mxHost);
      return result.valid; // If random email is valid, it's catch-all
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate composite score (0-100)
   */
  calculateScore(checks) {
    let score = 0;

    // Format validation: +20 points
    if (checks.formatValid) score += 20;

    // MX records valid: +30 points
    if (checks.mxRecords.valid) score += 30;

    // SMTP validation: +30 points
    if (checks.smtp.valid) score += 30;

    // Penalties
    if (checks.isDisposable) score -= 40;
    if (checks.isRoleBased) score -= 10;
    if (checks.catchAll) score -= 15;

    // Bonuses
    if (!checks.isFreeProvider) score += 10; // Custom domain bonus

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get grade from score
   */
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Get status from score and checks
   */
  getStatus(score, checks) {
    if (checks.isDisposable) return 'invalid';
    if (score >= 85) return 'valid';
    if (score >= 65) return 'risky';
    if (score >= 50) return 'unknown';
    return 'invalid';
  }

  /**
   * Get human-readable reason
   */
  getReason(checks, score) {
    if (checks.isDisposable) {
      return 'Disposable email address detected';
    }
    if (!checks.formatValid) {
      return 'Invalid email format';
    }
    if (!checks.mxRecords.valid) {
      return 'No mail server found for domain';
    }
    if (!checks.smtp.valid) {
      return 'Email rejected by mail server';
    }
    if (checks.catchAll) {
      return 'Domain accepts all emails (catch-all)';
    }
    if (score >= 85) {
      return 'Email appears valid and deliverable';
    }
    if (score >= 65) {
      return 'Email may be valid but has some risk factors';
    }
    return 'Email verification failed multiple checks';
  }

  /**
   * Cache verification result
   */
  async cacheResult(email, result) {
    try {
      const cacheKey = `email_verify:${email}`;
      const ttl = 30 * 24 * 60 * 60; // 30 days
      await redis.set(cacheKey, result, ttl);
    } catch (error) {
      logger.error('Failed to cache verification result:', error);
    }
  }

  /**
   * Get cached verification result
   */
  async getCachedResult(email) {
    try {
      const cacheKey = `email_verify:${email}`;
      return await redis.get(cacheKey);
    } catch (error) {
      logger.error('Failed to get cached result:', error);
      return null;
    }
  }

  /**
   * Get error result
   */
  getErrorResult(email, error) {
    return {
      email,
      status: 'error',
      score: 0,
      grade: 'F',
      checks: {
        formatValid: false,
        mxRecordsValid: false,
        smtpValid: false,
        isDisposable: false,
        isRoleBased: false,
        isFreeProvider: false,
        isCatchAll: false
      },
      details: {
        provider: null,
        domain: null,
        suggestion: null,
        reason: `Verification error: ${error.message}`,
        mxRecords: [],
        smtpResponse: null
      },
      metadata: {
        verificationService: 'internal',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Bulk verification (with rate limiting)
   */
  async verifyBulk(emails, options = {}) {
    const maxConcurrent = parseInt(process.env.MAX_CONCURRENT_VERIFICATIONS) || 10;
    const results = [];

    // Process in batches
    for (let i = 0; i < emails.length; i += maxConcurrent) {
      const batch = emails.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(email => this.verify(email, options))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Integration with third-party services (NeverBounce, ZeroBounce)
   */
  async verifyWithNeverBounce(email) {
    try {
      const apiKey = process.env.NEVERBOUNCE_API_KEY;
      if (!apiKey) {
        throw new Error('NeverBounce API key not configured');
      }

      const response = await axios.get('https://api.neverbounce.com/v4/single/check', {
        params: {
          key: apiKey,
          email: email
        }
      });

      const data = response.data;
      return {
        status: data.result, // valid, invalid, disposable, catchall, unknown
        score: this.convertNeverBounceScore(data.result),
        provider: 'neverbounce',
        raw: data
      };
    } catch (error) {
      logger.error('NeverBounce verification error:', error);
      throw error;
    }
  }

  async verifyWithZeroBounce(email) {
    try {
      const apiKey = process.env.ZEROBOUNCE_API_KEY;
      if (!apiKey) {
        throw new Error('ZeroBounce API key not configured');
      }

      const response = await axios.get(`https://api.zerobounce.net/v2/validate`, {
        params: {
          api_key: apiKey,
          email: email
        }
      });

      const data = response.data;
      return {
        status: data.status,
        score: this.convertZeroBounceScore(data.status),
        provider: 'zerobounce',
        raw: data
      };
    } catch (error) {
      logger.error('ZeroBounce verification error:', error);
      throw error;
    }
  }

  convertNeverBounceScore(result) {
    const scoreMap = {
      'valid': 95,
      'catchall': 70,
      'unknown': 50,
      'disposable': 20,
      'invalid': 0
    };
    return scoreMap[result] || 50;
  }

  convertZeroBounceScore(status) {
    const scoreMap = {
      'valid': 95,
      'catch-all': 70,
      'unknown': 50,
      'spamtrap': 10,
      'abuse': 10,
      'do_not_mail': 10,
      'invalid': 0
    };
    return scoreMap[status] || 50;
  }
}

module.exports = new EmailVerificationService();
