/**
 * Data Extraction Utilities
 * Advanced extraction engine for emails, phones, social links, and contact information
 */

class DataExtractor {
  constructor() {
    // Email regex patterns - comprehensive detection
    this.emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

    // Phone regex patterns - international and US formats
    this.phoneRegex = /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;

    // Social media URL patterns
    this.socialPatterns = {
      linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)/gi,
      twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi,
      facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/gi,
      instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
      github: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)/gi
    };
  }

  /**
   * Extract all emails from page content
   * @param {string} text - Text content to search
   * @returns {Array} - Unique email addresses found
   */
  extractEmails(text) {
    const emails = new Set();
    const matches = text.match(this.emailRegex);

    if (matches) {
      matches.forEach(email => {
        // Clean and validate email
        const cleaned = email.toLowerCase().trim();
        if (this.isValidEmail(cleaned)) {
          emails.add(cleaned);
        }
      });
    }

    return Array.from(emails);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail(email) {
    // Exclude common false positives
    const excludePatterns = [
      /\.png$/i,
      /\.jpg$/i,
      /\.gif$/i,
      /\.svg$/i,
      /example\.com$/i,
      /test\.com$/i,
      /email@/i,
      /your@/i,
      /name@/i
    ];

    return !excludePatterns.some(pattern => pattern.test(email));
  }

  /**
   * Extract phone numbers from text
   * @param {string} text - Text to search
   * @returns {Array} - Formatted phone numbers
   */
  extractPhones(text) {
    const phones = new Set();
    const matches = text.match(this.phoneRegex);

    if (matches) {
      matches.forEach(phone => {
        const cleaned = this.cleanPhone(phone);
        if (this.isValidPhone(cleaned)) {
          phones.add(cleaned);
        }
      });
    }

    return Array.from(phones);
  }

  /**
   * Clean phone number formatting
   * @param {string} phone - Raw phone number
   * @returns {string} - Cleaned phone
   */
  cleanPhone(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Validate phone number
   * @param {string} phone - Cleaned phone number
   * @returns {boolean}
   */
  isValidPhone(phone) {
    // Must be at least 10 digits (excluding country code)
    const digitCount = phone.replace(/\+/g, '').length;
    return digitCount >= 10 && digitCount <= 15;
  }

  /**
   * Extract social media profiles
   * @param {string} text - Text or HTML to search
   * @returns {Object} - Social media profiles by platform
   */
  extractSocialLinks(text) {
    const socialLinks = {};

    for (const [platform, pattern] of Object.entries(this.socialPatterns)) {
      const matches = text.match(pattern);
      if (matches) {
        socialLinks[platform] = [...new Set(matches)];
      }
    }

    return socialLinks;
  }

  /**
   * Extract person name from page content
   * Uses multiple heuristics to find likely names
   * @param {Document} doc - DOM document
   * @returns {string|null} - Extracted name
   */
  extractName(doc) {
    // Try meta tags first
    const metaSelectors = [
      'meta[property="og:title"]',
      'meta[name="author"]',
      'meta[property="profile:first_name"]',
      'meta[property="profile:last_name"]'
    ];

    for (const selector of metaSelectors) {
      const meta = doc.querySelector(selector);
      if (meta) {
        const content = meta.getAttribute('content');
        if (content && this.isLikelyName(content)) {
          return content;
        }
      }
    }

    // Try common name selectors
    const nameSelectors = [
      '.author-name',
      '.profile-name',
      '.user-name',
      'h1.name',
      '[itemprop="name"]'
    ];

    for (const selector of nameSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (this.isLikelyName(text)) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Check if text is likely a person's name
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  isLikelyName(text) {
    // Basic heuristics for name detection
    if (!text || text.length < 2 || text.length > 50) return false;

    // Should have 1-3 words, each capitalized
    const words = text.trim().split(/\s+/);
    if (words.length < 1 || words.length > 4) return false;

    // Check if words start with capital letter
    return words.every(word => /^[A-Z]/.test(word));
  }

  /**
   * Extract company name from page
   * @param {Document} doc - DOM document
   * @returns {string|null} - Company name
   */
  extractCompany(doc) {
    // Try meta tags
    const metaSelectors = [
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
      'meta[property="business:contact_data:company_name"]'
    ];

    for (const selector of metaSelectors) {
      const meta = doc.querySelector(selector);
      if (meta) {
        const content = meta.getAttribute('content');
        if (content) return content;
      }
    }

    // Try common company selectors
    const companySelectors = [
      '.company-name',
      '[itemprop="name"]',
      '.org',
      '.organization'
    ];

    for (const selector of companySelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }

    // Fallback to title extraction
    const title = doc.title;
    if (title) {
      // Extract company from title (usually after | or -)
      const parts = title.split(/[\|–-]/);
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
    }

    return null;
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to parse
   * @returns {string|null} - Domain name
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract all contact data from a webpage
   * @param {Document} doc - DOM document
   * @returns {Object} - Comprehensive contact data
   */
  extractAllData(doc) {
    const url = doc.location.href;
    const bodyText = doc.body ? doc.body.innerText : '';
    const htmlText = doc.documentElement ? doc.documentElement.innerHTML : '';

    const data = {
      url: url,
      domain: this.extractDomain(url),
      timestamp: new Date().toISOString(),
      name: this.extractName(doc),
      company: this.extractCompany(doc),
      emails: this.extractEmails(bodyText + htmlText),
      phones: this.extractPhones(bodyText),
      socialLinks: this.extractSocialLinks(htmlText),
      title: doc.title,
      metaDescription: this.getMetaDescription(doc)
    };

    return data;
  }

  /**
   * Get meta description
   * @param {Document} doc - DOM document
   * @returns {string|null}
   */
  getMetaDescription(doc) {
    const meta = doc.querySelector('meta[name="description"]');
    return meta ? meta.getAttribute('content') : null;
  }

  /**
   * Highlight emails on page for visual feedback
   * @param {Document} doc - DOM document
   */
  highlightEmailsOnPage(doc) {
    if (!doc.body) return;

    const walker = doc.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const nodesToReplace = [];
    let node;

    while (node = walker.nextNode()) {
      if (this.emailRegex.test(node.nodeValue)) {
        nodesToReplace.push(node);
      }
    }

    // Reset regex lastIndex
    this.emailRegex.lastIndex = 0;

    nodesToReplace.forEach(textNode => {
      const text = textNode.nodeValue;
      const highlighted = text.replace(
        this.emailRegex,
        '<span class="lead-gen-highlight" style="background-color: #ffff00; padding: 2px 4px; border-radius: 3px;">$1</span>'
      );

      if (highlighted !== text) {
        const span = doc.createElement('span');
        span.innerHTML = highlighted;
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExtractor;
}
