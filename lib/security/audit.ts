/**
 * Security audit logging utilities
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Create admin client for audit logging
function getAuditClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration for audit logging')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface SecurityAuditLog {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string
  statusCode?: number
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface AdminAuditLog {
  userId: string
  action: string
  resource: string
  details?: Record<string, any>
}

export interface FailedLoginAttempt {
  email: string
  ipAddress?: string
  userAgent?: string
  errorType: 'invalid_credentials' | 'account_locked' | 'account_disabled' | 'too_many_attempts'
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: SecurityAuditLog): Promise<void> {
  try {
    const client = getAuditClient()
    if (!client) return

    await client.from('security_audit_log').insert({
      user_id: event.userId,
      action: event.action,
      resource: event.resource,
      resource_id: event.resourceId,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      request_method: event.requestMethod,
      request_path: event.requestPath,
      status_code: event.statusCode,
      error_message: event.errorMessage,
      metadata: event.metadata,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Don't throw - logging failure shouldn't break the operation
  }
}

/**
 * Log admin action
 */
export async function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const client = getAuditClient()
    if (!client) return

    await client.from('admin_audit_log').insert({
      user_id: userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

/**
 * Log failed login attempt
 */
export async function logFailedLogin(attempt: FailedLoginAttempt): Promise<void> {
  try {
    const client = getAuditClient()
    if (!client) return

    await client.from('failed_login_attempts').insert({
      email: attempt.email,
      ip_address: attempt.ipAddress,
      user_agent: attempt.userAgent,
      error_type: attempt.errorType,
      attempt_time: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log failed login:', error)
  }
}

/**
 * Check if an account should be locked due to too many failed attempts
 */
export async function checkAccountLockout(
  email: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ isLocked: boolean; remainingTime?: number }> {
  try {
    const client = getAuditClient()
    if (!client) {
      return { isLocked: false }
    }

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

    const { data, error } = await client
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .gte('attempt_time', windowStart)
      .order('attempt_time', { ascending: false })

    if (error || !data) {
      return { isLocked: false }
    }

    if (data.length >= maxAttempts) {
      const latestAttempt = new Date(data[0].attempt_time)
      const lockoutEnd = new Date(latestAttempt.getTime() + windowMinutes * 60 * 1000)
      const now = new Date()

      if (now < lockoutEnd) {
        return {
          isLocked: true,
          remainingTime: Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000)
        }
      }
    }

    return { isLocked: false }
  } catch (error) {
    console.error('Failed to check account lockout:', error)
    return { isLocked: false }
  }
}

/**
 * Extract request information for logging
 */
export function extractRequestInfo(request: NextRequest): {
  ipAddress: string
  userAgent: string
  requestMethod: string
  requestPath: string
} {
  return {
    ipAddress: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestMethod: request.method,
    requestPath: request.nextUrl.pathname
  }
}

/**
 * Middleware to log API requests
 */
export function withAuditLogging(
  handler: (req: NextRequest) => Promise<Response>,
  action: string,
  resource: string
) {
  return async (req: NextRequest) => {
    const requestInfo = extractRequestInfo(req)
    let statusCode: number | undefined
    let errorMessage: string | undefined
    let userId: string | undefined

    try {
      // Try to extract user ID from auth header
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        // This is simplified - in production, validate the JWT properly
        // userId = extractUserIdFromToken(authHeader)
      }

      const response = await handler(req)
      statusCode = response.status

      // Log successful request
      await logSecurityEvent({
        userId,
        action,
        resource,
        ...requestInfo,
        statusCode
      })

      return response
    } catch (error: any) {
      errorMessage = error.message || 'Unknown error'
      statusCode = 500

      // Log failed request
      await logSecurityEvent({
        userId,
        action,
        resource,
        ...requestInfo,
        statusCode,
        errorMessage
      })

      throw error
    }
  }
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  description: string,
  request: NextRequest,
  metadata?: Record<string, any>
): Promise<void> {
  const requestInfo = extractRequestInfo(request)
  
  await logSecurityEvent({
    action: 'SUSPICIOUS_ACTIVITY',
    resource: 'system',
    ...requestInfo,
    metadata: {
      description,
      ...metadata
    }
  })
}

/**
 * Log data access
 */
export async function logDataAccess(
  userId: string,
  dataType: string,
  operation: 'read' | 'write' | 'delete',
  recordId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    userId,
    action: `DATA_${operation.toUpperCase()}`,
    resource: dataType,
    resourceId: recordId,
    metadata
  })
}