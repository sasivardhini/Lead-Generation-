# ✅ How to Test the Extension is Working

## 🚀 Quick Test (30 seconds)

### Step 1: Open the Test Page
```
1. Navigate to the extension folder
2. Find and open: test.html
3. Or drag test.html into Chrome
```

### Step 2: Verify Extension Loaded
Look for these signs:
- ✓ Floating "🎯 LEADS" button on the right side
- ✓ Console shows: "🎯 Lead Generator Pro - Content script loaded"
- ✓ No error messages in console

### Step 3: Extract Leads
```
1. Click the extension icon (in toolbar)
2. Click "Extract Leads from Page"
3. Wait 1-2 seconds
4. Success notification should appear!
```

### Step 4: Verify Results
The sidebar should show:
- ✓ 5 email addresses
- ✓ 3 phone numbers
- ✓ 3 social profiles (LinkedIn, Twitter, GitHub)
- ✓ Name: John Smith
- ✓ Company: Acme Corporation

---

## 🔍 What test.html Contains

The test page includes:
- **Emails:**
  - john.smith@acme-corp.com
  - jsmith@acme-corp.com
  - sales@acme-corp.com
  - support@acme-corp.com
  - marketing@acme-corp.com
  - info@acme-corp.com

- **Phones:**
  - (555) 123-4567
  - +1-555-987-6543
  - (555) 999-0000
  - (555) 100-2000

- **Social Links:**
  - LinkedIn: linkedin.com/in/johnsmith
  - Twitter: twitter.com/johnsmith
  - GitHub: github.com/johnsmith

- **Contact Info:**
  - Name: John Smith
  - Company: Acme Corporation
  - Title: Senior Software Engineer

---

## ✅ Success Indicators

### In the Popup:
```
Total Leads: 1
Today: 1
Recent leads show "John Smith"
```

### In the Sidebar:
```
Contact Information:
  Name: John Smith
  Company: Acme Corporation

Email Addresses: 5-6
  (Shows all found emails)

Phone Numbers: 3-4
  (Shows all found phones)

Social Profiles:
  LinkedIn, Twitter, GitHub links
```

### In the Console (F12):
```
🎯 Lead Generator Pro - Content script loaded on: file:///.../test.html
✓ Floating button created
📊 Lead extraction complete: {
  emails: 5,
  phones: 3,
  name: "John Smith",
  company: "Acme Corporation",
  socialLinks: 3
}
```

---

## ❌ If Test Fails

### No Floating Button?
1. Reload extension in chrome://extensions/
2. Refresh the test page (F5)
3. Check extension is enabled

### No Extraction?
1. Open console (F12)
2. Look for error messages
3. Try refreshing page (F5)
4. Check you clicked "Extract Leads" button

### Wrong Data?
1. Check console for what was actually extracted
2. Verify the test.html file is the original
3. Make sure page loaded completely

### Extension Not Loading?
1. Right-click extension icon → "Inspect popup"
2. Look at console for errors
3. Reload extension
4. Try again

---

## 🧪 Alternative Tests

### Test on Real Websites:

**1. LinkedIn (Best Test):**
```
1. Go to: linkedin.com/in/anyone
2. Refresh page (F5)
3. Extract leads
4. Should get profile data
```

**2. Example.com:**
```
1. Go to: example.com
2. Refresh page (F5)
3. Extract leads
4. Should find at least the domain info
```

**3. Company Website:**
```
1. Visit any company website
2. Go to "Contact" or "About" page
3. Refresh (F5)
4. Extract leads
5. Should find contact info
```

---

## 🎓 Understanding the Results

### Console Output Explained:

```javascript
📊 Lead extraction complete: {
  emails: 5,        // Found 5 unique emails
  phones: 3,        // Found 3 unique phones
  name: "...",      // Extracted name
  company: "...",   // Extracted company
  socialLinks: 3    // Found 3 social profiles
}
```

### Popup Stats:
- **Total Leads:** Cumulative count (all time)
- **Today:** Leads extracted today only
- **Recent Leads:** Last 5 extractions

### Sidebar Display:
- Shows ALL data from current page
- One-click copy buttons
- Direct links to social profiles
- Export options

---

## 💡 Pro Tips

1. **Always check console first** (F12)
   - Shows exactly what's happening
   - Displays all extracted data
   - Reveals any errors

2. **Use test.html for verification**
   - Known data set
   - Easy to compare results
   - Quick sanity check

3. **Test on different pages**
   - LinkedIn profiles
   - Company websites
   - Contact pages
   - About pages

4. **Verify injection**
   - Look for floating button
   - Check console messages
   - Confirm no errors

---

## 🆘 Still Not Working?

If test.html doesn't work:

1. **Check Extension Status**
   ```
   chrome://extensions/
   - Is it enabled? ✓
   - Any errors shown? ✗
   - Version 1.0.0? ✓
   ```

2. **Check Files**
   ```
   All files present:
   - manifest.json ✓
   - content.js ✓
   - popup.js ✓
   - sidebar.css ✓
   - icons/*.png ✓
   ```

3. **Fresh Start**
   ```
   1. Remove extension
   2. Close all Chrome tabs
   3. Restart Chrome
   4. Load extension again
   5. Open test.html
   6. Refresh (F5)
   7. Try extraction
   ```

4. **Check Console Carefully**
   ```
   Press F12
   Look for:
   - Red errors? Fix those first
   - No messages? Extension not loading
   - Green messages? It's working!
   ```

---

## 📊 Expected Behavior Checklist

- [ ] test.html opens in Chrome
- [ ] Page loads completely
- [ ] Floating "🎯 LEADS" button appears (right side)
- [ ] Console shows green success messages
- [ ] Extension icon shows in toolbar (not grayed)
- [ ] Clicking icon opens popup
- [ ] Popup shows buttons and stats
- [ ] "Extract Leads" button works
- [ ] Loading spinner appears briefly
- [ ] Success notification shows
- [ ] Sidebar slides in from right
- [ ] Data displayed in sidebar
- [ ] Emails, phones, social links shown
- [ ] Copy buttons work
- [ ] Export buttons work

**If ALL checks pass: Extension is working perfectly! ✅**

**If ANY check fails: See troubleshooting above or START-HERE.md**

---

## 🎯 Quick Verification Script

Open console on test.html and paste:

```javascript
// Quick test script
console.log('=== Extension Test ===');
console.log('1. Floating button:', document.getElementById('leadgen-sidebar-toggle') ? '✅ FOUND' : '❌ NOT FOUND');
console.log('2. Page URL:', window.location.href);
console.log('3. Page loaded:', document.readyState === 'complete' ? '✅ YES' : '⏳ LOADING');

// Test extraction manually
const text = document.body.innerText;
const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
console.log('4. Emails found:', emails ? `✅ ${emails.length} (${emails.join(', ')})` : '❌ NONE');

const phones = text.match(/(\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g);
console.log('5. Phones found:', phones ? `✅ ${phones.length}` : '❌ NONE');

console.log('=== Test Complete ===');
```

This should show:
```
✅ Floating button: FOUND
✅ Emails found: 5-6
✅ Phones found: 3-4
```

If not, extension has an issue!

---

**Use test.html as your go-to verification page!** 🎯
