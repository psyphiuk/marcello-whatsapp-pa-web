/**
 * Admin validation utilities for server-side security
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Create a server-side Supabase client with service role key
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Verify if a user is an admin - server-side only
 * This should be used in all admin API routes
 */
export async function verifyAdmin(request: NextRequest): Promise<{
  isAdmin: boolean
  userId?: string
  error?: string
}> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isAdmin: false, error: 'Missing authorization header' }
    }

    const token = authHeader.substring(7)
    
    // Create admin client to bypass RLS
    const supabase = createAdminClient()
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return { isAdmin: false, error: 'Invalid authentication token' }
    }

    // Check if user is admin in the database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('settings')
      .eq('id', user.id)
      .single()

    if (customerError || !customer) {
      return { isAdmin: false, userId: user.id, error: 'Customer not found' }
    }

    const isAdmin = customer.settings?.is_admin === true

    return { isAdmin, userId: user.id }
  } catch (error) {
    console.error('Admin verification error:', error)
    return { isAdmin: false, error: 'Verification failed' }
  }
}

/**
 * Middleware wrapper to protect admin API routes
 */
export function withAdminAuth(
  handler: (req: NextRequest, context: { userId: string }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const { isAdmin, userId, error } = await verifyAdmin(req)

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          error: error || 'Unauthorized: Admin access required' 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(req, { userId })
  }
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminActivityToAudit(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
) {
  try {
    const supabase = createAdminClient()
    
    await supabase.from('admin_audit_log').insert({
      user_id: userId,
      action,
      resource,
      details,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging failure shouldn't break the operation
  }
}