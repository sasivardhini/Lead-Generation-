/**
 * Content Script - Lead Generator Pro
 * Injects into all pages to extract lead data and inject sidebar
 */

// Import utility functions by embedding them
// (In Chrome extensions, we can't use ES6 imports in content scripts directly)

// Initialize global state
let sidebarInjected = false;
let currentLeadData = null;

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractLeads') {
    extractPageData().then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'toggleSidebar') {
    toggleSidebar();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getSidebarData') {
    sendResponse({ success: true, data: currentLeadData });
    return true;
  }
});

/**
 * Initialize on page load
 */
function initialize() {
  // Create sidebar toggle button
  createToggleButton();

  // Auto-extract on LinkedIn profiles
  if (window.location.hostname.includes('linkedin.com') &&
      (window.location.pathname.startsWith('/in/') ||
       window.location.pathname.startsWith('/company/'))) {
    // Auto-extract after a short delay to let page load
    setTimeout(() => {
      extractPageData();
    }, 2000);
  }
}

/**
 * Create floating toggle button
 */
function createToggleButton() {
  // Check if button already exists
  if (document.getElementById('leadgen-sidebar-toggle')) {
    return;
  }

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'leadgen-sidebar-toggle';
  toggleBtn.innerHTML = '🎯 LEADS';
  toggleBtn.title = 'Open Lead Generator';

  // Add CSS
  toggleBtn.style.cssText = `
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px 0 0 8px;
    padding: 15px 10px;
    cursor: pointer;
    z-index: 2147483646;
    font-size: 12px;
    box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-weight: 600;
    letter-spacing: 1px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  `;

  toggleBtn.addEventListener('click', () => {
    toggleSidebar();
  });

  toggleBtn.addEventListener('mouseenter', () => {
    toggleBtn.style.paddingRight = '15px';
    toggleBtn.style.boxShadow = '-4px 4px 15px rgba(102, 126, 234, 0.4)';
  });

  toggleBtn.addEventListener('mouseleave', () => {
    toggleBtn.style.paddingRight = '10px';
    toggleBtn.style.boxShadow = '-2px 2px 10px rgba(0, 0, 0, 0.2)';
  });

  document.body.appendChild(toggleBtn);
}

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
  if (!sidebarInjected) {
    injectSidebar();
  }

  const sidebar = document.getElementById('leadgen-sidebar-container');
  const toggleBtn = document.getElementById('leadgen-sidebar-toggle');

  if (sidebar) {
    const isOpen = sidebar.classList.contains('open');

    if (isOpen) {
      sidebar.classList.remove('open');
      toggleBtn.classList.remove('hidden');
    } else {
      sidebar.classList.add('open');
      toggleBtn.classList.add('hidden');

      // Extract data when opening
      extractPageData().then(data => {
        updateSidebarContent(data);
      });
    }
  }
}

/**
 * Inject sidebar into page
 */
function injectSidebar() {
  if (sidebarInjected) return;

  // Create sidebar container
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'leadgen-sidebar-container';

  // Inject sidebar CSS
  const cssUrl = chrome.runtime.getURL('sidebar.css');
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = cssUrl;
  document.head.appendChild(linkElement);

  // Load sidebar HTML
  fetch(chrome.runtime.getURL('sidebar.html'))
    .then(response => response.text())
    .then(html => {
      // Extract body content from HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const sidebarContent = doc.body.innerHTML;

      sidebarContainer.innerHTML = sidebarContent;
      document.body.appendChild(sidebarContainer);

      // Setup sidebar event listeners
      setupSidebarListeners();

      sidebarInjected = true;
    })
    .catch(error => {
      console.error('Error loading sidebar:', error);
    });
}

/**
 * Setup sidebar event listeners
 */
function setupSidebarListeners() {
  // Close button
  const closeBtn = document.getElementById('closeSidebar');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Save local button
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  if (saveLocalBtn) {
    saveLocalBtn.addEventListener('click', async () => {
      await saveLeadLocal();
    });
  }

  // Save to API button
  const saveApiBtn = document.getElementById('saveApiBtn');
  if (saveApiBtn) {
    saveApiBtn.addEventListener('click', async () => {
      await saveLeadToAPI();
    });
  }

  // Export CSV button
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', async () => {
      await exportCurrentLead('csv');
    });
  }

  // Export to Google Sheets button
  const exportSheetsBtn = document.getElementById('exportSheetsBtn');
  if (exportSheetsBtn) {
    exportSheetsBtn.addEventListener('click', async () => {
      await exportToGoogleSheets();
    });
  }

  // Enrich button
  const enrichBtn = document.getElementById('enrichBtn');
  if (enrichBtn) {
    enrichBtn.addEventListener('click', async () => {
      await enrichLead();
    });
  }
}

/**
 * Extract all data from current page
 */
async function extractPageData() {
  const data = {
    url: window.location.href,
    domain: extractDomain(window.location.href),
    timestamp: new Date().toISOString(),
    name: null,
    company: null,
    title: null,
    location: null,
    emails: [],
    phones: [],
    socialLinks: {},
    metaDescription: null
  };

  // Check if LinkedIn page
  if (window.location.hostname.includes('linkedin.com')) {
    if (window.location.pathname.startsWith('/in/')) {
      // Extract LinkedIn profile data
      const linkedinData = extractLinkedInProfile();
      Object.assign(data, linkedinData);
    } else if (window.location.pathname.startsWith('/company/')) {
      const companyData = extractLinkedInCompany();
      Object.assign(data, companyData);
    }
  }

  // Extract general page data
  const pageText = document.body ? document.body.innerText : '';
  const htmlText = document.documentElement ? document.documentElement.innerHTML : '';

  // Extract emails
  data.emails = extractEmails(pageText + htmlText);

  // Extract phone numbers
  data.phones = extractPhones(pageText);

  // Extract social links
  data.socialLinks = extractSocialLinks(htmlText);

  // Extract name (if not from LinkedIn)
  if (!data.name) {
    data.name = extractName();
  }

  // Extract company (if not from LinkedIn)
  if (!data.company) {
    data.company = extractCompany();
  }

  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  data.metaDescription = metaDesc ? metaDesc.getAttribute('content') : null;

  // Store current lead data
  currentLeadData = data;

  // Highlight emails on page
  highlightEmails();

  return data;
}

/**
 * Extract emails from text using regex
 */
function extractEmails(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const emails = new Set();
  const matches = text.match(emailRegex);

  if (matches) {
    matches.forEach(email => {
      const cleaned = email.toLowerCase().trim();
      // Filter out common false positives
      if (!cleaned.match(/\.(png|jpg|gif|svg|example\.com|test\.com)$/i)) {
        emails.add(cleaned);
      }
    });
  }

  return Array.from(emails);
}

/**
 * Extract phone numbers from text
 */
function extractPhones(text) {
  const phoneRegex = /(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g;
  const phones = new Set();
  const matches = text.match(phoneRegex);

  if (matches) {
    matches.forEach(phone => {
      const cleaned = phone.replace(/[^\d+]/g, '');
      // Must be at least 10 digits
      if (cleaned.replace(/\+/g, '').length >= 10) {
        phones.add(phone.trim());
      }
    });
  }

  return Array.from(phones);
}

/**
 * Extract social media links
 */
function extractSocialLinks(html) {
  const socialPatterns = {
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)/gi,
    twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/gi,
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/gi,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
    github: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)/gi
  };

  const socialLinks = {};

  for (const [platform, pattern] of Object.entries(socialPatterns)) {
    const matches = html.match(pattern);
    if (matches) {
      socialLinks[platform] = [...new Set(matches)];
    }
  }

  return socialLinks;
}

/**
 * Extract name from page
 */
function extractName() {
  const selectors = [
    'meta[property="og:title"]',
    'meta[name="author"]',
    '.author-name',
    '.profile-name',
    'h1.name'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    }
  }

  return null;
}

/**
 * Extract company name
 */
function extractCompany() {
  const selectors = [
    'meta[property="og:site_name"]',
    'meta[name="application-name"]',
    '.company-name'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content) return content.trim();
    }
  }

  // Fallback to domain
  const title = document.title;
  if (title) {
    const parts = title.split(/[\|–-]/);
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
  }

  return null;
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

/**
 * Highlight emails on page
 */
function highlightEmails() {
  // Skip if already highlighted
  if (document.querySelector('.lead-gen-highlight')) {
    return;
  }

  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;

  while (node = walker.nextNode()) {
    if (emailRegex.test(node.nodeValue)) {
      textNodes.push(node);
    }
    emailRegex.lastIndex = 0;
  }

  textNodes.forEach(textNode => {
    const text = textNode.nodeValue;
    const highlighted = text.replace(
      emailRegex,
      '<span class="lead-gen-highlight" style="background-color: #ffff00; padding: 2px 4px; border-radius: 3px;">$1</span>'
    );

    if (highlighted !== text) {
      const span = document.createElement('span');
      span.innerHTML = highlighted;
      textNode.parentNode.replaceChild(span, textNode);
    }
  });
}

/**
 * Extract LinkedIn profile data
 */
function extractLinkedInProfile() {
  const data = {
    type: 'linkedin_profile',
    name: null,
    headline: null,
    location: null,
    company: null,
    about: null
  };

  // Extract name
  const nameSelectors = [
    'h1.text-heading-xlarge',
    '.pv-text-details__left-panel h1'
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      data.name = element.textContent.trim();
      break;
    }
  }

  // Extract headline
  const headlineSelectors = [
    '.text-body-medium.break-words',
    'div.text-body-medium'
  ];

  for (const selector of headlineSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.length < 200) {
      data.headline = element.textContent.trim();
      data.title = data.headline;
      break;
    }
  }

  // Extract location
  const locationElement = document.querySelector('.text-body-small.inline.t-black--light.break-words');
  if (locationElement) {
    data.location = locationElement.textContent.trim();
  }

  // Extract about
  const aboutElement = document.querySelector('#about ~ div .inline-show-more-text span[aria-hidden="true"]');
  if (aboutElement) {
    data.about = aboutElement.textContent.trim();
  }

  return data;
}

/**
 * Extract LinkedIn company data
 */
function extractLinkedInCompany() {
  const data = {
    type: 'linkedin_company',
    company: null
  };

  const nameElement = document.querySelector('h1.org-top-card-summary__title');
  if (nameElement) {
    data.company = nameElement.textContent.trim();
  }

  return data;
}

/**
 * Update sidebar with extracted data
 */
function updateSidebarContent(data) {
  if (!data) return;

  // Show main content, hide loading
  const loadingSpinner = document.getElementById('loadingSpinner');
  const mainContent = document.getElementById('mainContent');

  if (loadingSpinner) loadingSpinner.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';

  // Update page URL
  const pageUrl = document.getElementById('pageUrl');
  if (pageUrl) {
    pageUrl.textContent = data.domain || 'Current page';
  }

  // Update contact info
  updateElement('contactName', data.name || '-');
  updateElement('contactCompany', data.company || '-');
  updateElement('contactTitle', data.title || data.headline || '-');
  updateElement('contactLocation', data.location || '-');

  // Update emails
  updateEmailList(data.emails);

  // Update phones
  updatePhoneList(data.phones);

  // Update social links
  updateSocialLinks(data.socialLinks);
}

/**
 * Update element text content
 */
function updateElement(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

/**
 * Update email list
 */
function updateEmailList(emails) {
  const emailList = document.getElementById('emailList');
  const emailCount = document.getElementById('emailCount');

  if (!emailList) return;

  if (!emails || emails.length === 0) {
    emailList.innerHTML = '<li class="empty-state"><div class="empty-state-text">No emails found</div></li>';
    if (emailCount) emailCount.textContent = '0';
    return;
  }

  if (emailCount) emailCount.textContent = emails.length.toString();

  emailList.innerHTML = emails.map(email => `
    <li class="email-item">
      <span>${escapeHtml(email)}</span>
      <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(email)}')">Copy</button>
    </li>
  `).join('');
}

/**
 * Update phone list
 */
function updatePhoneList(phones) {
  const phoneList = document.getElementById('phoneList');
  const phoneCount = document.getElementById('phoneCount');

  if (!phoneList) return;

  if (!phones || phones.length === 0) {
    phoneList.innerHTML = '<li class="empty-state"><div class="empty-state-text">No phone numbers found</div></li>';
    if (phoneCount) phoneCount.textContent = '0';
    return;
  }

  if (phoneCount) phoneCount.textContent = phones.length.toString();

  phoneList.innerHTML = phones.map(phone => `
    <li class="phone-item">
      <span>${escapeHtml(phone)}</span>
      <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(phone)}')">Copy</button>
    </li>
  `).join('');
}

/**
 * Update social links
 */
function updateSocialLinks(socialLinks) {
  const socialLinksContainer = document.getElementById('socialLinks');

  if (!socialLinksContainer) return;

  if (!socialLinks || Object.keys(socialLinks).length === 0) {
    socialLinksContainer.innerHTML = '<div class="empty-state-text">No social profiles found</div>';
    return;
  }

  const icons = {
    linkedin: '💼',
    twitter: '🐦',
    facebook: '👥',
    instagram: '📷',
    github: '💻'
  };

  const html = Object.entries(socialLinks).map(([platform, urls]) => {
    return urls.map(url => `
      <a href="${url}" target="_blank" class="social-link">
        <span>${icons[platform] || '🔗'}</span>
        ${platform}
      </a>
    `).join('');
  }).join('');

  socialLinksContainer.innerHTML = html;
}

/**
 * Save lead to local storage
 */
async function saveLeadLocal() {
  if (!currentLeadData) {
    showNotification('No data to save', 'error');
    return;
  }

  try {
    // Get existing leads
    const result = await chrome.storage.local.get(['leads']);
    const leads = result.leads || [];

    // Add new lead
    leads.push(currentLeadData);

    // Save back to storage
    await chrome.storage.local.set({ leads: leads });

    showNotification('Lead saved locally!', 'success');
  } catch (error) {
    console.error('Error saving lead:', error);
    showNotification('Failed to save lead', 'error');
  }
}

/**
 * Save lead to API
 */
async function saveLeadToAPI() {
  if (!currentLeadData) {
    showNotification('No data to save', 'error');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'saveToAPI',
      data: currentLeadData
    });

    if (response && response.success) {
      showNotification('Lead saved to API!', 'success');
    } else {
      throw new Error('API save failed');
    }
  } catch (error) {
    console.error('Error saving to API:', error);
    showNotification('Failed to save to API', 'error');
  }
}

/**
 * Export current lead
 */
async function exportCurrentLead(format) {
  if (!currentLeadData) {
    showNotification('No data to export', 'error');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'exportLeads',
      format: format,
      leads: [currentLeadData]
    });

    if (response && response.success) {
      showNotification(`Exported as ${format.toUpperCase()}!`, 'success');
    }
  } catch (error) {
    console.error('Error exporting:', error);
    showNotification('Export failed', 'error');
  }
}

/**
 * Export to Google Sheets
 */
async function exportToGoogleSheets() {
  showNotification('Google Sheets export coming soon!', 'info');
}

/**
 * Enrich lead data
 */
async function enrichLead() {
  if (!currentLeadData) {
    showNotification('No data to enrich', 'error');
    return;
  }

  showNotification('Enrichment coming soon!', 'info');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `leadgen-notification ${type}`;
  notification.innerHTML = `
    <div class="leadgen-notification-content">
      <div class="leadgen-notification-message">${escapeHtml(message)}</div>
    </div>
    <button class="leadgen-notification-close">×</button>
  `;

  notification.querySelector('.leadgen-notification-close').addEventListener('click', () => {
    notification.remove();
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Copy to clipboard
 */
window.copyToClipboard = async function(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotification('Failed to copy', 'error');
  }
};

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
