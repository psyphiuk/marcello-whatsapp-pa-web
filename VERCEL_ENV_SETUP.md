# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:
**Settings → Environment Variables**

### Supabase Configuration (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key - KEEP SECRET]
```

### WhatsApp Business API Configuration
```
WHATSAPP_PHONE_NUMBER_ID=[Your WhatsApp Phone Number ID]
WHATSAPP_BUSINESS_ACCOUNT_ID=[Your WhatsApp Business Account ID]
WHATSAPP_ACCESS_TOKEN=[Your WhatsApp Access Token - KEEP SECRET]
WHATSAPP_WEBHOOK_VERIFY_TOKEN=[Your Webhook Verify Token]
WHATSAPP_DISPLAY_PHONE_NUMBER=[Your Display Phone Number]
WHATSAPP_VERIFIED_NAME=[Your Verified Business Name]
```

### Stripe Configuration (Required for payments)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Your Stripe Publishable Key]
STRIPE_SECRET_KEY=[Your Stripe Secret Key]
STRIPE_WEBHOOK_SECRET=[Your Stripe Webhook Secret]

# Stripe Price IDs (from your Stripe Dashboard)
NEXT_PUBLIC_STRIPE_SETUP_PRICE_ID=[Your Setup Fee Price ID]
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=[Your Basic Plan Price ID]
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=[Your Pro Plan Price ID]
```

### Security Configuration
```
# Special activation codes
ADMIN_ACTIVATION_CODE=[Your Admin Activation Code - KEEP SECRET]
FREE_SETUP_CODE=[Your Free Setup Code - KEEP SECRET]

# Internal service token (generate a secure random string)
INTERNAL_SERVICE_TOKEN=[Generate a secure random string]
```

### Google OAuth Configuration (Optional)
```
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

### Rate Limiting with Upstash Redis (Optional but recommended)
```
UPSTASH_REDIS_REST_URL=[Your Upstash Redis URL]
UPSTASH_REDIS_REST_TOKEN=[Your Upstash Redis Token]
```

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Navigate to "Environment Variables" in the left sidebar
4. Add each variable:
   - **Key**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The variable value
   - **Environment**: Select all (Production, Preview, Development)
5. Click "Save" for each variable

## Important Notes

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- All other variables are server-side only
- After adding all variables, redeploy your application
- The Supabase credentials provided above are your actual production credentials
- Generate your own secure `INTERNAL_SERVICE_TOKEN` using a password generator
- Set up Stripe products and pricing in your Stripe Dashboard first

## Verification

After setting up the environment variables and redeploying:

1. Check the deployment logs for any errors
2. Visit your application URL
3. Try to sign up/login - it should work without JWT errors
4. Check that the Terms and Privacy pages load correctly

## Troubleshooting

If you still see errors after setting environment variables:

1. Make sure all variables are saved in Vercel
2. Trigger a new deployment (push a commit or use "Redeploy" button)
3. Check the function logs in Vercel dashboard for specific errors
4. Ensure your Supabase database has the correct migrations applied