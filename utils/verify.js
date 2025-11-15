/**
 * Email Verification Module
 * Validates email addresses through multiple checks
 * Note: Full SMTP verification requires backend server due to browser limitations
 */

class EmailVerifier {
  constructor() {
    // Common disposable email domains to flag
    this.disposableDomains = [
      'tempmail.com', 'throwaway.email', '10minutemail.com',
      'guerrillamail.com', 'mailinator.com', 'yopmail.com',
      'temp-mail.org', 'fakeinbox.com', 'trashmail.com'
    ];

    // Common free email providers
    this.freeEmailProviders = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'protonmail.com', 'mail.com'
    ];

    // Catch-all detection patterns
    this.catchAllIndicators = [
      'info', 'contact', 'admin', 'support', 'hello',
      'sales', 'office', 'team', 'noreply'
    ];
  }

  /**
   * Validate email format using comprehensive regex
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidFormat(email) {
    if (!email) return false;

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(email);
  }

  /**
   * Extract domain from email
   * @param {string} email - Email address
   * @returns {string|null}
   */
  extractDomain(email) {
    if (!email || !email.includes('@')) return null;
    return email.split('@')[1].toLowerCase();
  }

  /**
   * Check if email is from a disposable email provider
   * @param {string} email - Email to check
   * @returns {boolean}
   */
  isDisposable(email) {
    const domain = this.extractDomain(email);
    return domain ? this.disposableDomains.includes(domain) : false;
  }

  /**
   * Check if email is from a free email provider
   * @param {string} email - Email to check
   * @returns {boolean}
   */
  isFreeEmail(email) {
    const domain = this.extractDomain(email);
    return domain ? this.freeEmailProviders.includes(domain) : false;
  }

  /**
   * Check if email is likely a catch-all address
   * @param {string} email - Email to check
   * @returns {boolean}
   */
  isCatchAll(email) {
    const localPart = email.split('@')[0].toLowerCase();
    return this.catchAllIndicators.some(indicator =>
      localPart.includes(indicator)
    );
  }

  /**
   * Check if domain has valid MX records
   * Note: This is a mock implementation. Real MX check requires DNS lookup
   * which cannot be done directly in browser. Use backend API for real check.
   * @param {string} domain - Domain to check
   * @returns {Promise<Object>}
   */
  async checkMXRecords(domain) {
    // Mock implementation - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate MX record check
        // In production, call your backend API endpoint
        const hasValidMX = !domain.includes('invalid') && !domain.includes('test');

        resolve({
          domain: domain,
          hasMX: hasValidMX,
          mxRecords: hasValidMX ? [`mx1.${domain}`, `mx2.${domain}`] : [],
          checked: true
        });
      }, 100);
    });
  }

  /**
   * Simulate SMTP verification
   * Note: Real SMTP verification must be done server-side
   * @param {string} email - Email to verify
   * @returns {Promise<Object>}
   */
  async checkSMTP(email) {
    // Mock implementation - replace with backend API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const domain = this.extractDomain(email);
        const isDisposable = this.isDisposable(email);

        // Simulate SMTP check result
        resolve({
          email: email,
          smtpValid: !isDisposable,
          smtpCheck: 'completed',
          deliverable: !isDisposable
        });
      }, 200);
    });
  }

  /**
   * Check domain validity
   * @param {string} domain - Domain to check
   * @returns {Object}
   */
  checkDomain(domain) {
    if (!domain) {
      return { valid: false, reason: 'No domain provided' };
    }

    // Check domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(?:\.[a-zA-Z]{2,})+$/;

    if (!domainRegex.test(domain)) {
      return { valid: false, reason: 'Invalid domain format' };
    }

    // Check for common test/invalid domains
    const invalidDomains = ['example.com', 'test.com', 'invalid.com', 'localhost'];
    if (invalidDomains.includes(domain)) {
      return { valid: false, reason: 'Test/invalid domain' };
    }

    return { valid: true, reason: 'Domain format valid' };
  }

  /**
   * Calculate email quality score
   * @param {Object} checks - Results from various checks
   * @returns {number} - Score from 0-100
   */
  calculateScore(checks) {
    let score = 100;

    // Deduct points for various issues
    if (!checks.formatValid) score -= 100; // Invalid format = 0 score
    if (checks.isDisposable) score -= 50;
    if (checks.isFreeEmail) score -= 10;
    if (checks.isCatchAll) score -= 15;
    if (!checks.domainValid) score -= 30;
    if (checks.mxRecords && !checks.mxRecords.hasMX) score -= 40;
    if (checks.smtp && !checks.smtp.smtpValid) score -= 30;

    return Math.max(0, score);
  }

  /**
   * Determine email status based on checks
   * @param {Object} checks - Results from various checks
   * @param {number} score - Quality score
   * @returns {string}
   */
  determineStatus(checks, score) {
    if (!checks.formatValid) return 'invalid';
    if (checks.isDisposable) return 'disposable';
    if (score >= 80) return 'valid';
    if (score >= 60) return 'risky';
    if (score >= 40) return 'unknown';
    return 'invalid';
  }

  /**
   * Comprehensive email verification
   * Runs all available checks and returns detailed results
   * @param {string} email - Email to verify
   * @returns {Promise<Object>} - Verification results
   */
  async verify(email) {
    const startTime = Date.now();

    // Basic checks (synchronous)
    const formatValid = this.isValidFormat(email);
    const isDisposable = this.isDisposable(email);
    const isFreeEmail = this.isFreeEmail(email);
    const isCatchAll = this.isCatchAll(email);
    const domain = this.extractDomain(email);
    const domainCheck = this.checkDomain(domain);

    // Async checks (would be real API calls in production)
    let mxRecords = null;
    let smtp = null;

    if (formatValid && domain) {
      try {
        [mxRecords, smtp] = await Promise.all([
          this.checkMXRecords(domain),
          this.checkSMTP(email)
        ]);
      } catch (error) {
        console.error('Verification error:', error);
      }
    }

    // Compile all checks
    const checks = {
      formatValid,
      isDisposable,
      isFreeEmail,
      isCatchAll,
      domainValid: domainCheck.valid,
      mxRecords,
      smtp
    };

    // Calculate score and status
    const score = this.calculateScore(checks);
    const status = this.determineStatus(checks, score);

    const result = {
      email: email,
      status: status,
      score: score,
      checks: {
        format: formatValid,
        disposable: isDisposable,
        freeEmail: isFreeEmail,
        catchAll: isCatchAll,
        domain: domainCheck.valid,
        mxRecords: mxRecords ? mxRecords.hasMX : false,
        smtp: smtp ? smtp.smtpValid : false
      },
      details: {
        domain: domain,
        domainCheck: domainCheck,
        mxRecords: mxRecords,
        smtp: smtp
      },
      verifiedAt: new Date().toISOString(),
      verificationTime: Date.now() - startTime
    };

    return result;
  }

  /**
   * Bulk verify multiple emails
   * @param {Array} emails - Array of emails to verify
   * @param {number} concurrency - Number of concurrent verifications
   * @returns {Promise<Array>} - Array of verification results
   */
  async bulkVerify(emails, concurrency = 5) {
    const results = [];
    const chunks = [];

    // Split into chunks for concurrent processing
    for (let i = 0; i < emails.length; i += concurrency) {
      chunks.push(emails.slice(i, i + concurrency));
    }

    // Process each chunk
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(email => this.verify(email))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Quick validation (format and basic checks only)
   * @param {string} email - Email to validate
   * @returns {Object} - Quick validation result
   */
  quickValidate(email) {
    const formatValid = this.isValidFormat(email);
    const isDisposable = this.isDisposable(email);
    const isFreeEmail = this.isFreeEmail(email);
    const domain = this.extractDomain(email);
    const domainCheck = this.checkDomain(domain);

    let status = 'valid';
    if (!formatValid) status = 'invalid';
    else if (isDisposable) status = 'disposable';
    else if (!domainCheck.valid) status = 'invalid';

    return {
      email: email,
      status: status,
      formatValid: formatValid,
      isDisposable: isDisposable,
      isFreeEmail: isFreeEmail,
      domainValid: domainCheck.valid
    };
  }

  /**
   * Get verification summary statistics
   * @param {Array} verificationResults - Array of verification results
   * @returns {Object} - Summary statistics
   */
  getSummary(verificationResults) {
    const total = verificationResults.length;
    const statusCounts = {};

    verificationResults.forEach(result => {
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    });

    const averageScore = verificationResults.reduce((sum, r) => sum + r.score, 0) / total;

    return {
      total: total,
      statusCounts: statusCounts,
      averageScore: averageScore.toFixed(2),
      validCount: statusCounts.valid || 0,
      invalidCount: statusCounts.invalid || 0,
      riskyCount: statusCounts.risky || 0,
      unknownCount: statusCounts.unknown || 0,
      disposableCount: statusCounts.disposable || 0
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailVerifier;
}
