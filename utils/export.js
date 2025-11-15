/**
 * Export Utilities
 * Handle exporting leads to various formats (CSV, JSON, Excel)
 */

class ExportManager {
  constructor() {
    this.csvSeparator = ',';
    this.csvNewline = '\n';
  }

  /**
   * Convert leads to CSV format
   * @param {Array} leads - Array of lead objects
   * @param {Array} fields - Fields to include (optional)
   * @returns {string} - CSV string
   */
  toCSV(leads, fields = null) {
    if (!leads || leads.length === 0) {
      return '';
    }

    // Determine fields to export
    const exportFields = fields || this.getDefaultFields(leads[0]);

    // Create header row
    const headers = exportFields.map(field => this.escapeCSV(field));
    const rows = [headers.join(this.csvSeparator)];

    // Create data rows
    leads.forEach(lead => {
      const row = exportFields.map(field => {
        const value = this.getNestedValue(lead, field);
        return this.escapeCSV(String(value || ''));
      });
      rows.push(row.join(this.csvSeparator));
    });

    return rows.join(this.csvNewline);
  }

  /**
   * Get default export fields
   * @param {Object} sampleLead - Sample lead to extract fields from
   * @returns {Array} - Array of field names
   */
  getDefaultFields(sampleLead) {
    const priorityFields = [
      'name', 'email', 'emails', 'phone', 'phones', 'company',
      'title', 'headline', 'location', 'linkedinUrl', 'url',
      'domain', 'timestamp'
    ];

    const fields = [];
    priorityFields.forEach(field => {
      if (sampleLead.hasOwnProperty(field)) {
        fields.push(field);
      }
    });

    return fields;
  }

  /**
   * Get nested object value by dot notation path
   * @param {Object} obj - Object to extract from
   * @param {string} path - Dot notation path (e.g., 'contact.email')
   * @returns {*}
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.join('; ');
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return value;
  }

  /**
   * Escape CSV value
   * @param {string} value - Value to escape
   * @returns {string} - Escaped value
   */
  escapeCSV(value) {
    if (!value) return '';

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes
    if (stringValue.includes(this.csvSeparator) ||
        stringValue.includes('"') ||
        stringValue.includes('\n')) {
      // Escape existing quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Convert leads to JSON format
   * @param {Array} leads - Array of lead objects
   * @param {boolean} pretty - Pretty print JSON
   * @returns {string} - JSON string
   */
  toJSON(leads, pretty = true) {
    return JSON.stringify(leads, null, pretty ? 2 : 0);
  }

  /**
   * Convert leads to formatted table string
   * @param {Array} leads - Array of lead objects
   * @returns {string} - Table string
   */
  toTable(leads) {
    if (!leads || leads.length === 0) {
      return 'No leads to display';
    }

    const fields = this.getDefaultFields(leads[0]);
    const rows = [];

    // Calculate column widths
    const columnWidths = {};
    fields.forEach(field => {
      columnWidths[field] = field.length;
    });

    leads.forEach(lead => {
      fields.forEach(field => {
        const value = String(this.getNestedValue(lead, field) || '');
        columnWidths[field] = Math.max(columnWidths[field], value.length);
      });
    });

    // Create header
    const headerRow = fields.map(field =>
      field.padEnd(columnWidths[field])
    ).join(' | ');
    rows.push(headerRow);
    rows.push(fields.map(field => '-'.repeat(columnWidths[field])).join('-|-'));

    // Create data rows
    leads.forEach(lead => {
      const row = fields.map(field => {
        const value = String(this.getNestedValue(lead, field) || '');
        return value.padEnd(columnWidths[field]);
      }).join(' | ');
      rows.push(row);
    });

    return rows.join('\n');
  }

  /**
   * Download file to user's computer
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export leads as CSV file
   * @param {Array} leads - Array of lead objects
   * @param {string} filename - Filename (optional)
   */
  exportCSV(leads, filename = null) {
    const csv = this.toCSV(leads);
    const defaultFilename = `leads_export_${this.getTimestamp()}.csv`;
    this.downloadFile(csv, filename || defaultFilename, 'text/csv');
  }

  /**
   * Export leads as JSON file
   * @param {Array} leads - Array of lead objects
   * @param {string} filename - Filename (optional)
   */
  exportJSON(leads, filename = null) {
    const json = this.toJSON(leads);
    const defaultFilename = `leads_export_${this.getTimestamp()}.json`;
    this.downloadFile(json, filename || defaultFilename, 'application/json');
  }

  /**
   * Get formatted timestamp for filenames
   * @returns {string}
   */
  getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').split('T')[0] +
           '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');
  }

  /**
   * Copy to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>}
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Export leads to clipboard as CSV
   * @param {Array} leads - Array of lead objects
   * @returns {Promise<boolean>}
   */
  async copyCSVToClipboard(leads) {
    const csv = this.toCSV(leads);
    return await this.copyToClipboard(csv);
  }

  /**
   * Export leads to clipboard as JSON
   * @param {Array} leads - Array of lead objects
   * @returns {Promise<boolean>}
   */
  async copyJSONToClipboard(leads) {
    const json = this.toJSON(leads, false);
    return await this.copyToClipboard(json);
  }

  /**
   * Convert leads to VCard format (for contact import)
   * @param {Array} leads - Array of lead objects
   * @returns {string} - VCard string
   */
  toVCard(leads) {
    const vcards = [];

    leads.forEach(lead => {
      let vcard = 'BEGIN:VCARD\n';
      vcard += 'VERSION:3.0\n';

      // Name
      if (lead.name) {
        const nameParts = lead.name.split(' ');
        const lastName = nameParts.pop();
        const firstName = nameParts.join(' ');
        vcard += `N:${lastName};${firstName};;;\n`;
        vcard += `FN:${lead.name}\n`;
      }

      // Email
      const email = lead.email || (lead.emails && lead.emails[0]);
      if (email) {
        vcard += `EMAIL;TYPE=WORK:${email}\n`;
      }

      // Phone
      const phone = lead.phone || (lead.phones && lead.phones[0]);
      if (phone) {
        vcard += `TEL;TYPE=WORK:${phone}\n`;
      }

      // Organization
      if (lead.company) {
        vcard += `ORG:${lead.company}\n`;
      }

      // Title
      if (lead.title || lead.headline) {
        vcard += `TITLE:${lead.title || lead.headline}\n`;
      }

      // URL
      if (lead.linkedinUrl) {
        vcard += `URL:${lead.linkedinUrl}\n`;
      }

      // Location
      if (lead.location) {
        vcard += `ADR;TYPE=WORK:;;${lead.location};;;;\n`;
      }

      vcard += 'END:VCARD\n';
      vcards.push(vcard);
    });

    return vcards.join('\n');
  }

  /**
   * Export leads as VCard file
   * @param {Array} leads - Array of lead objects
   * @param {string} filename - Filename (optional)
   */
  exportVCard(leads, filename = null) {
    const vcard = this.toVCard(leads);
    const defaultFilename = `leads_contacts_${this.getTimestamp()}.vcf`;
    this.downloadFile(vcard, filename || defaultFilename, 'text/vcard');
  }

  /**
   * Generate export statistics
   * @param {Array} leads - Array of lead objects
   * @returns {Object} - Statistics object
   */
  getExportStats(leads) {
    const stats = {
      totalLeads: leads.length,
      withEmail: 0,
      withPhone: 0,
      withLinkedIn: 0,
      withCompany: 0,
      sources: {},
      domains: {}
    };

    leads.forEach(lead => {
      if (lead.email || (lead.emails && lead.emails.length > 0)) {
        stats.withEmail++;
      }

      if (lead.phone || (lead.phones && lead.phones.length > 0)) {
        stats.withPhone++;
      }

      if (lead.linkedinUrl) {
        stats.withLinkedIn++;
      }

      if (lead.company) {
        stats.withCompany++;
      }

      // Track source domains
      if (lead.domain) {
        stats.domains[lead.domain] = (stats.domains[lead.domain] || 0) + 1;
      }

      // Track source URLs
      if (lead.url) {
        try {
          const url = new URL(lead.url);
          const source = url.hostname.replace('www.', '');
          stats.sources[source] = (stats.sources[source] || 0) + 1;
        } catch (e) {
          // Invalid URL
        }
      }
    });

    return stats;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportManager;
}
