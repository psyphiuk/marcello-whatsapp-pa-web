'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from '../auth.module.scss'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Ti abbiamo inviato un\'email con le istruzioni per reimpostare la password.'
      })
      setEmail('')
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Errore durante l\'invio dell\'email'
      })
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
        
        <h1>Password Dimenticata?</h1>
        <p className={styles.subtitle}>
          Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password
        </p>

        <form onSubmit={handleResetPassword} className={styles.form}>
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

          {message && (
            <div className={message.type === 'success' ? styles.success : styles.error}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Invio in corso...' : 'Invia Link di Reset'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/login">← Torna al Login</Link>
          <span className={styles.separator}>•</span>
          <span>
            Non hai un account? <Link href="/signup">Registrati</Link>
          </span>
        </div>
      </div>
    </div>
  )
}