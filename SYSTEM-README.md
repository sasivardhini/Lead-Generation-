# 🎯 Lead Generator Pro - Complete System

**A professional LinkedIn lead generation platform with backend API, frontend dashboard, and Chrome extension.**

---

## 📋 System Architecture

The system consists of three main components:

1. **Backend API** (Node.js + Express + PostgreSQL)
   - RESTful API for lead management
   - User authentication & authorization
   - Email verification & lead scoring
   - Data enrichment services
   - CRM integrations
   - Analytics & reporting

2. **Frontend Dashboard** (React + Vite + Tailwind)
   - User login/registration
   - Lead management interface
   - Analytics & statistics
   - Export functionality
   - Settings & integrations

3. **Chrome Extension** (Vanilla JS)
   - LinkedIn profile extraction
   - Automatic data capture
   - Backend API integration
   - Email pattern generation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional but recommended)
- Chrome browser

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create database
createdb leadgen_pro

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run database migrations
psql -d leadgen_pro -f migrations/001_initial_schema.sql

# Start backend server
npm start
```

Backend will run on: **http://localhost:3000**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:5173**

### 3. Chrome Extension Setup

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the root project folder (Lead-Generation-)
5. Extension installed! ✅

---

## 📖 Complete Usage Guide

### Step 1: Create Account

1. Open the Chrome extension popup
2. Click "Sign In"
3. Click "Don't have an account? Create one"
4. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password
5. Click "Create Account"

### Step 2: Login

1. Click the extension icon
2. Enter your email and password
3. Click "Sign In"
4. You'll see the dashboard view

### Step 3: Extract LinkedIn Leads

1. Visit any LinkedIn profile (e.g., https://www.linkedin.com/in/williamhgates/)
2. Wait 3 seconds
3. A floating card appears with extracted data:
   - Name
   - Job Title
   - Company
   - Location
   - Predicted Emails (4 patterns)
4. Data is automatically saved to:
   - Local browser storage (offline backup)
   - Backend database (synced across devices)

### Step 4: View Dashboard

1. Click the extension icon
2. Click "📊 View Full Dashboard"
3. Opens the web dashboard at http://localhost:5173
4. See all your leads, analytics, and exports

### Step 5: Manage Leads

**In the Dashboard:**

- **View Leads**: See all extracted leads in a table
- **Search**: Filter by name, email, or company
- **Filter**: By status, lead score, or quality
- **Export**: Download as CSV or Excel
- **Delete**: Remove unwanted leads
- **View Details**: See full lead information

### Step 6: Analytics

1. Go to Analytics page
2. View:
   - Lead growth over time
   - Quality distribution
   - Source breakdown
   - Verification rates
   - Conversion metrics

---

## 🔧 System Components

### Backend API (Port 3000)

**Key Endpoints:**

```
POST   /api/v1/auth/register       - Create account
POST   /api/v1/auth/login          - Login
GET    /api/v1/auth/me             - Get current user

GET    /api/v1/leads               - Get all leads
POST   /api/v1/leads               - Create lead
GET    /api/v1/leads/:id           - Get lead by ID
PATCH  /api/v1/leads/:id           - Update lead
DELETE /api/v1/leads/:id           - Delete lead
GET    /api/v1/leads/stats/summary - Get statistics

POST   /api/v1/verify/email        - Verify email
POST   /api/v1/verify/bulk         - Bulk verify

POST   /api/v1/enrich/lead/:id     - Enrich lead data
POST   /api/v1/enrich/company      - Enrich company

POST   /api/v1/export              - Create export
GET    /api/v1/export/:id          - Get export status
GET    /api/v1/export/:id/download - Download export

GET    /api/v1/analytics/dashboard - Dashboard stats
```

**Database Schema:**

- `users` - User accounts and subscriptions
- `teams` - Team collaboration
- `leads` - Extracted lead data
- `email_verifications` - Verification results
- `usage_tracking` - Usage analytics
- `subscriptions` - Stripe billing
- `integrations` - CRM connections
- `exports` - Export history
- `api_keys` - API authentication
- `webhooks` - Webhook endpoints

### Frontend Dashboard (Port 5173)

**Pages:**

- `/login` - Authentication
- `/` - Dashboard (overview)
- `/leads` - Lead management
- `/analytics` - Statistics & charts
- `/settings` - Account settings

**Features:**

- ✅ Responsive design
- ✅ Real-time updates
- ✅ Chart visualizations
- ✅ CSV/Excel export
- ✅ Search & filtering
- ✅ Pagination
- ✅ Dark mode ready

### Chrome Extension

**Files:**

- `manifest.json` - Extension configuration
- `popup-new.html` - Popup interface
- `popup-new.js` - Popup logic
- `extractor.js` - Content script (runs on LinkedIn)

**Features:**

- ✅ Auto-extraction (3 seconds)
- ✅ Floating card UI
- ✅ Backend sync
- ✅ Offline storage
- ✅ Email pattern generation
- ✅ One-click copy

---

## 🗄️ Database Setup

### PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database

```bash
# Create database
createdb leadgen_pro

# Run migrations
cd backend
psql -d leadgen_pro -f migrations/001_initial_schema.sql
```

### Default Admin User

After running migrations, create an admin user:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, subscription_tier)
VALUES (
  'admin@leadgenpro.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin',
  'User',
  'admin',
  'enterprise'
);
```

---

## 🎨 Customization

### Environment Variables

**Backend (.env):**

```bash
# Required
DB_HOST=localhost
DB_NAME=leadgen_pro
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key

# Optional
STRIPE_SECRET_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx
CLEARBIT_API_KEY=xxx
```

**Frontend (.env):**

```bash
VITE_API_URL=http://localhost:3000/api/v1
```

### API Configuration

Edit `frontend/src/services/api.js` to change API base URL for production:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com/api/v1';
```

Edit `extractor.js` and `popup-new.js` for extension:

```javascript
const API_URL = 'https://api.yourdomain.com/api/v1';
```

---

## 📊 Subscription Tiers

| Tier | Price | Leads/Month | Verifications | Enrichments | Features |
|------|-------|-------------|---------------|-------------|----------|
| **Free** | $0 | 25 | 25 | 0 | Basic extraction, CSV export |
| **Starter** | $29 | 500 | 500 | 100 | Email verification |
| **Pro** | $79 | 2,500 | 2,500 | 500 | Lead scoring, CRM integrations |
| **Business** | $199 | 10,000 | 10,000 | 2,500 | Teams, API access, Analytics |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Everything + White-label |

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ HTTPS ready

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Extract LinkedIn profile
- [ ] View leads in dashboard
- [ ] Search and filter leads
- [ ] Export to CSV
- [ ] View analytics
- [ ] Update settings
- [ ] Logout

---

## 🚢 Production Deployment

### Backend Deployment (Heroku)

```bash
cd backend
heroku create leadgen-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

### Extension Publishing

1. Create a ZIP of the extension:
```bash
zip -r extension.zip . -x "node_modules/*" "backend/*" "frontend/*" ".git/*"
```

2. Go to Chrome Web Store Developer Dashboard
3. Upload ZIP file
4. Fill in metadata
5. Submit for review

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check PostgreSQL
psql -d leadgen_pro -c "SELECT 1"

# Check logs
tail -f backend/logs/app.log
```

### Frontend won't connect to API

```bash
# Check backend is running
curl http://localhost:3000/health

# Check CORS settings
nano backend/.env  # Update CORS_ORIGIN
```

### Extension not loading

1. Go to `chrome://extensions/`
2. Click "Reload" button
3. Check console (F12) for errors
4. Verify manifest.json is valid

### Leads not syncing

1. Click extension icon
2. Check if logged in
3. View console on LinkedIn page (F12)
4. Look for API errors
5. Verify backend is running

---

## 📝 API Documentation

Full API documentation available at:

**Development:** http://localhost:3000/api/v1

**Example Request:**

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get leads
curl -X GET http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create lead
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "title": "CEO",
    "companyName": "Example Corp",
    "linkedinUrl": "https://linkedin.com/in/johnsmith"
  }'
```

---

## 🔄 Data Flow

1. **User visits LinkedIn profile** →
2. **Extension extracts data** →
3. **Shows floating card** →
4. **Saves to local storage** →
5. **Sends to backend API** →
6. **Stores in PostgreSQL** →
7. **Available in dashboard** →
8. **User exports to CSV** →
9. **Imports to CRM**

---

## 💡 Pro Tips

1. **Use LinkedIn Premium** for better access to profiles
2. **Verify emails** before cold outreach (reduces bounce rate)
3. **Export regularly** to avoid data loss
4. **Check lead scores** to prioritize outreach
5. **Use filters** to segment your leads
6. **Set up CRM integration** for automatic sync
7. **Monitor analytics** to track performance

---

## 📞 Support

- **Issues:** Create GitHub issue
- **Email:** support@leadgenpro.com
- **Docs:** https://docs.leadgenpro.com
- **Discord:** https://discord.gg/leadgenpro

---

## 📜 License

**Proprietary** - Lead Generator Pro

All rights reserved. This software is for demonstration purposes.

---

## 🙏 Credits

Built with:
- Node.js + Express
- PostgreSQL + Redis
- React + Vite + Tailwind
- Recharts
- Chrome Extensions API

---

**Version:** 4.0.0
**Last Updated:** 2024-11-23
**Status:** Production Ready ✅

---

**Ready to generate leads!** 🚀
