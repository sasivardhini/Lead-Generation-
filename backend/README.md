# 🚀 Lead Generator Pro - Production API

**Enterprise-grade lead generation and verification platform**

## 📋 Overview

Production-ready Node.js/Express API with:
- ✅ Advanced email verification (A+ to F grading)
- ✅ Lead scoring (demographic + firmographic + quality)
- ✅ Data enrichment (Clearbit, FullContact, Crunchbase, BuiltWith)
- ✅ Stripe subscription management
- ✅ CRM integrations (Salesforce, HubSpot, Pipedrive)
- ✅ PostgreSQL + Redis architecture
- ✅ JWT authentication
- ✅ Rate limiting & quotas
- ✅ Comprehensive analytics

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Chrome Extension│
└────────┬────────┘
         │
    ┌────▼─────┐
    │   API    │
    │  Gateway │
    └────┬─────┘
         │
    ┌────▼──────────────────────┐
    │   Express Routes          │
    │  /auth /leads /verify     │
    │  /enrich /subscriptions   │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │   Services Layer          │
    │  Verification │ Scoring   │
    │  Enrichment   │ Stripe    │
    └────┬──────────────────────┘
         │
    ┌────▼────────┬──────────┐
    │  PostgreSQL │  Redis   │
    │  (Primary)  │  (Cache) │
    └─────────────┴──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- Stripe account
- API keys for enrichment services (optional)

### Installation

```bash
# Clone repository
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Database Setup

```bash
# Install PostgreSQL
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS:
brew install postgresql

# Start PostgreSQL
sudo service postgresql start

# Create database
createdb leadgen_pro

# Run migrations
psql leadgen_pro < migrations/001_initial_schema.sql
```

### Redis Setup

```bash
# Install Redis
# Ubuntu/Debian:
sudo apt-get install redis-server

# macOS:
brew install redis

# Start Redis
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

---

## 📝 Configuration

### Environment Variables

**Required:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadgen_pro
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

**Optional (for enrichment):**
```env
CLEARBIT_API_KEY=sk_...
FULLCONTACT_API_KEY=...
HUNTER_API_KEY=...
CRUNCHBASE_API_KEY=...
BUILTWITH_API_KEY=...
```

---

## 🔐 API Authentication

All endpoints (except `/auth/register` and `/auth/login`) require JWT token:

```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Returns:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/leads
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Leads
- `POST /api/v1/leads` - Create lead
- `POST /api/v1/leads/bulk` - Create multiple leads
- `GET /api/v1/leads` - Get all leads (with pagination)
- `GET /api/v1/leads/:id` - Get single lead
- `PATCH /api/v1/leads/:id` - Update lead
- `DELETE /api/v1/leads/:id` - Delete lead
- `GET /api/v1/leads/stats/summary` - Get statistics

### Verification
- `POST /api/v1/verify/email` - Verify email (A+ to F grading)
- `POST /api/v1/verify/bulk` - Verify multiple emails [PRO]
- `GET /api/v1/verify/history` - Get verification history

### Enrichment
- `POST /api/v1/enrich/lead/:id` - Enrich lead [PRO]
- `POST /api/v1/enrich/person` - Enrich person by email [PRO]
- `POST /api/v1/enrich/company` - Enrich company by domain [PRO]
- `POST /api/v1/enrich/technographics` - Get tech stack [BUSINESS]
- `POST /api/v1/enrich/funding` - Get funding data [BUSINESS]
- `POST /api/v1/enrich/email/find` - Find email [PRO]

### Subscriptions
- `GET /api/v1/subscriptions/tiers` - Get subscription tiers
- `POST /api/v1/subscriptions/create` - Create subscription
- `GET /api/v1/subscriptions/current` - Get current subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Analytics
- `GET /api/v1/analytics/dashboard` - Get dashboard stats

### Export
- `POST /api/v1/export/csv` - Export leads to CSV

---

## 💎 Subscription Tiers

| Tier | Price | Leads/Month | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 25 | Basic extraction, CSV export |
| **Starter** | $29 | 500 | Email verification, exports |
| **Pro** | $79 | 2,500 | Enrichment, scoring, integrations |
| **Business** | $199 | 10,000 | Team features, API, analytics |
| **Enterprise** | Custom | Unlimited | White-label, SLA, custom dev |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Test specific endpoint
curl -X POST http://localhost:3000/api/v1/verify/email \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure database with SSL
- [ ] Set up Redis persistence
- [ ] Configure CORS properly
- [ ] Enable HTTPS
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup strategy
- [ ] Set up CDN for static assets
- [ ] Configure rate limiting
- [ ] Set up health checks

### Deploy to AWS

```bash
# 1. Create EC2 instance (Ubuntu 22.04)
# 2. Install dependencies
sudo apt-get update
sudo apt-get install -y nodejs npm postgresql redis-server

# 3. Clone and setup
git clone your-repo
cd backend
npm install --production

# 4. Setup PM2
npm install -g pm2
pm2 start server.js --name leadgen-api
pm2 startup
pm2 save

# 5. Configure Nginx
sudo apt-get install nginx
# Copy nginx config
sudo nano /etc/nginx/sites-available/leadgen
sudo ln -s /etc/nginx/sites-available/leadgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. Setup SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.leadgenpro.com
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: leadgen_pro
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

```bash
# View logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# PM2 logs
pm2 logs leadgen-api
```

### Metrics

- Request rate
- Response times
- Error rates
- Database query performance
- Redis cache hit ratio
- Active subscriptions
- API usage by tier

---

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo service postgresql status

# Test connection
psql -U postgres -d leadgen_pro -h localhost
```

### Redis Connection Failed
```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server
```

### High Memory Usage
```bash
# Check Node.js memory
node --max-old-space-size=4096 server.js

# Monitor Redis memory
redis-cli info memory
```

---

## 📈 Performance Optimization

1. **Database Indexing**: All foreign keys and frequently queried fields are indexed
2. **Redis Caching**: Verification results cached for 30 days
3. **Connection Pooling**: PostgreSQL pool configured for optimal performance
4. **Rate Limiting**: Prevents API abuse
5. **Query Optimization**: Views created for common analytics queries

---

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation with Joi
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection
- ✅ HTTPS enforcement (production)

---

## 📝 License

Proprietary - All rights reserved

---

## 🆘 Support

- Email: support@leadgenpro.com
- Documentation: https://docs.leadgenpro.com
- Status Page: https://status.leadgenpro.com

---

**Built with ❤️ for production-ready lead generation**
