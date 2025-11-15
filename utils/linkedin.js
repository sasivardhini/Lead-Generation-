/**
 * LinkedIn Profile Scraper
 * Extracts comprehensive profile data from LinkedIn pages
 */

class LinkedInScraper {
  constructor() {
    this.isLinkedInProfile = this.detectLinkedInProfile();
    this.isLinkedInCompany = this.detectLinkedInCompany();
  }

  /**
   * Detect if current page is a LinkedIn profile
   * @returns {boolean}
   */
  detectLinkedInProfile() {
    return window.location.hostname.includes('linkedin.com') &&
           window.location.pathname.startsWith('/in/');
  }

  /**
   * Detect if current page is a LinkedIn company page
   * @returns {boolean}
   */
  detectLinkedInCompany() {
    return window.location.hostname.includes('linkedin.com') &&
           window.location.pathname.startsWith('/company/');
  }

  /**
   * Extract full name from profile
   * @returns {string|null}
   */
  extractName() {
    const selectors = [
      'h1.text-heading-xlarge',
      'h1.top-card-layout__title',
      '.pv-top-card--list li:first-child',
      '.pv-text-details__left-panel h1'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Extract headline/title
   * @returns {string|null}
   */
  extractHeadline() {
    const selectors = [
      '.text-body-medium.break-words',
      '.top-card-layout__headline',
      '.pv-top-card--list-bullet li:first-child',
      'div.text-body-medium'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.length > 0 && element.textContent.length < 200) {
        return element.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Extract location
   * @returns {string|null}
   */
  extractLocation() {
    const selectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.top-card-layout__first-subline',
      '.pv-top-card--list-bullet li.t-16',
      'span.text-body-small'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        // Location typically contains city/state/country
        if (text && text.length > 2 && text.length < 100 && /[,\s]/.test(text)) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Extract current company
   * @returns {string|null}
   */
  extractCurrentCompany() {
    const selectors = [
      '.inline-show-more-text--is-collapsed span[aria-hidden="true"]',
      '.pv-top-card-v2-ctas .pv-text-details__right-panel span',
      'div.text-body-medium span[aria-hidden="true"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          return text;
        }
      }
    }

    // Try to extract from experience section
    const firstExperience = document.querySelector('#experience ~ .pvs-list__outer-container li');
    if (firstExperience) {
      const companyElement = firstExperience.querySelector('.t-bold span[aria-hidden="true"]');
      if (companyElement) {
        return companyElement.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Extract about/summary section
   * @returns {string|null}
   */
  extractAbout() {
    const selectors = [
      '#about ~ div .inline-show-more-text span[aria-hidden="true"]',
      '.pv-about-section .pv-about__summary-text',
      'section.pv-about-section p',
      '#about ~ .pvs-list__outer-container .inline-show-more-text'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text && text.length > 10) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Extract experience items
   * @returns {Array}
   */
  extractExperience() {
    const experiences = [];
    const experienceSection = document.querySelector('#experience');

    if (!experienceSection) {
      return experiences;
    }

    // Find the experience list container
    const experienceList = experienceSection.parentElement.querySelector('.pvs-list__outer-container');

    if (!experienceList) {
      return experiences;
    }

    const items = experienceList.querySelectorAll('.pvs-list__paged-list-item');

    items.forEach(item => {
      const experience = {
        title: null,
        company: null,
        duration: null,
        location: null,
        description: null
      };

      // Extract title
      const titleElement = item.querySelector('.t-bold span[aria-hidden="true"]');
      if (titleElement) {
        experience.title = titleElement.textContent.trim();
      }

      // Extract company (second bold element)
      const boldElements = item.querySelectorAll('.t-bold span[aria-hidden="true"]');
      if (boldElements.length > 1) {
        experience.company = boldElements[1].textContent.trim();
      }

      // Extract duration
      const durationElement = item.querySelector('.t-black--light span[aria-hidden="true"]');
      if (durationElement) {
        experience.duration = durationElement.textContent.trim();
      }

      // Extract location
      const locationElements = item.querySelectorAll('.t-black--light span[aria-hidden="true"]');
      if (locationElements.length > 1) {
        experience.location = locationElements[1].textContent.trim();
      }

      // Extract description
      const descElement = item.querySelector('.inline-show-more-text span[aria-hidden="true"]');
      if (descElement) {
        experience.description = descElement.textContent.trim();
      }

      if (experience.title || experience.company) {
        experiences.push(experience);
      }
    });

    return experiences;
  }

  /**
   * Extract education information
   * @returns {Array}
   */
  extractEducation() {
    const education = [];
    const educationSection = document.querySelector('#education');

    if (!educationSection) {
      return education;
    }

    const educationList = educationSection.parentElement.querySelector('.pvs-list__outer-container');

    if (!educationList) {
      return education;
    }

    const items = educationList.querySelectorAll('.pvs-list__paged-list-item');

    items.forEach(item => {
      const edu = {
        school: null,
        degree: null,
        field: null,
        duration: null
      };

      // Extract school name
      const schoolElement = item.querySelector('.t-bold span[aria-hidden="true"]');
      if (schoolElement) {
        edu.school = schoolElement.textContent.trim();
      }

      // Extract degree and field
      const degreeElements = item.querySelectorAll('.t-14 span[aria-hidden="true"]');
      if (degreeElements.length > 0) {
        edu.degree = degreeElements[0].textContent.trim();
      }

      // Extract duration
      const durationElement = item.querySelector('.t-black--light span[aria-hidden="true"]');
      if (durationElement) {
        edu.duration = durationElement.textContent.trim();
      }

      if (edu.school) {
        education.push(edu);
      }
    });

    return education;
  }

  /**
   * Extract skills
   * @returns {Array}
   */
  extractSkills() {
    const skills = [];
    const skillsSection = document.querySelector('#skills');

    if (!skillsSection) {
      return skills;
    }

    const skillsList = skillsSection.parentElement.querySelector('.pvs-list__outer-container');

    if (!skillsList) {
      return skills;
    }

    const skillElements = skillsList.querySelectorAll('.t-bold span[aria-hidden="true"]');
    skillElements.forEach(element => {
      const skill = element.textContent.trim();
      if (skill) {
        skills.push(skill);
      }
    });

    return skills;
  }

  /**
   * Extract contact info (if visible)
   * @returns {Object}
   */
  extractContactInfo() {
    const contact = {
      email: null,
      phone: null,
      website: null,
      twitter: null
    };

    // LinkedIn contact info is usually in a modal or restricted
    // This method will work if the contact info section is visible

    const contactSection = document.querySelector('.pv-contact-info');
    if (!contactSection) {
      return contact;
    }

    // Extract email
    const emailElements = contactSection.querySelectorAll('a[href^="mailto:"]');
    if (emailElements.length > 0) {
      contact.email = emailElements[0].href.replace('mailto:', '');
    }

    // Extract phone
    const phoneElements = contactSection.querySelectorAll('.t-14');
    phoneElements.forEach(element => {
      const text = element.textContent.trim();
      if (/[\d\+\-\(\)\s]{10,}/.test(text)) {
        contact.phone = text;
      }
    });

    // Extract websites
    const websiteElements = contactSection.querySelectorAll('a[href^="http"]');
    if (websiteElements.length > 0) {
      contact.website = websiteElements[0].href;
    }

    return contact;
  }

  /**
   * Extract profile URL
   * @returns {string}
   */
  extractProfileUrl() {
    return window.location.href.split('?')[0];
  }

  /**
   * Extract profile image URL
   * @returns {string|null}
   */
  extractProfileImage() {
    const img = document.querySelector('.pv-top-card-profile-picture__image');
    return img ? img.src : null;
  }

  /**
   * Extract connections count
   * @returns {string|null}
   */
  extractConnectionsCount() {
    const selectors = [
      '.pv-top-card--list-bullet li span',
      '.t-black--light span'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        if (text.includes('connection') || text.includes('follower')) {
          return text;
        }
      }
    }

    return null;
  }

  /**
   * Extract all profile data
   * @returns {Object} - Comprehensive LinkedIn profile data
   */
  extractProfileData() {
    if (!this.isLinkedInProfile) {
      return null;
    }

    const profileData = {
      type: 'linkedin_profile',
      url: this.extractProfileUrl(),
      profileImage: this.extractProfileImage(),
      name: this.extractName(),
      headline: this.extractHeadline(),
      location: this.extractLocation(),
      company: this.extractCurrentCompany(),
      about: this.extractAbout(),
      connectionsCount: this.extractConnectionsCount(),
      experience: this.extractExperience(),
      education: this.extractEducation(),
      skills: this.extractSkills(),
      contactInfo: this.extractContactInfo(),
      scrapedAt: new Date().toISOString()
    };

    return profileData;
  }

  /**
   * Extract company page data
   * @returns {Object|null}
   */
  extractCompanyData() {
    if (!this.isLinkedInCompany) {
      return null;
    }

    const companyData = {
      type: 'linkedin_company',
      url: window.location.href.split('?')[0],
      name: null,
      description: null,
      website: null,
      industry: null,
      companySize: null,
      headquarters: null,
      founded: null
    };

    // Extract company name
    const nameElement = document.querySelector('h1.org-top-card-summary__title');
    if (nameElement) {
      companyData.name = nameElement.textContent.trim();
    }

    // Extract description
    const descElement = document.querySelector('.org-top-card-summary__tagline');
    if (descElement) {
      companyData.description = descElement.textContent.trim();
    }

    // Extract website
    const websiteElement = document.querySelector('a.org-top-card-primary-actions__action');
    if (websiteElement) {
      companyData.website = websiteElement.href;
    }

    // Extract company info from about section
    const infoItems = document.querySelectorAll('.org-page-details__definition-text');
    infoItems.forEach((item, index) => {
      const text = item.textContent.trim();
      const label = document.querySelectorAll('.org-page-details__definition-term')[index];

      if (label) {
        const labelText = label.textContent.trim().toLowerCase();

        if (labelText.includes('industry')) {
          companyData.industry = text;
        } else if (labelText.includes('company size')) {
          companyData.companySize = text;
        } else if (labelText.includes('headquarters')) {
          companyData.headquarters = text;
        } else if (labelText.includes('founded')) {
          companyData.founded = text;
        }
      }
    });

    companyData.scrapedAt = new Date().toISOString();

    return companyData;
  }

  /**
   * Main extraction method - auto-detects profile or company page
   * @returns {Object|null}
   */
  extract() {
    if (this.isLinkedInProfile) {
      return this.extractProfileData();
    } else if (this.isLinkedInCompany) {
      return this.extractCompanyData();
    }
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinkedInScraper;
}
