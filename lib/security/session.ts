/**
 * Session management utilities
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Session configuration
export const SESSION_CONFIG = {
  TIMEOUT_MINUTES: 30,           // Inactivity timeout
  ABSOLUTE_TIMEOUT_HOURS: 24,    // Maximum session duration
  REFRESH_THRESHOLD_MINUTES: 5,  // Refresh if less than 5 minutes left
  WARNING_MINUTES: 5,            // Warn user 5 minutes before timeout
  COOKIE_NAME: 'session_token',
  SECURE_COOKIE: process.env.NODE_ENV === 'production'
}

// Create admin client for session operations
function getSessionClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create new session
 */
export async function createSession(
  userId: string,
  request: NextRequest,
  mfaVerified: boolean = false
): Promise<{ token: string; expiresAt: Date } | null> {
  try {
    const supabase = getSessionClient()
    const token = generateSessionToken()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000)
    
    const { error } = await supabase.from('user_sessions').insert({
      customer_id: userId,
      session_token: token,
      ip_address: request.ip || request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent') || null,
      last_activity: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      mfa_verified: mfaVerified,
      created_at: now.toISOString()
    })

    if (error) {
      console.error('Error creating session:', error)
      return null
    }

    return { token, expiresAt }
  } catch (error) {
    console.error('Error in createSession:', error)
    return null
  }
}

/**
 * Validate session
 */
export async function validateSession(token: string): Promise<{
  valid: boolean
  userId?: string
  mfaVerified?: boolean
  needsRefresh?: boolean
  remainingTime?: number
}> {
  try {
    const supabase = getSessionClient()
    const now = new Date()
    
    // Get session
    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_token', token)
      .single()

    if (error || !session) {
      return { valid: false }
    }

    // Check if session expired
    if (new Date(session.expires_at) < now) {
      await destroySession(token)
      return { valid: false }
    }

    // Check inactivity timeout
    const lastActivity = new Date(session.last_activity)
    const inactiveMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
    
    if (inactiveMinutes > SESSION_CONFIG.TIMEOUT_MINUTES) {
      await destroySession(token)
      return { valid: false }
    }

    // Update last activity
    await supabase
      .from('user_sessions')
      .update({ last_activity: now.toISOString() })
      .eq('id', session.id)

    // Calculate remaining time
    const expiresAt = new Date(session.expires_at)
    const remainingMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60)
    
    return {
      valid: true,
      userId: session.customer_id,
      mfaVerified: session.mfa_verified,
      needsRefresh: remainingMinutes < SESSION_CONFIG.REFRESH_THRESHOLD_MINUTES,
      remainingTime: Math.floor(remainingMinutes)
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return { valid: false }
  }
}

/**
 * Refresh session
 */
export async function refreshSession(token: string): Promise<{
  success: boolean
  newToken?: string
  expiresAt?: Date
}> {
  try {
    const validation = await validateSession(token)
    
    if (!validation.valid || !validation.userId) {
      return { success: false }
    }

    const supabase = getSessionClient()
    const now = new Date()
    const newExpiresAt = new Date(now.getTime() + SESSION_CONFIG.ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000)
    
    // Generate new token
    const newToken = generateSessionToken()
    
    // Update session with new token and expiry
    const { error } = await supabase
      .from('user_sessions')
      .update({
        session_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        last_activity: now.toISOString()
      })
      .eq('session_token', token)

    if (error) {
      console.error('Error refreshing session:', error)
      return { success: false }
    }

    return {
      success: true,
      newToken,
      expiresAt: newExpiresAt
    }
  } catch (error) {
    console.error('Error in refreshSession:', error)
    return { success: false }
  }
}

/**
 * Destroy session
 */
export async function destroySession(token: string): Promise<boolean> {
  try {
    const supabase = getSessionClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', token)

    if (error) {
      console.error('Error destroying session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in destroySession:', error)
    return false
  }
}

/**
 * Destroy all sessions for a user
 */
export async function destroyAllUserSessions(userId: string): Promise<boolean> {
  try {
    const supabase = getSessionClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('customer_id', userId)

    if (error) {
      console.error('Error destroying user sessions:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in destroyAllUserSessions:', error)
    return false
  }
}

/**
 * Update MFA verification status for session
 */
export async function updateSessionMFA(token: string, verified: boolean): Promise<boolean> {
  try {
    const supabase = getSessionClient()
    
    const { error } = await supabase
      .from('user_sessions')
      .update({ mfa_verified: verified })
      .eq('session_token', token)

    if (error) {
      console.error('Error updating session MFA:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateSessionMFA:', error)
    return false
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Array<{
  id: string
  ipAddress: string | null
  userAgent: string | null
  lastActivity: Date
  expiresAt: Date
  current: boolean
}>> {
  try {
    const supabase = getSessionClient()
    
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('customer_id', userId)
      .order('last_activity', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(session => ({
      id: session.id,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      lastActivity: new Date(session.last_activity),
      expiresAt: new Date(session.expires_at),
      current: false // Will be set by the calling function
    }))
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return []
  }
}

/**
 * Session middleware
 */
export function withSession(
  handler: (req: NextRequest, session: { userId: string; mfaVerified: boolean }) => Promise<Response>,
  options?: {
    requireMFA?: boolean
  }
) {
  return async (req: NextRequest) => {
    // Get session token from cookie or header
    const token = req.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value ||
                  req.headers.get('x-session-token')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Sessione non valida' },
        { status: 401 }
      )
    }

    const validation = await validateSession(token)
    
    if (!validation.valid || !validation.userId) {
      const response = NextResponse.json(
        { error: 'Sessione scaduta' },
        { status: 401 }
      )
      
      // Clear session cookie
      response.cookies.delete(SESSION_CONFIG.COOKIE_NAME)
      
      return response
    }

    // Check MFA requirement
    if (options?.requireMFA && !validation.mfaVerified) {
      return NextResponse.json(
        { error: 'Verifica MFA richiesta' },
        { status: 403 }
      )
    }

    // Handle session refresh if needed
    let responseToken = token
    let responseExpiresAt: Date | null = null
    
    if (validation.needsRefresh) {
      const refresh = await refreshSession(token)
      if (refresh.success && refresh.newToken) {
        responseToken = refresh.newToken
        responseExpiresAt = refresh.expiresAt || null
      }
    }

    // Execute handler
    const response = await handler(req, {
      userId: validation.userId,
      mfaVerified: validation.mfaVerified || false
    })

    // Update session cookie if refreshed
    if (responseToken !== token && responseExpiresAt) {
      response.cookies.set(SESSION_CONFIG.COOKIE_NAME, responseToken, {
        httpOnly: true,
        secure: SESSION_CONFIG.SECURE_COOKIE,
        sameSite: 'strict',
        expires: responseExpiresAt,
        path: '/'
      })
    }

    return response
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = getSessionClient()
    const now = new Date()
    
    // Delete expired sessions
    const { data, error } = await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', now.toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up sessions:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error in cleanupExpiredSessions:', error)
    return 0
  }
}

/**
 * React hook for session management (client-side)
 */
export const useSessionScript = `
(function() {
  let warningShown = false;
  let sessionTimeout = null;
  let warningTimeout = null;
  
  const SESSION_TIMEOUT = ${SESSION_CONFIG.TIMEOUT_MINUTES} * 60 * 1000;
  const WARNING_TIME = ${SESSION_CONFIG.WARNING_MINUTES} * 60 * 1000;
  
  function resetSessionTimers() {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    if (warningTimeout) clearTimeout(warningTimeout);
    
    warningShown = false;
    
    // Set warning timeout
    warningTimeout = setTimeout(() => {
      if (!warningShown) {
        warningShown = true;
        if (window.onSessionWarning) {
          window.onSessionWarning(${SESSION_CONFIG.WARNING_MINUTES});
        }
      }
    }, SESSION_TIMEOUT - WARNING_TIME);
    
    // Set session timeout
    sessionTimeout = setTimeout(() => {
      if (window.onSessionTimeout) {
        window.onSessionTimeout();
      }
    }, SESSION_TIMEOUT);
  }
  
  // Reset timers on user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetSessionTimers, { passive: true });
  });
  
  // Initialize timers
  resetSessionTimers();
  
  // Expose session refresh function
  window.refreshSession = async function() {
    try {
      const response = await fetch('/api/session/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        resetSessionTimers();
        return true;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
    return false;
  };
})();
`