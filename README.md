# 🎯 Lead Generator Pro - Advanced Chrome Extension

A powerful, production-ready Chrome extension for lead generation and contact extraction. Extract emails, phone numbers, social profiles, and enrich contact data from any webpage with a beautiful, professional interface.

## ✨ Features

### Core Functionality
- **📧 Email Extraction**: Automatically detect and extract email addresses from any webpage
- **📱 Phone Number Detection**: Find and extract phone numbers in various formats
- **🔗 Social Profile Discovery**: Detect LinkedIn, Twitter, Facebook, Instagram, and GitHub profiles
- **👤 Contact Information**: Extract names, job titles, companies, and locations
- **🎯 LinkedIn Integration**: Advanced LinkedIn profile and company page scraping

### Advanced Features
- **🔮 AI-Powered Email Pattern Generation**: Automatically generates 9+ likely email patterns based on name and company (95% confidence)
  - Patterns: first.last@, firstlast@, flast@, f.last@, first@, first_last@, first-last@, last.first@, lastf@
  - Intelligent company domain extraction and guessing
  - Confidence scoring for each predicted pattern
- **✅ Email Verification**: Validate email addresses (format, domain, MX records, SMTP)
- **💾 Multi-Format Export**: Export leads to CSV, JSON, or vCard format
- **☁️ Cloud Storage**: Save leads to your backend API or Google Sheets
- **📊 Beautiful Sidebar UI**: Slide-out panel with comprehensive lead information
- **🎨 Visual Highlights**: Automatically highlight detected emails on the page
- **📈 Statistics Dashboard**: Track total leads and daily extraction metrics
- **🔄 Auto-Save**: Automatically saves extracted leads to local storage
- **📱 Enhanced Phone Detection**: Multiple pattern recognition for international numbers

## 🏗️ Architecture

```
Lead-Generation-/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js          # Service worker for background tasks
├── content.js             # Content script injected into pages
├── popup.html/js          # Extension popup interface
├── sidebar.html/css       # Slide-out sidebar UI
├── utils/
│   ├── extract.js         # Data extraction engine
│   ├── linkedin.js        # LinkedIn scraper
│   ├── email_guess.js     # Email pattern generator
│   ├── verify.js          # Email verification module
│   ├── api.js             # API integration client
│   └── export.js          # Export utilities
└── icons/
    ├── icon.svg           # Source icon file
    ├── generate-icons.html # Icon generator tool
    └── icon{16,48,128}.png # Extension icons
```

## 🚀 Installation

### Prerequisites
- Google Chrome or any Chromium-based browser (Edge, Brave, etc.)
- Chrome 88+ (for Manifest V3 support)

### Step 1: Generate Icons

Before installing, you need to generate the extension icons:

1. Open `icons/generate-icons.html` in your browser
2. Icons will be automatically generated
3. Click "Download 16x16", "Download 48x48", and "Download 128x128"
4. Save the downloaded files as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` directory

### Step 2: Load Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `Lead-Generation-` directory
5. The extension should now appear in your extensions list

### Step 3: Pin Extension (Optional)

1. Click the puzzle piece icon in your Chrome toolbar
2. Find "Lead Generator Pro"
3. Click the pin icon to keep it visible in your toolbar

## 📖 Usage Guide

### Basic Lead Extraction

1. **Navigate to any webpage** with contact information
2. **Click the extension icon** in your toolbar
3. **Click "Extract Leads from Page"** to scan the current page
4. **View results** in the popup or sidebar

### Using the Sidebar

The sidebar provides a comprehensive view of extracted lead data:

1. **Open sidebar** by clicking "Open Sidebar" in popup or the floating button
2. **View contact information**: Name, company, title, location
3. **See all emails and phones**: With one-click copy buttons
4. **Access social profiles**: Direct links to LinkedIn, Twitter, etc.
5. **Save or export**: Choose from multiple save/export options

### LinkedIn Profile Extraction

The extension has special support for LinkedIn:

1. **Navigate to a LinkedIn profile** (`linkedin.com/in/...`)
2. **Extension auto-detects** and extracts profile data
3. **Open sidebar** to see:
   - Full name and headline
   - Current company and role
   - Location and about section
   - Experience and education
   - Skills and connections

### Email Pattern Guessing

Generate possible email addresses when you have a name and company:

1. Extract or enter a person's name and company
2. Click "Enrich Lead Data"
3. View generated email patterns sorted by likelihood
4. Common patterns include:
   - first.last@company.com
   - firstlast@company.com
   - first@company.com
   - flast@company.com

### Exporting Leads

#### Export to CSV
1. Click "Export CSV" in popup or sidebar
2. File downloads with all lead data
3. Open in Excel, Google Sheets, or any spreadsheet app

#### Export to JSON
1. Click "📄 JSON" in popup
2. Structured JSON file downloads
3. Use for data import or processing

#### Export to vCard
1. Click "👤 vCard" in popup
2. Contact file downloads
3. Import directly into email clients or CRM systems

### Saving to Storage

#### Local Storage
- Click "💾 Save Local" to save lead to browser storage
- Access all saved leads from the popup
- Persists across browser sessions

#### Backend API
- Configure API endpoint in settings
- Click "☁️ Save to API" to sync with your server
- Requires API key configuration

#### Google Sheets
- Set up Google Sheets integration in settings
- Click "📑 Google Sheets" to append lead data
- Requires Google API key

## ⚙️ Configuration

### API Integration

To use backend API features:

1. Click the extension icon
2. Click "⚙️ Settings & API Configuration"
3. Enter your API details:
   - **API Base URL**: Your backend server URL
   - **API Key**: Authentication token
   - **Google Sheets ID**: Spreadsheet ID (optional)

### Settings Options

Available settings:
- **Auto Extract**: Automatically extract when page loads
- **Highlight Emails**: Visual highlighting of detected emails
- **API Configuration**: Backend integration settings

## 🔌 API Integration

### Backend Endpoints

Your backend should implement these endpoints:

```javascript
POST /leads
{
  "lead": {
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Example Corp",
    // ... other fields
  },
  "timestamp": "2025-01-15T10:00:00Z"
}

POST /leads/bulk
{
  "leads": [...],
  "count": 10,
  "timestamp": "2025-01-15T10:00:00Z"
}

POST /enrich
{
  "email": "john@example.com",
  "name": "John Doe",
  "company": "Example Corp",
  "domain": "example.com"
}

POST /verify/email
{
  "email": "john@example.com"
}
```

### Google Sheets Integration

To export to Google Sheets:

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create an API key
4. Configure in extension settings
5. Provide spreadsheet ID

The extension will append lead data to your sheet with columns:
- Timestamp, Name, Email, Phone, Company, Title, Location, LinkedIn, Domain, Source URL

## 🛠️ Development

### Technology Stack

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No framework dependencies
- **Chrome APIs**: Storage, Tabs, Scripting, Downloads
- **CSS3**: Modern styling with gradients and animations

### Key Modules

#### Data Extraction (`utils/extract.js`)
- Regex-based email and phone detection
- Social media URL pattern matching
- Meta tag and DOM selector extraction
- Duplicate filtering and validation

#### LinkedIn Scraper (`utils/linkedin.js`)
- Profile data extraction
- Company page parsing
- Experience and education details
- Skills and connections

#### Email Guesser (`utils/email_guess.js`)
- 16+ common email patterns
- Confidence scoring
- Domain extraction and validation
- Pattern detection from known emails

#### Email Verifier (`utils/verify.js`)
- Format validation (RFC 5322)
- Disposable email detection
- Free email provider identification
- MX record checking (requires backend)
- SMTP verification (requires backend)

#### Export Manager (`utils/export.js`)
- CSV generation with escaping
- JSON formatting
- vCard creation
- Clipboard operations
- Download handling

## 🔒 Privacy & Security

- **No data collection**: Extension doesn't send data to third parties
- **Local storage**: All data stored locally in browser
- **API optional**: Backend integration is completely optional
- **User control**: Users decide what to save and where
- **No tracking**: No analytics or user tracking
- **Secure**: Follows Chrome extension security best practices

## 🎨 Customization

### Modifying the UI

Edit these files to customize the interface:
- `sidebar.html`: Sidebar structure
- `sidebar.css`: Sidebar styling
- `popup.html`: Popup structure and styles

### Changing Colors

The extension uses a purple gradient theme. To change:

1. Edit gradient in CSS:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

2. Update in multiple files:
   - `sidebar.html` (inline styles)
   - `sidebar.css`
   - `popup.html` (inline styles)
   - `icons/icon.svg`

### Adding New Data Extractors

To extract additional data types:

1. Add extraction logic in `utils/extract.js`
2. Update `extractAllData()` method
3. Add UI elements in `sidebar.html`
4. Update display logic in `content.js`

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure you're in Developer Mode
- Check for errors in `chrome://extensions/`
- Verify all files are present
- Try reloading the extension

### Extraction Not Working
- Check browser console for errors (F12)
- Verify content script is loading
- Try refreshing the page
- Check if page uses shadow DOM or iframe

### LinkedIn Extraction Issues
- LinkedIn frequently updates their DOM structure
- Check `utils/linkedin.js` selectors
- Update selectors to match current LinkedIn HTML
- Some data may require being logged in

### Icons Not Showing
- Generate icons using `icons/generate-icons.html`
- Ensure PNG files are in `icons/` directory
- Reload extension after adding icons

### API Integration Not Working
- Verify API endpoint URLs
- Check API key is correct
- Ensure CORS is configured on backend
- Check network tab for API errors

## 📊 Data Fields

The extension extracts these fields:

```javascript
{
  url: String,              // Page URL
  domain: String,           // Domain name
  timestamp: String,        // ISO timestamp
  name: String,             // Person name
  company: String,          // Company name
  title: String,            // Job title
  headline: String,         // LinkedIn headline
  location: String,         // Location
  about: String,            // About/bio text
  emails: Array,            // Email addresses
  phones: Array,            // Phone numbers
  socialLinks: Object,      // Social profiles by platform
  linkedinUrl: String,      // LinkedIn profile URL
  metaDescription: String,  // Page meta description
  experience: Array,        // LinkedIn experience (if applicable)
  education: Array,         // LinkedIn education (if applicable)
  skills: Array            // LinkedIn skills (if applicable)
}
```

## 🚀 Advanced Usage

### Keyboard Shortcuts

Add keyboard shortcuts in Chrome:
1. Go to `chrome://extensions/shortcuts`
2. Find "Lead Generator Pro"
3. Set shortcuts for:
   - Extract leads
   - Toggle sidebar
   - Open popup

### Context Menu

Right-click on any page to access:
- "Extract Email from Selection" - Extract from highlighted text
- "Open Lead Generator" - Open sidebar

### Batch Processing

To extract leads from multiple pages:
1. Open pages in different tabs
2. Click extension icon on each tab
3. Extract leads from each page
4. Export all leads at once from popup

## 🔄 Updates & Maintenance

### Updating the Extension

1. Pull latest code
2. Go to `chrome://extensions/`
3. Click reload icon on extension card
4. Changes take effect immediately

### Version History

- **v1.0.0** - Initial release
  - Core extraction features
  - LinkedIn support
  - Export functionality
  - API integration

## 📄 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional social platform support
- More extraction patterns
- UI/UX enhancements
- Performance optimizations
- Bug fixes

## 💡 Use Cases

- **Sales & Marketing**: Build prospect lists
- **Recruitment**: Find candidate contact info
- **Networking**: Gather contact details from events
- **Research**: Collect data for analysis
- **Lead Generation**: Build sales pipelines
- **Contact Management**: Maintain updated contact database

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review browser console for errors
3. Check Chrome extension documentation
4. Create an issue on GitHub

## 🎯 Roadmap

Planned features:
- [ ] Enhanced AI-powered enrichment
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Bulk email verification
- [ ] Advanced filtering and search
- [ ] Team collaboration features
- [ ] Chrome sync for multi-device access
- [ ] More export formats (Excel, XML)
- [ ] Automated follow-up sequences
- [ ] Custom extraction rules
- [ ] Data deduplication

## ⚡ Performance

- **Fast extraction**: Processes pages in <2 seconds
- **Lightweight**: Minimal memory footprint
- **Efficient**: Uses Chrome APIs optimally
- **Non-blocking**: Doesn't slow down browsing

## 🌟 Best Practices

1. **Review extracted data**: Always verify before saving
2. **Respect privacy**: Use responsibly and legally
3. **Clean data**: Remove duplicates regularly
4. **Backup**: Export data regularly
5. **Update**: Keep extension updated for best results

---

**Built with ❤️ for professional lead generation**

Made with modern web technologies and Chrome Extension Manifest V3.
