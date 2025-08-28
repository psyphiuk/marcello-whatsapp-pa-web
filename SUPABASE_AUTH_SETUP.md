# Supabase Authentication Configuration

## Fix the Redirect URL Issue

Your Supabase is currently redirecting to `localhost:3000` instead of your production URL. 

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/utiehqkhjbfaadznqbsz

2. **Update Site URL**
   - Go to **Authentication → URL Configuration**
   - Change **Site URL** from `http://localhost:3000` to:
     ```
     https://picortex-whatsapp-pa.vercel.app
     ```

3. **Update Redirect URLs**
   - In the same section, add to **Redirect URLs**:
     ```
     https://picortex-whatsapp-pa.vercel.app/*
     https://picortex-whatsapp-pa.vercel.app
     ```

4. **Update Email Templates (Optional)**
   - Go to **Authentication → Email Templates**
   - Update the confirmation email template if needed
   - Ensure the URL uses `{{ .SiteURL }}` variable

## How the Authentication Flow Works

1. User signs up with email/password
2. Supabase creates an auth.users entry
3. Supabase sends confirmation email
4. User clicks link and is redirected to your app
5. Your app should handle the token and create the customers table entry

## Handle the Magic Link in Your App

The confirmation link includes these parameters:
- `access_token`: JWT token for authentication
- `refresh_token`: Token to refresh the session
- `expires_in`: Token expiration time
- `type`: signup or recovery

Your app should:
1. Extract these from the URL hash
2. Use Supabase client to set the session
3. Create the customer record if it doesn't exist
4. Redirect to dashboard

## Quick Fix for Current Situation

Since you received the email with localhost URL, you can:
1. Copy everything after the # in the URL
2. Go to: `https://picortex-whatsapp-pa.vercel.app/#[paste-the-token-part-here]`
3. This should log you in on the production site

## Vercel Environment Variable Check

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`