/**
 * Overlay Widget - Professional LinkedIn Lead Capture
 * Similar to Kaspr, GetProspect, Lusha overlay design
 */

class OverlayWidget {
  constructor() {
    this.widget = null;
    this.isVisible = false;
    this.currentProfile = null;
    this.position = { top: '20px', right: '20px' };
  }

  /**
   * Create and inject the overlay widget
   */
  create() {
    if (this.widget) {
      this.widget.remove();
    }

    // Create widget container
    this.widget = document.createElement('div');
    this.widget.id = 'leadgen-overlay-widget';
    this.widget.className = 'leadgen-widget';
    this.widget.style.cssText = `
      position: fixed;
      top: ${this.position.top};
      right: ${this.position.right};
      width: 360px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      display: none;
      animation: slideInRight 0.3s ease-out;
    `;

    // Add CSS animation
    if (!document.getElementById('leadgen-widget-styles')) {
      const style = document.createElement('style');
      style.id = 'leadgen-widget-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }

        .leadgen-widget-hidden {
          animation: slideOutRight 0.3s ease-out;
        }

        .leadgen-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .leadgen-badge-verified {
          background: #d4edda;
          color: #155724;
        }

        .leadgen-badge-likely {
          background: #fff3cd;
          color: #856404;
        }

        .leadgen-badge-invalid {
          background: #f8d7da;
          color: #721c24;
        }

        .leadgen-field {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .leadgen-field:hover {
          background: #f8f9fa;
        }

        .leadgen-field-icon {
          width: 36px;
          height: 36px;
          background: #f0f2f5;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .leadgen-field-content {
          flex: 1;
          min-width: 0;
        }

        .leadgen-field-label {
          font-size: 11px;
          color: #65676b;
          font-weight: 500;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .leadgen-field-value {
          font-size: 14px;
          color: #1c1e21;
          font-weight: 500;
          word-break: break-word;
        }

        .leadgen-field-empty {
          color: #8a8d91;
          font-style: italic;
        }

        .leadgen-copy-btn {
          background: #1877f2;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          flex-shrink: 0;
        }

        .leadgen-copy-btn:hover {
          background: #166fe5;
          transform: scale(1.05);
        }

        .leadgen-copy-btn:active {
          transform: scale(0.95);
        }

        .leadgen-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .leadgen-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .leadgen-btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .leadgen-btn-secondary:hover {
          background: #f8f9fa;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(this.widget);
    return this.widget;
  }

  /**
   * Render widget with profile data
   */
  render(profile) {
    if (!this.widget) {
      this.create();
    }

    this.currentProfile = profile;

    const hasEmail = profile.emails && profile.emails.length > 0;
    const hasPhone = profile.phones && profile.phones.length > 0;
    const hasPredictedEmails = profile.predictedEmails && profile.predictedEmails.length > 0;

    this.widget.innerHTML = `
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px; border-radius: 12px 12px 0 0; position: relative;">
        <button id="leadgen-close-widget" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
          ×
        </button>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${profile.profileImage ?
            `<img src="${this.escapeHtml(profile.profileImage)}" style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3);" alt="Profile" />` :
            `<div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">👤</div>`
          }
          <div style="flex: 1;">
            <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              ${this.escapeHtml(profile.name || 'LinkedIn Contact')}
            </div>
            <div style="color: rgba(255,255,255,0.9); font-size: 12px;">
              ${this.escapeHtml(profile.title || profile.headline || 'No title available')}
            </div>
          </div>
        </div>
      </div>

      <!-- Body -->
      <div style="max-height: 500px; overflow-y: auto;">

        <!-- Company -->
        ${profile.company ? `
        <div class="leadgen-field">
          <div class="leadgen-field-icon">🏢</div>
          <div class="leadgen-field-content">
            <div class="leadgen-field-label">Company</div>
            <div class="leadgen-field-value">${this.escapeHtml(profile.company)}</div>
          </div>
        </div>
        ` : ''}

        <!-- Location -->
        ${profile.location ? `
        <div class="leadgen-field">
          <div class="leadgen-field-icon">📍</div>
          <div class="leadgen-field-content">
            <div class="leadgen-field-label">Location</div>
            <div class="leadgen-field-value">${this.escapeHtml(profile.location)}</div>
          </div>
        </div>
        ` : ''}

        <!-- Email Section -->
        <div style="background: #f8f9fa; padding: 12px 16px; border-top: 2px solid #e9ecef;">
          <div style="font-size: 12px; font-weight: 600; color: #495057; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📧 EMAIL ADDRESSES</span>
            ${hasEmail ? `<span class="leadgen-badge leadgen-badge-verified">✓ ${profile.emails.length} Found</span>` : ''}
          </div>

          ${hasEmail ? profile.emails.map(email => `
            <div class="leadgen-field" style="border: 1px solid #dee2e6; background: white; border-radius: 8px; margin-bottom: 8px; padding: 10px;">
              <div class="leadgen-field-content">
                <div class="leadgen-field-value" style="font-size: 13px; display: flex; align-items: center; gap: 8px;">
                  <span>${this.escapeHtml(email)}</span>
                  <span class="leadgen-badge leadgen-badge-verified" style="font-size: 9px;">VERIFIED</span>
                </div>
              </div>
              <button class="leadgen-copy-btn" onclick="window.leadgenCopyText('${this.escapeHtml(email)}')">
                Copy
              </button>
            </div>
          `).join('') : ''}

          ${hasPredictedEmails ? `
            <div style="margin-top: 16px;">
              <div style="font-size: 11px; font-weight: 600; color: #856404; margin-bottom: 8px; background: #fff3cd; padding: 8px 12px; border-radius: 6px; display: inline-block;">
                ✨ PREDICTED PATTERNS
              </div>
              ${profile.predictedEmails.slice(0, 3).map(item => `
                <div class="leadgen-field" style="border: 1px solid #ffc107; background: #fffbf0; border-radius: 8px; margin-bottom: 8px; padding: 10px;">
                  <div class="leadgen-field-content">
                    <div class="leadgen-field-value" style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                      <span>${this.escapeHtml(item.email)}</span>
                      <span class="leadgen-badge leadgen-badge-likely" style="font-size: 9px;">${item.confidence}%</span>
                    </div>
                  </div>
                  <button class="leadgen-copy-btn" style="background: #ffc107; color: #000;" onclick="window.leadgenCopyText('${this.escapeHtml(item.email)}')">
                    Copy
                  </button>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${!hasEmail && !hasPredictedEmails ? `
            <div class="leadgen-field-empty" style="text-align: center; padding: 16px; font-size: 13px;">
              No email addresses found
            </div>
          ` : ''}
        </div>

        <!-- Phone Section -->
        ${hasPhone ? `
        <div style="background: #f8f9fa; padding: 12px 16px; border-top: 2px solid #e9ecef;">
          <div style="font-size: 12px; font-weight: 600; color: #495057; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span>📱 PHONE NUMBERS</span>
            <span class="leadgen-badge leadgen-badge-verified">✓ ${profile.phones.length} Found</span>
          </div>
          ${profile.phones.map(phone => `
            <div class="leadgen-field" style="border: 1px solid #dee2e6; background: white; border-radius: 8px; margin-bottom: 8px; padding: 10px;">
              <div class="leadgen-field-content">
                <div class="leadgen-field-value" style="font-size: 13px;">
                  ${this.escapeHtml(phone)}
                </div>
              </div>
              <button class="leadgen-copy-btn" onclick="window.leadgenCopyText('${this.escapeHtml(phone)}')">
                Copy
              </button>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- LinkedIn Profile -->
        <div class="leadgen-field">
          <div class="leadgen-field-icon">💼</div>
          <div class="leadgen-field-content">
            <div class="leadgen-field-label">LinkedIn Profile</div>
            <div class="leadgen-field-value" style="font-size: 12px; color: #1877f2;">
              <a href="${this.escapeHtml(profile.profileUrl || profile.linkedinUrl || window.location.href)}" target="_blank" style="color: #1877f2; text-decoration: none;">
                View Full Profile →
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div style="padding: 16px; background: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 2px solid #e9ecef;">
        <button class="leadgen-btn-primary" id="leadgen-save-lead">
          💾 Save to Leads
        </button>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
          <button class="leadgen-btn-secondary" id="leadgen-export-csv">
            📊 Export
          </button>
          <button class="leadgen-btn-secondary" id="leadgen-enrich">
            ✨ Enrich
          </button>
        </div>
        <div style="text-align: center; margin-top: 12px; font-size: 11px; color: #8a8d91;">
          Powered by Lead Generator Pro
        </div>
      </div>
    `;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to widget buttons
   */
  attachEventListeners() {
    const closeBtn = document.getElementById('leadgen-close-widget');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const saveBtn = document.getElementById('leadgen-save-lead');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveLead());
    }

    const exportBtn = document.getElementById('leadgen-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLead());
    }

    const enrichBtn = document.getElementById('leadgen-enrich');
    if (enrichBtn) {
      enrichBtn.addEventListener('click', () => this.enrichLead());
    }

    // Close button hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.3)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.2)';
    });
  }

  /**
   * Show widget
   */
  show() {
    if (!this.widget) {
      this.create();
    }
    this.widget.style.display = 'block';
    this.widget.classList.remove('leadgen-widget-hidden');
    this.isVisible = true;
  }

  /**
   * Hide widget
   */
  hide() {
    if (this.widget) {
      this.widget.classList.add('leadgen-widget-hidden');
      setTimeout(() => {
        this.widget.style.display = 'none';
        this.isVisible = false;
      }, 300);
    }
  }

  /**
   * Toggle widget visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Save lead to storage
   */
  async saveLead() {
    if (!this.currentProfile) return;

    try {
      const result = await chrome.storage.local.get(['leads']);
      const leads = result.leads || [];
      leads.push(this.currentProfile);
      await chrome.storage.local.set({ leads: leads });

      this.showToast('✓ Lead saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving lead:', error);
      this.showToast('✗ Failed to save lead', 'error');
    }
  }

  /**
   * Export lead as CSV
   */
  async exportLead() {
    if (!this.currentProfile) return;

    const response = await chrome.runtime.sendMessage({
      action: 'exportLeads',
      format: 'csv',
      leads: [this.currentProfile]
    });

    if (response && response.success) {
      this.showToast('✓ Exported successfully!', 'success');
    } else {
      this.showToast('✗ Export failed', 'error');
    }
  }

  /**
   * Enrich lead with API
   */
  async enrichLead() {
    this.showToast('✨ Enrichment coming soon!', 'info');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#667eea'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000000;
      font-size: 14px;
      font-weight: 500;
      animation: slideInUp 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global copy function
window.leadgenCopyText = async function(text) {
  try {
    await navigator.clipboard.writeText(text);

    // Show toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000000;
      font-size: 14px;
      font-weight: 500;
    `;
    toast.textContent = '✓ Copied to clipboard!';
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

// Export
window.OverlayWidget = OverlayWidget;
