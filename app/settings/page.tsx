'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from './settings.module.scss'

interface CustomerData {
  id: string
  company_name: string
  phone_numbers: string[]
  plan: string
  settings: any
  stripe_customer_id?: string
  subscription_status?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [companyName, setCompanyName] = useState('')
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([''])
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (customerError) {
        console.error('Error loading customer:', customerError)
        router.push('/dashboard')
        return
      }

      if (customerData) {
        setCustomer(customerData)
        setCompanyName(customerData.company_name || '')
        setPhoneNumbers(customerData.phone_numbers || [''])
        setWhatsappNumber(customerData.settings?.whatsapp_assistant_number || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Non autenticato')
      }

      // Filter out empty phone numbers
      const validPhoneNumbers = phoneNumbers.filter(p => p.trim())

      // Update customer record
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          company_name: companyName,
          phone_numbers: validPhoneNumbers,
          settings: {
            ...customer?.settings,
            whatsapp_assistant_number: whatsappNumber
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)

      // Reload settings
      await loadSettings()
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError(error.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ''])
  }

  const handleRemovePhone = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index))
  }

  const handlePhoneChange = (index: number, value: string) => {
    const updated = [...phoneNumbers]
    updated[index] = value
    setPhoneNumbers(updated)
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Sei sicuro di voler cancellare il tuo abbonamento?')) {
      return
    }

    try {
      // Here you would call your Stripe cancellation endpoint
      alert('Funzionalità in arrivo. Contatta support@picortex.ai per cancellare.')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento impostazioni...</p>
      </div>
    )
  }

  return (
    <div className={styles.settingsContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <h2>PICORTEX AI</h2>
          <div className={styles.navActions}>
            <Link href="/dashboard" className={styles.navLink}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className={styles.settings}>
        <div className={styles.header}>
          <h1>Impostazioni</h1>
          <p>Gestisci il tuo account e le preferenze</p>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {success && (
          <div className={styles.success}>Impostazioni salvate con successo!</div>
        )}

        <div className={styles.section}>
          <h2>Informazioni Azienda</h2>
          <div className={styles.formGroup}>
            <label htmlFor="companyName">Nome Azienda</label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Il nome della tua azienda"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>Numero Assistente WhatsApp</h2>
          <div className={styles.formGroup}>
            <label htmlFor="whatsappNumber">Numero WhatsApp del tuo Assistente</label>
            <input
              id="whatsappNumber"
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+39 XXX XXX XXXX"
            />
            <small>Questo è il numero che i tuoi clienti dovranno salvare per utilizzare l'assistente</small>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Numeri Autorizzati</h2>
          <p className={styles.sectionDescription}>
            Solo questi numeri possono inviare messaggi all'assistente
          </p>
          {phoneNumbers.map((phone, index) => (
            <div key={index} className={styles.phoneRow}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(index, e.target.value)}
                placeholder="+39 XXX XXX XXXX"
              />
              {phoneNumbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePhone(index)}
                  className={styles.removeButton}
                >
                  Rimuovi
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPhone}
            className={styles.addButton}
          >
            + Aggiungi numero
          </button>
        </div>

        <div className={styles.section}>
          <h2>Piano e Fatturazione</h2>
          <div className={styles.planInfo}>
            <div className={styles.planDetail}>
              <span>Piano attuale:</span>
              <strong>{customer?.plan === 'pro' ? 'Professional' : 'Basic'}</strong>
            </div>
            <div className={styles.planDetail}>
              <span>Stato:</span>
              <strong className={customer?.subscription_status === 'active' ? styles.active : styles.inactive}>
                {customer?.subscription_status === 'active' ? 'Attivo' : 'Non attivo'}
              </strong>
            </div>
            <div className={styles.planDetail}>
              <span>Prezzo:</span>
              <strong>{customer?.plan === 'pro' ? '€99/mese' : '€49/mese'}</strong>
            </div>
          </div>
          {customer?.plan === 'basic' && (
            <Link href="/setup" className={styles.upgradeButton}>
              Passa a Professional →
            </Link>
          )}
          {customer?.subscription_status === 'active' && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              className={styles.cancelButton}
            >
              Cancella abbonamento
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
          <Link href="/dashboard" className={styles.cancelLink}>
            Annulla
          </Link>
        </div>

        <div className={styles.dangerZone}>
          <h2>Zona Pericolosa</h2>
          <p>Azioni irreversibili per il tuo account</p>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => alert('Contatta support@picortex.ai per eliminare il tuo account')}
          >
            Elimina account
          </button>
        </div>
      </div>
    </div>
  )
}