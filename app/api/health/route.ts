import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      api: 'ok',
      database: 'checking',
      redis: 'checking',
      stripe: 'checking'
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.VERCEL_ENV || 'development'
  }

  // Check database connection
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { error } = await supabase.from('customers').select('count').limit(1)
      checks.checks.database = error ? 'error' : 'ok'
    } else {
      checks.checks.database = 'not configured'
    }
  } catch (error) {
    checks.checks.database = 'error'
    checks.status = 'degraded'
  }

  // Check Redis (Upstash) connection
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
        }
      })
      checks.checks.redis = response.ok ? 'ok' : 'error'
    } else {
      checks.checks.redis = 'not configured'
    }
  } catch (error) {
    checks.checks.redis = 'error'
  }

  // Check Stripe configuration
  checks.checks.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured'

  // Determine overall health
  const hasErrors = Object.values(checks.checks).some(status => status === 'error')
  if (hasErrors) {
    checks.status = 'unhealthy'
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}