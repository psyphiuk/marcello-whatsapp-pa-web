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
    
    // Close the popup window and notify parent
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connessione completata</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .success-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h2>Connessione completata!</h2>
            <p>Puoi chiudere questa finestra.</p>
          </div>
          <script>
            // Notify parent window
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({ type: 'google-oauth-success' }, '${requestUrl.origin}');
                console.log('Message sent to parent window');
              } catch (e) {
                console.error('Could not send message to parent:', e);
              }
            }
            
            // Try to close after a short delay to ensure message is sent
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Window close failed, user must close manually');
              }
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