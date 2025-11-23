/**
 * SUPER SIMPLE LinkedIn Lead Extractor
 * Just extracts basic data that's visible on the page
 */

console.log('🎯 LinkedIn Lead Extractor loaded');

// Extract data when page loads
setTimeout(extractAndShow, 3000);

function extractAndShow() {
  console.log('Starting extraction...');

  const lead = extractLead();

  if (lead.name) {
    console.log('✅ Extracted:', lead);
    showCard(lead);
    saveLead(lead);
  } else {
    console.log('❌ Could not extract name');
  }
}

function extractLead() {
  const lead = {
    name: null,
    title: null,
    company: null,
    location: null,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    predictedEmails: []
  };

  // Get the FIRST h1 on the page (usually the person's name)
  const h1s = document.querySelectorAll('h1');
  if (h1s.length > 0) {
    lead.name = h1s[0].textContent.trim();
    console.log('Found name:', lead.name);
  }

  // Get headline - look for divs with text-body-medium
  const divs = document.querySelectorAll('div[class*="text-body-medium"]');
  console.log(`Found ${divs.length} potential headline divs`);

  for (let div of divs) {
    const text = div.textContent.trim();

    // Skip empty, very short, or very long text
    if (!text || text.length < 5 || text.length > 200) continue;

    // Skip pronouns
    if (text.match(/^(He\/Him|She\/Her|They\/Them)$/i)) {
      console.log('Skipping pronouns:', text);
      continue;
    }

    // Skip if it's the name we already found
    if (text === lead.name) continue;

    console.log('Checking headline candidate:', text);

    // If it contains "at", parse title and company
    if (text.includes(' at ')) {
      const parts = text.split(' at ');
      lead.title = parts[0].trim();
      lead.company = parts[1].split('·')[0].split('|')[0].trim();
      console.log('Found title with company:', lead.title, 'at', lead.company);
      break;
    }
    // If it contains " | ", might be formatted differently
    else if (text.includes(' | ')) {
      const parts = text.split(' | ');
      lead.title = parts[0].trim();
      lead.company = parts[1].trim();
      console.log('Found title (pipe format):', lead.title);
      break;
    }
    // Otherwise, just use it as title
    else if (!lead.title) {
      lead.title = text;
      console.log('Found title (no company):', lead.title);
      break;
    }
  }

  // Get location from spans with text-body-small
  const spans = document.querySelectorAll('span[class*="text-body-small"]');
  console.log(`Found ${spans.length} potential location spans`);

  for (let span of spans) {
    const text = span.textContent.trim();

    // Skip empty or very short
    if (!text || text.length < 3) continue;

    // Skip pronouns
    if (text.match(/^(He\/Him|She\/Her|They\/Them)$/i)) {
      console.log('Skipping pronouns in span:', text);
      continue;
    }

    // Skip common non-location text
    if (text.match(/connection|follower|post|view|message|more/i)) {
      console.log('Skipping non-location:', text);
      continue;
    }

    // Good location should be reasonable length
    if (text.length >= 3 && text.length < 100) {
      lead.location = text;
      console.log('Found location:', lead.location);
      break;
    }
  }

  // Try to extract company from experience section if we don't have it
  if (!lead.company) {
    const experienceSection = document.querySelector('#experience');
    if (experienceSection) {
      const nextSection = experienceSection.parentElement;
      const companySpans = nextSection.querySelectorAll('span[aria-hidden="true"]');
      if (companySpans.length >= 2) {
        lead.company = companySpans[1].textContent.trim().split('·')[0];
        console.log('Found company from experience:', lead.company);
      }
    }
  }

  // Generate email patterns
  if (lead.name && lead.company) {
    lead.predictedEmails = generateEmails(lead.name, lead.company);
    console.log('Generated', lead.predictedEmails.length, 'emails');
  } else {
    console.log('Cannot generate emails - missing name or company');
  }

  return lead;
}

function generateEmails(name, company) {
  const parts = name.toLowerCase().split(' ');
  const first = parts[0].replace(/[^a-z]/g, '');
  const last = parts[parts.length - 1].replace(/[^a-z]/g, '');

  const domain = company.toLowerCase()
    .replace(/\s*(inc|llc|ltd|corp|company)\s*$/i, '')
    .replace(/[^a-z0-9]/g, '') + '.com';

  return [
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
    `${first}@${domain}`
  ];
}

function showCard(lead) {
  // Remove old card if exists
  const old = document.getElementById('lead-card');
  if (old) old.remove();

  // Create card
  const card = document.createElement('div');
  card.id = 'lead-card';
  card.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    width: 350px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 999999;
    font-family: Arial, sans-serif;
    border: 2px solid #0a66c2;
  `;

  card.innerHTML = `
    <div style="background: linear-gradient(135deg, #0a66c2 0%, #004182 100%); padding: 20px; border-radius: 10px 10px 0 0; color: white;">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${lead.name || 'Unknown'}</div>
      <div style="font-size: 13px; opacity: 0.9;">${lead.title || 'No title'}</div>
    </div>

    <div style="padding: 20px;">
      ${lead.company ? `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 11px; color: #666; font-weight: 600; margin-bottom: 5px;">COMPANY</div>
          <div style="font-size: 14px; color: #000;">${lead.company}</div>
        </div>
      ` : ''}

      ${lead.location ? `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 11px; color: #666; font-weight: 600; margin-bottom: 5px;">LOCATION</div>
          <div style="font-size: 14px; color: #000;">${lead.location}</div>
        </div>
      ` : ''}

      ${lead.predictedEmails.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 11px; color: #666; font-weight: 600; margin-bottom: 8px;">PREDICTED EMAILS</div>
          ${lead.predictedEmails.map(email => `
            <div style="background: #f3f6f8; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: #000;">${email}</span>
              <button onclick="navigator.clipboard.writeText('${email}'); alert('Copied!')"
                style="background: #0a66c2; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                Copy
              </button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <button onclick="document.getElementById('lead-card').remove()"
        style="width: 100%; background: #f3f6f8; color: #333; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(card);
}

function saveLead(lead) {
  // Save to local storage first
  chrome.storage.local.get(['leads'], (result) => {
    const leads = result.leads || [];
    leads.push(lead);
    chrome.storage.local.set({ leads: leads }, () => {
      console.log('✅ Saved lead to local storage');
    });
  });

  // Send to backend API
  saveToBackend(lead);
}

async function saveToBackend(lead) {
  try {
    // Get auth token from storage
    const { authToken } = await chrome.storage.local.get(['authToken']);

    if (!authToken) {
      console.log('⚠️ No auth token found. Lead saved locally only.');
      return;
    }

    const API_URL = 'http://localhost:3000/api/v1';

    // Transform lead data for API
    const payload = {
      firstName: lead.name ? lead.name.split(' ')[0] : null,
      lastName: lead.name ? lead.name.split(' ').slice(1).join(' ') : null,
      fullName: lead.name,
      email: lead.predictedEmails?.[0] || null,
      title: lead.title,
      companyName: lead.company,
      location: lead.location,
      linkedinUrl: lead.url,
      sourceUrl: lead.url,
      sourceType: 'linkedin',
    };

    const response = await fetch(`${API_URL}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Lead saved to backend:', data);
    } else {
      const error = await response.json();
      console.error('❌ Failed to save to backend:', error);
    }
  } catch (error) {
    console.error('❌ Error saving to backend:', error);
  }
}
