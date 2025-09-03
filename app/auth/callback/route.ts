import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  
  console.log('Auth callback called with code:', code ? 'present' : 'missing')
  
  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
      }
      
      if (data.session) {
        console.log('Session created successfully for user:', data.session.user.email)
        
        // Check if user needs to complete onboarding
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', data.session.user.id)
          .single()
        
        // If error is not "no rows", log it
        if (customerError && customerError.code !== 'PGRST116') {
          console.error('Error fetching customer:', customerError)
        }
        
        // Redirect based on whether customer record exists and onboarding status
        if (customer) {
          console.log('Customer record found:', customer.email)
          // Customer exists, check onboarding status
          if (!customer.onboarding_completed) {
            console.log('Onboarding not completed, redirecting to setup')
            const response = NextResponse.redirect(new URL('/setup', requestUrl.origin))
            return response
          } else {
            console.log('Onboarding completed, redirecting to dashboard')
            const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
            return response
          }
        } else {
          console.log('No customer record found, redirecting to setup to create it')
          // No customer record, go to setup which will handle creation
          const response = NextResponse.redirect(new URL('/setup', requestUrl.origin))
          return response
        }
      }
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(new URL('/login?error=callback_error', requestUrl.origin))
    }
  }
  
  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}