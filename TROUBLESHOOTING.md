# 🔧 Troubleshooting Guide - Lead Generator Pro

## Nothing is Extracting? Follow These Steps

### ✅ Step 1: Reload the Extension

After installing or updating:

```
1. Go to chrome://extensions/
2. Find "Advanced Lead Generator Pro"
3. Click the RELOAD icon (🔄)
4. Wait 2 seconds
```

### ✅ Step 2: Refresh Your Page

**IMPORTANT:** The page you're on needs to be refreshed AFTER installing the extension!

```
1. Go to the page where you want to extract leads
2. Press F5 (or Ctrl+R on Windows, Cmd+R on Mac)
3. Wait for page to fully load
4. NOW click the extension icon
5. Click "Extract Leads from Page"
```

### ✅ Step 3: Check the Page Type

The extension **WON'T work** on these pages:
- ❌ `chrome://` pages (Chrome settings, extensions, etc.)
- ❌ `chrome-extension://` pages
- ❌ `edge://` pages
- ❌ `about:` pages
- ❌ Chrome Web Store pages
- ❌ New Tab pages

The extension **WILL work** on:
- ✅ Regular websites (http://, https://)
- ✅ LinkedIn profiles
- ✅ Company websites
- ✅ Blogs and news sites
- ✅ Any normal webpage

### ✅ Step 4: Try a Test Page

Test on a page you KNOW has data:

**Example Test Pages:**
1. Visit: `https://www.example.com/contact`
2. Or search "John Smith software engineer" on Google
3. Click any LinkedIn profile result
4. Refresh the page (F5)
5. Click extension → "Extract Leads"

### ✅ Step 5: Check Console for Errors

1. **Right-click on the page** → "Inspect" (or press F12)
2. Click "**Console**" tab
3. Look for **red error messages**
4. Take a screenshot if you see errors

Also check extension console:
1. **Right-click extension icon** → "Inspect popup"
2. Look at Console tab
3. Click "Extract Leads" and watch for errors

### ✅ Step 6: Verify Extension is Active

Look for the floating button:
- You should see a **"🎯 LEADS"** button on the right side of the page
- If you don't see it, the content script didn't load
- **Solution:** Refresh the page (F5)

### ✅ Step 7: Test Extraction Manually

Open browser console (F12) and paste this:

```javascript
// Check if content script loaded
console.log('Testing lead generator...');

// Extract emails manually
const text = document.body.innerText;
const emails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
console.log('Found emails:', emails);
```

If this finds emails but the extension doesn't, there's a connection issue.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Receiving end does not exist"

**Cause:** Content script not loaded on page

**Solution:**
1. **Refresh the page** (F5)
2. Wait for page to fully load
3. Try extracting again

### Issue 2: "Cannot extract from this page"

**Cause:** You're on a restricted page (chrome://, etc.)

**Solution:**
1. Navigate to a regular website
2. Try again

### Issue 3: Popup shows "0 leads"

**Cause:** No data found on current page

**Solutions:**
- Make sure you're on a page with contact info
- Try a LinkedIn profile or company contact page
- Check that the page has visible emails/phones

### Issue 4: Extension icon is grayed out

**Cause:** Extension disabled or not loaded

**Solution:**
1. Go to chrome://extensions/
2. Make sure "Advanced Lead Generator Pro" is **ENABLED**
3. If not, toggle it on
4. Reload the extension

### Issue 5: No floating button appears

**Cause:** Content script didn't inject

**Solution:**
1. Refresh the page (F5)
2. Check you're not on a restricted page
3. Reload the extension
4. Try a different page

---

## 🧪 Diagnostic Tests

### Test 1: Check Extension is Loaded

```
1. Go to chrome://extensions/
2. Find "Advanced Lead Generator Pro"
3. Should say "Enabled" in green
4. Should show version 1.0.0
```

### Test 2: Check Content Script

```
1. Open any regular website
2. Press F12 (open console)
3. Type: chrome.runtime.id
4. Should see extension ID
5. Refresh page
6. You should see the floating button
```

### Test 3: Check Permissions

```
1. Go to chrome://extensions/
2. Click "Details" on extension
3. Scroll to "Permissions"
4. Should see:
   - Read and change all your data on all websites
   - Display notifications
5. If not, reload extension
```

### Test 4: Try Simple Page

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <h1>Contact Me</h1>
  <p>Email: john.doe@example.com</p>
  <p>Phone: (555) 123-4567</p>
  <p>LinkedIn: https://linkedin.com/in/johndoe</p>
</body>
</html>
```

Save as `test.html`, open in Chrome, extract leads.
Should find the email, phone, and LinkedIn.

---

## 🔍 Enable Debug Mode

Add this to help debug:

1. **Right-click extension icon** → "Inspect popup"
2. In console, type:
```javascript
localStorage.setItem('debug', 'true');
```
3. Now use the extension
4. Watch console for detailed logs

---

## 📊 What SHOULD Happen

When working correctly:

1. **Load extension** → Icon appears in toolbar
2. **Visit webpage** → Floating "🎯 LEADS" button appears
3. **Click extension** → Popup opens showing stats
4. **Click "Extract Leads"** → Loading spinner shows
5. **After 1-2 seconds** → Success notification
6. **Sidebar opens** → Shows extracted data
7. **Popup updates** → Shows new lead count

---

## 🆘 Still Not Working?

### Quick Reset:

```
1. Go to chrome://extensions/
2. Click "Remove" on the extension
3. Close all Chrome windows
4. Reopen Chrome
5. Go to chrome://extensions/
6. Enable "Developer mode"
7. Click "Load unpacked"
8. Select extension folder
9. Go to a regular website
10. Refresh the page (F5)
11. Try again
```

### Check These Files Exist:

```
Lead-Generation-/
├── manifest.json ✓
├── background.js ✓
├── content.js ✓
├── popup.html ✓
├── popup.js ✓
├── sidebar.html ✓
├── sidebar.css ✓
├── icons/
│   ├── icon16.png ✓
│   ├── icon48.png ✓
│   └── icon128.png ✓
```

### Check File Permissions:

```bash
# Make sure files are readable
ls -la Lead-Generation-/
# All files should have read permissions
```

---

## 💡 Pro Tips

1. **Always refresh** the page after installing extension
2. **Use LinkedIn** for best results (it has lots of data)
3. **Check console** for errors first
4. **Test on simple pages** before complex ones
5. **Reload extension** after any code changes

---

## 📝 Report Issues

If still not working, collect this info:

```
1. Chrome version: chrome://version/
2. OS: Windows/Mac/Linux
3. Page URL where it fails
4. Console errors (screenshot)
5. Extension console errors (screenshot)
6. Steps you tried
```

Then create an issue with this information.

---

## ✅ Success Indicators

Extension is working when you see:

- ✅ Extension icon in toolbar (not grayed out)
- ✅ Floating "🎯 LEADS" button on pages
- ✅ Popup opens when clicking icon
- ✅ "Extract Leads" button works
- ✅ Sidebar slides in with data
- ✅ Lead count increases
- ✅ Data exports successfully

---

**Most common fix: Just refresh the page! (F5)** 🔄
