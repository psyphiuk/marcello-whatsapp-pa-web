'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import styles from '../auth.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Check if user is already logged in and redirect (only once)
  useEffect(() => {
    // Prevent running if already redirecting
    if (isRedirecting) return

    const params = new URLSearchParams(window.location.search)
    const hasError = params.get('error')
    const hasConfirmed = params.get('confirmed')

    // Check URL parameters for messages
    if (hasConfirmed === 'true') {
      setSuccessMessage('Email confermata con successo! Ora puoi effettuare il login.')
      return // Don't check session if showing confirmation message
    }
    if (hasError === 'auth_callback_error') {
      setError('Errore durante la conferma dell\'email. Per favore, prova ad effettuare il login.')
      return // Don't check session if showing error
    }
    if (hasError === 'callback_error') {
      setError('Si è verificato un errore. Per favore, prova ad effettuare il login.')
      return // Don't check session if showing error
    }

    // Check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          // No session, user needs to login
          return
        }

        // User is logged in, check where to redirect
        setIsRedirecting(true)
        console.log('[Login] User already logged in, checking where to redirect...')

        // Check payment/onboarding status
        const { data: customer } = await supabase
          .from('customers')
          .select('stripe_customer_id, subscription_status, settings, onboarding_completed')
          .eq('id', session.user.id)
          .single()

        // Check if onboarding/payment is completed
        const hasCompletedOnboarding = customer?.onboarding_completed ||
          (customer?.stripe_customer_id &&
          (customer?.subscription_status === 'active' || customer?.settings?.payment_completed))

        if (!customer || !hasCompletedOnboarding) {
          console.log('[Login] User needs to complete setup/payment, redirecting to setup...')
          router.push('/setup')
        } else {
          console.log('[Login] User has completed onboarding, redirecting to dashboard...')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('[Login] Error checking session:', error)
        setIsRedirecting(false) // Reset if error occurs
      }
    }

    checkExistingSession()
  }, [router, isRedirecting])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt started for email:', email)
    setLoading(true)
    setError(null)

    // Check if Supabase is properly configured
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      console.error('Supabase not configured properly')
      setError('Supabase non è configurato. Controlla le variabili di ambiente.')
      setLoading(false)
      return
    }

    try {
      console.log('[Login] Attempting login with Supabase...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error)
        throw error
      }

      if (!data?.session) {
        console.error('No session returned from Supabase')
        throw new Error('No session created')
      }

      console.log('[Login] Login successful, verifying session...')

      // Verify the session is really established
      const { data: { session: verifiedSession } } = await supabase.auth.getSession()

      if (!verifiedSession) {
        console.error('[Login] Session not established after login!')
        throw new Error('Sessione non creata correttamente')
      }

      console.log('[Login] Session verified, checking onboarding status...')
      setIsRedirecting(true)

      // Check if user has completed payment/onboarding
      const { data: customer } = await supabase
        .from('customers')
        .select('stripe_customer_id, subscription_status, settings, onboarding_completed')
        .eq('id', data.user.id)
        .single()

      // Check if onboarding/payment is completed
      const hasCompletedOnboarding = customer?.onboarding_completed ||
        (customer?.stripe_customer_id &&
        (customer?.subscription_status === 'active' || customer?.settings?.payment_completed))

      if (!customer || !hasCompletedOnboarding) {
        console.log('[Login] User needs to complete setup/payment, redirecting to setup...')
        // Add delay to ensure session cookies are properly set
        setTimeout(() => {
          router.push('/setup')
        }, 1000)
      } else {
        console.log('[Login] Onboarding completed, redirecting to dashboard...')
        // Add delay to ensure session cookies are properly set
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (error: any) {
      console.error('Login error caught:', error)
      setError(error.message || 'Errore durante il login')
      setIsRedirecting(false)
    } finally {
      setLoading(false)
    }
  }

  // Prevent form display when redirecting
  if (isRedirecting) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1>Reindirizzamento in corso...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1>Accedi al tuo Account</h1>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {successMessage && (
          <div className={styles.success}>{successMessage}</div>
        )}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="tua@email.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="La tua password"
            />
          </div>

          <button
            type="submit"
            className="button button-primary button-full"
            disabled={loading}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div className={styles.authLinks}>
          <Link href="/forgot-password">Password dimenticata?</Link>
          <span className={styles.separator}>•</span>
          <Link href="/signup">Crea un account</Link>
        </div>
      </div>
    </div>
  )
}