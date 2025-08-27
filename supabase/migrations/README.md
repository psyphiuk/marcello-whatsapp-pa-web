# Database Migration Order

Run these migrations in the following order to properly set up the database schema:

## Migration Files

1. **000_base_schema.sql** - Base tables and initial schema
   - Creates the `customers` table
   - Creates `credentials`, `usage_metrics`, `user_sessions` tables
   - Creates WhatsApp-related tables (`whatsapp_conversations`, `whatsapp_messages`)
   - Sets up indexes and RLS policies

2. **001_stripe_integration.sql** - Stripe payment integration
   - Creates `system_config`, `discount_codes`, `subscriptions`, `billing_events` tables
   - Adds Stripe-related columns to the `customers` table
   - Sets up Stripe-specific RLS policies

3. **002_security_audit.sql** - Security and audit logging
   - Creates security audit tables
   - Adds admin-related tables and tracking

4. **003_mfa_support.sql** - Multi-factor authentication
   - Adds MFA-related tables and columns
   - Sets up MFA policies

## How to Run Migrations

### Using Supabase CLI
```bash
supabase migration up
```

### Manual Execution
Run each SQL file in order through the Supabase SQL Editor:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Execute in order (000, 001, 002, 003)

## Important Notes
- Always run migrations in the specified order
- The base schema (000) MUST be run first as other migrations depend on it
- Each migration is idempotent (safe to run multiple times)