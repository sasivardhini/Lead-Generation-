-- ============================================================================
-- Lead Generator Pro - Initial Database Schema
-- PostgreSQL migration for production-ready lead generation platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- user, admin, enterprise
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, starter, pro, business, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, canceled, past_due, trialing
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- TEAMS & COLLABORATION
-- ============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(50) DEFAULT 'business',
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}'
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- owner, admin, member, viewer
  permissions JSONB DEFAULT '{"canExtract": true, "canExport": true, "canVerify": true}',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================================================
-- LEADS & CONTACTS
-- ============================================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Contact Information
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  title VARCHAR(255),

  -- Company Information
  company_name VARCHAR(255),
  company_domain VARCHAR(255),
  company_size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-500, 501-1000, 1001+
  company_industry VARCHAR(100),
  company_revenue VARCHAR(50),
  company_location VARCHAR(255),

  -- Social Profiles
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,

  -- Additional Data
  location VARCHAR(255),
  timezone VARCHAR(50),
  source_url TEXT, -- URL where lead was extracted
  source_type VARCHAR(50), -- linkedin, website, manual, import

  -- Verification Status
  email_verified BOOLEAN DEFAULT false,
  email_verification_status VARCHAR(50), -- valid, invalid, risky, unknown
  email_verification_score INTEGER, -- 0-100
  email_verification_grade VARCHAR(2), -- A+, A, B, C, D, F
  phone_verified BOOLEAN DEFAULT false,

  -- Lead Scoring
  lead_score INTEGER DEFAULT 0, -- 0-100 composite score
  demographic_score INTEGER DEFAULT 0,
  firmographic_score INTEGER DEFAULT 0,
  quality_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,

  -- Enrichment Data
  enriched BOOLEAN DEFAULT false,
  enrichment_data JSONB DEFAULT '{}',
  technographics JSONB DEFAULT '[]',
  funding_data JSONB DEFAULT '{}',

  -- Metadata
  tags TEXT[],
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, unqualified, converted
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  enriched_at TIMESTAMP,
  last_contacted_at TIMESTAMP
);

CREATE INDEX idx_leads_user ON leads(user_id);
CREATE INDEX idx_leads_team ON leads(team_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_company ON leads(company_domain);
CREATE INDEX idx_leads_source_type ON leads(source_type);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);

-- ============================================================================
-- EMAIL VERIFICATION RESULTS
-- ============================================================================

CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,

  -- Verification Results
  status VARCHAR(50) NOT NULL, -- valid, invalid, risky, unknown
  score INTEGER NOT NULL, -- 0-100
  grade VARCHAR(2) NOT NULL, -- A+, A, B, C, D, F

  -- Verification Checks
  format_valid BOOLEAN DEFAULT false,
  mx_records_valid BOOLEAN DEFAULT false,
  smtp_valid BOOLEAN DEFAULT false,
  is_disposable BOOLEAN DEFAULT false,
  is_role_based BOOLEAN DEFAULT false,
  is_free_provider BOOLEAN DEFAULT false,
  is_catch_all BOOLEAN DEFAULT false,

  -- Provider Information
  provider VARCHAR(100), -- gmail, outlook, custom
  domain VARCHAR(255),

  -- Additional Details
  suggestion VARCHAR(255), -- Did you mean suggestion
  reason TEXT,
  verification_service VARCHAR(50), -- neverbounce, zerobounce, internal

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',

  -- Metadata
  response_time_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_verifications_email ON email_verifications(email);
CREATE INDEX idx_verifications_user ON email_verifications(user_id);
CREATE INDEX idx_verifications_lead ON email_verifications(lead_id);
CREATE INDEX idx_verifications_status ON email_verifications(status);
CREATE INDEX idx_verifications_created_at ON email_verifications(created_at DESC);

-- ============================================================================
-- USAGE & ANALYTICS
-- ============================================================================

CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,

  -- Action tracking
  action_type VARCHAR(50) NOT NULL, -- extract, verify, enrich, export
  resource_type VARCHAR(50), -- lead, email, company
  resource_id UUID,

  -- Usage details
  count INTEGER DEFAULT 1,
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Metadata
  source VARCHAR(100), -- extension, api, dashboard
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON usage_tracking(user_id);
CREATE INDEX idx_usage_team ON usage_tracking(team_id);
CREATE INDEX idx_usage_action_type ON usage_tracking(action_type);
CREATE INDEX idx_usage_created_at ON usage_tracking(created_at DESC);

-- Monthly usage summary (for quota management)
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Usage counters
  leads_extracted INTEGER DEFAULT 0,
  emails_verified INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  exports_created INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,

  -- Limits (based on subscription tier)
  leads_limit INTEGER NOT NULL,
  verifications_limit INTEGER NOT NULL,
  enrichments_limit INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, year, month)
);

CREATE INDEX idx_monthly_usage_user ON monthly_usage(user_id);
CREATE INDEX idx_monthly_usage_date ON monthly_usage(year, month);

-- ============================================================================
-- SUBSCRIPTIONS & BILLING
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe Information
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- Subscription Details
  tier VARCHAR(50) NOT NULL, -- starter, pro, business, enterprise
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing, incomplete

  -- Billing
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',
  interval VARCHAR(20) DEFAULT 'month', -- month, year

  -- Dates
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),

  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  status VARCHAR(50) NOT NULL, -- paid, open, void, uncollectible

  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  period_start TIMESTAMP,
  period_end TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================================================
-- CRM INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Integration Details
  provider VARCHAR(50) NOT NULL, -- salesforce, hubspot, pipedrive, zapier
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, error

  -- Authentication
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,

  -- Configuration
  config JSONB DEFAULT '{}',
  field_mapping JSONB DEFAULT '{}',
  sync_settings JSONB DEFAULT '{}',

  -- Sync Status
  last_sync_at TIMESTAMP,
  last_sync_status VARCHAR(50),
  last_sync_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integrations_user ON integrations(user_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);

CREATE TABLE integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  action VARCHAR(50) NOT NULL, -- sync, push, pull
  status VARCHAR(50) NOT NULL, -- success, error, partial

  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  error_message TEXT,
  details JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX idx_integration_logs_created_at ON integration_logs(created_at DESC);

-- ============================================================================
-- EXPORTS & DOWNLOADS
-- ============================================================================

CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Export Details
  format VARCHAR(20) NOT NULL, -- csv, json, vcard, xlsx
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed

  -- File Information
  file_name VARCHAR(255),
  file_size INTEGER,
  file_url TEXT,
  download_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',

  -- Export Configuration
  filters JSONB DEFAULT '{}',
  columns TEXT[],
  lead_ids UUID[],

  -- Processing
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_exports_user ON exports(user_id);
CREATE INDEX idx_exports_status ON exports(status);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);

-- ============================================================================
-- API KEYS & WEBHOOKS
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for display

  permissions TEXT[] DEFAULT '{"read", "write"}',

  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- lead.created, lead.verified, lead.enriched
  secret VARCHAR(255),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,

  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,

  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  attempts INTEGER DEFAULT 0,
  delivered BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default subscription tiers configuration
CREATE TABLE subscription_tiers (
  tier VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price_monthly INTEGER NOT NULL, -- cents
  price_yearly INTEGER NOT NULL, -- cents
  leads_limit INTEGER NOT NULL,
  verifications_limit INTEGER NOT NULL,
  enrichments_limit INTEGER NOT NULL,
  team_members INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO subscription_tiers (tier, name, price_monthly, price_yearly, leads_limit, verifications_limit, enrichments_limit, team_members, features) VALUES
('free', 'Free', 0, 0, 25, 25, 0, 1, '{"exports": true, "basicVerification": true}'),
('starter', 'Starter', 2900, 29000, 500, 500, 100, 1, '{"exports": true, "fullVerification": true, "emailSupport": true}'),
('pro', 'Professional', 7900, 79000, 2500, 2500, 500, 3, '{"exports": true, "fullVerification": true, "enrichment": true, "leadScoring": true, "crmIntegrations": true, "prioritySupport": true}'),
('business', 'Business', 19900, 199000, 10000, 10000, 2500, 10, '{"exports": true, "fullVerification": true, "enrichment": true, "leadScoring": true, "crmIntegrations": true, "teamFeatures": true, "api": true, "analytics": true, "prioritySupport": true}'),
('enterprise', 'Enterprise', 0, 0, 999999, 999999, 999999, 999999, '{"everything": true, "whiteLabel": true, "dedicatedSupport": true, "sla": true, "customDevelopment": true}');

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- User dashboard statistics view
CREATE VIEW user_dashboard_stats AS
SELECT
  u.id as user_id,
  u.subscription_tier,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.created_at >= NOW() - INTERVAL '7 days' THEN l.id END) as leads_last_7_days,
  COUNT(DISTINCT CASE WHEN l.created_at >= NOW() - INTERVAL '30 days' THEN l.id END) as leads_last_30_days,
  COUNT(DISTINCT CASE WHEN l.email_verified = true THEN l.id END) as verified_leads,
  COUNT(DISTINCT CASE WHEN l.enriched = true THEN l.id END) as enriched_leads,
  AVG(l.lead_score) as avg_lead_score
FROM users u
LEFT JOIN leads l ON u.id = l.user_id
GROUP BY u.id, u.subscription_tier;

COMMENT ON DATABASE leadgen_pro IS 'Lead Generator Pro - Production Database';
