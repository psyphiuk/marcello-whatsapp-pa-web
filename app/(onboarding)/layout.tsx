'use client'

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking auth in onboarding layout...')
      
      // First try to get the session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }
      
      if (session) {
        console.log('Session found in onboarding:', session.user?.email)
        setIsChecking(false)
      } else {
        console.log('No session found in onboarding, waiting a moment...')
        
        // Wait a moment for session to establish (for cases coming from signup)
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          if (retrySession) {
            console.log('Session found on retry:', retrySession.user?.email)
            setIsChecking(false)
          } else {
            console.log('Still no session, redirecting to login')
            router.push('/login')
          }
        }, 1000)
      }
    }
    checkAuth()
  }, [router])

  if (isChecking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Verifica autenticazione...</div>
      </div>
    )
  }

  return <>{children}</>
}