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

  // Check if user is already logged in and redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasError = params.get('error')
    const hasConfirmed = params.get('confirmed')
    
    // No longer needed since onboarding is not protected
    // Loop detection was for when onboarding was protected by middleware
    
    // Check URL parameters for messages
    if (hasConfirmed === 'true') {
      setSuccessMessage('Email confermata con successo! Ora puoi effettuare il login.')
    }
    if (hasError === 'auth_callback_error') {
      setError('Errore durante la conferma dell\'email. Per favore, prova ad effettuare il login.')
    }
    if (hasError === 'callback_error') {
      setError('Si è verificato un errore. Per favore, prova ad effettuare il login.')
    }
    
    // Don't check session if we're showing an error or success message
    if (!hasError && !hasConfirmed) {
      const checkExistingSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('[Login] User already logged in, checking where to redirect...')
          
          // Check onboarding status
          const { data: customer } = await supabase
            .from('customers')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single()
          
          if (!customer || !customer.onboarding_completed) {
            console.log('[Login] Redirecting logged in user to onboarding...')
            window.location.href = '/setup'
          } else {
            console.log('[Login] Redirecting logged in user to dashboard...')
            window.location.href = '/dashboard'
          }
        }
      }
      checkExistingSession()
    }
  }, [router])

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
      console.log('Calling Supabase signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Supabase response:', { 
        hasData: !!data, 
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        error: error?.message || null,
        errorCode: error?.code || null
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
      
      // Check if user has completed onboarding
      const { data: customer } = await supabase
        .from('customers')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .single()
      
      if (!customer || !customer.onboarding_completed) {
        console.log('[Login] User needs onboarding, redirecting to setup...')
        // Add delay to ensure session cookies are properly set
        setTimeout(() => {
          window.location.href = '/setup'
        }, 1000) // Increased to 1 second
      } else {
        console.log('[Login] Onboarding completed, redirecting to dashboard...')
        // Add delay to ensure session cookies are properly set
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000) // Increased to 1 second
      }
    } catch (error: any) {
      console.error('Login error caught:', error)
      setError(error.message || 'Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <Link href="/" className={styles.logo}>
          <h2>PICORTEX AI</h2>
        </Link>
        
        <h1>Accedi al tuo Account</h1>
        <p className={styles.subtitle}>
          Bentornato! Accedi per gestire il tuo assistente WhatsApp
        </p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              required
              disabled={loading}
            />
          </div>

          {successMessage && (
            <div className={styles.success} style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0284c7',
              color: '#0c4a6e',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {successMessage}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>oppure</span>
        </div>

        <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          className={styles.googleButton}
          disabled={loading}
        >
          <span className={styles.googleIcon}>G</span>
          Accedi con Google
        </button>

        <div className={styles.links}>
          <Link href="/forgot-password">Password dimenticata?</Link>
          <span className={styles.separator}>•</span>
          <span>
            Non hai un account? <Link href="/signup">Registrati</Link>
          </span>
        </div>
      </div>
    </div>
  )
}