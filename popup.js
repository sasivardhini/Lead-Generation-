/**
 * Popup Script
 * Handles the extension popup UI and user interactions
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize popup
  await loadStats();
  await loadRecentLeads();
  setupEventListeners();
});

/**
 * Setup event listeners for popup buttons
 */
function setupEventListeners() {
  // Extract leads button
  document.getElementById('extractBtn').addEventListener('click', async () => {
    await extractLeads();
  });

  // Open sidebar button
  document.getElementById('openSidebarBtn').addEventListener('click', async () => {
    await openSidebar();
  });

  // Export buttons
  document.getElementById('exportCsvBtn').addEventListener('click', async () => {
    await exportLeads('csv');
  });

  document.getElementById('exportJsonBtn').addEventListener('click', async () => {
    await exportLeads('json');
  });

  document.getElementById('exportVcardBtn').addEventListener('click', async () => {
    await exportLeads('vcard');
  });

  // Settings link
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

/**
 * Load statistics from storage
 */
async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['leads', 'stats']);
    const leads = result.leads || [];
    const stats = result.stats || { total: 0, today: 0 };

    // Update total leads
    document.getElementById('totalLeads').textContent = leads.length;

    // Calculate today's leads
    const today = new Date().toDateString();
    const todayLeads = leads.filter(lead => {
      const leadDate = new Date(lead.timestamp).toDateString();
      return leadDate === today;
    });

    document.getElementById('todayLeads').textContent = todayLeads.length;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/**
 * Load recent leads from storage
 */
async function loadRecentLeads() {
  try {
    const result = await chrome.storage.local.get(['leads']);
    const leads = result.leads || [];

    const recentLeadsList = document.getElementById('recentLeadsList');

    if (leads.length === 0) {
      recentLeadsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">No leads extracted yet</div>
        </div>
      `;
      return;
    }

    // Show last 5 leads
    const recentLeads = leads.slice(-5).reverse();

    recentLeadsList.innerHTML = recentLeads.map(lead => {
      const email = lead.email || (lead.emails && lead.emails[0]) || 'No email';
      const name = lead.name || 'Unknown';
      const time = formatTimeAgo(lead.timestamp);

      return `
        <div class="lead-item">
          <div class="lead-name">${escapeHtml(name)}</div>
          <div class="lead-email">${escapeHtml(email)}</div>
          <div class="lead-meta">${time} • ${lead.domain || lead.url || ''}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading recent leads:', error);
  }
}

/**
 * Extract leads from current page
 */
async function extractLeads() {
  const extractBtn = document.getElementById('extractBtn');
  const originalContent = extractBtn.innerHTML;

  try {
    // Show loading state
    extractBtn.innerHTML = '<div class="spinner"></div> Extracting...';
    extractBtn.disabled = true;

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Check if page is restricted
    if (isRestrictedPage(tab.url)) {
      throw new Error('Cannot extract from this page. Extension doesn\'t work on Chrome system pages.');
    }

    // Try to inject content script if not already loaded
    try {
      await ensureContentScriptLoaded(tab.id);
    } catch (injectError) {
      console.warn('Could not inject content script:', injectError);
    }

    // Send message to content script to extract leads
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractLeads'
      });
    } catch (msgError) {
      // Content script not loaded - ask user to refresh
      if (msgError.message.includes('Receiving end does not exist')) {
        throw new Error('Please refresh this page and try again. (Press F5 or Ctrl+R)');
      }
      throw msgError;
    }

    if (response && response.success) {
      // Reload stats and recent leads
      await loadStats();
      await loadRecentLeads();

      // Show success message
      showNotification('Success!', `Extracted ${response.data.emails?.length || 0} emails`, 'success');

      // Auto-open sidebar
      await openSidebar();
    } else {
      throw new Error(response?.error || 'Extraction failed');
    }
  } catch (error) {
    console.error('Error extracting leads:', error);
    showNotification('Error', error.message, 'error');
  } finally {
    // Restore button
    extractBtn.innerHTML = originalContent;
    extractBtn.disabled = false;
  }
}

/**
 * Check if page is restricted (cannot run content scripts)
 */
function isRestrictedPage(url) {
  if (!url) return true;

  const restrictedProtocols = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'file://'
  ];

  return restrictedProtocols.some(protocol => url.startsWith(protocol));
}

/**
 * Ensure content script is loaded on the page
 */
async function ensureContentScriptLoaded(tabId) {
  try {
    // Try to ping the content script
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (error) {
    // Content script not loaded, try to inject it
    console.log('Injecting content script...');
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });

    // Wait a bit for script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Open sidebar on current page
 */
async function openSidebar() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('No active tab found');
    }

    // Check if page is restricted
    if (isRestrictedPage(tab.url)) {
      throw new Error('Cannot open sidebar on this page');
    }

    // Ensure content script is loaded
    try {
      await ensureContentScriptLoaded(tab.id);
    } catch (injectError) {
      console.warn('Could not inject content script:', injectError);
    }

    // Send message to content script to toggle sidebar
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleSidebar'
      });

      // Close popup
      window.close();
    } catch (msgError) {
      if (msgError.message.includes('Receiving end does not exist')) {
        throw new Error('Please refresh this page first');
      }
      throw msgError;
    }
  } catch (error) {
    console.error('Error opening sidebar:', error);
    showNotification('Error', error.message, 'error');
  }
}

/**
 * Export leads in specified format
 */
async function exportLeads(format) {
  try {
    const result = await chrome.storage.local.get(['leads']);
    const leads = result.leads || [];

    if (leads.length === 0) {
      showNotification('No Data', 'No leads to export', 'error');
      return;
    }

    // Send to background script for export
    const response = await chrome.runtime.sendMessage({
      action: 'exportLeads',
      format: format,
      leads: leads
    });

    if (response && response.success) {
      showNotification('Success', `Exported ${leads.length} leads as ${format.toUpperCase()}`, 'success');
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Error exporting leads:', error);
    showNotification('Error', 'Export failed', 'error');
  }
}

/**
 * Show notification toast
 */
function showNotification(title, message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
    color: white;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    font-size: 12px;
    max-width: 250px;
  `;
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(title)}</div>
    <div style="font-size: 11px; opacity: 0.9;">${escapeHtml(message)}</div>
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Format timestamp as "time ago" string
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
