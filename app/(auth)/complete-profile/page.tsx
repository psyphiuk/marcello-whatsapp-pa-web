'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from '../auth.module.scss'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    phoneNumber: '',
    plan: 'basic'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    // Try to restore signup data from localStorage
    const pendingSignup = localStorage.getItem('pendingSignup')
    if (pendingSignup) {
      try {
        const data = JSON.parse(pendingSignup)
        setFormData({
          companyName: data.companyName || '',
          phoneNumber: data.phoneNumber || '',
          plan: data.plan || 'basic'
        })
        console.log('Restored signup data from localStorage')
      } catch (e) {
        console.error('Error parsing pending signup data:', e)
      }
    }
  }, [])

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No user found, redirecting to login')
      // Add a small delay to prevent rapid redirects
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
      return
    }

    console.log('User found:', user.email)
    setUser(user)

    // Check if customer record already exists
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .single()

    if (customer) {
      console.log('Customer already exists, redirecting to dashboard')
      window.location.href = '/dashboard'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!user) {
      setError('Utente non trovato')
      setLoading(false)
      return
    }

    try {
      // Create customer record
      const customerData = {
        id: user.id,
        email: user.email,
        company_name: formData.companyName,
        phone_numbers: [formData.phoneNumber],
        plan: formData.plan as 'basic' | 'pro',
      }
      
      console.log('Creating customer record:', customerData)
      
      const { error: customerError } = await supabase
        .from('customers')
        .insert(customerData)

      if (customerError) {
        console.error('Customer creation error:', customerError)
        throw customerError
      }

      console.log('Customer record created successfully')
      // Clear pending signup data
      localStorage.removeItem('pendingSignup')
      window.location.href = '/setup'
    } catch (error: any) {
      console.error('Error creating customer:', error)
      setError(error.message || 'Errore durante la creazione del profilo')
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
        
        <h1>Completa il tuo Profilo</h1>
        <p className={styles.subtitle}>
          Il tuo account è stato creato ma mancano alcuni dettagli
        </p>

        {user && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0284c7',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0 }}>
              Account: <strong>{user.email}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="companyName">Nome Azienda *</label>
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
            <label htmlFor="phoneNumber">Numero WhatsApp *</label>
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
            <small>Numero che userà il servizio WhatsApp</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="plan">Piano</label>
            <select
              id="plan"
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="basic">Basic - €100/mese</option>
              <option value="pro">Professional - €200/mese</option>
            </select>
          </div>

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
            {loading ? 'Salvataggio in corso...' : 'Completa Profilo'}
          </button>
        </form>

        <div className={styles.links}>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Esci
          </button>
        </div>
      </div>
    </div>
  )
}