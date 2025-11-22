// Load leads when popup opens
loadLeads();

function loadLeads() {
  chrome.storage.local.get(['leads'], (result) => {
    const leads = result.leads || [];

    // Update stats
    document.getElementById('totalLeads').textContent = leads.length;

    // Count today's leads
    const today = new Date().toDateString();
    const todayLeads = leads.filter(lead => {
      return new Date(lead.timestamp).toDateString() === today;
    });
    document.getElementById('todayLeads').textContent = todayLeads.length;

    // Display leads
    const leadsList = document.getElementById('leadsList');

    if (leads.length === 0) {
      leadsList.innerHTML = `
        <div class="empty">
          <div style="font-size: 48px; margin-bottom: 10px;">📭</div>
          <div>No leads yet</div>
          <div style="font-size: 11px; margin-top: 5px;">Visit a LinkedIn profile to start extracting</div>
        </div>
      `;
      return;
    }

    // Show last 10 leads
    const recentLeads = leads.slice(-10).reverse();

    leadsList.innerHTML = recentLeads.map(lead => {
      const timeAgo = formatTimeAgo(lead.timestamp);

      return `
        <div class="lead-item">
          <div class="lead-name">${lead.name || 'Unknown'}</div>
          <div class="lead-company">${lead.title || ''} ${lead.company ? `at ${lead.company}` : ''}</div>
          <div class="lead-time">${timeAgo}</div>
        </div>
      `;
    }).join('');
  });
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

function exportCSV() {
  chrome.storage.local.get(['leads'], (result) => {
    const leads = result.leads || [];

    if (leads.length === 0) {
      alert('No leads to export');
      return;
    }

    // Create CSV
    const headers = ['Name', 'Title', 'Company', 'Location', 'Predicted Email 1', 'Predicted Email 2', 'URL', 'Date'];
    const rows = [headers];

    leads.forEach(lead => {
      rows.push([
        lead.name || '',
        lead.title || '',
        lead.company || '',
        lead.location || '',
        lead.predictedEmails[0] || '',
        lead.predictedEmails[1] || '',
        lead.url || '',
        lead.timestamp || ''
      ]);
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  });
}

function clearLeads() {
  if (confirm('Are you sure you want to clear all leads?')) {
    chrome.storage.local.set({ leads: [] }, () => {
      loadLeads();
    });
  }
}
