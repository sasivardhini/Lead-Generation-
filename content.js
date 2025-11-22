/**
 * Content Script - Lead Generator Pro
 * Injects into all pages to extract lead data and inject sidebar
 */

// Import utility functions by embedding them
// (In Chrome extensions, we can't use ES6 imports in content scripts directly)

// Initialize global state
let sidebarInjected = false;
let currentLeadData = null;
let extractor = null; // LinkedIn extractor instance
let overlayWidget = null; // Overlay widget instance
let floatingButton = null; // Floating action button

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Ping-pong for connection check
  if (request.action === 'ping') {
    sendResponse({ success: true, pong: true });
    return true;
  }

  if (request.action === 'extractLeads') {
    extractPageData().then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }

  if (request.action === 'extractBulk') {
    extractBulkFromSearch().then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.action === 'toggleSidebar') {
    toggleSidebar();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'toggleOverlay') {
    toggleOverlay();
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
  console.log('🎯 Lead Generator Pro - Content script loaded on:', window.location.href);

  // Initialize extractor and widget
  if (typeof LinkedInExtractor !== 'undefined') {
    extractor = new LinkedInExtractor();
    console.log(`✓ Initialized LinkedIn extractor (Page type: ${extractor.pageType})`);
  }

  if (typeof OverlayWidget !== 'undefined') {
    overlayWidget = new OverlayWidget();
    console.log('✓ Initialized overlay widget');
  }

  // Create floating action button
  createFloatingButton();
  console.log('✓ Floating button created');

  // Auto-extract on LinkedIn pages
  if (window.location.hostname.includes('linkedin.com')) {
    if (extractor && extractor.pageType === 'PROFILE') {
      console.log('LinkedIn profile detected - auto-extracting in 2 seconds...');
      setTimeout(() => {
        autoExtractAndShow();
      }, 2000);
    } else if (extractor && extractor.pageType === 'SEARCH_PEOPLE') {
      console.log('LinkedIn search page detected - ready for bulk extraction');
      showBulkExtractionButton();
    }
  }
}

/**
 * Auto-extract and show in overlay
 */
async function autoExtractAndShow() {
  try {
    const data = await extractPageData();
    if (data && data.name) {
      if (overlayWidget) {
        overlayWidget.render(data);
        overlayWidget.show();
      }
    }
  } catch (error) {
    console.error('Auto-extraction error:', error);
  }
}

/**
 * Create floating action button
 */
function createFloatingButton() {
  // Check if button already exists
  if (document.getElementById('leadgen-floating-button')) {
    return;
  }

  floatingButton = document.createElement('button');
  floatingButton.id = 'leadgen-floating-button';
  floatingButton.innerHTML = '🎯<br><span style="font-size: 10px;">LEADS</span>';
  floatingButton.title = 'Open Lead Generator';

  // Add CSS
  floatingButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 999998;
    font-size: 20px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
  `;

  floatingButton.addEventListener('click', () => {
    if (overlayWidget && currentLeadData) {
      toggleOverlay();
    } else {
      // Extract and show
      extractAndShowOverlay();
    }
  });

  floatingButton.addEventListener('mouseenter', () => {
    floatingButton.style.transform = 'scale(1.1)';
    floatingButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  floatingButton.addEventListener('mouseleave', () => {
    floatingButton.style.transform = 'scale(1)';
    floatingButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  document.body.appendChild(floatingButton);
}

/**
 * Toggle overlay widget
 */
function toggleOverlay() {
  if (overlayWidget) {
    overlayWidget.toggle();
  }
}

/**
 * Extract and show overlay
 */
async function extractAndShowOverlay() {
  try {
    // Show loading state
    if (floatingButton) {
      floatingButton.innerHTML = '⏳';
    }

    const data = await extractPageData();

    if (data && overlayWidget) {
      overlayWidget.render(data);
      overlayWidget.show();
    }

    // Restore button
    if (floatingButton) {
      floatingButton.innerHTML = '🎯<br><span style="font-size: 10px;">LEADS</span>';
    }
  } catch (error) {
    console.error('Error extracting data:', error);
    if (floatingButton) {
      floatingButton.innerHTML = '❌';
      setTimeout(() => {
        floatingButton.innerHTML = '🎯<br><span style="font-size: 10px;">LEADS</span>';
      }, 2000);
    }
  }
}

/**
 * Show bulk extraction button on search pages
 */
function showBulkExtractionButton() {
  // Check if already exists
  if (document.getElementById('leadgen-bulk-extract-btn')) {
    return;
  }

  const bulkButton = document.createElement('button');
  bulkButton.id = 'leadgen-bulk-extract-btn';
  bulkButton.innerHTML = '⚡ Extract All Leads';
  bulkButton.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    z-index: 999998;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  `;

  bulkButton.addEventListener('click', () => {
    extractBulkFromSearch();
  });

  bulkButton.addEventListener('mouseenter', () => {
    bulkButton.style.transform = 'translateY(-2px)';
    bulkButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  bulkButton.addEventListener('mouseleave', () => {
    bulkButton.style.transform = 'translateY(0)';
    bulkButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  document.body.appendChild(bulkButton);
}

/**
 * Extract bulk contacts from search page
 */
async function extractBulkFromSearch() {
  if (!extractor) {
    console.error('Extractor not initialized');
    return [];
  }

  const bulkButton = document.getElementById('leadgen-bulk-extract-btn');

  try {
    // Show loading state
    if (bulkButton) {
      bulkButton.innerHTML = '⏳ Extracting...';
      bulkButton.disabled = true;
    }

    const profiles = extractor.extractBulkFromSearch();

    // Enrich with email patterns
    for (const profile of profiles) {
      if (profile.firstName && profile.company) {
        profile.predictedEmails = generateEmailPatterns(
          profile.name || `${profile.firstName} ${profile.lastName || ''}`,
          profile.company,
          extractCompanyDomain(profile.company, profile.profileUrl)
        );
      }
    }

    // Save all to storage
    const result = await chrome.storage.local.get(['leads']);
    const leads = result.leads || [];
    leads.push(...profiles);
    await chrome.storage.local.set({ leads: leads });

    // Show success message
    showBulkSuccessOverlay(profiles.length);

    // Restore button
    if (bulkButton) {
      bulkButton.innerHTML = `✓ Extracted ${profiles.length} Leads`;
      setTimeout(() => {
        bulkButton.innerHTML = '⚡ Extract All Leads';
        bulkButton.disabled = false;
      }, 3000);
    }

    return profiles;
  } catch (error) {
    console.error('Bulk extraction error:', error);

    if (bulkButton) {
      bulkButton.innerHTML = '❌ Failed';
      bulkButton.disabled = false;
      setTimeout(() => {
        bulkButton.innerHTML = '⚡ Extract All Leads';
      }, 2000);
    }

    return [];
  }
}

/**
 * Show bulk extraction success overlay
 */
function showBulkSuccessOverlay(count) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 40px 60px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    z-index: 1000000;
    text-align: center;
    animation: scaleIn 0.3s ease-out;
  `;

  overlay.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
    <div style="font-size: 24px; font-weight: 700; color: #1c1e21; margin-bottom: 12px;">
      Successfully Extracted!
    </div>
    <div style="font-size: 16px; color: #65676b; margin-bottom: 24px;">
      ${count} LinkedIn profiles saved to your leads
    </div>
    <button id="leadgen-view-leads" style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    ">
      View Leads
    </button>
    <button id="leadgen-export-bulk" style="
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
      padding: 10px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 12px;
      transition: transform 0.2s;
    ">
      Export CSV
    </button>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes scaleIn {
      from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(overlay);

  // Remove after 5 seconds
  setTimeout(() => {
    overlay.remove();
    style.remove();
  }, 5000);

  // Add click to close
  overlay.addEventListener('click', (e) => {
    if (e.target.id === 'leadgen-view-leads') {
      chrome.runtime.sendMessage({ action: 'openPopup' });
      overlay.remove();
    } else if (e.target.id === 'leadgen-export-bulk') {
      chrome.runtime.sendMessage({
        action: 'exportAllLeads',
        format: 'csv'
      });
      overlay.remove();
    }
  });
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
  let data = {};

  // Use professional LinkedIn extractor if available
  if (extractor && window.location.hostname.includes('linkedin.com')) {
    if (extractor.pageType === 'PROFILE') {
      data = extractor.extractProfile();
    } else if (extractor.pageType === 'COMPANY') {
      const companyData = extractLinkedInCompany();
      data = {
        ...companyData,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        domain: extractDomain(window.location.href)
      };
    }
  } else {
    // Fallback to generic extraction
    data = {
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

  // Generate predicted emails if we have name and company but no emails found
  if (data.name && data.company && data.emails.length === 0) {
    data.predictedEmails = generateEmailPatterns(data.name, data.company, data.domain);
    console.log(`✨ Generated ${data.predictedEmails.length} predicted email patterns`);
  }

  // Extract company domain from URL or company name
  if (data.company && !data.companyDomain) {
    data.companyDomain = extractCompanyDomain(data.company, data.url);
  }

  // Store current lead data
  currentLeadData = data;

  // Save to local storage automatically
  await saveLeadLocal();

  // Log extraction results
  console.log('📊 Lead extraction complete:', {
    emails: data.emails.length,
    predictedEmails: data.predictedEmails ? data.predictedEmails.length : 0,
    phones: data.phones.length,
    name: data.name,
    company: data.company,
    socialLinks: Object.keys(data.socialLinks).length
  });
  console.log('Full data:', data);

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
  const phones = new Set();

  // Multiple phone patterns
  const patterns = [
    // International format: +1 234 567 8900
    /\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,4}/g,
    // US format: (123) 456-7890
    /\(\d{3}\)\s?\d{3}[-.]?\d{4}/g,
    // US format: 123-456-7890
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // International with dashes: +1-234-567-8900
    /\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}/g,
    // Simple format: 1234567890 (10+ digits)
    /\b\d{10,15}\b/g
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(phone => {
        const cleaned = phone.replace(/[^\d+]/g, '');
        const digitCount = cleaned.replace(/\+/g, '').length;

        // Must be 10-15 digits
        if (digitCount >= 10 && digitCount <= 15) {
          // Skip common false positives
          const phoneStr = phone.trim();
          if (!phoneStr.match(/^[0-9]{13,}$/) && // Skip very long number sequences
              !phoneStr.match(/\d{4}-\d{2}-\d{2}/) && // Skip dates
              !phoneStr.includes('000000')) { // Skip obvious fake numbers
            phones.add(phoneStr);
          }
        }
      });
    }
  });

  return Array.from(phones).slice(0, 10); // Limit to 10 phones max
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
    about: null,
    linkedinUrl: window.location.href
  };

  // Extract name - Try multiple selectors for robustness
  const nameSelectors = [
    'h1.text-heading-xlarge',
    '.pv-text-details__left-panel h1',
    'h1[class*="top-card"]',
    'div[class*="pv-top-card"] h1',
    '.scaffold-layout__main h1',
    'h1.inline'
  ];

  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 0 && element.textContent.trim().length < 100) {
      data.name = element.textContent.trim();
      console.log(`✓ Found name with selector: ${selector}`);
      break;
    }
  }

  // Extract headline/title - Try multiple approaches
  const headlineSelectors = [
    'div.text-body-medium.break-words',
    '.pv-text-details__left-panel .text-body-medium',
    'div[class*="top-card"] .text-body-medium',
    '.pv-top-card-profile-section__headline',
    'div[data-generated-suggestion-target]',
    '.scaffold-layout__main .text-body-medium'
  ];

  for (const selector of headlineSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 0 && element.textContent.trim().length < 300) {
      const text = element.textContent.trim();
      // Skip if it's the name we already found
      if (text !== data.name) {
        data.headline = text;
        data.title = text;
        console.log(`✓ Found headline with selector: ${selector}`);
        break;
      }
    }
  }

  // Extract location
  const locationSelectors = [
    '.text-body-small.inline.t-black--light.break-words',
    'span.text-body-small.inline.t-black--light',
    '.pv-text-details__left-panel .text-body-small',
    'div[class*="top-card"] .text-body-small',
    '.scaffold-layout__main .text-body-small'
  ];

  for (const selector of locationSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      // Location usually contains a comma or country name
      if (text.length > 2 && text.length < 100) {
        data.location = text;
        console.log(`✓ Found location: ${text}`);
        break;
      }
    }
  }

  // Extract current company from experience section
  const companySelectors = [
    'div[id="experience"] + div li.artdeco-list__item:first-child span[aria-hidden="true"]',
    '.experience-section .pv-entity__secondary-title',
    '.pv-top-card--experience-list-item',
    'div.pvs-list__paged-list-item:first-child span[aria-hidden="true"]'
  ];

  for (const selector of companySelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      // Try to find company name in first experience entry
      for (const el of Array.from(elements).slice(0, 3)) {
        const text = el.textContent.trim();
        if (text.length > 2 && text.length < 100 && !text.includes('·') && !text.includes('yr') && !text.includes('mo')) {
          data.company = text;
          console.log(`✓ Found company: ${text}`);
          break;
        }
      }
      if (data.company) break;
    }
  }

  // Extract about section
  const aboutSelectors = [
    '#about ~ div .inline-show-more-text span[aria-hidden="true"]',
    'section.summary div.pv-shared-text-with-see-more span[aria-hidden="true"]',
    '#about ~ * span[aria-hidden="true"]',
    'div[id="about"] ~ div span[aria-hidden="true"]'
  ];

  for (const selector of aboutSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 10) {
      data.about = element.textContent.trim();
      console.log(`✓ Found about section (${data.about.length} chars)`);
      break;
    }
  }

  // Try to extract email from about or contact info
  if (data.about) {
    const emailsFromAbout = extractEmails(data.about);
    if (emailsFromAbout.length > 0) {
      console.log(`✓ Found ${emailsFromAbout.length} email(s) in about section`);
    }
  }

  console.log('LinkedIn profile extraction complete:', data);
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

  // Update emails (with predicted patterns if available)
  updateEmailList(data.emails, data.predictedEmails);

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
function updateEmailList(emails, predictedEmails) {
  const emailList = document.getElementById('emailList');
  const emailCount = document.getElementById('emailCount');

  if (!emailList) return;

  let html = '';
  let totalCount = 0;

  // Show found emails
  if (emails && emails.length > 0) {
    totalCount += emails.length;
    html += emails.map(email => `
      <li class="email-item">
        <span style="flex: 1; word-break: break-all;">${escapeHtml(email)}</span>
        <span style="background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin: 0 8px;">FOUND</span>
        <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(email)}')">Copy</button>
      </li>
    `).join('');
  }

  // Show predicted email patterns
  if (predictedEmails && predictedEmails.length > 0) {
    html += '<li style="padding: 8px; background: #f8f9fa; margin: 8px 0; border-radius: 4px; font-weight: 600; font-size: 11px; color: #6c757d;">✨ PREDICTED PATTERNS</li>';

    // Show top 5 predicted patterns
    const topPredicted = predictedEmails.slice(0, 5);
    html += topPredicted.map(item => `
      <li class="email-item" style="background: #fff3cd;">
        <span style="flex: 1; word-break: break-all; font-size: 12px;">${escapeHtml(item.email)}</span>
        <span style="background: #ffc107; color: #000; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin: 0 8px;">${item.confidence}%</span>
        <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(item.email)}')" style="background: #ffc107; color: #000;">Copy</button>
      </li>
    `).join('');
  }

  if (html === '') {
    emailList.innerHTML = '<li class="empty-state"><div class="empty-state-text">No emails found</div></li>';
    if (emailCount) emailCount.textContent = '0';
    return;
  }

  if (emailCount) emailCount.textContent = totalCount.toString();
  emailList.innerHTML = html;
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

/**
 * Generate email patterns based on name and company
 */
function generateEmailPatterns(fullName, company, domain) {
  if (!fullName || !company) {
    return [];
  }

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const lastName = nameParts[nameParts.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const firstInitial = firstName[0] || '';
  const lastInitial = lastName[0] || '';

  // Extract or guess company domain
  let companyDomain = domain || extractCompanyDomain(company);

  if (!companyDomain) {
    return [];
  }

  const patterns = [];

  // Generate common email patterns
  if (firstName && lastName) {
    patterns.push({
      email: `${firstName}.${lastName}@${companyDomain}`,
      pattern: 'first.last',
      confidence: 95
    });
    patterns.push({
      email: `${firstName}${lastName}@${companyDomain}`,
      pattern: 'firstlast',
      confidence: 85
    });
    patterns.push({
      email: `${firstInitial}${lastName}@${companyDomain}`,
      pattern: 'flast',
      confidence: 80
    });
    patterns.push({
      email: `${firstInitial}.${lastName}@${companyDomain}`,
      pattern: 'f.last',
      confidence: 75
    });
    patterns.push({
      email: `${firstName}@${companyDomain}`,
      pattern: 'first',
      confidence: 70
    });
    patterns.push({
      email: `${firstName}_${lastName}@${companyDomain}`,
      pattern: 'first_last',
      confidence: 65
    });
    patterns.push({
      email: `${firstName}-${lastName}@${companyDomain}`,
      pattern: 'first-last',
      confidence: 60
    });
    patterns.push({
      email: `${lastName}.${firstName}@${companyDomain}`,
      pattern: 'last.first',
      confidence: 55
    });
    patterns.push({
      email: `${lastName}${firstInitial}@${companyDomain}`,
      pattern: 'lastf',
      confidence: 50
    });
  } else if (firstName) {
    patterns.push({
      email: `${firstName}@${companyDomain}`,
      pattern: 'first',
      confidence: 75
    });
  }

  console.log(`📧 Generated ${patterns.length} email patterns for ${fullName} at ${companyDomain}`);
  return patterns;
}

/**
 * Extract company domain from company name or URL
 */
function extractCompanyDomain(company, url) {
  if (!company) return null;

  let domain = '';

  // If company is a URL, extract domain
  if (company.includes('http') || company.includes('www.')) {
    try {
      const urlObj = new URL(company.startsWith('http') ? company : `https://${company}`);
      domain = urlObj.hostname.replace('www.', '');
      return domain;
    } catch (e) {
      // Invalid URL
    }
  }

  // Try to find company website from page URL
  if (url && !url.includes('linkedin.com')) {
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
      // If it's a reasonable domain, use it
      if (domain && !domain.includes('linkedin') && domain.includes('.')) {
        return domain;
      }
    } catch (e) {
      // Invalid URL
    }
  }

  // Clean company name and create domain
  const cleanCompany = company
    .toLowerCase()
    .replace(/\s*(inc|llc|ltd|limited|corporation|corp|company|co\.?)\.?\s*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  // Common company domain patterns
  const commonTLDs = ['.com', '.io', '.net', '.org', '.co'];

  // Return most likely domain
  domain = `${cleanCompany}.com`;

  console.log(`🌐 Extracted/guessed domain: ${domain} from company: ${company}`);
  return domain;
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Get company info from domain
 */
async function getCompanyInfo(domain) {
  // This would integrate with Clearbit, Hunter.io, or similar APIs
  // For now, return mock data
  return {
    domain: domain,
    name: domain.split('.')[0],
    industry: 'Technology',
    employeeCount: '50-200',
    founded: null
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
