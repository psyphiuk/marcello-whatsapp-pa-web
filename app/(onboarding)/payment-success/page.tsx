'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from '../setup/setup.module.scss'

export default function PaymentSuccess() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')

  useEffect(() => {
    checkPaymentAndSession()
  }, [])

  async function checkPaymentAndSession() {
    try {
      // First check payment status from URL
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')

      if (sessionId) {
        // Verify payment with backend
        const response = await fetch(`/api/check-payment?session_id=${sessionId}`)
        const data = await response.json()

        if (data.success && data.customer) {
          setCustomerEmail(data.customer.email)
        }
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setHasSession(true)
        // User is authenticated, redirect to dashboard after 5 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 5000)
      } else {
        // No session, user needs to login first
        setHasSession(false)
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingCard}>
        <div className={styles.content} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
            Pagamento Completato!
          </h1>
          
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Il tuo account è stato configurato con successo.
            L'assistente WhatsApp è ora attivo e pronto all'uso.
          </p>

          <div style={{
            backgroundColor: 'var(--background-light)',
            padding: '2rem',
            borderRadius: 'var(--border-radius)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>📱 Numero WhatsApp dell'Assistente</h3>
            <div style={{
              fontSize: '1.25rem',
              fontFamily: 'monospace',
              color: 'var(--primary-color)',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              +39 XXX XXX XXXX
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Salva questo numero nei tuoi contatti e invia "Ciao" per iniziare
            </p>
          </div>

          {isChecking ? (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Verifica in corso...
              </p>
            </div>
          ) : hasSession ? (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Verrai reindirizzato alla dashboard tra 5 secondi...
                </p>
              </div>
              <Link href="/dashboard" className="button button-primary button-large">
                Vai alla Dashboard
              </Link>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Il pagamento è stato completato con successo!
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Per accedere alla dashboard, effettua il login con le credenziali
                  che hai usato durante la registrazione
                  {customerEmail && (
                    <span style={{ fontWeight: 500 }}> ({customerEmail})</span>
                  )}.
                </p>
              </div>
              <Link href="/login" className="button button-primary button-large">
                Accedi alla Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}