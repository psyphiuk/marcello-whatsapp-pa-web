import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const state = requestUrl.searchParams.get('state')
  
  console.log('[Google OAuth Callback] Received callback')
  console.log('[Google OAuth Callback] Code present:', !!code)
  console.log('[Google OAuth Callback] State present:', !!state)
  console.log('[Google OAuth Callback] Error:', error)
  
  // Check for OAuth errors
  if (error) {
    console.error('[Google OAuth Callback] OAuth error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <p>Errore durante l'autorizzazione: ${error}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-oauth-error', error: '${error}' }, '${requestUrl.origin}');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }
  
  if (!code) {
    console.error('[Google OAuth Callback] No authorization code received')
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Error</title></head>
        <body>
          <p>Nessun codice di autorizzazione ricevuto</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-oauth-error', error: 'no_code' }, '${requestUrl.origin}');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }
  
  // Decode state to get user ID
  let userId: string | null = null
  try {
    if (state) {
      const decoded = JSON.parse(atob(state))
      userId = decoded.userId
      console.log('[Google OAuth Callback] Decoded user ID from state:', userId)
    }
  } catch (e) {
    console.error('[Google OAuth Callback] Failed to decode state:', e)
  }
  
  if (!userId) {
    console.error('[Google OAuth Callback] No user ID in state')
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Invalid State</title></head>
        <body>
          <p>Stato non valido. Riprova.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-oauth-error', error: 'invalid_state' }, '${requestUrl.origin}');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }
  
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  try {
    console.log('[Google OAuth Callback] Processing for user ID:', userId)
    
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
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Token Error</title></head>
          <body>
            <p>Errore nello scambio del token: ${tokens.error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-oauth-error', error: 'token_exchange' }, '${requestUrl.origin}');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
    }
    
    console.log('[Google OAuth Callback] Tokens received, storing credentials')
    
    // Store credentials in database using the user ID from state
    const { error: dbError } = await supabase
      .from('credentials')
      .upsert({
        customer_id: userId,
        service: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope,
      })
    
    if (dbError) {
      console.error('[Google OAuth Callback] Database error:', dbError)
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Storage Error</title></head>
          <body>
            <p>Errore nel salvataggio delle credenziali</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'google-oauth-error', error: 'storage' }, '${requestUrl.origin}');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
    }
    
    console.log('[Google OAuth Callback] Credentials stored successfully')
    
    // Return success page that notifies parent and closes
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
            console.log('OAuth callback: Attempting to notify parent window');
            
            // Multiple attempts to notify parent
            function notifyParent() {
              // Try window.opener
              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({ type: 'google-oauth-success', timestamp: Date.now() }, '${requestUrl.origin}');
                  console.log('Message sent via window.opener');
                } catch (e) {
                  console.error('window.opener postMessage failed:', e);
                }
              }
              
              // Try parent (in case it's an iframe)
              if (window.parent && window.parent !== window) {
                try {
                  window.parent.postMessage({ type: 'google-oauth-success', timestamp: Date.now() }, '${requestUrl.origin}');
                  console.log('Message sent via window.parent');
                } catch (e) {
                  console.error('window.parent postMessage failed:', e);
                }
              }
            }
            
            // Send message immediately
            notifyParent();
            
            // Try again after a short delay
            setTimeout(notifyParent, 500);
            
            // Attempt to close the window
            setTimeout(() => {
              try {
                window.close();
                console.log('Window close attempted');
              } catch (e) {
                console.log('Window close failed:', e);
              }
            }, 1500);
          </script>
        </body>
      </html>
    `
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
    
  } catch (error) {
    console.error('[Google OAuth Callback] Unexpected error:', error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Unexpected Error</title></head>
        <body>
          <p>Errore inaspettato durante l'autorizzazione</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-oauth-error', error: 'unexpected' }, '${requestUrl.origin}');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  }
}