'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import styles from './dashboard.module.scss'

interface CustomerData {
  id: string
  company_name: string
  phone_numbers: string[]
  plan: string
  created_at: string
  settings: any
}

interface UsageData {
  message_count: number
  tokens_used: number
  date: string
}

export default function Dashboard() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerData | null>(null)
  const [usage, setUsage] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testMessageStatus, setTestMessageStatus] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...')
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        window.location.href = '/login'
        return
      }
      
      if (!user) {
        console.log('No user found, redirecting to login')
        window.location.href = '/login'
        return
      }

      console.log('User found:', user.id, user.email)

      // Load customer data
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (customerError) {
        console.error('Error loading customer data:', customerError)
        // If customer doesn't exist, redirect to complete profile
        if (customerError.code === 'PGRST116') {
          console.log('No customer record found, redirecting to complete profile')
          window.location.href = '/setup'
          return
        }
      }

      if (customerData) {
        console.log('Customer data loaded:', customerData)
        setCustomer(customerData)
        
        // Check if onboarding is completed
        if (!customerData.onboarding_completed) {
          console.log('Onboarding not completed, redirecting to setup')
          window.location.href = '/setup'
          return
        }
      } else {
        console.log('No customer data found, redirecting to complete profile')
        window.location.href = '/setup'
        return
      }

      // Check Google credentials
      const { data: credentials } = await supabase
        .from('credentials')
        .select('*')
        .eq('customer_id', user.id)
        .eq('service', 'google')
        .single()

      setGoogleConnected(!!credentials)

      // Load usage data
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const { data: usageData } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('customer_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (usageData) {
        setUsage(usageData)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const sendTestMessage = async () => {
    if (!customer?.phone_numbers?.[0]) {
      setTestMessageStatus('Nessun numero autorizzato configurato')
      return
    }

    setSendingTest(true)
    setTestMessageStatus(null)

    try {
      const response = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: customer.phone_numbers[0]
        })
      })

      const data = await response.json()

      if (response.ok) {
        setTestMessageStatus('✅ Messaggio di test inviato! Controlla WhatsApp.')
      } else {
        setTestMessageStatus(`❌ Errore: ${data.error || 'Impossibile inviare il messaggio'}`)
      }
    } catch (error) {
      console.error('Error sending test message:', error)
      setTestMessageStatus('❌ Errore di connessione')
    } finally {
      setSendingTest(false)
    }
  }

  const getTotalMessages = () => {
    return usage.reduce((sum, day) => sum + day.message_count, 0)
  }

  const getTodayMessages = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayUsage = usage.find(u => u.date === today)
    return todayUsage?.message_count || 0
  }

  const getMessageLimit = () => {
    return customer?.plan === 'pro' ? 'Illimitati' : '20/giorno'
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <h2>PICORTEX AI</h2>
          <div className={styles.navActions}>
            <Link href="/settings" className={styles.navLink}>
              Impostazioni
            </Link>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Esci
            </button>
          </div>
        </div>
      </nav>

      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1>Benvenuto, {customer?.company_name}</h1>
          <p>Il tuo assistente WhatsApp è {googleConnected ? 'attivo' : 'non configurato'}</p>
        </div>

        <div className={styles.statusCards}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Stato Servizio</h3>
              <span className={`${styles.status} ${googleConnected ? styles.active : styles.inactive}`}>
                {googleConnected ? 'Attivo' : 'Non Attivo'}
              </span>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statusItem}>
                <span>WhatsApp:</span>
                <span className={styles.statusValue}>✓ Connesso</span>
              </div>
              <div className={styles.statusItem}>
                <span>Google Workspace:</span>
                <span className={styles.statusValue}>
                  {googleConnected ? '✓ Connesso' : '✗ Non connesso'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span>Piano:</span>
                <span className={styles.statusValue}>
                  {customer?.plan === 'pro' ? 'Professional' : 'Basic'}
                </span>
              </div>
            </div>
            {!googleConnected && (
              <Link href="/setup" className={styles.setupLink}>
                Completa la configurazione →
              </Link>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Utilizzo Oggi</h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.usageMetric}>
                <span className={styles.metricValue}>{getTodayMessages()}</span>
                <span className={styles.metricLabel}>Messaggi</span>
              </div>
              <div className={styles.usageBar}>
                <div
                  className={styles.usageProgress}
                  style={{
                    width: customer?.plan === 'basic'
                      ? `${Math.min((getTodayMessages() / 20) * 100, 100)}%`
                      : '0%'
                  }}
                />
              </div>
              <p className={styles.limitText}>
                Limite: {getMessageLimit()}
              </p>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Ultimi 30 Giorni</h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.usageMetric}>
                <span className={styles.metricValue}>{getTotalMessages()}</span>
                <span className={styles.metricLabel}>Messaggi Totali</span>
              </div>
              <div className={styles.trend}>
                {usage.length > 0 && (
                  <span>Media giornaliera: {Math.round(getTotalMessages() / 30)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.quickActions}>
          <h2>Come Configurare WhatsApp</h2>
          <div className={styles.setupSteps} style={{background: 'rgba(0, 255, 136, 0.05)', padding: '1.5rem', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem', border: '1px solid rgba(0, 255, 136, 0.2)'}}>
            <p style={{marginBottom: '1rem', color: 'var(--text-primary)'}}>
              <strong>📋 Flusso dei Messaggi:</strong>
            </p>
            <ol style={{marginLeft: '1.5rem', lineHeight: '1.8', color: 'var(--text-secondary)'}}>
              <li>Tu invii un messaggio dal tuo numero autorizzato al numero del bot</li>
              <li>Il bot elabora la richiesta con l'IA</li>
              <li>Il bot ti risponde automaticamente sullo stesso numero</li>
              <li>Solo i numeri autorizzati nelle impostazioni possono interagire con il bot</li>
            </ol>
          </div>
          <div className={styles.actionCards}>
            <div className={styles.actionCard}>
              <h3>📱 Numero Bot WhatsApp</h3>
              <p>Salva questo numero nei tuoi contatti:</p>
              <div className={styles.phoneNumber}>
                {customer?.settings?.whatsapp_assistant_number || 'Non configurato'}
              </div>
              <small>Il bot invierà messaggi da questo numero</small>
              {!customer?.settings?.whatsapp_assistant_number && (
                <Link href="/settings" className={styles.configureLink}>
                  Configura numero bot →
                </Link>
              )}
            </div>

            <div className={styles.actionCard}>
              <h3>💬 Test del Servizio</h3>
              <p>Ricevi un messaggio di benvenuto:</p>
              <button
                onClick={sendTestMessage}
                disabled={sendingTest || !customer?.phone_numbers?.[0]}
                className={styles.testButton}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: sendingTest ? '#ccc' : 'var(--secondary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: sendingTest ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  marginTop: '1rem',
                  width: '100%'
                }}
              >
                {sendingTest ? 'Invio in corso...' : 'Invia messaggio di test'}
              </button>
              {testMessageStatus && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  background: testMessageStatus.includes('✅') ? '#d4edda' : '#f8d7da',
                  color: testMessageStatus.includes('✅') ? '#155724' : '#721c24',
                  textAlign: 'center'
                }}>
                  {testMessageStatus}
                </div>
              )}
              <small>Il bot invierà un messaggio al tuo numero principale</small>
            </div>

            <div className={styles.actionCard}>
              <h3>📖 Guida Rapida</h3>
              <p>Esempi di comandi utili:</p>
              <ul>
                <li>"Crea un evento domani alle 15"</li>
                <li>"Aggiungi Marco ai contatti"</li>
                <li>"Ricordami di chiamare il cliente"</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.phoneNumbers}>
          <h2>I Tuoi Numeri Autorizzati</h2>
          <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem'}}>
            Solo questi numeri possono inviare messaggi al bot e ricevere risposte:
          </p>
          <div className={styles.phoneList}>
            {customer?.phone_numbers.map((phone, index) => (
              <div key={index} className={styles.phoneItem}>
                <span>{phone}</span>
                {index === 0 && <span className={styles.primaryBadge}>Principale</span>}
              </div>
            ))}
          </div>
          <Link href="/settings" className={styles.manageLink}>
            Gestisci i tuoi numeri →
          </Link>
        </div>

        <div className={styles.support}>
          <h2>Hai bisogno di aiuto?</h2>
          <div className={styles.supportOptions}>
            <a href="mailto:support@picortex.ai" className={styles.supportLink}>
              📧 support@picortex.ai
            </a>
            <Link href="/docs" className={styles.supportLink}>
              📚 Documentazione
            </Link>
            <Link href="/faq" className={styles.supportLink}>
              ❓ FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}