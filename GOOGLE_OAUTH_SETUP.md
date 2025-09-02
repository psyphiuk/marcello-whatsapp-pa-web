# Google OAuth Setup Guide

## Prerequisites
- Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left)
3. Click "New Project"
4. Enter project name: "WhatsApp PA" (or your preferred name)
5. Click "Create"

### 2. Enable Google APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google Calendar API** (for calendar management)
   - **Google Contacts API** (for contacts management)
   - **Google Drive API** (for file access)
   - **Gmail API** (for email integration)

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: PICORTEX AI (or your app name)
   - **User support email**: Your email
   - **App logo**: Optional
   - **Application home page**: https://picortex-whatsapp-pa.vercel.app (or your domain)
   - **Authorized domains**: vercel.app (or your domain)
   - **Developer contact email**: Your email
5. Click "Save and Continue"

### 4. Add OAuth Scopes

1. Click "Add or Remove Scopes"
2. Add these scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   https://www.googleapis.com/auth/contacts
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   ```
3. Click "Update"
4. Click "Save and Continue"

### 5. Add Test Users (if in testing mode)

1. Click "Add Users"
2. Add your email address and any other test emails
3. Click "Save and Continue"

### 6. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application" as the application type
4. Name: "WhatsApp PA Web Client"
5. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://picortex-whatsapp-pa.vercel.app
   https://your-domain.com
   ```
6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   https://picortex-whatsapp-pa.vercel.app/api/auth/google/callback
   https://your-domain.com/api/auth/google/callback
   ```
7. Click "Create"

### 7. Copy Your Credentials

After creating, you'll see:
- **Client ID**: Something like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: A long string of characters

### 8. Update Environment Variables

Add these to your `.env.local` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

For production (Vercel), update the redirect URI:
```env
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
```

### 9. Verify Setup

1. Restart your development server
2. Try the Google connection step again
3. You should see Google's consent screen

## Troubleshooting

### "Access blocked" error
- Make sure your redirect URI exactly matches what's in Google Console
- Check that all required APIs are enabled
- Verify client ID and secret are correct

### "Invalid client" error
- Double-check the CLIENT_ID is copied correctly
- Ensure no extra spaces in environment variables
- Restart the development server after adding env vars

### "Redirect URI mismatch"
- The redirect URI must match EXACTLY (including http/https and trailing slashes)
- Add all variations you might use (localhost, production domain)

## Publishing Your App (Optional)

While in testing mode, only test users can use OAuth. To go live:

1. Go to "OAuth consent screen"
2. Click "Publish App"
3. Google may require verification if you use sensitive scopes

## Security Notes

- **Never commit** your CLIENT_SECRET to version control
- Use different OAuth apps for development and production
- Regularly rotate your client secret
- Monitor usage in Google Cloud Console

## Required Scopes Explanation

- **calendar**: Create and manage calendar events
- **contacts**: Access and manage contacts
- **drive.file**: Access files created by the app
- **gmail.readonly**: Read email for task extraction
- **userinfo**: Get user's basic profile information