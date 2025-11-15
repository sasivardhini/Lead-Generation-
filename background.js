/**
 * Background Service Worker - Lead Generator Pro
 * Handles extension background tasks, API calls, and data management
 */

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Lead Generator Pro installed!');

    // Initialize storage
    chrome.storage.local.set({
      leads: [],
      stats: {
        total: 0,
        today: 0,
        lastUpdated: new Date().toISOString()
      },
      settings: {
        apiKey: '',
        apiBaseUrl: 'https://api.yourbackend.com',
        googleSheetsId: '',
        autoExtract: true,
        highlightEmails: true
      }
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://github.com/yourusername/lead-generator-pro'
    });
  }

  if (details.reason === 'update') {
    console.log('Lead Generator Pro updated!');
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  if (request.action === 'saveToAPI') {
    saveLeadToAPI(request.data).then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'exportLeads') {
    exportLeads(request.leads, request.format).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'enrichLead') {
    enrichLead(request.data).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'verifyEmail') {
    verifyEmail(request.email).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'guessEmails') {
    guessEmails(request.name, request.company).then(result => {
      sendResponse(result);
    });
    return true;
  }
});

/**
 * Save lead to backend API
 */
async function saveLeadToAPI(leadData) {
  try {
    // Get API settings
    const settings = await chrome.storage.local.get(['settings']);
    const apiKey = settings.settings?.apiKey || '';
    const apiBaseUrl = settings.settings?.apiBaseUrl || 'https://api.yourbackend.com';

    if (!apiKey) {
      throw new Error('API key not configured. Please set it in settings.');
    }

    // Make API request
    const response = await fetch(`${apiBaseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lead: leadData,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error saving to API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Export leads to file
 */
async function exportLeads(leads, format) {
  try {
    let content, filename, mimeType;

    if (format === 'csv') {
      content = convertToCSV(leads);
      filename = `leads_export_${getTimestamp()}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'json') {
      content = JSON.stringify(leads, null, 2);
      filename = `leads_export_${getTimestamp()}.json`;
      mimeType = 'application/json';
    } else if (format === 'vcard') {
      content = convertToVCard(leads);
      filename = `leads_contacts_${getTimestamp()}.vcf`;
      mimeType = 'text/vcard';
    } else {
      throw new Error('Unsupported format');
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Trigger download
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });

    return {
      success: true,
      filename: filename
    };
  } catch (error) {
    console.error('Error exporting leads:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert leads to CSV format
 */
function convertToCSV(leads) {
  if (!leads || leads.length === 0) {
    return '';
  }

  // Define headers
  const headers = [
    'Timestamp', 'Name', 'Email', 'Phone', 'Company',
    'Title', 'Location', 'LinkedIn', 'Domain', 'Source URL'
  ];

  const rows = [headers.join(',')];

  leads.forEach(lead => {
    const row = [
      lead.timestamp || '',
      escapeCSV(lead.name || ''),
      escapeCSV(lead.email || (lead.emails && lead.emails[0]) || ''),
      escapeCSV(lead.phone || (lead.phones && lead.phones[0]) || ''),
      escapeCSV(lead.company || ''),
      escapeCSV(lead.title || lead.headline || ''),
      escapeCSV(lead.location || ''),
      escapeCSV(lead.linkedinUrl || ''),
      escapeCSV(lead.domain || ''),
      escapeCSV(lead.url || '')
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSV(value) {
  if (!value) return '';

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes
  if (stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert leads to VCard format
 */
function convertToVCard(leads) {
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
    if (lead.linkedinUrl || lead.url) {
      vcard += `URL:${lead.linkedinUrl || lead.url}\n`;
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
 * Enrich lead with additional data
 */
async function enrichLead(leadData) {
  try {
    // Get API settings
    const settings = await chrome.storage.local.get(['settings']);
    const apiKey = settings.settings?.apiKey || '';
    const apiBaseUrl = settings.settings?.apiBaseUrl || 'https://api.yourbackend.com';

    if (!apiKey) {
      // Return mock enrichment data
      return {
        success: true,
        data: {
          enriched: true,
          confidence: 0.85,
          additionalData: {
            jobTitle: leadData.title || 'Unknown',
            companySize: '50-200 employees',
            industry: 'Technology',
            predictedEmails: []
          }
        }
      };
    }

    // Make API request for enrichment
    const response = await fetch(`${apiBaseUrl}/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email: leadData.email,
        name: leadData.name,
        company: leadData.company,
        domain: leadData.domain
      })
    });

    if (!response.ok) {
      throw new Error('Enrichment API error');
    }

    const data = await response.json();

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error enriching lead:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify email address
 */
async function verifyEmail(email) {
  try {
    // Get API settings
    const settings = await chrome.storage.local.get(['settings']);
    const apiKey = settings.settings?.apiKey || '';
    const apiBaseUrl = settings.settings?.apiBaseUrl || 'https://api.yourbackend.com';

    if (!apiKey) {
      // Return mock verification result
      return {
        success: true,
        data: {
          email: email,
          status: 'valid',
          score: 85,
          checks: {
            format: true,
            disposable: false,
            freeEmail: email.includes('gmail') || email.includes('yahoo'),
            mxRecords: true,
            smtp: true
          }
        }
      };
    }

    // Make API request for verification
    const response = await fetch(`${apiBaseUrl}/verify/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Verification API error');
    }

    const data = await response.json();

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Guess email patterns
 */
async function guessEmails(name, company) {
  try {
    // Simple email pattern guesser
    const patterns = generateEmailPatterns(name, company);

    return {
      success: true,
      data: {
        patterns: patterns,
        count: patterns.length
      }
    };
  } catch (error) {
    console.error('Error guessing emails:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate email patterns
 */
function generateEmailPatterns(fullName, company) {
  if (!fullName || !company) {
    return [];
  }

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0]?.toLowerCase() || '';
  const lastName = nameParts[nameParts.length - 1]?.toLowerCase() || '';

  // Extract domain from company
  let domain = company.toLowerCase();
  if (domain.includes('http')) {
    try {
      domain = new URL(domain).hostname.replace('www.', '');
    } catch (e) {
      // Invalid URL
    }
  } else if (!domain.includes('.')) {
    domain = `${domain.replace(/[^a-z0-9]/g, '')}.com`;
  }

  const patterns = [];

  // Generate common patterns
  if (firstName && lastName) {
    patterns.push({ email: `${firstName}.${lastName}@${domain}`, pattern: 'first.last', confidence: 95 });
    patterns.push({ email: `${firstName}${lastName}@${domain}`, pattern: 'firstlast', confidence: 85 });
    patterns.push({ email: `${firstName}@${domain}`, pattern: 'first', confidence: 75 });
    patterns.push({ email: `${firstName[0]}${lastName}@${domain}`, pattern: 'flast', confidence: 70 });
    patterns.push({ email: `${firstName[0]}.${lastName}@${domain}`, pattern: 'f.last', confidence: 65 });
    patterns.push({ email: `${lastName}@${domain}`, pattern: 'last', confidence: 50 });
  } else if (firstName) {
    patterns.push({ email: `${firstName}@${domain}`, pattern: 'first', confidence: 75 });
  }

  return patterns;
}

/**
 * Get formatted timestamp for filenames
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').split('T')[0] +
         '_' + now.toTimeString().split(' ')[0].replace(/:/g, '-');
}

/**
 * Update badge with lead count
 */
async function updateBadge() {
  try {
    const result = await chrome.storage.local.get(['leads']);
    const leads = result.leads || [];

    chrome.action.setBadgeText({
      text: leads.length > 0 ? leads.length.toString() : ''
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#667eea'
    });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Update badge when leads change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.leads) {
    updateBadge();
  }
});

// Initial badge update
updateBadge();

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // Open popup (default behavior, but we can add custom logic here)
  console.log('Extension icon clicked on tab:', tab.id);
});

// Context menu items (right-click menu)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'extractEmail',
    title: 'Extract Email from Selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'openSidebar',
    title: 'Open Lead Generator',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'extractEmail') {
    const selectedText = info.selectionText;
    // Extract email from selected text
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = selectedText.match(emailRegex);

    if (emails && emails.length > 0) {
      // Save extracted emails
      const leadData = {
        emails: emails,
        url: info.pageUrl,
        timestamp: new Date().toISOString()
      };

      const result = await chrome.storage.local.get(['leads']);
      const leads = result.leads || [];
      leads.push(leadData);
      await chrome.storage.local.set({ leads: leads });

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Email Extracted',
        message: `Found ${emails.length} email(s): ${emails.join(', ')}`
      });
    }
  }

  if (info.menuItemId === 'openSidebar') {
    // Send message to content script to open sidebar
    chrome.tabs.sendMessage(tab.id, {
      action: 'toggleSidebar'
    });
  }
});

console.log('Lead Generator Pro background service worker loaded');
