import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  
  console.log('[Google OAuth Callback] Received callback')
  console.log('[Google OAuth Callback] Code present:', !!code)
  console.log('[Google OAuth Callback] Error:', error)
  
  // Check for OAuth errors
  if (error) {
    console.error('[Google OAuth Callback] OAuth error:', error)
    return NextResponse.redirect(new URL('/setup?google_error=denied', requestUrl.origin))
  }
  
  if (!code) {
    console.error('[Google OAuth Callback] No authorization code received')
    return NextResponse.redirect(new URL('/setup?google_error=no_code', requestUrl.origin))
  }
  
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('[Google OAuth Callback] No authenticated user')
      return NextResponse.redirect(new URL('/login', requestUrl.origin))
    }
    
    console.log('[Google OAuth Callback] Processing for user:', user.email)
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${requestUrl.origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    
    const tokens = await tokenResponse.json()
    
    if (tokens.error) {
      console.error('[Google OAuth Callback] Token exchange error:', tokens.error)
      return NextResponse.redirect(new URL('/setup?google_error=token_exchange', requestUrl.origin))
    }
    
    console.log('[Google OAuth Callback] Tokens received, storing credentials')
    
    // Store credentials in database
    const { error: dbError } = await supabase
      .from('credentials')
      .upsert({
        customer_id: user.id,
        service: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope,
      })
    
    if (dbError) {
      console.error('[Google OAuth Callback] Database error:', dbError)
      return NextResponse.redirect(new URL('/setup?google_error=storage', requestUrl.origin))
    }
    
    console.log('[Google OAuth Callback] Credentials stored successfully')
    
    // Close the popup window via JavaScript
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connessione completata</title>
        </head>
        <body>
          <p>Connessione con Google completata! Questa finestra si chiuderà automaticamente.</p>
          <script>
            window.close();
            // Fallback if window.close() doesn't work
            setTimeout(() => {
              window.location.href = '/setup?google_success=true';
            }, 1000);
          </script>
        </body>
      </html>
    `
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
    
  } catch (error) {
    console.error('[Google OAuth Callback] Unexpected error:', error)
    return NextResponse.redirect(new URL('/setup?google_error=unexpected', requestUrl.origin))
  }
}