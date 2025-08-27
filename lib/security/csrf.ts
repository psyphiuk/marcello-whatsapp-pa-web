/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 */

import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

// In-memory token storage (for development - use Redis in production)
const tokenStore = new Map<string, { token: string; expires: number }>()

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Store CSRF token
 */
async function storeToken(sessionId: string, token: string): Promise<void> {
  const expires = Date.now() + CSRF_TOKEN_EXPIRY
  tokenStore.set(sessionId, { token, expires })
  
  // Clean up expired tokens
  for (const [key, value] of tokenStore.entries()) {
    if (value.expires < Date.now()) {
      tokenStore.delete(key)
    }
  }
}

/**
 * Validate CSRF token
 */
async function validateToken(sessionId: string, token: string): Promise<boolean> {
  const stored = tokenStore.get(sessionId)
  
  if (!stored) {
    return false
  }
  
  if (stored.expires < Date.now()) {
    tokenStore.delete(sessionId)
    return false
  }
  
  return stored.token === token
}

/**
 * Get session ID from request (use auth user ID or IP address)
 */
function getSessionId(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Simple hash of auth token for session ID
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(authHeader).digest('hex')
  }
  
  // Fallback to IP address
  return request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
}

/**
 * CSRF middleware for protecting state-changing operations
 */
export async function csrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }
  
  // Skip for webhook endpoints (they have their own validation)
  if (request.nextUrl.pathname.startsWith('/api/stripe/webhook')) {
    return null
  }
  
  const sessionId = getSessionId(request)
  
  // Get token from header or body
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  
  if (!headerToken) {
    return NextResponse.json(
      { error: 'CSRF token mancante' },
      { status: 403 }
    )
  }
  
  // Validate token
  const isValid = await validateToken(sessionId, headerToken)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'CSRF token non valido' },
      { status: 403 }
    )
  }
  
  return null
}

/**
 * Generate and return a new CSRF token for the session
 */
export async function getCSRFToken(request: NextRequest): Promise<string> {
  const sessionId = getSessionId(request)
  const token = generateCSRFToken()
  await storeToken(sessionId, token)
  return token
}

/**
 * Middleware wrapper with CSRF protection
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const csrfResponse = await csrfProtection(req)
    if (csrfResponse) {
      return csrfResponse
    }
    return handler(req)
  }
}

/**
 * API route to get CSRF token
 */
export async function GET(request: NextRequest) {
  const token = await getCSRFToken(request)
  
  const response = NextResponse.json({ token })
  
  // Also set as httpOnly cookie for double-submit pattern
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: '/'
  })
  
  return response
}

/**
 * Hook for client-side CSRF token management
 */
export const csrfTokenScript = `
  (function() {
    let csrfToken = null;
    
    // Get CSRF token from API
    async function fetchCSRFToken() {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        csrfToken = data.token;
        return csrfToken;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return null;
      }
    }
    
    // Add CSRF token to fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      let [resource, config] = args;
      
      // Skip for GET requests or external URLs
      if (config?.method && !['GET', 'HEAD'].includes(config.method.toUpperCase())) {
        if (typeof resource === 'string' && resource.startsWith('/')) {
          if (!csrfToken) {
            await fetchCSRFToken();
          }
          
          config = config || {};
          config.headers = config.headers || {};
          
          if (csrfToken) {
            config.headers['${CSRF_HEADER_NAME}'] = csrfToken;
          }
        }
      }
      
      return originalFetch.apply(this, [resource, config]);
    };
    
    // Fetch token on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fetchCSRFToken);
    } else {
      fetchCSRFToken();
    }
  })();
`

