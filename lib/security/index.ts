/**
 * Central security configuration and utilities
 */

export * from './admin'
export * from './audit'
export * from './csrf'
export * from './password'
export * from './ratelimit'
export * from './validation'

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from './ratelimit'
import { withCSRFProtection } from './csrf'
import { withAuditLogging } from './audit'
import { withAdminAuth } from './admin'

/**
 * Combine multiple security middlewares
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<Response>,
  options?: {
    rateLimit?: boolean
    rateLimitType?: 'auth' | 'api' | 'admin' | 'payment' | 'webhook'
    csrf?: boolean
    audit?: boolean
    auditAction?: string
    auditResource?: string
    adminOnly?: boolean
  }
) {
  let wrappedHandler = handler

  // Apply audit logging
  if (options?.audit && options?.auditAction && options?.auditResource) {
    wrappedHandler = withAuditLogging(wrappedHandler, options.auditAction, options.auditResource)
  }

  // Apply CSRF protection
  if (options?.csrf) {
    wrappedHandler = withCSRFProtection(wrappedHandler)
  }

  // Apply rate limiting
  if (options?.rateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler, options.rateLimitType || 'api')
  }

  // Apply admin authentication
  if (options?.adminOnly) {
    wrappedHandler = withAdminAuth(wrappedHandler as any) as any
  }

  return wrappedHandler
}

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Password policy
  PASSWORD: {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
    PREVENT_COMMON: true
  },
  
  // Account lockout
  LOCKOUT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MINUTES: 15,
    DURATION_MINUTES: 30
  },
  
  // Session management
  SESSION: {
    TIMEOUT_MINUTES: 30,
    ABSOLUTE_TIMEOUT_HOURS: 24,
    REFRESH_THRESHOLD_MINUTES: 5
  },
  
  // Rate limiting
  RATE_LIMIT: {
    AUTH: { requests: 5, window: '1m' },
    API: { requests: 30, window: '1m' },
    ADMIN: { requests: 60, window: '1m' },
    PAYMENT: { requests: 3, window: '1m' }
  },
  
  // CSRF
  CSRF: {
    TOKEN_LENGTH: 32,
    TOKEN_EXPIRY_HOURS: 24
  },
  
  // Audit log retention
  AUDIT: {
    RETENTION_DAYS: 90,
    FAILED_LOGIN_RETENTION_DAYS: 30
  }
}

/**
 * Security headers middleware for pages
 */
export function securityHeaders(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  
  // Security headers are now configured in next.config.js
  // This is for any additional runtime headers needed
  
  // Add nonce for CSP if needed
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  response.headers.set('X-Nonce', nonce)
  
  return response
}

/**
 * Check if request is from a trusted source
 */
export function isTrustedSource(request: NextRequest): boolean {
  // Check for Stripe webhook signature
  if (request.headers.get('stripe-signature')) {
    return true
  }
  
  // Check for internal service token
  const serviceToken = request.headers.get('x-service-token')
  if (serviceToken === process.env.INTERNAL_SERVICE_TOKEN) {
    return true
  }
  
  // Add more trusted source checks as needed
  
  return false
}

/**
 * Sanitize error messages before sending to client
 */
export function sanitizeErrorMessage(error: any): string {
  // Don't expose internal error details
  const genericMessages: Record<string, string> = {
    'auth/user-not-found': 'Credenziali non valide',
    'auth/wrong-password': 'Credenziali non valide',
    'auth/invalid-email': 'Email non valida',
    'auth/weak-password': 'Password troppo debole',
    'auth/email-already-in-use': 'Email già registrata',
    'auth/too-many-requests': 'Troppi tentativi. Riprova più tardi',
    'permission-denied': 'Accesso negato',
    'unauthenticated': 'Autenticazione richiesta',
    'unavailable': 'Servizio temporaneamente non disponibile'
  }
  
  if (typeof error === 'string' && genericMessages[error]) {
    return genericMessages[error]
  }
  
  if (error?.code && genericMessages[error.code]) {
    return genericMessages[error.code]
  }
  
  // Generic error message
  return 'Si è verificato un errore. Riprova più tardi'
}

/**
 * Create secure response with proper headers
 */
export function createSecureResponse(
  data: any,
  options?: {
    status?: number
    headers?: Record<string, string>
  }
): NextResponse {
  const response = NextResponse.json(data, {
    status: options?.status || 200,
    headers: options?.headers
  })
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}