import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

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
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/onboarding/:path*', '/settings/:path*']
}