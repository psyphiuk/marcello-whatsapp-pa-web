import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('[Middleware] Checking path:', req.nextUrl.pathname)
  
  // Create a response and pass it to the middleware client
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get and refresh the session
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('[Middleware] Session exists:', !!session, session?.user?.email)

  // Protect admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // No session, redirect to login
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check if user is admin
    const { data: customer } = await supabase
      .from('customers')
      .select('settings')
      .eq('id', session.user.id)
      .single()

    if (!customer?.settings?.is_admin) {
      // Not an admin, redirect to regular dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Protect authenticated routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/onboarding') ||
      req.nextUrl.pathname.startsWith('/settings')) {
    if (!session) {
      console.log('[Middleware] No session for protected route:', req.nextUrl.pathname)
      // Don't redirect if we're already on the login page (prevents loops)
      if (!req.nextUrl.pathname.includes('/login')) {
        // Add parameter to indicate where the redirect came from
        const loginUrl = new URL('/login', req.url)
        if (req.nextUrl.pathname.startsWith('/onboarding')) {
          loginUrl.searchParams.set('from', 'onboarding')
        }
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // IMPORTANT: Return the response with updated cookies
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/onboarding/:path*', '/settings/:path*']
}