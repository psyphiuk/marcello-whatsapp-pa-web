# Debugging Signup Issue - FIXED! 🎉

## The Problem
"null value in column 'email' of relation 'customers' violates not-null constraint"

## The Root Cause
In `app/(auth)/signup/page.tsx`, the customer insert was MISSING the email field!

```javascript
// BEFORE (BROKEN):
.insert({
  id: authData.user.id,
  company_name: formData.companyName,
  phone_numbers: [formData.phoneNumber],
  plan: plan as 'basic' | 'pro',
  // EMAIL WAS MISSING!
})

// AFTER (FIXED):
.insert({
  id: authData.user.id,
  email: formData.email,  // <-- THIS WAS THE FIX!
  company_name: formData.companyName,
  phone_numbers: [formData.phoneNumber],
  plan: plan as 'basic' | 'pro',
})
```

## Testing Locally

1. **Start the development server:**
   ```bash
   yarn dev
   ```

2. **Open browser console** (F12 or right-click → Inspect → Console tab)

3. **Go to signup page:** http://localhost:3000/signup

4. **Fill the form and submit**

5. **Check console for debug logs:**
   - "Starting signup process with data:" - Shows form data
   - "Auth user created:" - Confirms Supabase auth worked
   - "Creating customer with data:" - Shows customer insert data
   - "Customer created successfully" - Confirms success
   - Any errors will show in red

## Testing on Vercel

After deploying:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try signing up at https://picortex-whatsapp-pa.vercel.app/signup
4. Watch the console logs

## Common Issues and Solutions

### Issue 1: RLS Policy Blocks Insert
**Solution:** Run migration 006_fix_customer_registration_rls.sql

### Issue 2: Email redirect goes to localhost
**Solution:** Update Supabase Site URL to production URL

### Issue 3: Stripe API version mismatch
**Solution:** Already fixed with type assertion

## Verifying the Fix Works

1. The signup should complete without errors
2. Check Supabase Dashboard → Table Editor → customers table
3. You should see a new row with ALL fields populated including email
4. The confirmation email should be sent
5. After confirming email, user can login

## Environment Variables Required

Make sure these are set in both local `.env.local` and Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`