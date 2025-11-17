# 🚀 Production Deployment Guide
## Lead Generator Pro - Complete Setup

**Complete guide to deploy the production-ready lead generation platform**

---

## 📋 System Requirements

### Server Requirements

**Minimum (Small Setup - Up to 100 users):**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS

**Recommended (Production - 1,000+ users):**
- CPU: 4-8 cores
- RAM: 16-32 GB
- Storage: 200 GB SSD
- OS: Ubuntu 22.04 LTS
- Load Balancer (multiple instances)

**Database Server:**
- CPU: 4 cores
- RAM: 8-16 GB
- Storage: 100-500 GB SSD (based on data volume)
- PostgreSQL 14+

**Redis Server:**
- CPU: 2 cores
- RAM: 4-8 GB
- Storage: 20 GB SSD

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Internet / Users                      │
└──────────────────┬──────────────────────────────┘
                   │
            ┌──────▼──────┐
            │  Cloudflare │ (CDN + DDoS Protection)
            │    / CDN    │
            └──────┬──────┘
                   │
            ┌──────▼──────┐
            │  Load       │ (AWS ELB / Nginx)
            │  Balancer   │
            └──────┬──────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐      ┌───▼───┐      ┌───▼───┐
│ API   │      │ API   │      │ API   │ (Node.js)
│Server │      │Server │      │Server │
│  #1   │      │  #2   │      │  #3   │
└───┬───┘      └───┬───┘      └───┬───┘
    │              │              │
    └──────────────┼──────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
    │Postgres│ │ Redis │ │Stripe │
    │   DB   │ │Cache  │ │  API  │
    └────────┘ └───────┘ └───────┘
```

---

## 📦 Part 1: AWS Setup

### 1.1 Create AWS Account & Setup

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

### 1.2 Launch EC2 Instances

**Application Server (API):**
```bash
# Launch EC2 instance
# - AMI: Ubuntu 22.04 LTS
# - Instance Type: t3.medium (2 vCPU, 4 GB RAM)
# - Storage: 50 GB gp3
# - Security Group: Allow ports 22, 80, 443, 3000

# OR use AWS CLI:
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":50,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=LeadGen-API}]'
```

**Database Server (PostgreSQL):**
```bash
# Option 1: RDS (Recommended)
aws rds create-db-instance \
  --db-instance-identifier leadgen-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.6 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxx

# Option 2: Self-hosted on EC2
# Launch t3.medium instance with 100 GB storage
```

**Redis Cache:**
```bash
# Option 1: ElastiCache (Recommended)
aws elasticache create-cache-cluster \
  --cache-cluster-id leadgen-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1

# Option 2: Self-hosted on EC2
# Launch t3.small instance
```

### 1.3 Setup Security Groups

```bash
# API Server Security Group
aws ec2 create-security-group \
  --group-name leadgen-api-sg \
  --description "Lead Generator API Server"

# Allow SSH (22)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Allow HTTP (80)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS (443)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Database Security Group
# Allow PostgreSQL (5432) only from API servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-db-xxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-api-xxxxxxxx
```

---

## 📦 Part 2: Server Setup

### 2.1 Connect to Server

```bash
# Download your key pair from AWS
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_SERVER_IP
```

### 2.2 Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y build-essential git curl wget
```

### 2.3 Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### 2.4 Install PostgreSQL (if self-hosting)

```bash
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE leadgen_pro;
postgres=# CREATE USER leadgen_admin WITH PASSWORD 'your_secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE leadgen_pro TO leadgen_admin;
postgres=# \q
```

### 2.5 Install Redis (if self-hosting)

```bash
sudo apt-get install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: bind 127.0.0.1
# Set: requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test
redis-cli ping
# Should return: PONG
```

### 2.6 Install Nginx

```bash
sudo apt-get install -y nginx

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create new config
sudo nano /etc/nginx/sites-available/leadgen

# Add configuration (see below)

# Enable site
sudo ln -s /etc/nginx/sites-available/leadgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Nginx Configuration:**
```nginx
upstream api_backend {
    server 127.0.0.1:3000;
    # Add more servers for load balancing:
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name api.leadgenpro.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://api_backend/health;
        access_log off;
    }
}
```

---

## 📦 Part 3: Application Deployment

### 3.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/leadgen
sudo chown -R ubuntu:ubuntu /var/www/leadgen

# Clone repository
cd /var/www/leadgen
git clone https://github.com/your-org/Lead-Generation-.git .
```

### 3.2 Install Dependencies

```bash
cd /var/www/leadgen/backend
npm install --production
```

### 3.3 Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Production .env Configuration:**
```env
# Environment
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database (Use RDS endpoint or private IP)
DB_HOST=leadgen-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=leadgen_pro
DB_USER=leadgen_admin
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis (Use ElastiCache endpoint or private IP)
REDIS_HOST=leadgen-redis.xxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# JWT (Generate strong secret)
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLIC_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# External APIs
NEVERBOUNCE_API_KEY=your_key
CLEARBIT_API_KEY=your_key
FULLCONTACT_API_KEY=your_key
HUNTER_API_KEY=your_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@leadgenpro.com

# CORS (Your extension ID)
CORS_ORIGIN=chrome-extension://YOUR_EXTENSION_ID,https://app.leadgenpro.com

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/leadgen/app.log
```

### 3.4 Run Database Migrations

```bash
# Create logs directory
sudo mkdir -p /var/log/leadgen
sudo chown -R ubuntu:ubuntu /var/log/leadgen

# Run migrations
psql -h YOUR_DB_HOST -U leadgen_admin -d leadgen_pro < migrations/001_initial_schema.sql
```

### 3.5 Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name leadgen-api --instances 2 --exec-mode cluster

# Configure PM2 to start on boot
pm2 startup systemd
# Copy and run the command it outputs

pm2 save

# Monitor
pm2 monit
pm2 logs leadgen-api
```

**PM2 Ecosystem File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'leadgen-api',
    script: './server.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/leadgen/error.log',
    out_file: '/var/log/leadgen/out.log',
    log_file: '/var/log/leadgen/combined.log',
    time: true,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10
  }]
};

// Start with: pm2 start ecosystem.config.js
```

---

## 🔒 Part 4: SSL/HTTPS Setup

### 4.1 Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 4.2 Obtain SSL Certificate

```bash
# Get certificate
sudo certbot --nginx -d api.leadgenpro.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 4.3 Verify HTTPS

```bash
# Test API over HTTPS
curl https://api.leadgenpro.com/health

# Should return:
# {"status":"healthy",...}
```

---

## 📊 Part 5: Monitoring & Logging

### 5.1 Setup CloudWatch (AWS)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/bin/config.json
```

### 5.2 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/leadgen

# Add:
/var/log/leadgen/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 5.3 Setup Monitoring

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Health check script
nano /usr/local/bin/health-check.sh
```

**Health Check Script:**
```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $RESPONSE != "200" ]; then
    echo "API health check failed with status $RESPONSE"
    pm2 restart leadgen-api
    # Send alert (optional)
    # curl -X POST https://hooks.slack.com/... -d "API is down"
fi
```

```bash
chmod +x /usr/local/bin/health-check.sh

# Add to crontab (run every 5 minutes)
crontab -e
*/5 * * * * /usr/local/bin/health-check.sh
```

---

## 🔄 Part 6: Continuous Deployment

### 6.1 Setup GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/leadgen
            git pull origin main
            cd backend
            npm install --production
            pm2 reload leadgen-api
```

### 6.2 Setup Auto-scaling (Optional)

```bash
# Create Auto Scaling Group in AWS
# Set min instances: 2
# Set max instances: 10
# Target CPU: 70%
```

---

## ✅ Part 7: Production Checklist

### Pre-Launch
- [ ] Environment variables set correctly
- [ ] Database migrations run
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Load testing completed
- [ ] Security audit passed

### Post-Launch
- [ ] Health checks passing
- [ ] Error rates monitored
- [ ] Performance metrics tracked
- [ ] Backup verification
- [ ] User testing
- [ ] Documentation updated

---

## 🆘 Troubleshooting

### API Not Starting
```bash
# Check logs
pm2 logs leadgen-api

# Check environment
pm2 env leadgen-api

# Restart
pm2 restart leadgen-api
```

### Database Connection Failed
```bash
# Test connection
psql -h YOUR_DB_HOST -U leadgen_admin -d leadgen_pro

# Check security group rules
# Check database server status
```

### High CPU Usage
```bash
# Check processes
top
htop

# Check PM2
pm2 list
pm2 monit

# Reduce instances if needed
pm2 scale leadgen-api 2
```

---

## 📈 Scaling Strategy

**Up to 1,000 users:**
- Single t3.medium instance
- RDS db.t3.small
- ElastiCache cache.t3.micro

**1,000 - 10,000 users:**
- 2-3 t3.large instances behind ALB
- RDS db.t3.medium (Multi-AZ)
- ElastiCache cache.t3.small

**10,000+ users:**
- Auto-scaling group (3-10 instances)
- RDS db.r5.xlarge (Multi-AZ + Read Replicas)
- ElastiCache cache.r5.large
- CloudFront CDN
- WAF protection

---

**🎉 Your production-ready Lead Generator Pro API is now live!**
