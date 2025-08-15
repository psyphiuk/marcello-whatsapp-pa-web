'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../setup/setup.module.scss'

export default function PaymentSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timeout)
  }, [router])

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

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Verrai reindirizzato alla dashboard tra 5 secondi...
            </p>
          </div>

          <Link href="/dashboard" className="button button-primary button-large">
            Vai alla Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}