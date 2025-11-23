# ⚡ Quick Setup Guide

Get the complete Lead Generator Pro system running in 10 minutes!

---

## 🎯 Prerequisites

✅ Node.js 18+ installed
✅ PostgreSQL 14+ installed
✅ Chrome browser
✅ Terminal/Command Line

---

## 📦 Step 1: Clone & Install (2 minutes)

```bash
# Navigate to project
cd Lead-Generation-

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

---

## 🗄️ Step 2: Setup Database (2 minutes)

```bash
# Create database
createdb leadgen_pro

# Run migrations
cd backend
psql -d leadgen_pro -f migrations/001_initial_schema.sql
```

**Note:** If `createdb` doesn't work, use:
```bash
psql postgres
CREATE DATABASE leadgen_pro;
\q
```

---

## ⚙️ Step 3: Configure Environment (1 minute)

### Backend Configuration

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit with your database password
nano .env  # or use any text editor
```

**Minimum required in .env:**
```bash
DB_HOST=localhost
DB_NAME=leadgen_pro
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
JWT_SECRET=change_this_to_random_string
```

### Frontend Configuration

```bash
cd ../frontend

# Copy environment file
cp .env.example .env
```

The default `.env` should work (points to localhost:3000)

---

## 🚀 Step 4: Start Services (2 minutes)

### Terminal 1 - Backend

```bash
cd backend
npm start
```

✅ Backend running at: **http://localhost:3000**

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## 🔌 Step 5: Install Chrome Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the **Lead-Generation-** folder
6. Done! ✅

---

## 🎉 Step 6: Test the System (2 minutes)

### Create Account

1. Click the extension icon in Chrome
2. Click "Don't have an account? Create one"
3. Fill in:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
4. Click "Create Account"

### Extract a Lead

1. Visit: https://www.linkedin.com/in/williamhgates/
2. Wait 3 seconds
3. See the floating card appear! 🎯
4. Lead is automatically saved

### View Dashboard

1. Click extension icon
2. Click "📊 View Full Dashboard"
3. See your extracted lead!
4. Explore analytics and export features

---

## ✅ System Check

**Backend Health Check:**
```bash
curl http://localhost:3000/health
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

**Frontend Check:**

Open browser: http://localhost:5173

Should see the login page.

**Extension Check:**

1. Click extension icon
2. Should see login form
3. No console errors (F12)

---

## 🐛 Common Issues

### Issue: "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql   # macOS
sudo systemctl status postgresql       # Linux

# Start if not running
brew services start postgresql         # macOS
sudo systemctl start postgresql        # Linux
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

### Issue: "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Issue: "Extension not loading"

**Solution:**
1. Go to `chrome://extensions/`
2. Click "Reload" under the extension
3. Check for errors in console
4. Verify `manifest.json` exists

---

## 🎓 Next Steps

1. ✅ **Extract 10 leads** from LinkedIn
2. ✅ **Export to CSV** and check the data
3. ✅ **View analytics** to see quality distribution
4. ✅ **Try search & filters** in the Leads page
5. ✅ **Check settings** to see subscription info

---

## 📚 Additional Resources

- **Full Documentation:** SYSTEM-README.md
- **API Endpoints:** http://localhost:3000/api/v1
- **Frontend Dashboard:** http://localhost:5173
- **Troubleshooting:** See SYSTEM-README.md § Troubleshooting

---

## 🚀 Production Deployment

When ready to deploy:

1. **Backend:** Deploy to Heroku/Railway/DigitalOcean
2. **Frontend:** Deploy to Vercel/Netlify
3. **Extension:** Publish to Chrome Web Store
4. **Database:** Use managed PostgreSQL (RDS, Supabase, etc.)

See full deployment guide in SYSTEM-README.md

---

## ✨ Success!

Your complete Lead Generator Pro system is now running!

- ✅ Backend API
- ✅ Frontend Dashboard
- ✅ Chrome Extension
- ✅ Database
- ✅ All features enabled

**Start extracting leads from LinkedIn!** 🎯

---

**Questions?** Open an issue on GitHub or check SYSTEM-README.md
