# 🚀 Vercel Deployment Guide - WhatsApp PA Web

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Deploy](#quick-deploy)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services
- ✅ [Vercel Account](https://vercel.com/signup)
- ✅ [Supabase Account](https://supabase.com)
- ✅ [Stripe Account](https://stripe.com)
- ✅ [Google Cloud Console](https://console.cloud.google.com) (for OAuth)
- ✅ [Upstash Account](https://upstash.com) (optional, for Redis rate limiting)

### Repository Access
- ✅ GitHub repository: `https://github.com/psyphiuk/marcello-whatsapp-pa-web`

---

## Quick Deploy

### Option 1: Deploy with Vercel Button (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/psyphiuk/marcello-whatsapp-pa-web&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET,ADMIN_ACTIVATION_CODE,FREE_SETUP_CODE)

### Option 2: Manual Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Clone repository
git clone https://github.com/psyphiuk/marcello-whatsapp-pa-web.git
cd marcello-whatsapp-pa-web

# Deploy to Vercel
vercel

# Follow prompts and set environment variables
```

### Option 3: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub: `psyphiuk/marcello-whatsapp-pa-web`
4. Configure environment variables (see below)
5. Click "Deploy"

---

## Environment Variables

### 1. Create `.env.production` file locally (for reference):

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback

# Stripe Configuration (Required)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Application Configuration (Required)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Security - Special Codes (Required - Change these!)
ADMIN_ACTIVATION_CODE=change-this-secure-code-123
FREE_SETUP_CODE=cambio-codice-gratuito-456

# Security - Internal Service Token (Required - Generate a secure token)
INTERNAL_SERVICE_TOKEN=generate-secure-token-here-789

# Rate Limiting - Upstash Redis (Optional but Recommended)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 2. Add Environment Variables in Vercel Dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable with appropriate values for:
   - `Production`
   - `Preview` (optional, use different values)
   - `Development` (optional, for local development)

### 3. Environment Variable Groups:

#### 🔴 Critical (Must set before deployment):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_ACTIVATION_CODE (change default!)
FREE_SETUP_CODE (change default!)
INTERNAL_SERVICE_TOKEN (generate secure token!)
```

#### 🟡 Required for Full Functionality:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
```

#### 🟢 Optional but Recommended:
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

---

## Database Setup

### 1. Supabase Configuration

#### Create Supabase Project:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Save your project URL and keys

#### Run Database Migrations:
```sql
-- Connect to Supabase SQL Editor and run migrations in order:

-- 1. Run initial schema (if not exists)
-- Check if tables exist first

-- 2. Run Stripe integration migration
-- Location: supabase/migrations/001_stripe_integration.sql

-- 3. Run security audit migration
-- Location: supabase/migrations/002_security_audit.sql

-- 4. Run MFA support migration
-- Location: supabase/migrations/003_mfa_support.sql
```

#### Enable Row Level Security (RLS):
```sql
-- Ensure RLS is enabled on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
```

### 2. Stripe Configuration

#### Create Stripe Products:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create products:
   - **Setup Fee**: €500 one-time
   - **Basic Plan**: €100/month
   - **Pro Plan**: €200/month

#### Configure Webhook:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select project
3. Enable Google Workspace APIs:
   - Google Calendar API
   - Google Contacts API
   - Gmail API
4. Create OAuth 2.0 credentials:
   - Authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`
5. Copy Client ID and Secret

---

## Post-Deployment Configuration

### 1. Verify Deployment

```bash
# Check deployment status
vercel ls

# Check deployment logs
vercel logs your-deployment-url

# Test the application
curl -I https://your-domain.vercel.app
```

### 2. Configure Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables:
   - `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback`

### 3. Set Up Monitoring

#### Vercel Analytics:
1. Enable in Vercel Dashboard → Analytics
2. No additional configuration needed

#### Error Tracking (Optional):
```bash
# Install Sentry
npm install @sentry/nextjs

# Run Sentry wizard
npx @sentry/wizard -i nextjs
```

### 4. Configure Rate Limiting (Production)

1. Create Upstash Redis database at [upstash.com](https://upstash.com)
2. Copy REST URL and token
3. Add to Vercel environment variables:
   ```
   UPSTASH_REDIS_REST_URL=your_url
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```
4. Redeploy for changes to take effect

---

## Security Checklist

### Pre-Deployment:
- [ ] Change default `ADMIN_ACTIVATION_CODE`
- [ ] Change default `FREE_SETUP_CODE`
- [ ] Generate secure `INTERNAL_SERVICE_TOKEN`
- [ ] Set strong `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configure Stripe webhook secret
- [ ] Review all environment variables

### Post-Deployment:
- [ ] Test rate limiting is working
- [ ] Verify security headers are present
- [ ] Check HTTPS is enforced
- [ ] Test MFA functionality
- [ ] Verify session timeouts
- [ ] Check audit logging
- [ ] Test admin access restrictions
- [ ] Verify Stripe webhooks

### Production Security:
```bash
# Test security headers
curl -I https://your-domain.vercel.app

# Expected headers:
# Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Content-Security-Policy: [policy]
```

---

## Monitoring & Maintenance

### 1. Regular Tasks

#### Daily:
- Check Vercel Analytics for errors
- Monitor rate limit violations
- Review security dashboard

#### Weekly:
- Review audit logs
- Check failed login attempts
- Monitor subscription statuses

#### Monthly:
- Update dependencies: `npm update`
- Review security alerts
- Database backup (Supabase handles automatically)

### 2. Monitoring Endpoints

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Check rate limiting
curl -X POST https://your-domain.vercel.app/api/test-rate-limit
```

### 3. Database Maintenance

```sql
-- Clean up old sessions (run weekly)
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Clean up old audit logs (run monthly)
SELECT cleanup_old_audit_logs();

-- Check database size
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Environment Variables Not Loading
```bash
# Verify in Vercel Dashboard
vercel env ls

# Pull to local
vercel env pull .env.local

# Redeploy
vercel --prod
```

#### 2. Database Connection Issues
```javascript
// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(url, key)
const { data, error } = await supabase.from('customers').select('count')
console.log(data, error)
```

#### 3. Stripe Webhook Failures
- Verify webhook endpoint URL
- Check webhook signing secret
- Ensure webhook events are selected
- Check Stripe Dashboard → Developers → Webhooks → Failed attempts

#### 4. Build Failures
```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs --since 1h

# Run build locally
npm run build
```

#### 5. Rate Limiting Not Working
- Verify Upstash credentials
- Check Redis connection
- Falls back to in-memory if Redis unavailable
- Monitor with: `curl -X POST https://your-domain.vercel.app/api/test-rate-limit`

### Debug Mode

Add to environment variables for verbose logging:
```env
DEBUG=true
NODE_ENV=development
```

### Support Resources

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **Project Issues**: [GitHub Issues](https://github.com/psyphiuk/marcello-whatsapp-pa-web/issues)

---

## Performance Optimization

### Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "functions": {
    "app/api/admin/*": {
      "maxDuration": 10
    },
    "app/api/stripe/webhook": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Edge Functions (Optional)

Convert API routes to Edge Runtime for better performance:

```typescript
// Add to API routes for edge runtime
export const runtime = 'edge'
```

---

## Deployment Commands Reference

```bash
# Development
vercel dev

# Preview deployment
vercel

# Production deployment
vercel --prod

# List deployments
vercel ls

# Inspect deployment
vercel inspect [url]

# View logs
vercel logs [url]

# Remove deployment
vercel rm [url]

# Link to existing project
vercel link

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add

# Rollback to previous deployment
vercel rollback
```

---

## 🎉 Deployment Complete!

Once deployed, your WhatsApp PA Web application will be available at:
- **Production**: `https://your-project.vercel.app`
- **Preview**: `https://your-project-git-branch.vercel.app`

### Next Steps:
1. ✅ Test all functionality
2. ✅ Configure custom domain
3. ✅ Set up monitoring
4. ✅ Enable analytics
5. ✅ Schedule security review

---

**Last Updated**: January 2025
**Version**: 1.0
**Support**: security@picortex.ai