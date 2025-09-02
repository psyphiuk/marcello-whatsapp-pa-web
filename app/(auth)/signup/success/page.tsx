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
        router.push('/onboarding/setup')
      }
    }
    checkSession()

    // Set up auth state listener for when user confirms email
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in after email confirmation')
        router.push('/onboarding/setup')
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
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
    
    try {
      // Try to refresh the session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        console.log('Session found, redirecting to onboarding')
        router.push('/onboarding/setup')
      } else {
        setResendMessage('Email non ancora confermata. Controlla la tua casella di posta.')
        setTimeout(() => setResendMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error checking session:', error)
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