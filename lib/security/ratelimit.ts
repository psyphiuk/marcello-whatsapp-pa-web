/**
 * Rate limiting middleware for API protection
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Different rate limit configurations for various endpoints
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    requests: 5,
    window: '1 m', // 5 requests per minute
  },
  // Moderate limits for API endpoints
  api: {
    requests: 30,
    window: '1 m', // 30 requests per minute
  },
  // Relaxed limits for admin endpoints (still protected)
  admin: {
    requests: 60,
    window: '1 m', // 60 requests per minute
  },
  // Very strict limits for payment endpoints
  payment: {
    requests: 3,
    window: '1 m', // 3 requests per minute
  },
  // Webhook endpoints (allow more for Stripe callbacks)
  webhook: {
    requests: 100,
    window: '1 m', // 100 requests per minute
  }
}

// Create Redis client (fallback to in-memory if not configured)
let redis: Redis | null = null
let ratelimiters: Map<string, Ratelimit> = new Map()

function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('Upstash Redis not configured. Rate limiting will use in-memory storage (not recommended for production)')
    return null
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }

  return redis
}

// In-memory rate limiter for development (not recommended for production)
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly requestLimit: number
  private readonly windowMs: number

  constructor(requests: number, window: string) {
    this.requestLimit = requests
    // Parse window string (e.g., "1 m" -> 60000ms)
    const [value, unit] = window.split(' ')
    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    }
    this.windowMs = parseInt(value) * (multipliers[unit] || 60000)
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (!record || now > record.resetTime) {
      // Start new window
      const resetTime = now + this.windowMs
      this.requests.set(identifier, { count: 1, resetTime })
      return {
        success: true,
        limit: this.requestLimit,
        remaining: this.requestLimit - 1,
        reset: resetTime
      }
    }

    if (record.count >= this.requestLimit) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.requestLimit,
        remaining: 0,
        reset: record.resetTime
      }
    }

    // Increment counter
    record.count++
    return {
      success: true,
      limit: this.requestLimit,
      remaining: this.requestLimit - record.count,
      reset: record.resetTime
    }
  }
}

// In-memory rate limiters for development
const inMemoryLimiters: Map<string, InMemoryRateLimiter> = new Map()

function getRateLimiter(type: keyof typeof rateLimitConfigs): Ratelimit | InMemoryRateLimiter {
  const redisClient = getRedisClient()
  
  if (redisClient) {
    // Use Upstash rate limiter with Redis
    if (!ratelimiters.has(type)) {
      const config = rateLimitConfigs[type]
      // Parse window string to duration
      const [value, unit] = config.window.split(' ')
      const unitMap: Record<string, 's' | 'm' | 'h' | 'd'> = {
        's': 's', 'm': 'm', 'h': 'h', 'd': 'd'
      }
      const duration = `${value}${unitMap[unit] || 'm'}` as `${number}${'s' | 'm' | 'h' | 'd'}`
      
      ratelimiters.set(type, new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(config.requests, duration),
        analytics: true,
        prefix: `ratelimit:${type}`
      }))
    }
    return ratelimiters.get(type)!
  } else {
    // Use in-memory rate limiter for development
    if (!inMemoryLimiters.has(type)) {
      const config = rateLimitConfigs[type]
      inMemoryLimiters.set(type, new InMemoryRateLimiter(config.requests, config.window))
    }
    return inMemoryLimiters.get(type)!
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  request: NextRequest,
  type: keyof typeof rateLimitConfigs = 'api'
): Promise<NextResponse | null> {
  try {
    // Get identifier (IP address or user ID)
    const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
    
    const limiter = getRateLimiter(type)
    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Troppe richieste. Riprova più tardi.',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.floor((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.floor((reset - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Rate limit passed - return null to continue
    return null
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Don't block requests if rate limiting fails
    return null
  }
}

/**
 * Middleware wrapper with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  type: keyof typeof rateLimitConfigs = 'api'
) {
  return async (req: NextRequest) => {
    const rateLimitResponse = await rateLimit(req, type)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    return handler(req)
  }
}

/**
 * Combined middleware for admin routes (auth + rate limit)
 */
export function withAdminRateLimit(
  handler: (req: NextRequest, context: { userId: string }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    // Apply rate limiting first
    const rateLimitResponse = await rateLimit(req, 'admin')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Then apply admin auth
    const { withAdminAuth } = await import('@/lib/security/admin')
    return withAdminAuth(handler)(req)
  }
}