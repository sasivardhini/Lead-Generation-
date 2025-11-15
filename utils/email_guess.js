/**
 * Email Pattern Guesser
 * Generates possible email combinations based on name and domain
 * Uses common corporate email patterns
 */

class EmailGuesser {
  constructor() {
    // Common email patterns used by companies
    this.patterns = [
      { name: 'first.last', generator: (f, l) => `${f}.${l}` },
      { name: 'firstlast', generator: (f, l) => `${f}${l}` },
      { name: 'first', generator: (f, l) => `${f}` },
      { name: 'last', generator: (f, l) => `${l}` },
      { name: 'flast', generator: (f, l) => `${f[0]}${l}` },
      { name: 'firstl', generator: (f, l) => `${f}${l[0]}` },
      { name: 'f.last', generator: (f, l) => `${f[0]}.${l}` },
      { name: 'first.l', generator: (f, l) => `${f}.${l[0]}` },
      { name: 'last.first', generator: (f, l) => `${l}.${f}` },
      { name: 'lastfirst', generator: (f, l) => `${l}${f}` },
      { name: 'last.f', generator: (f, l) => `${l}.${f[0]}` },
      { name: 'lastf', generator: (f, l) => `${l}${f[0]}` },
      { name: 'first_last', generator: (f, l) => `${f}_${l}` },
      { name: 'last_first', generator: (f, l) => `${l}_${f}` },
      { name: 'first-last', generator: (f, l) => `${f}-${l}` },
      { name: 'last-first', generator: (f, l) => `${l}-${f}` }
    ];
  }

  /**
   * Clean and normalize name parts
   * @param {string} name - Name to clean
   * @returns {string}
   */
  cleanName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z]/g, '');
  }

  /**
   * Parse full name into first and last
   * @param {string} fullName - Full name
   * @returns {Object} - {firstName, lastName}
   */
  parseName(fullName) {
    if (!fullName) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else {
      // For names with 3+ parts, use first as firstName and last as lastName
      return { firstName: parts[0], lastName: parts[parts.length - 1] };
    }
  }

  /**
   * Extract domain from company name or URL
   * @param {string} input - Company name or website
   * @returns {string|null}
   */
  extractDomain(input) {
    if (!input) return null;

    // If it's a URL, extract domain
    if (input.includes('http://') || input.includes('https://')) {
      try {
        const url = new URL(input);
        return url.hostname.replace('www.', '');
      } catch (e) {
        return null;
      }
    }

    // If it looks like a domain
    if (input.includes('.')) {
      return input.replace('www.', '').trim().toLowerCase();
    }

    // If it's just a company name, try to guess domain
    const cleaned = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleaned}.com`;
  }

  /**
   * Generate all possible email patterns
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {string} domain - Email domain
   * @returns {Array} - Array of possible emails with pattern info
   */
  generatePatterns(firstName, lastName, domain) {
    const emails = [];
    const cleanFirst = this.cleanName(firstName);
    const cleanLast = this.cleanName(lastName);
    const cleanDomain = this.extractDomain(domain);

    if (!cleanFirst || !cleanDomain) {
      return emails;
    }

    // Generate all patterns
    this.patterns.forEach(pattern => {
      try {
        const localPart = pattern.generator(cleanFirst, cleanLast || '');
        if (localPart && localPart.length > 0) {
          const email = `${localPart}@${cleanDomain}`;
          emails.push({
            email: email,
            pattern: pattern.name,
            confidence: this.calculateConfidence(pattern.name)
          });
        }
      } catch (e) {
        // Skip invalid patterns
      }
    });

    // Sort by confidence
    return emails.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for email pattern
   * Based on popularity of pattern in corporate environments
   * @param {string} patternName - Pattern name
   * @returns {number} - Confidence score 0-100
   */
  calculateConfidence(patternName) {
    const confidenceMap = {
      'first.last': 95,
      'firstlast': 85,
      'first': 75,
      'flast': 70,
      'f.last': 65,
      'first_last': 60,
      'firstl': 55,
      'last': 50,
      'first.l': 45,
      'last.first': 40,
      'first-last': 35,
      'lastfirst': 30,
      'last.f': 25,
      'lastf': 20,
      'last_first': 15,
      'last-first': 10
    };

    return confidenceMap[patternName] || 50;
  }

  /**
   * Guess emails from full name and company
   * @param {string} fullName - Person's full name
   * @param {string} company - Company name or domain
   * @returns {Array} - Sorted array of email guesses
   */
  guessEmails(fullName, company) {
    const { firstName, lastName } = this.parseName(fullName);
    return this.generatePatterns(firstName, lastName, company);
  }

  /**
   * Detect email pattern from known emails
   * Useful for learning company's email pattern from existing data
   * @param {Array} knownEmails - Array of known emails from the company
   * @param {string} domain - Company domain
   * @returns {string|null} - Detected pattern name
   */
  detectPattern(knownEmails, domain) {
    if (!knownEmails || knownEmails.length === 0) return null;

    const patternCounts = {};

    knownEmails.forEach(email => {
      const [localPart, emailDomain] = email.split('@');

      if (emailDomain !== domain) return;

      // Try to match against known patterns
      // This is a simplified version - in production, use more sophisticated matching
      if (localPart.includes('.')) {
        patternCounts['first.last'] = (patternCounts['first.last'] || 0) + 1;
      } else if (localPart.includes('_')) {
        patternCounts['first_last'] = (patternCounts['first_last'] || 0) + 1;
      } else if (localPart.includes('-')) {
        patternCounts['first-last'] = (patternCounts['first-last'] || 0) + 1;
      } else {
        patternCounts['firstlast'] = (patternCounts['firstlast'] || 0) + 1;
      }
    });

    // Return most common pattern
    const sortedPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1]);

    return sortedPatterns.length > 0 ? sortedPatterns[0][0] : null;
  }

  /**
   * Generate emails using detected pattern
   * @param {string} fullName - Full name
   * @param {string} domain - Email domain
   * @param {string} patternName - Pattern to use
   * @returns {string|null} - Generated email
   */
  generateWithPattern(fullName, domain, patternName) {
    const { firstName, lastName } = this.parseName(fullName);
    const pattern = this.patterns.find(p => p.name === patternName);

    if (!pattern) return null;

    const cleanFirst = this.cleanName(firstName);
    const cleanLast = this.cleanName(lastName);
    const cleanDomain = this.extractDomain(domain);

    if (!cleanFirst || !cleanDomain) return null;

    try {
      const localPart = pattern.generator(cleanFirst, cleanLast);
      return `${localPart}@${cleanDomain}`;
    } catch (e) {
      return null;
    }
  }

  /**
   * Bulk generate emails for multiple people
   * @param {Array} people - Array of {name, company} objects
   * @returns {Array} - Array of results with guessed emails
   */
  bulkGuess(people) {
    return people.map(person => ({
      name: person.name,
      company: person.company,
      emails: this.guessEmails(person.name, person.company)
    }));
  }

  /**
   * Get top N most likely emails
   * @param {string} fullName - Full name
   * @param {string} company - Company domain
   * @param {number} limit - Number of emails to return
   * @returns {Array} - Top N email guesses
   */
  getTopGuesses(fullName, company, limit = 5) {
    const allGuesses = this.guessEmails(fullName, company);
    return allGuesses.slice(0, limit);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailGuesser;
}
