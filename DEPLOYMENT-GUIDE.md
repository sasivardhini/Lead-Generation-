# 🚀 Production Deployment Guide

Complete guide to deploying Lead Generator Pro to production.

---

## 🎯 Deployment Overview

**Services to Deploy:**

1. **Backend API** → Heroku / Railway / DigitalOcean
2. **Frontend Dashboard** → Vercel / Netlify
3. **Database** → Heroku Postgres / Supabase / RDS
4. **Redis** → Redis Cloud / Upstash
5. **Chrome Extension** → Chrome Web Store

---

## 📦 Option 1: Heroku + Vercel (Recommended)

### Step 1: Deploy Backend to Heroku

#### A. Install Heroku CLI

```bash
# macOS
brew install heroku/brew/heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login
```

#### B. Create Heroku App

```bash
cd backend

# Create app
heroku create leadgen-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis
heroku addons:create heroku-redis:mini

# Get database URL
heroku config:get DATABASE_URL
```

#### C. Configure Environment

```bash
# Set all environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set API_VERSION=v1
heroku config:set CORS_ORIGIN=https://your-frontend.vercel.app

# Optional: Add API keys if you have them
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set SENDGRID_API_KEY=SG.xxx
```

#### D. Deploy Backend

```bash
# Initialize git if not already
git init
git add .
git commit -m "Initial backend deployment"

# Add Heroku remote
heroku git:remote -a leadgen-api

# Deploy
git push heroku main

# Run migrations
heroku run psql $DATABASE_URL -f migrations/001_initial_schema.sql

# Check logs
heroku logs --tail
```

✅ **Backend deployed at:** `https://leadgen-api.herokuapp.com`

#### E. Verify Backend

```bash
curl https://leadgen-api.herokuapp.com/health
```

Should return:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

---

### Step 2: Deploy Frontend to Vercel

#### A. Install Vercel CLI

```bash
npm install -g vercel
```

#### B. Configure Frontend

```bash
cd frontend

# Update .env for production
echo "VITE_API_URL=https://leadgen-api.herokuapp.com/api/v1" > .env.production
```

#### C. Deploy to Vercel

```bash
# Login
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Project name: lead-generator-dashboard
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

✅ **Frontend deployed at:** `https://lead-generator-dashboard.vercel.app`

#### D. Configure Environment in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_API_URL` = `https://leadgen-api.herokuapp.com/api/v1`

---

### Step 3: Update Backend CORS

```bash
# Update CORS to allow frontend domain
heroku config:set CORS_ORIGIN=https://lead-generator-dashboard.vercel.app

# Restart app
heroku restart
```

---

### Step 4: Prepare Chrome Extension

#### A. Update API URLs

Edit `extractor.js`:
```javascript
const API_URL = 'https://leadgen-api.herokuapp.com/api/v1';
```

Edit `popup-new.js`:
```javascript
const API_URL = 'https://leadgen-api.herokuapp.com/api/v1';
```

Edit `popup-new.html` (openDashboard function):
```javascript
function openDashboard() {
  chrome.tabs.create({ url: 'https://lead-generator-dashboard.vercel.app' });
}
```

#### B. Update manifest.json

```json
{
  "host_permissions": [
    "https://leadgen-api.herokuapp.com/*",
    "https://lead-generator-dashboard.vercel.app/*"
  ]
}
```

#### C. Create Production ZIP

```bash
# From project root
zip -r extension-v4.0.0.zip \
  manifest.json \
  extractor.js \
  popup-new.html \
  popup-new.js \
  icons/
```

---

### Step 5: Publish Chrome Extension

#### A. Create Developer Account

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay one-time $5 registration fee
3. Complete developer profile

#### B. Upload Extension

1. Click "New Item"
2. Upload `extension-v4.0.0.zip`
3. Fill in required information:

**Store Listing:**
- **Name:** Lead Generator Pro
- **Description:** Professional LinkedIn lead generation with automated extraction and CRM integration
- **Category:** Productivity
- **Language:** English

**Privacy:**
- Single purpose: Lead generation from LinkedIn profiles
- Permissions justification:
  - `storage`: Save leads locally and auth token
  - `activeTab`: Access LinkedIn pages for extraction
  - Host permissions: Connect to backend API

**Screenshots:**
- Popup interface (400x560)
- Floating card on LinkedIn
- Dashboard view

**Icon:**
- 128x128 icon from `icons/icon128.png`

4. Submit for review (1-3 days)

---

## 📦 Option 2: Railway (Alternative)

Railway is simpler than Heroku:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
cd backend
railway init

# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Get deployment URL
railway status
```

---

## 📦 Option 3: DigitalOcean App Platform

### Backend Deployment

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Select `backend` folder
5. Configure:
   - **Type:** Web Service
   - **Build Command:** `npm install`
   - **Run Command:** `npm start`
   - **Environment:** Node.js 18
   - **Plan:** Basic ($5/month)

6. Add Database:
   - Click "Add Resource" → "Database"
   - Choose PostgreSQL
   - Plan: Basic ($15/month)

7. Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (auto-populated)
   - `JWT_SECRET` = (generate random)

8. Deploy!

---

## 🗄️ Database Migration Strategy

### For Heroku:

```bash
# Run migrations
heroku run psql $DATABASE_URL -f migrations/001_initial_schema.sql

# Verify
heroku pg:psql -c "SELECT COUNT(*) FROM users;"
```

### For Railway:

```bash
railway run psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### For DigitalOcean:

```bash
# Get database connection string from console
psql "postgresql://user:pass@host:port/db" -f migrations/001_initial_schema.sql
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS (handled by Heroku/Vercel)
- [ ] Set proper `CORS_ORIGIN` (not `*`)
- [ ] Enable rate limiting
- [ ] Add helmet.js security headers (already included)
- [ ] Set up error monitoring (Sentry)
- [ ] Configure logging (already included with Winston)
- [ ] Backup database regularly
- [ ] Use strong database password

---

## 📊 Monitoring & Analytics

### Setup Sentry for Error Tracking

```bash
npm install @sentry/node

# Add to backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Setup LogRocket for Frontend

```bash
cd frontend
npm install logrocket

# Add to src/main.jsx
import LogRocket from 'logrocket';

LogRocket.init('your-app-id');
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions for Backend

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "leadgen-api"
          heroku_email: "your@email.com"
          appdir: "backend"
```

### Vercel Auto-Deploy

Vercel automatically deploys on git push if connected to GitHub.

---

## 💰 Cost Estimation

### Minimal Setup ($30/month)

- Heroku Basic: $7/month
- Heroku Postgres Mini: $5/month
- Heroku Redis Mini: $3/month
- Vercel Free: $0/month
- Total: **~$15/month**

### Production Setup ($100/month)

- Heroku Standard: $25/month
- Heroku Postgres Standard: $50/month
- Redis Cloud: $10/month
- Vercel Pro: $20/month
- Total: **~$105/month**

### Enterprise Setup ($500/month)

- DigitalOcean App Platform: $100/month
- Managed PostgreSQL: $200/month
- Redis Cloud: $50/month
- Vercel Pro: $20/month
- CDN (CloudFlare): $20/month
- Monitoring (Sentry): $26/month
- Total: **~$416/month**

---

## 🧪 Pre-Launch Testing

### Backend Tests

```bash
cd backend

# Health check
curl https://your-api.herokuapp.com/health

# Register
curl -X POST https://your-api.herokuapp.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST https://your-api.herokuapp.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Create lead
curl -X POST https://your-api.herokuapp.com/api/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com"}'
```

### Frontend Tests

1. Open https://your-frontend.vercel.app
2. Register account
3. Login
4. Verify dashboard loads
5. Check leads page
6. Test analytics
7. Try export

### Extension Tests

1. Install production extension
2. Login
3. Visit LinkedIn profile
4. Verify extraction works
5. Check lead appears in dashboard
6. Verify popup stats update

---

## 🚨 Rollback Plan

### Heroku Rollback

```bash
# View releases
heroku releases

# Rollback to previous
heroku rollback v23
```

### Vercel Rollback

1. Go to Vercel Dashboard
2. Select deployment
3. Click "Promote to Production"

---

## 📈 Scaling Strategy

### Backend Scaling

```bash
# Scale dynos
heroku ps:scale web=2

# Upgrade database
heroku addons:upgrade heroku-postgresql:standard-0
```

### Database Optimization

- Add indexes for frequently queried fields
- Use connection pooling
- Enable query caching with Redis
- Consider read replicas

### CDN for Assets

Use CloudFlare or Vercel CDN for static assets.

---

## ✅ Launch Checklist

**Pre-Launch:**
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database migrated successfully
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Extension updated with production URLs
- [ ] All tests passing
- [ ] Error monitoring setup
- [ ] Backups configured
- [ ] SSL certificates valid

**Launch Day:**
- [ ] Publish extension to Chrome Web Store
- [ ] Announce on social media
- [ ] Monitor error logs
- [ ] Watch performance metrics
- [ ] Have rollback plan ready

**Post-Launch:**
- [ ] Monitor user signups
- [ ] Check error rates
- [ ] Review performance
- [ ] Gather user feedback
- [ ] Plan next iteration

---

## 🎉 You're Live!

Your complete Lead Generator Pro system is now in production!

**URLs:**
- API: https://leadgen-api.herokuapp.com
- Dashboard: https://lead-generator-dashboard.vercel.app
- Extension: Chrome Web Store link

**Next Steps:**
1. Monitor metrics
2. Gather user feedback
3. Plan features
4. Scale as needed

---

**Questions?** Check SYSTEM-README.md or create a GitHub issue.
