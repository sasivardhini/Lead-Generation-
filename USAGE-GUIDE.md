# 📘 Lead Generator Pro - Usage Guide

## Quick Start

### 1. Install the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Lead-Generation-` folder
5. The extension icon should appear in your toolbar

### 2. Extract Leads from LinkedIn

#### Automatic Extraction
1. Navigate to any LinkedIn profile (e.g., `linkedin.com/in/john-doe`)
2. The extension will automatically extract data within 2 seconds
3. Click the floating "🎯 LEADS" button on the right side of the page
4. View extracted information in the sidebar

#### Manual Extraction
1. Visit any webpage with contact information
2. Click the extension icon in your toolbar
3. Click "Extract Leads from Page"
4. View results in the popup or click "Open Sidebar"

## Features Explained

### Email Pattern Generation (AI-Powered)

When visiting a LinkedIn profile **without visible email addresses**, the extension automatically:

1. **Extracts Profile Data**
   - Name: "John Smith"
   - Company: "TechCorp Inc"
   - Title: "Software Engineer"
   - Location: "San Francisco, CA"

2. **Generates Company Domain**
   - Cleans company name: "TechCorp Inc" → "techcorp"
   - Guesses domain: "techcorp.com"
   - Or extracts from company website if available

3. **Creates Email Patterns** (sorted by confidence)
   ```
   ✨ PREDICTED PATTERNS

   ✅ john.smith@techcorp.com         [95% confidence]
   ✅ johnsmith@techcorp.com          [85% confidence]
   ✅ jsmith@techcorp.com             [80% confidence]
   ✅ j.smith@techcorp.com            [75% confidence]
   ✅ john@techcorp.com               [70% confidence]
   ✅ john_smith@techcorp.com         [65% confidence]
   ✅ john-smith@techcorp.com         [60% confidence]
   ✅ smith.john@techcorp.com         [55% confidence]
   ✅ smithj@techcorp.com             [50% confidence]
   ```

4. **One-Click Copy**
   - Click "Copy" next to any predicted email
   - Use in your outreach campaigns
   - Test patterns to find working emails

### Data Extraction

#### LinkedIn Profiles
The extension extracts:
- ✅ Full name (multiple selector fallbacks for reliability)
- ✅ Current job title/headline
- ✅ Company name
- ✅ Location
- ✅ About/Summary section
- ✅ Email addresses (if visible in About section)
- ✅ LinkedIn profile URL

#### LinkedIn Company Pages
- ✅ Company name
- ✅ Website
- ✅ Industry
- ✅ Employee count

#### General Webpages
- 📧 Email addresses (regex-based extraction)
- 📱 Phone numbers (international format support)
- 🔗 Social media profiles (LinkedIn, Twitter, Facebook, Instagram, GitHub)
- 👤 Contact names
- 🏢 Company information

### Email Highlighting

When emails are detected on a page:
- Automatically highlighted in yellow
- Hover for emphasis
- Click to copy (coming soon)

### Export Options

#### CSV Export
```csv
Timestamp,Name,Email,Phone,Company,Title,Location,LinkedIn,Domain,Source URL
2024-01-15T10:30:00Z,John Smith,john.smith@techcorp.com,+1-415-555-0123,TechCorp Inc,Software Engineer,San Francisco CA,linkedin.com/in/johnsmith,techcorp.com,https://linkedin.com/in/johnsmith
```

#### JSON Export
```json
{
  "name": "John Smith",
  "email": "john.smith@techcorp.com",
  "emails": ["john.smith@techcorp.com"],
  "phone": "+1-415-555-0123",
  "phones": ["+1-415-555-0123"],
  "company": "TechCorp Inc",
  "title": "Software Engineer",
  "location": "San Francisco, CA",
  "linkedinUrl": "https://linkedin.com/in/johnsmith",
  "domain": "techcorp.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "predictedEmails": [
    { "email": "john.smith@techcorp.com", "pattern": "first.last", "confidence": 95 },
    { "email": "johnsmith@techcorp.com", "pattern": "firstlast", "confidence": 85 }
  ]
}
```

#### vCard Export
Import directly into:
- Google Contacts
- Outlook
- Apple Contacts
- CRM systems

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Toggle Sidebar | `Ctrl+Shift+L` (coming soon) |
| Extract Leads | `Ctrl+Shift+E` (coming soon) |
| Copy First Email | `Ctrl+Shift+C` (coming soon) |

## Advanced Usage

### Context Menu Options

**Right-click on any page:**
1. "Extract Email from Selection" - Extract email from highlighted text
2. "Open Lead Generator" - Open sidebar

### API Integration

Configure in Settings (⚙️):
```javascript
{
  "apiBaseUrl": "https://your-backend.com",
  "apiKey": "your-api-key-here",
  "autoSave": true
}
```

**Supported Actions:**
- Save lead to your database
- Enrich with additional data
- Email verification
- Bulk export to CRM

### Statistics

View in popup:
- **Total Leads**: All extracted leads
- **Today**: Leads extracted today
- **Recent Leads**: Last 5 extractions

## Troubleshooting

### "Nothing extracting" Issue

If the extension isn't working:

1. **Refresh the Page**
   - Press `F5` or `Ctrl+R`
   - Re-click "Extract Leads from Page"

2. **Check Console**
   - Press `F12` to open DevTools
   - Look for logs starting with `🎯 Lead Generator Pro`

3. **Verify Installation**
   - Go to `chrome://extensions/`
   - Ensure "Advanced Lead Generator Pro" is enabled

4. **LinkedIn-Specific Issues**
   - LinkedIn frequently updates their HTML structure
   - Check console for messages like "✓ Found name with selector"
   - If selectors fail, the extension has multiple fallbacks

### No Emails Found

This is expected! Most LinkedIn profiles don't display email addresses publicly.

**Solution:** Use the AI-powered email pattern generator:
1. Extension automatically generates patterns when no emails found
2. Patterns appear as "✨ PREDICTED PATTERNS" in sidebar
3. Click "Copy" to test each pattern

### Predicted Emails Not Showing

Ensure the profile has:
- ✅ A name extracted
- ✅ A company name extracted

Check console logs:
```
✓ Found name: John Smith
✓ Found company: TechCorp Inc
🌐 Extracted domain: techcorp.com
📧 Generated 9 email patterns
```

## Best Practices

### For Lead Generation

1. **Start with LinkedIn**
   - Search for your target audience
   - Visit profiles one by one
   - Extension auto-extracts data

2. **Use Predicted Emails**
   - Copy top 3 patterns (highest confidence)
   - Test with email verification tools
   - Track which patterns work for each company

3. **Export Regularly**
   - Click "Export CSV" after collecting multiple leads
   - Import to your CRM or email tool
   - Segment by company, title, location

4. **Enrich Data**
   - Click "Enrich Lead Data" for additional insights
   - Verify emails before outreach
   - Add to API/database for permanent storage

### For Compliance

- ⚠️ Use only for legitimate business purposes
- ⚠️ Follow GDPR/CCPA guidelines
- ⚠️ Respect LinkedIn's Terms of Service
- ⚠️ Don't scrape excessively (rate limiting recommended)
- ⚠️ Obtain consent before email outreach

## Support & Updates

- 🐛 Report bugs: [GitHub Issues](https://github.com/yourusername/Lead-Generation/issues)
- 💡 Feature requests: [Discussions](https://github.com/yourusername/Lead-Generation/discussions)
- 📧 Contact: support@yourcompany.com

---

**Version:** 1.0.0
**Last Updated:** 2024-01-15
**License:** MIT
