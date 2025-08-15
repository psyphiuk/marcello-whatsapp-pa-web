# 🤖 WhatsApp PA Web - Marketing & Onboarding Frontend

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/psyphiuk/marcello-whatsapp-pa-web)
[![Security Score](https://img.shields.io/badge/Security%20Score-9.5%2F10-brightgreen)](./SECURITY_AUDIT.md)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

Enterprise-grade marketing and onboarding frontend for the WhatsApp Personal Assistant service. Built with Next.js 15, TypeScript, and comprehensive security features.

## 🌟 Features

### Core Functionality
- 🚀 **Marketing Landing Page** - Italian language, conversion-optimized
- 📝 **Multi-Step Onboarding** - Guided setup for Google Workspace integration
- 💳 **Stripe Payment Integration** - Flexible pricing with discount codes
- 🔐 **Admin Dashboard** - Complete customer and billing management
- 📊 **Analytics & Monitoring** - Real-time metrics and insights

### Security Features (Score: 9.5/10)
- 🔑 **Multi-Factor Authentication (MFA/2FA)** - TOTP-based with backup codes
- 🛡️ **Advanced Session Management** - Timeout, refresh, and device tracking
- 🚦 **Rate Limiting** - DDoS protection on all endpoints
- 📝 **Comprehensive Audit Logging** - 90-day retention
- 🔒 **OWASP Top 10 Compliant** - Full coverage
- 🌐 **IP Whitelisting** - Admin panel protection
- 🔍 **Real-time Security Monitoring** - Threat detection dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn 4.9.2+
- Supabase account
- Stripe account
- Google Cloud Console access

### Local Development

```bash
# Clone repository
git clone https://github.com/psyphiuk/marcello-whatsapp-pa-web.git
cd marcello-whatsapp-pa-web

# Install dependencies
corepack enable
corepack yarn install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
yarn dev

# Open http://localhost:3000
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/psyphiuk/marcello-whatsapp-pa-web)

See [DEPLOYMENT_VERCEL.md](./DEPLOYMENT_VERCEL.md) for detailed instructions.

## 📁 Project Structure

```
whatsapp-pa-web/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (onboarding)/      # Onboarding flow
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   └── dashboard/         # User dashboard
├── lib/                   # Utility libraries
│   ├── security/          # Security utilities
│   └── supabase/          # Database client
├── public/                # Static assets
├── styles/                # Global styles
└── supabase/             # Database migrations
```

## 🔧 Configuration

### Environment Variables

```env
# Required - See .env.local.example for full list
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
ADMIN_ACTIVATION_CODE=
```

### Database Setup

Run migrations in order:
1. `supabase/migrations/001_stripe_integration.sql`
2. `supabase/migrations/002_security_audit.sql`
3. `supabase/migrations/003_mfa_support.sql`

## 🔒 Security

### Security Score: 9.5/10

- ✅ **Authentication**: Password complexity, MFA/2FA, session management
- ✅ **Authorization**: Role-based access, server-side validation
- ✅ **Data Protection**: Encryption, input sanitization, CSRF protection
- ✅ **Monitoring**: Audit logging, real-time alerts, threat detection

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for detailed security analysis.

## 📊 Admin Features

### Dashboard Sections
- **Customer Management** - CRUD operations, status tracking
- **Analytics** - Revenue, user metrics, system health
- **Billing** - Subscription management, invoices
- **Security Center** - Real-time monitoring, audit logs
- **Pricing Configuration** - Dynamic pricing updates

### Special Admin Codes
Configure in environment variables (change defaults!):
- `ADMIN_ACTIVATION_CODE` - Grants admin access
- `FREE_SETUP_CODE` - Waives setup fee

## 🧪 Testing

```bash
# Run type checking
yarn typecheck

# Run linting
yarn lint

# Security audit
yarn security:check

# Build for production
yarn build
```

## 📈 Monitoring

### Health Check Endpoint
```bash
curl https://your-domain.vercel.app/api/health
```

### Metrics Available
- Active sessions
- Failed login attempts
- MFA adoption rate
- API response times
- Error rates

## 🛠️ Scripts

```json
{
  "dev": "Start development server",
  "build": "Build for production",
  "start": "Start production server",
  "lint": "Run ESLint",
  "typecheck": "TypeScript type checking",
  "security:check": "Security audit"
}
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_VERCEL.md) - Complete Vercel deployment
- [Security Audit](./SECURITY_AUDIT.md) - OWASP security analysis
- [Security Implementation](./SECURITY_IMPLEMENTATION.md) - Phase 1 security
- [Security Phase 2](./SECURITY_PHASE2_COMPLETE.md) - Advanced security

## 🤝 Contributing

This is a private commercial project. For access or contributions, contact the development team.

## 🐛 Known Issues

- Rate limiting requires Upstash Redis for production (falls back to in-memory)
- MFA QR codes require HTTPS in production
- Session refresh requires client-side JavaScript

## 📞 Support

- **Technical**: dev@picortex.ai
- **Security**: security@picortex.ai
- **Business**: business@picortex.ai

## 📄 License

Proprietary - All rights reserved. This software is the property of Picortex AI.

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Database & Auth
- [Stripe](https://stripe.com/) - Payment processing
- [Vercel](https://vercel.com/) - Deployment platform

---

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintained by**: Picortex AI Team
