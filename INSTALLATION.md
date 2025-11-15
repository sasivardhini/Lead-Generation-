# 🚀 Quick Installation Guide - Lead Generator Pro

## Step-by-Step Installation

### 1. Generate Extension Icons (Required)

The extension icons must be generated before installation:

1. **Open the icon generator**:
   ```bash
   # Open this file in your browser:
   icons/generate-icons.html
   ```

2. **Download the icons**:
   - The page will automatically generate the icons
   - Click "Download 16x16"
   - Click "Download 48x48"
   - Click "Download 128x128"

3. **Save the icons**:
   - Save downloaded files as:
     - `icon16.png`
     - `icon48.png`
     - `icon128.png`
   - Place them in the `icons/` directory

### 2. Load Extension in Chrome

1. **Open Chrome Extensions Page**:
   - Navigate to `chrome://extensions/`
   - Or click: Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle "Developer mode" switch in top-right corner

3. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to and select the `Lead-Generation-` directory
   - Click "Select Folder"

4. **Verify Installation**:
   - Extension should appear in your extensions list
   - Look for "Lead Generator Pro" with the target icon
   - Status should show "Enabled"

### 3. Pin Extension to Toolbar (Recommended)

1. Click the **puzzle piece icon** (🧩) in Chrome toolbar
2. Find **"Lead Generator Pro"** in the list
3. Click the **pin icon** (📌) to keep it visible

### 4. Test the Extension

1. **Open a test page**:
   - Navigate to any webpage with contact information
   - Try: LinkedIn profile, company website, or blog

2. **Extract leads**:
   - Click the extension icon in toolbar
   - Click "Extract Leads from Page"
   - Popup should show extracted data

3. **Open sidebar**:
   - Click "Open Sidebar" or click the floating "LEADS" button
   - Sidebar should slide in from the right
   - View extracted contact information

## Troubleshooting

### Icons Not Showing

If you see a generic icon instead of the target icon:

1. Make sure you completed Step 1 (Generate Icons)
2. Verify PNG files exist in `icons/` directory
3. Reload the extension:
   - Go to `chrome://extensions/`
   - Click reload icon (🔄) on the extension card

### Extension Not Loading

If you get errors when loading:

1. **Check file structure**:
   ```
   Lead-Generation-/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── popup.html
   ├── popup.js
   ├── sidebar.html
   ├── sidebar.css
   ├── utils/
   │   ├── extract.js
   │   ├── linkedin.js
   │   ├── email_guess.js
   │   ├── verify.js
   │   ├── api.js
   │   └── export.js
   └── icons/
       ├── icon.svg
       ├── icon16.png
       ├── icon48.png
       └── icon128.png
   ```

2. **Check for errors**:
   - Look at error messages in `chrome://extensions/`
   - Click "Errors" button if it appears
   - Common issues:
     - Missing files
     - Syntax errors in JSON/JS
     - Missing icons

3. **Fix and reload**:
   - Fix any errors
   - Click reload icon on extension card

### Nothing Happens When Clicking Extension

1. **Check permissions**:
   - Extension needs `activeTab`, `scripting`, `storage`, `tabs`
   - These are in `manifest.json`

2. **Open developer console**:
   - Right-click extension icon → Inspect popup
   - Check for JavaScript errors
   - Look in Console tab

3. **Try different pages**:
   - Some pages may block extensions
   - Try on a simple website first

### Sidebar Not Appearing

1. **Check for conflicts**:
   - Other extensions may interfere
   - Try disabling other extensions temporarily

2. **Check page content**:
   - Some pages use iframes or shadow DOM
   - Extension may not inject on protected pages (chrome://, chrome-extension://)

3. **Reload page**:
   - Refresh the page after installing extension
   - Content script needs page reload to activate

## Next Steps

Once installed successfully:

1. **Read the full documentation**: See `README.md`
2. **Configure settings**: Click ⚙️ in popup
3. **Set up API** (optional): Add your backend API details
4. **Try on LinkedIn**: Best results on LinkedIn profiles
5. **Export your first leads**: Test CSV/JSON export

## System Requirements

- **Browser**: Chrome 88+ or Chromium-based (Edge, Brave, Opera)
- **OS**: Windows, macOS, or Linux
- **Permissions**: Must enable Developer Mode
- **Storage**: ~5MB for extension + variable for saved leads

## Updates

To update the extension:

1. Get latest code
2. Go to `chrome://extensions/`
3. Click reload icon (🔄) on extension card
4. Changes take effect immediately

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Lead Generator Pro"
3. Click "Remove"
4. Confirm removal

**Note**: This will delete all locally saved leads. Export data first if needed!

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Review troubleshooting section above
3. Check `README.md` for detailed documentation
4. Verify all files are present and properly formatted

---

**Ready to start generating leads!** 🎯

After installation, click the extension icon on any webpage to begin extracting contact information.
