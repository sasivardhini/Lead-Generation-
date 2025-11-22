/**
 * Simple, Robust LinkedIn Extractor
 * Uses generic selectors that work regardless of LinkedIn UI changes
 */

function extractLinkedInProfileSimple() {
  console.log('🎯 Simple LinkedIn Profile Extraction Starting...');

  const profile = {
    type: 'linkedin_profile',
    url: window.location.href,
    linkedinUrl: window.location.href,
    timestamp: new Date().toISOString(),
    name: null,
    firstName: null,
    lastName: null,
    headline: null,
    title: null,
    company: null,
    location: null,
    about: null,
    emails: [],
    phones: [],
    predictedEmails: [],
    experience: [],
    education: [],
    skills: []
  };

  // Extract name - Look for largest h1 on page
  const allH1s = Array.from(document.querySelectorAll('h1'));
  console.log(`Found ${allH1s.length} h1 elements`);

  if (allH1s.length > 0) {
    // Get first h1 that looks like a person's name
    for (const h1 of allH1s) {
      const text = h1.textContent.trim();
      console.log(`  H1 text: "${text}"`);

      // Skip if empty or too long or looks like site navigation
      if (text &&
          text.length > 2 &&
          text.length < 80 &&
          !text.match(/^(LinkedIn|Profile|Home|Jobs|Messaging|Notifications)/i)) {
        profile.name = text;

        const parts = text.split(' ').filter(p => p.length > 0);
        if (parts.length >= 2) {
          profile.firstName = parts[0];
          profile.lastName = parts[parts.length - 1];
        } else {
          profile.firstName = parts[0];
        }

        console.log(`✅ Extracted name: ${text}`);
        break;
      }
    }
  }

  // Extract headline - Look for text after the name
  const mediumTexts = Array.from(document.querySelectorAll('div.text-body-medium, .pv-text-details__left-panel div'));
  console.log(`Found ${mediumTexts.length} potential headline elements`);

  for (const div of mediumTexts) {
    const text = div.textContent.trim();

    if (text &&
        text !== profile.name &&
        text.length > 5 &&
        text.length < 300 &&
        !text.includes('\n\n')) { // Skip multi-paragraph text

      profile.headline = text;

      // Try to parse company from headline
      if (text.includes(' at ')) {
        const parts = text.split(' at ');
        profile.title = parts[0].trim();
        if (parts[1]) {
          // Remove any bullet points or extra info
          profile.company = parts[1].split(/[·•|@]/)[0].trim();
        }
      } else if (text.includes(' @ ')) {
        const parts = text.split(' @ ');
        profile.title = parts[0].trim();
        profile.company = parts[1].split(/[·•|]/)[0].trim();
      } else {
        profile.title = text;
      }

      console.log(`✅ Extracted headline: ${text}`);
      if (profile.company) {
        console.log(`✅ Extracted company: ${profile.company}`);
      }
      break;
    }
  }

  // Extract location - Look for small text elements
  const smallTexts = Array.from(document.querySelectorAll('span.text-body-small, .pv-text-details__left-panel span'));

  for (const span of smallTexts) {
    const text = span.textContent.trim();

    // Location usually has a comma or is a city/country name
    if (text &&
        text.length > 3 &&
        text.length < 100 &&
        !text.match(/connections?|followers?|posts?/i)) {

      profile.location = text;
      console.log(`✅ Extracted location: ${text}`);
      break;
    }
  }

  // Extract about section - Look for long text blocks
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const aboutContainer = aboutSection.closest('section');
    if (aboutContainer) {
      const aboutText = aboutContainer.textContent.trim();
      if (aboutText.length > 50) {
        // Remove the "About" header
        profile.about = aboutText.replace(/^About\s*/i, '').trim();
        console.log(`✅ Extracted about (${profile.about.length} chars)`);
      }
    }
  }

  // Extract experience
  const experienceSection = document.querySelector('#experience');
  if (experienceSection) {
    const expContainer = experienceSection.closest('section');
    if (expContainer) {
      const expItems = expContainer.querySelectorAll('li');
      console.log(`Found ${expItems.length} experience items`);

      expItems.forEach((item, idx) => {
        if (idx < 5) { // Only get top 5 experiences
          const spans = item.querySelectorAll('span[aria-hidden="true"]');
          if (spans.length >= 2) {
            const exp = {
              title: spans[0]?.textContent.trim() || '',
              company: spans[1]?.textContent.trim() || ''
            };

            // Set current company from first experience if we don't have it
            if (idx === 0 && !profile.company && exp.company) {
              profile.company = exp.company.split(/[·•|]/)[0].trim();
              console.log(`✅ Got company from experience: ${profile.company}`);
            }

            if (exp.title || exp.company) {
              profile.experience.push(exp);
            }
          }
        }
      });
    }
  }

  // Generate predicted emails if we have name and company
  if (profile.name && profile.company) {
    const domain = extractCompanyDomain(profile.company);
    if (domain) {
      profile.predictedEmails = generateEmailPatterns(profile.name, profile.company, domain);
      console.log(`✨ Generated ${profile.predictedEmails.length} predicted email patterns`);
    }
  }

  console.log('📊 Extraction complete:', profile);
  return profile;
}

/**
 * Extract company domain from company name
 */
function extractCompanyDomain(company) {
  if (!company) return null;

  // Clean company name
  const cleaned = company
    .toLowerCase()
    .replace(/\s*(inc|llc|ltd|limited|corporation|corp|company|co\.?|pvt)\.?\s*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (cleaned.length < 2) return null;

  return `${cleaned}.com`;
}

/**
 * Generate email patterns
 */
function generateEmailPatterns(fullName, company, domain) {
  if (!fullName || !domain) return [];

  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.toLowerCase().replace(/[^a-z]/g, '') || '';
  const last = parts[parts.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';

  if (!first) return [];

  const patterns = [];

  if (first && last) {
    patterns.push({ email: `${first}.${last}@${domain}`, pattern: 'first.last', confidence: 95 });
    patterns.push({ email: `${first}${last}@${domain}`, pattern: 'firstlast', confidence: 85 });
    patterns.push({ email: `${first[0]}${last}@${domain}`, pattern: 'flast', confidence: 80 });
    patterns.push({ email: `${first[0]}.${last}@${domain}`, pattern: 'f.last', confidence: 75 });
    patterns.push({ email: `${first}@${domain}`, pattern: 'first', confidence: 70 });
    patterns.push({ email: `${first}_${last}@${domain}`, pattern: 'first_last', confidence: 65 });
    patterns.push({ email: `${first}-${last}@${domain}`, pattern: 'first-last', confidence: 60 });
    patterns.push({ email: `${last}.${first}@${domain}`, pattern: 'last.first', confidence: 55 });
    patterns.push({ email: `${last}${first[0]}@${domain}`, pattern: 'lastf', confidence: 50 });
  } else if (first) {
    patterns.push({ email: `${first}@${domain}`, pattern: 'first', confidence: 75 });
  }

  return patterns;
}

// Export for use in content script
window.extractLinkedInProfileSimple = extractLinkedInProfileSimple;
