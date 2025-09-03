'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from '../../auth.module.scss'

export default function SignupSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [checkingSession, setCheckingSession] = useState(false)

  useEffect(() => {
    // Check if user is already confirmed and logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('User already has session, redirecting to onboarding')
        window.location.href = '/setup'
      }
    }
    checkSession()

    // Set up auth state listener for when user confirms email (same device)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in after email confirmation')
        window.location.href = '/setup'
      }
    })

    // Also set up a periodic check in case user confirmed on different device
    let checkCount = 0
    const maxChecks = 30 // Stop after 5 minutes (30 * 10 seconds)
    
    const intervalId = setInterval(() => {
      checkCount++
      console.log(`Auto-checking for email confirmation... (${checkCount}/${maxChecks})`)
      
      if (checkCount >= maxChecks) {
        console.log('Stopping auto-checks after 5 minutes')
        clearInterval(intervalId)
        return
      }
      
      // Only auto-redirect to login, don't show messages
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('Session detected! Redirecting to onboarding')
          clearInterval(intervalId)
          window.location.href = '/setup'
        } else {
          console.log('No session yet, user may need to login after confirming on another device')
        }
      })
    }, 10000) // Check every 10 seconds

    return () => {
      authListener.subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [router])

  const handleResendEmail = async () => {
    setResending(true)
    setResendMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      setResendMessage('Email di conferma inviata! Controlla la tua casella di posta.')
    } catch (error: any) {
      setResendMessage(error.message || 'Errore durante l\'invio dell\'email')
    } finally {
      setResending(false)
    }
  }

  const handleCheckConfirmation = async () => {
    setCheckingSession(true)
    setResendMessage('')
    
    try {
      // Check if the email has been confirmed by checking if user can now sign in
      console.log('Checking if email is confirmed for:', email)
      
      // First, check if we already have a session (confirmed on same device)
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      
      if (existingSession) {
        console.log('Session found, redirecting to onboarding')
        window.location.href = '/setup'
        return
      }

      // If no session, check if the user exists and is confirmed
      // We'll try to get user info which will tell us if they're confirmed
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (user) {
        // User exists and is authenticated, redirect
        console.log('User authenticated, redirecting to onboarding')
        window.location.href = '/setup'
      } else {
        // No user session means either not confirmed or needs to login
        console.log('No active session, redirecting to login')
        // User has likely confirmed on another device, redirect to login
        window.location.href = '/login?confirmed=true'
      }
    } catch (error) {
      console.error('Error checking confirmation:', error)
      // If we can't determine status, suggest user try logging in
      setResendMessage('Se hai confermato l\'email, prova ad effettuare il login.')
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } finally {
      setCheckingSession(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <Link href="/" className={styles.logo}>
          <h2>PICORTEX AI</h2>
        </Link>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            animation: 'pulse 2s infinite'
          }}>
            ✉️
          </div>
          <h1>Controlla la tua Email!</h1>
        </div>

        <div style={{ 
          backgroundColor: 'var(--success-bg, #f0f9ff)', 
          border: '1px solid var(--success-border, #0284c7)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <p style={{ marginBottom: '1rem', fontWeight: 500 }}>
            Registrazione completata con successo!
          </p>
          <p style={{ marginBottom: '1rem' }}>
            Abbiamo inviato un'email di conferma a:
          </p>
          <p style={{ 
            fontWeight: 'bold', 
            fontSize: '1.1rem',
            color: 'var(--primary-color)',
            marginBottom: '1rem'
          }}>
            {email}
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Clicca sul link nell'email per attivare il tuo account.
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={handleCheckConfirmation}
            className="button button-primary"
            disabled={checkingSession}
            style={{ width: '100%' }}
          >
            {checkingSession ? 'Verifica in corso...' : 'Ho confermato l\'email'}
          </button>

          <button
            onClick={handleResendEmail}
            className="button button-secondary"
            disabled={resending}
            style={{ width: '100%' }}
          >
            {resending ? 'Invio in corso...' : 'Invia di nuovo l\'email'}
          </button>
        </div>

        {resendMessage && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: resendMessage.includes('Errore') ? '#fee' : '#efe',
            color: resendMessage.includes('Errore') ? '#c00' : '#060',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {resendMessage}
          </div>
        )}

        <div style={{ 
          borderTop: '1px solid #e5e5e5', 
          paddingTop: '1.5rem',
          marginTop: '2rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Non hai ricevuto l'email?</h3>
          <ul style={{ 
            fontSize: '0.9rem', 
            lineHeight: '1.8',
            paddingLeft: '1.5rem',
            opacity: 0.8
          }}>
            <li>Controlla la cartella spam o posta indesiderata</li>
            <li>Assicurati che l'indirizzo email sia corretto</li>
            <li>Aggiungi noreply@picortex.ai alla tua lista contatti</li>
            <li>Attendi qualche minuto e riprova</li>
          </ul>
        </div>

        <div className={styles.links} style={{ marginTop: '2rem' }}>
          <Link href="/login">← Torna al login</Link>
          <span className={styles.separator}>•</span>
          <a href="mailto:support@picortex.ai">Contatta supporto</a>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}