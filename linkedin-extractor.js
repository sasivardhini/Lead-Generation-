/**
 * LinkedIn Extractor - Professional Grade
 * Extracts contacts from LinkedIn profiles and search pages
 * Based on industry standards (Kaspr, GetProspect, Lusha)
 */

class LinkedInExtractor {
  constructor() {
    this.currentUrl = window.location.href;
    this.pageType = this.detectPageType();
    this.extractedData = [];
  }

  /**
   * Detect LinkedIn page type
   */
  detectPageType() {
    const url = window.location.href;
    const path = window.location.pathname;

    if (path.startsWith('/in/') && !path.includes('/search/')) {
      return 'PROFILE';
    } else if (path.startsWith('/company/')) {
      return 'COMPANY';
    } else if (path.includes('/search/results/people/') || url.includes('search/results/people')) {
      return 'SEARCH_PEOPLE';
    } else if (path.includes('/sales/search/people') || url.includes('sales/search/people')) {
      return 'SALES_NAVIGATOR';
    } else if (path.startsWith('/recruiter/')) {
      return 'RECRUITER';
    } else {
      return 'OTHER';
    }
  }

  /**
   * Extract single profile data (current implementation)
   * Called when viewing an individual LinkedIn profile
   */
  extractProfile() {
    console.log('🎯 Extracting single LinkedIn profile...');

    const profile = {
      type: 'linkedin_profile',
      extractedAt: new Date().toISOString(),
      profileUrl: window.location.href,
      linkedinId: this.getLinkedInId(),
      name: null,
      firstName: null,
      lastName: null,
      headline: null,
      title: null,
      company: null,
      companyUrl: null,
      location: null,
      about: null,
      profileImage: null,
      connectionDegree: null,
      emails: [],
      phones: [],
      socialLinks: {},
      experience: [],
      education: [],
      skills: []
    };

    // Extract profile image
    const imgSelectors = [
      'img.pv-top-card-profile-picture__image',
      'img[class*="profile-photo"]',
      'button.pv-top-card-profile-picture img'
    ];
    for (const selector of imgSelectors) {
      const img = document.querySelector(selector);
      if (img && img.src) {
        profile.profileImage = img.src;
        break;
      }
    }

    // Extract name with multiple fallbacks
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'h1[class*="top-card"]',
      '.scaffold-layout__main h1',
      'h1.inline.t-24.v-align-middle.break-words'
    ];

    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 0 && element.textContent.trim().length < 100) {
        const fullName = element.textContent.trim();
        profile.name = fullName;

        // Parse first and last name
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          profile.firstName = nameParts[0];
          profile.lastName = nameParts[nameParts.length - 1];
        } else {
          profile.firstName = nameParts[0];
        }

        console.log(`✓ Found name: ${fullName}`);
        break;
      }
    }

    // Extract headline/title
    const headlineSelectors = [
      'div.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      'div[class*="top-card"] .text-body-medium',
      '.pv-top-card-profile-section__headline'
    ];

    for (const selector of headlineSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 0) {
        const text = element.textContent.trim();
        if (text !== profile.name && text.length < 300) {
          profile.headline = text;
          profile.title = text.split('at')[0].trim(); // Extract job title before "at Company"
          console.log(`✓ Found headline: ${text}`);
          break;
        }
      }
    }

    // Extract location
    const locationSelectors = [
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      'div.mt2.relative span.text-body-small'
    ];

    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text.length > 2 && text.length < 100) {
          profile.location = text;
          console.log(`✓ Found location: ${text}`);
          break;
        }
      }
    }

    // Extract connection degree
    const connectionElement = document.querySelector('span.dist-value');
    if (connectionElement) {
      profile.connectionDegree = connectionElement.textContent.trim();
    }

    // Extract current company and experience
    this.extractExperience(profile);

    // Extract education
    this.extractEducation(profile);

    // Extract skills
    this.extractSkills(profile);

    // Extract about section
    this.extractAbout(profile);

    // Extract contact info from visible page
    this.extractContactInfo(profile);

    return profile;
  }

  /**
   * Extract experience/work history
   */
  extractExperience(profile) {
    const experienceSection = document.querySelector('#experience');
    if (!experienceSection) return;

    const experienceItems = experienceSection.parentElement.querySelectorAll('li.artdeco-list__item');

    experienceItems.forEach((item, index) => {
      const spans = item.querySelectorAll('span[aria-hidden="true"]');

      if (spans.length > 0) {
        const experience = {
          title: '',
          company: '',
          duration: '',
          location: ''
        };

        // First experience is usually current position
        if (index === 0 && spans.length >= 2) {
          experience.title = spans[0]?.textContent.trim() || '';
          experience.company = spans[1]?.textContent.trim() || '';

          // Set current company
          if (!profile.company && experience.company) {
            profile.company = experience.company.split('·')[0].trim();
            console.log(`✓ Found company: ${profile.company}`);
          }
        }

        if (experience.title || experience.company) {
          profile.experience.push(experience);
        }
      }
    });
  }

  /**
   * Extract education
   */
  extractEducation(profile) {
    const educationSection = document.querySelector('#education');
    if (!educationSection) return;

    const educationItems = educationSection.parentElement.querySelectorAll('li.artdeco-list__item');

    educationItems.forEach(item => {
      const spans = item.querySelectorAll('span[aria-hidden="true"]');
      if (spans.length >= 2) {
        profile.education.push({
          school: spans[0]?.textContent.trim() || '',
          degree: spans[1]?.textContent.trim() || ''
        });
      }
    });
  }

  /**
   * Extract skills
   */
  extractSkills(profile) {
    const skillsSection = document.querySelector('#skills');
    if (!skillsSection) return;

    const skillElements = skillsSection.parentElement.querySelectorAll('span[aria-hidden="true"]');
    skillElements.forEach(el => {
      const skill = el.textContent.trim();
      if (skill && skill.length < 50 && !profile.skills.includes(skill)) {
        profile.skills.push(skill);
      }
    });

    profile.skills = profile.skills.slice(0, 10); // Limit to top 10
  }

  /**
   * Extract about section
   */
  extractAbout(profile) {
    const aboutSelectors = [
      '#about ~ div .inline-show-more-text span[aria-hidden="true"]',
      'section[data-section="summary"] .pv-shared-text-with-see-more span',
      '#about ~ * span[aria-hidden="true"]'
    ];

    for (const selector of aboutSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 10) {
        profile.about = element.textContent.trim();
        console.log(`✓ Found about section (${profile.about.length} chars)`);
        break;
      }
    }
  }

  /**
   * Extract contact information from page
   */
  extractContactInfo(profile) {
    // Extract emails from about section or page content
    const pageText = document.body.innerText;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = new Set();

    const matches = pageText.match(emailRegex);
    if (matches) {
      matches.forEach(email => {
        const cleaned = email.toLowerCase().trim();
        // Filter false positives
        if (!cleaned.match(/\.(png|jpg|gif|svg|example\.com|test\.com|linkedin\.com)$/i)) {
          emails.add(cleaned);
        }
      });
    }

    profile.emails = Array.from(emails);

    // Extract phone numbers
    const phoneRegex = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const phones = new Set();

    const phoneMatches = pageText.match(phoneRegex);
    if (phoneMatches) {
      phoneMatches.forEach(phone => {
        const cleaned = phone.replace(/[^\d+]/g, '');
        if (cleaned.length >= 10) {
          phones.add(phone.trim());
        }
      });
    }

    profile.phones = Array.from(phones).slice(0, 5);
  }

  /**
   * Extract LinkedIn ID from URL
   */
  getLinkedInId() {
    const match = window.location.pathname.match(/\/in\/([^\/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract multiple profiles from search page
   * This is the KILLER FEATURE that tools like Kaspr and GetProspect have
   */
  extractBulkFromSearch() {
    console.log('🔍 Extracting bulk contacts from LinkedIn search page...');

    const profiles = [];

    // Different selectors for different search types
    const searchResultSelectors = [
      'li.reusable-search__result-container', // Standard search
      'li[class*="search-result"]', // Alternative search
      'div.entity-result', // Sales Navigator
      'li.search-result' // Old LinkedIn
    ];

    let resultElements = [];

    for (const selector of searchResultSelectors) {
      resultElements = document.querySelectorAll(selector);
      if (resultElements.length > 0) {
        console.log(`✓ Found ${resultElements.length} results with selector: ${selector}`);
        break;
      }
    }

    if (resultElements.length === 0) {
      console.warn('⚠ No search results found on page');
      return profiles;
    }

    resultElements.forEach((element, index) => {
      try {
        const profile = this.extractSearchResultProfile(element, index);
        if (profile && profile.name) {
          profiles.push(profile);
        }
      } catch (error) {
        console.error(`Error extracting profile ${index}:`, error);
      }
    });

    console.log(`✅ Extracted ${profiles.length} profiles from search page`);
    return profiles;
  }

  /**
   * Extract single profile from search result item
   */
  extractSearchResultProfile(element, index) {
    const profile = {
      type: 'linkedin_search_result',
      extractedAt: new Date().toISOString(),
      searchPosition: index + 1,
      name: null,
      firstName: null,
      lastName: null,
      headline: null,
      title: null,
      company: null,
      location: null,
      profileUrl: null,
      linkedinId: null,
      profileImage: null,
      connectionDegree: null
    };

    // Extract profile URL and ID
    const linkElement = element.querySelector('a[href*="/in/"]');
    if (linkElement) {
      const href = linkElement.href;
      profile.profileUrl = href.split('?')[0]; // Remove query params

      const match = href.match(/\/in\/([^\/\?]+)/);
      if (match) {
        profile.linkedinId = match[1];
      }
    }

    // Extract name
    const nameSelectors = [
      'span.entity-result__title-text a span[aria-hidden="true"]',
      'span[dir="ltr"] > span[aria-hidden="true"]',
      '.entity-result__title-line a',
      'a.app-aware-link span[aria-hidden="true"]'
    ];

    for (const selector of nameSelectors) {
      const nameEl = element.querySelector(selector);
      if (nameEl && nameEl.textContent.trim()) {
        const fullName = nameEl.textContent.trim();
        profile.name = fullName;

        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          profile.firstName = nameParts[0];
          profile.lastName = nameParts[nameParts.length - 1];
        } else {
          profile.firstName = nameParts[0];
        }
        break;
      }
    }

    // Extract headline (job title)
    const headlineSelectors = [
      '.entity-result__primary-subtitle',
      'div.entity-result__summary div',
      '.t-14.t-black--light.t-normal'
    ];

    for (const selector of headlineSelectors) {
      const headlineEl = element.querySelector(selector);
      if (headlineEl) {
        const text = headlineEl.textContent.trim();
        if (text && text.length < 300) {
          profile.headline = text;

          // Try to extract company from headline "Title at Company"
          if (text.includes(' at ')) {
            const parts = text.split(' at ');
            profile.title = parts[0].trim();
            profile.company = parts[1].trim();
          } else {
            profile.title = text;
          }
          break;
        }
      }
    }

    // Extract location
    const locationSelectors = [
      '.entity-result__secondary-subtitle',
      'div.t-14.t-black--light.t-normal:nth-child(2)'
    ];

    for (const selector of locationSelectors) {
      const locationEl = element.querySelector(selector);
      if (locationEl) {
        const text = locationEl.textContent.trim();
        if (text && text.length < 100) {
          profile.location = text;
          break;
        }
      }
    }

    // Extract profile image
    const imgEl = element.querySelector('img.presence-entity__image');
    if (imgEl && imgEl.src) {
      profile.profileImage = imgEl.src;
    }

    // Extract connection degree
    const degreeEl = element.querySelector('.dist-value');
    if (degreeEl) {
      profile.connectionDegree = degreeEl.textContent.trim();
    }

    return profile;
  }

  /**
   * Enrich profile with email/phone using API services
   * This is where tools like Hunter.io, Snov.io integrate
   */
  async enrichWithEmailAPI(profile) {
    // This would integrate with email finding APIs
    // For now, return predicted patterns

    if (!profile.firstName || !profile.company) {
      return profile;
    }

    const enrichment = {
      emails: [],
      phones: [],
      verifiedEmail: null,
      verificationStatus: 'NOT_VERIFIED',
      confidence: 0
    };

    // TODO: Integrate with real APIs:
    // - Hunter.io API
    // - Snov.io API
    // - Clearbit API
    // - RocketReach API

    return { ...profile, ...enrichment };
  }
}

// Export for use in content script
window.LinkedInExtractor = LinkedInExtractor;
