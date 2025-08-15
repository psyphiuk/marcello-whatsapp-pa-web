'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { validatePassword, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/security/password'
import styles from '../auth.module.scss'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'basic'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, errors: [] as string[] })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Validate password strength on change
    if (name === 'password') {
      const validation = validatePassword(value)
      setPasswordStrength({
        score: validation.score,
        errors: validation.errors
      })
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('. '))
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Le password non corrispondono')
      setLoading(false)
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName,
            phone_number: formData.phoneNumber,
            plan: plan,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create customer record
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            company_name: formData.companyName,
            phone_numbers: [formData.phoneNumber],
            plan: plan as 'basic' | 'pro',
          })

        if (customerError) throw customerError

        router.push('/onboarding/setup')
      }
    } catch (error: any) {
      setError(error.message || 'Errore durante la registrazione')
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
        
        <h1>Crea il tuo Account</h1>
        <p className={styles.subtitle}>
          Inizia a risparmiare tempo con il tuo assistente WhatsApp personale
        </p>

        {plan && (
          <div className={styles.planInfo}>
            Piano selezionato: <strong>{plan === 'pro' ? 'Professional' : 'Basic'}</strong>
            <Link href="/#pricing">Cambia piano</Link>
          </div>
        )}

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="companyName">Nome Azienda</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="La tua azienda"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Numero WhatsApp</label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+39 333 1234567"
              required
              disabled={loading}
            />
            <small>Numero che userà il servizio</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nome@azienda.it"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Almeno 12 caratteri"
              minLength={12}
              required
              disabled={loading}
            />
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      height: '100%',
                      backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: getPasswordStrengthColor(passwordStrength.score)
                  }}>
                    {getPasswordStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <ul style={{
                    fontSize: '0.75rem',
                    color: 'var(--error-color)',
                    margin: '0.25rem 0',
                    paddingLeft: '1rem'
                  }}>
                    {passwordStrength.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Ripeti la password"
              minLength={12}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.terms}>
            <label>
              <input type="checkbox" required disabled={loading} />
              Accetto i <Link href="/terms">Termini di Servizio</Link> e la{' '}
              <Link href="/privacy">Privacy Policy</Link>
            </label>
          </div>

          <button
            type="submit"
            className="button button-primary"
            disabled={loading}
          >
            {loading ? 'Registrazione in corso...' : 'Crea Account'}
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
          Registrati con Google
        </button>

        <div className={styles.links}>
          <span>
            Hai già un account? <Link href="/login">Accedi</Link>
          </span>
        </div>
      </div>
    </div>
  )
}