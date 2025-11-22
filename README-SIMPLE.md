# 🎯 Simple LinkedIn Lead Extractor

**A super simple Chrome extension that extracts LinkedIn profiles and generates predicted emails.**

Built from scratch to be simple, minimal, and actually work.

---

## 🚀 Installation (30 seconds)

1. Open Chrome: `chrome://extensions/`
2. Turn on "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `Lead-Generation-` folder
5. Done! ✅

---

## 📖 How to Use

### Step 1: Visit a LinkedIn Profile

Go to any LinkedIn profile, for example:
- https://www.linkedin.com/in/williamhgates/
- https://www.linkedin.com/in/satya-nadella/
- https://www.linkedin.com/in/jeff-weiner-08b0701/

### Step 2: Wait 3 Seconds

The extension **automatically** extracts the profile. No button clicking needed!

### Step 3: See the Card

A floating card appears in the top-right showing:

```
🎯 Bill Gates
   Co-chair, Bill & Melinda Gates Foundation

COMPANY
Bill & Melinda Gates Foundation

LOCATION
Seattle, Washington

PREDICTED EMAILS
✉ bill.gates@billmelindagatesfoundation.com    [Copy]
✉ billgates@billmelindagatesfoundation.com     [Copy]
✉ bgates@billmelindagatesfoundation.com        [Copy]
✉ bill@billmelindagatesfoundation.com          [Copy]

[Close]
```

### Step 4: Copy Emails

Click "Copy" next to any email to copy it to your clipboard.

### Step 5: View All Leads

Click the extension icon to see:
- Total leads collected
- Today's leads
- List of recent leads
- Export to CSV button

---

## ✨ Features

### Auto-Extraction
- Automatically extracts when you visit a profile
- No button clicking needed
- Works in 3 seconds

### Floating Card
- Shows extracted data instantly
- Clean blue/white design
- One-click email copying
- Easy to close

### Email Pattern Generation
Creates 4 predicted email patterns:
1. `first.last@company.com` (most common)
2. `firstlast@company.com`
3. `flast@company.com`
4. `first@company.com`

### Data Extraction
Extracts:
- ✅ Name
- ✅ Job Title
- ✅ Company
- ✅ Location
- ✅ Profile URL
- ✅ Timestamp

### Storage & Export
- Auto-saves all leads
- View in popup dashboard
- Export to CSV
- Clear all button

---

## 📊 What Gets Extracted

For https://www.linkedin.com/in/williamhgates/:

```json
{
  "name": "Bill Gates",
  "title": "Co-chair",
  "company": "Bill & Melinda Gates Foundation",
  "location": "Seattle, Washington",
  "url": "https://www.linkedin.com/in/williamhgates/",
  "timestamp": "2024-11-22T05:30:00.000Z",
  "predictedEmails": [
    "bill.gates@billmelindagatesfoundation.com",
    "billgates@billmelindagatesfoundation.com",
    "bgates@billmelindagatesfoundation.com",
    "bill@billmelindagatesfoundation.com"
  ]
}
```

---

## 🎨 Screenshots

### Floating Card (Auto-Appears)
```
┌─────────────────────────────────┐
│ 🎯 John Smith                   │ ← Blue header
│    Software Engineer at Google  │
├─────────────────────────────────┤
│ COMPANY                         │
│ Google                          │
│                                 │
│ PREDICTED EMAILS                │
│ john.smith@google.com   [Copy]  │ ← Click to copy
│ johnsmith@google.com    [Copy]  │
│ jsmith@google.com       [Copy]  │
│                                 │
│        [Close]                  │
└─────────────────────────────────┘
```

### Popup Dashboard
```
┌───────────────────────────┐
│ 🎯 Lead Extractor         │
│ LinkedIn Profile Scraper  │
├───────────────────────────┤
│  Total    │    Today      │
│    47     │      12       │
├───────────────────────────┤
│ [📊 Export to CSV]       │
│ [🗑️  Clear All]          │
│                           │
│ RECENT LEADS              │
│ ┌───────────────────────┐│
│ │ John Smith           ││
│ │ Software Engineer at ││
│ │ Google               ││
│ │ 2m ago               ││
│ └───────────────────────┘│
└───────────────────────────┘
```

---

## 🎯 Example Use Case

**Goal:** Find 100 software engineers at Google

1. Go to LinkedIn search: "software engineer at google"
2. Open each profile in a new tab
3. Extension auto-extracts each one
4. Wait 3 seconds per profile
5. After 100 profiles, click extension icon
6. Click "Export to CSV"
7. Import CSV to your CRM
8. Start outreach with predicted emails

---

## 📁 Files

```
Lead-Generation-/
├── manifest.json       # Extension config
├── extractor.js        # Main extraction script (150 lines)
├── popup.html          # Dashboard UI
├── popup.js            # Dashboard logic
└── icons/              # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 How It Works

### 1. Content Script Injection
When you visit `linkedin.com`, Chrome injects `extractor.js`

### 2. Auto-Extraction
After 3 seconds:
```javascript
setTimeout(extractAndShow, 3000);
```

### 3. Data Extraction
```javascript
// Get name from first h1
const h1s = document.querySelectorAll('h1');
lead.name = h1s[0].textContent.trim();

// Get title from divs
const divs = document.querySelectorAll('div[class*="text-body-medium"]');
// Find the one with " at "
lead.title = text.split(' at ')[0];
lead.company = text.split(' at ')[1];
```

### 4. Email Generation
```javascript
function generateEmails(name, company) {
  const first = 'john';
  const last = 'smith';
  const domain = 'google.com';

  return [
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
    `${first}@${domain}`
  ];
}
```

### 5. Show Card
```javascript
// Create floating div with extracted data
card.innerHTML = `... name, title, emails ...`;
document.body.appendChild(card);
```

### 6. Save to Storage
```javascript
chrome.storage.local.get(['leads'], (result) => {
  const leads = result.leads || [];
  leads.push(lead);
  chrome.storage.local.set({ leads: leads });
});
```

---

## ✅ Testing Checklist

- [ ] Install extension
- [ ] Visit https://www.linkedin.com/in/williamhgates/
- [ ] Wait 3 seconds
- [ ] See floating card appear
- [ ] See "Bill Gates" as name
- [ ] See 4 predicted emails
- [ ] Click "Copy" button → Email copied
- [ ] Click extension icon → See 1 lead
- [ ] Visit another profile → See 2 leads
- [ ] Click "Export to CSV" → CSV downloads

---

## 🐛 Troubleshooting

### Card doesn't appear?
1. Open console (F12)
2. Look for: `🎯 LinkedIn Lead Extractor loaded`
3. Look for: `✅ Extracted: {name: "...", ...}`

### No data extracted?
1. Make sure you're on a LinkedIn profile page (`/in/`)
2. Wait 3-5 seconds
3. Check console for errors

### Extension not loading?
1. Go to `chrome://extensions/`
2. Click "Reload" button
3. Refresh LinkedIn page

### Emails not generating?
1. Check if name AND company were extracted
2. Open console to see what was found
3. Company domain is auto-generated from company name

---

## 📈 Limitations

- Only works on LinkedIn (by design)
- Requires 3 seconds per profile
- Emails are **predicted** (not verified)
- Extraction depends on LinkedIn's HTML structure

---

## 🔒 Privacy

- All data stored **locally** in your browser
- No data sent to servers
- No tracking or analytics
- You control all exports

---

## 💡 Tips

1. **Use LinkedIn Premium/Sales Navigator** for better access
2. **Test predicted emails** with email verification tools
3. **Export regularly** to avoid losing data
4. **Verify emails** before sending cold emails
5. **Follow GDPR/CAN-SPAM** regulations

---

## 🚀 Next Steps

Once you verify it works:

1. Extract 10-20 profiles to test
2. Export to CSV
3. Import to your CRM
4. Test predicted emails
5. Start outreach

---

**Version:** 3.0.0 (Complete Rebuild)
**Last Updated:** 2024-11-22
**Total Code:** ~300 lines

---

## 📞 Support

If you have issues:
1. Check console (F12) for errors
2. Try the troubleshooting steps above
3. Share console output for debugging

---

**Now go test it on a LinkedIn profile!** 🎯
