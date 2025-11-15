/**
 * API Integration Module
 * Handles communication with backend services for lead storage and enrichment
 */

class APIClient {
  constructor(config = {}) {
    // Default API configuration
    this.config = {
      baseURL: config.baseURL || 'https://api.yourbackend.com',
      apiKey: config.apiKey || '',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    };
  }

  /**
   * Set API key for authentication
   * @param {string} apiKey - API key
   */
  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
  }

  /**
   * Set base URL
   * @param {string} baseURL - Base API URL
   */
  setBaseURL(baseURL) {
    this.config.baseURL = baseURL;
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>}
   */
  async request(endpoint, options = {}) {
    const url = `${this.config.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add API key if available
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const fetchOptions = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.config.timeout)
    };

    let lastError;

    // Retry logic
    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data: data,
          status: response.status
        };
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt + 1} failed:`, error.message);

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries - 1) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return {
      success: false,
      error: lastError.message,
      status: 0
    };
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save a single lead
   * @param {Object} lead - Lead data
   * @returns {Promise<Object>}
   */
  async saveLead(lead) {
    return await this.request('/leads', {
      method: 'POST',
      body: JSON.stringify({
        lead: lead,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Bulk upload leads
   * @param {Array} leads - Array of lead objects
   * @returns {Promise<Object>}
   */
  async bulkUpload(leads) {
    return await this.request('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify({
        leads: leads,
        count: leads.length,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Update existing lead
   * @param {string} leadId - Lead ID
   * @param {Object} updates - Updated lead data
   * @returns {Promise<Object>}
   */
  async updateLead(leadId, updates) {
    return await this.request(`/leads/${leadId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete lead
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>}
   */
  async deleteLead(leadId) {
    return await this.request(`/leads/${leadId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get lead by ID
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>}
   */
  async getLead(leadId) {
    return await this.request(`/leads/${leadId}`, {
      method: 'GET'
    });
  }

  /**
   * Search leads
   * @param {Object} query - Search query parameters
   * @returns {Promise<Object>}
   */
  async searchLeads(query) {
    const params = new URLSearchParams(query).toString();
    return await this.request(`/leads/search?${params}`, {
      method: 'GET'
    });
  }

  /**
   * Enrich lead with additional data
   * @param {Object} lead - Lead to enrich
   * @returns {Promise<Object>}
   */
  async enrichLead(lead) {
    return await this.request('/enrich', {
      method: 'POST',
      body: JSON.stringify({
        email: lead.email,
        name: lead.name,
        company: lead.company,
        domain: lead.domain
      })
    });
  }

  /**
   * Verify email via backend
   * @param {string} email - Email to verify
   * @returns {Promise<Object>}
   */
  async verifyEmail(email) {
    return await this.request('/verify/email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  /**
   * Get company information
   * @param {string} domain - Company domain
   * @returns {Promise<Object>}
   */
  async getCompanyInfo(domain) {
    return await this.request(`/company/${domain}`, {
      method: 'GET'
    });
  }

  /**
   * Export leads to Google Sheets
   * @param {Array} leads - Leads to export
   * @param {string} spreadsheetId - Google Sheets ID
   * @returns {Promise<Object>}
   */
  async exportToGoogleSheets(leads, spreadsheetId) {
    return await this.request('/export/sheets', {
      method: 'POST',
      body: JSON.stringify({
        leads: leads,
        spreadsheetId: spreadsheetId
      })
    });
  }

  /**
   * Sync leads with CRM
   * @param {Array} leads - Leads to sync
   * @param {string} crmType - CRM type (salesforce, hubspot, etc.)
   * @returns {Promise<Object>}
   */
  async syncToCRM(leads, crmType) {
    return await this.request('/sync/crm', {
      method: 'POST',
      body: JSON.stringify({
        leads: leads,
        crm: crmType
      })
    });
  }

  /**
   * Get API usage statistics
   * @returns {Promise<Object>}
   */
  async getUsageStats() {
    return await this.request('/stats/usage', {
      method: 'GET'
    });
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const result = await this.request('/health', {
        method: 'GET'
      });
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Google Sheets Integration
 * Direct integration with Google Sheets API
 */
class GoogleSheetsClient {
  constructor(apiKey = '') {
    this.apiKey = apiKey;
    this.baseURL = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  /**
   * Set Google API key
   * @param {string} apiKey - Google API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Append leads to Google Sheet
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {Array} leads - Lead data
   * @param {string} range - Sheet range (e.g., 'Sheet1!A1')
   * @returns {Promise<Object>}
   */
  async appendLeads(spreadsheetId, leads, range = 'Sheet1!A1') {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google API key not configured'
      };
    }

    // Convert leads to 2D array format
    const values = this.convertLeadsToRows(leads);

    const url = `${this.baseURL}/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert lead objects to spreadsheet rows
   * @param {Array} leads - Lead objects
   * @returns {Array} - 2D array of values
   */
  convertLeadsToRows(leads) {
    // Header row
    const headers = [
      'Timestamp', 'Name', 'Email', 'Phone', 'Company',
      'Title', 'LinkedIn', 'Location', 'Source URL'
    ];

    const rows = [headers];

    leads.forEach(lead => {
      rows.push([
        new Date().toISOString(),
        lead.name || '',
        lead.email || (lead.emails && lead.emails[0]) || '',
        lead.phone || (lead.phones && lead.phones[0]) || '',
        lead.company || '',
        lead.title || lead.headline || '',
        lead.linkedinUrl || '',
        lead.location || '',
        lead.url || lead.sourceUrl || ''
      ]);
    });

    return rows;
  }

  /**
   * Create new spreadsheet
   * @param {string} title - Spreadsheet title
   * @returns {Promise<Object>}
   */
  async createSpreadsheet(title) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Google API key not configured'
      };
    }

    const url = `${this.baseURL}?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: title
          }
        })
      });

      const data = await response.json();

      return {
        success: true,
        data: data,
        spreadsheetId: data.spreadsheetId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, GoogleSheetsClient };
}
