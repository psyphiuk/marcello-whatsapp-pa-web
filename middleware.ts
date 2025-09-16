import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('[Middleware] Checking path:', req.nextUrl.pathname)

  // Create a response and pass it to the middleware client
  const res = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req, res })

    // IMPORTANT: Refresh session to ensure it's valid
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[Middleware] Error getting session:', error)
    }

    console.log('[Middleware] Session exists:', !!session, session?.user?.email)

    // For dashboard route, check authentication
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        console.log('[Middleware] No session for dashboard, redirecting to login')
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('from', 'dashboard')
        return NextResponse.redirect(loginUrl)
      }
      // Session exists, allow access
      console.log('[Middleware] Session valid for dashboard access')
    }

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        console.log('[Middleware] No session for admin route')
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Check if user is admin
      const { data: customer } = await supabase
        .from('customers')
        .select('settings')
        .eq('id', session.user.id)
        .single()

      if (!customer?.settings?.is_admin) {
        console.log('[Middleware] User is not admin')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // For other protected routes
    if (req.nextUrl.pathname.startsWith('/settings')) {
      if (!session) {
        console.log('[Middleware] No session for settings')
        const loginUrl = new URL('/login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    }

  } catch (error) {
    console.error('[Middleware] Unexpected error:', error)
  }

  // ALWAYS return the response with updated cookies
  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*'
  ]
}