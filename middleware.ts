import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Checking path:', request.nextUrl.pathname)

  // Create a response and pass it to the middleware client
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: Refresh session to ensure it's valid
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('[Middleware] Error getting session:', error)
  }

  console.log('[Middleware] Session exists:', !!session, session?.user?.email)

  // For dashboard route, check authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      console.log('[Middleware] No session for dashboard, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', 'dashboard')
      return NextResponse.redirect(loginUrl)
    }
    // Session exists, allow access
    console.log('[Middleware] Session valid for dashboard access')
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      console.log('[Middleware] No session for admin route')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin
    const { data: customer } = await supabase
      .from('customers')
      .select('settings')
      .eq('id', session.user.id)
      .single()

    if (!customer?.settings?.is_admin) {
      console.log('[Middleware] User is not admin')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // For other protected routes
  if (request.nextUrl.pathname.startsWith('/settings')) {
    if (!session) {
      console.log('[Middleware] No session for settings')
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ALWAYS return the response with updated cookies
  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/settings/:path*'
  ]
}