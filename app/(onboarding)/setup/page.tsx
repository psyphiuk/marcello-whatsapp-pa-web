'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import styles from './setup.module.scss'

interface StepProps {
  onNext: (data: any) => void
  onBack?: () => void
  data: any
}

function CompanyInfoStep({ onNext, data }: StepProps) {
  const [formData, setFormData] = useState({
    companyName: data.companyName || '',
    phoneNumber: data.phoneNumber || '',
    additionalPhones: data.additionalPhones || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(formData)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.stepForm}>
      <h2>Informazioni Aziendali</h2>
      <p>Completa le informazioni della tua azienda</p>
      
      <div className={styles.formGroup}>
        <label>Nome Azienda</label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="La tua azienda"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Numero WhatsApp Principale</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="+39 333 1234567"
          required
        />
        <small>Il numero che riceverà i messaggi dall'assistente</small>
      </div>

      <div className={styles.formGroup}>
        <label>Numeri WhatsApp Aggiuntivi (opzionale)</label>
        <textarea
          value={formData.additionalPhones}
          onChange={(e) => setFormData({ ...formData, additionalPhones: e.target.value })}
          placeholder="Un numero per riga"
          rows={3}
        />
        <small>Altri numeri autorizzati ad usare il servizio</small>
      </div>

      <button type="submit" className="button button-primary">
        Continua
      </button>
    </form>
  )
}

function GoogleConnectionStep({ onNext, onBack, data }: StepProps) {
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleConnect = async () => {
    setConnecting(true)
    setError(null)
    
    try {
      // Debug: Check if Google Client ID is set
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      console.log('[Google OAuth] Client ID present:', !!clientId)
      console.log('[Google OAuth] Client ID starts with:', clientId?.substring(0, 20))
      
      if (!clientId || clientId === 'your_google_client_id') {
        setError('Google OAuth non configurato. Contatta l\'amministratore.')
        setConnecting(false)
        return
      }
      
      // Initialize OAuth flow
      const redirectUrl = `${window.location.origin}/api/auth/google/callback`
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.modify')
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      
      console.log('[Google OAuth] Redirect URL:', redirectUrl)
      console.log('[Google OAuth] Opening auth window...')
      
      // Open OAuth flow in new window
      const authWindow = window.open(googleAuthUrl, 'google-auth', 'width=500,height=600')
      
      // Listen for OAuth callback
      const checkAuth = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkAuth)
          // Check if credentials were stored
          checkCredentials()
        }
      }, 1000)
    } catch (error: any) {
      setError('Errore durante la connessione con Google')
      setConnecting(false)
    }
  }

  const checkCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('credentials')
          .select('*')
          .eq('customer_id', user.id)
          .eq('service', 'google')
          .single()
        
        if (data) {
          setConnected(true)
          setConnecting(false)
        } else {
          setError('Credenziali non trovate. Riprova.')
          setConnecting(false)
        }
      }
    } catch (error) {
      setError('Errore nel verificare le credenziali')
      setConnecting(false)
    }
  }

  return (
    <div className={styles.stepForm}>
      <h2>Collega Google Workspace</h2>
      <p>Autorizza l'accesso ai tuoi servizi Google per abilitare l'assistente</p>
      
      <div className={styles.servicesInfo}>
        <h3>Servizi che verranno collegati:</h3>
        <ul>
          <li>📅 Google Calendar - Gestione eventi e appuntamenti</li>
          <li>👥 Google Contacts - Gestione contatti</li>
          <li>✅ Google Tasks - Gestione attività</li>
          <li>📧 Gmail - Invio e lettura email</li>
        </ul>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {connected ? (
        <div className={styles.success}>
          ✓ Account Google collegato con successo!
        </div>
      ) : (
        <button
          onClick={handleGoogleConnect}
          className={styles.googleConnectButton}
          disabled={connecting}
        >
          <span className={styles.googleIcon}>G</span>
          {connecting ? 'Connessione in corso...' : 'Collega Account Google'}
        </button>
      )}

      <div className={styles.privacy}>
        <p>
          I tuoi dati sono protetti e criptati. Non accederemo mai ai tuoi dati
          senza il tuo consenso esplicito.
        </p>
      </div>

      <div className={styles.stepActions}>
        <button onClick={onBack} className="button button-outline">
          Indietro
        </button>
        <button
          onClick={() => onNext({ googleConnected: connected })}
          className="button button-primary"
          disabled={!connected}
        >
          Continua
        </button>
      </div>
    </div>
  )
}

function PlanSelectionStep({ onNext, onBack, data }: StepProps) {
  const [selectedPlan, setSelectedPlan] = useState(data.plan || 'basic')
  const [discountCode, setDiscountCode] = useState('')
  const [pricing, setPricing] = useState({
    setupFee: 500,
    basicMonthly: 100,
    proMonthly: 200
  })

  useEffect(() => {
    // Load pricing configuration
    loadPricing()
  }, [])

  const loadPricing = async () => {
    try {
      const { data: config } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'pricing')
        .single()

      if (config?.value) {
        setPricing(config.value)
      }
    } catch (error) {
      console.error('Error loading pricing:', error)
    }
  }

  return (
    <div className={styles.stepForm}>
      <h2>Scegli il tuo Piano</h2>
      <p>Seleziona il piano più adatto alle tue esigenze</p>
      
      <div className={styles.planCards}>
        <div
          className={`${styles.planCard} ${selectedPlan === 'basic' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('basic')}
        >
          <h3>Basic</h3>
          <div className={styles.price}>
            <span className={styles.amount}>€{pricing.basicMonthly}</span>
            <span className={styles.period}>/mese</span>
          </div>
          <ul>
            <li>✓ Fino a 20 messaggi al giorno</li>
            <li>✓ Calendario e Contatti</li>
            <li>✓ Attività (Tasks)</li>
            <li>✓ Messaggi vocali</li>
            <li>✓ Supporto email</li>
          </ul>
        </div>

        <div
          className={`${styles.planCard} ${selectedPlan === 'pro' ? styles.selected : ''}`}
          onClick={() => setSelectedPlan('pro')}
        >
          <div className={styles.badge}>Consigliato</div>
          <h3>Professional</h3>
          <div className={styles.price}>
            <span className={styles.amount}>€{pricing.proMonthly}</span>
            <span className={styles.period}>/mese</span>
          </div>
          <ul>
            <li>✓ Messaggi illimitati</li>
            <li>✓ Tutte le funzionalità Basic</li>
            <li>✓ Integrazione Email (Gmail)</li>
            <li>✓ Risposte audio (TTS)</li>
            <li>✓ Supporto prioritario</li>
            <li>✓ Backup automatici</li>
          </ul>
        </div>
      </div>

      <div className={styles.setupFee}>
        Nota: È prevista una configurazione iniziale di €{pricing.setupFee} (una tantum)
      </div>

      <div className={styles.discountSection}>
        <label>Hai un codice sconto?</label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Inserisci il codice"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            marginTop: '0.5rem'
          }}
        />
      </div>

      <div className={styles.stepActions}>
        <button onClick={onBack} className="button button-outline">
          Indietro
        </button>
        <button
          onClick={() => onNext({ plan: selectedPlan, discountCode, pricing })}
          className="button button-primary"
        >
          Continua
        </button>
      </div>
    </div>
  )
}

function ReviewStep({ onNext, onBack, data }: StepProps) {
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    setProcessing(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Update customer record first
      const phoneNumbers = [data.phoneNumber]
      if (data.additionalPhones) {
        phoneNumbers.push(...data.additionalPhones.split('\n').filter(Boolean))
      }

      await supabase
        .from('customers')
        .update({
          company_name: data.companyName,
          phone_numbers: phoneNumbers,
          plan: data.plan,
        })
        .eq('id', user.id)

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: user.id,
          plan: data.plan,
          discountCode: data.discountCode || '',
          email: user.email,
          companyName: data.companyName
        })
      })

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      console.error('Error processing payment:', error)
      alert('Errore durante il processo di pagamento: ' + error.message)
      setProcessing(false)
    }
  }

  return (
    <div className={styles.stepForm}>
      <h2>Riepilogo Configurazione</h2>
      <p>Controlla che tutto sia corretto prima di completare</p>
      
      <div className={styles.reviewSection}>
        <h3>Informazioni Azienda</h3>
        <dl>
          <dt>Nome Azienda:</dt>
          <dd>{data.companyName}</dd>
          <dt>Numero WhatsApp:</dt>
          <dd>{data.phoneNumber}</dd>
          {data.additionalPhones && (
            <>
              <dt>Numeri Aggiuntivi:</dt>
              <dd>{data.additionalPhones.split('\n').join(', ')}</dd>
            </>
          )}
        </dl>
      </div>

      <div className={styles.reviewSection}>
        <h3>Integrazioni</h3>
        <dl>
          <dt>Google Workspace:</dt>
          <dd>{data.googleConnected ? '✓ Collegato' : '✗ Non collegato'}</dd>
        </dl>
      </div>

      <div className={styles.reviewSection}>
        <h3>Piano Selezionato</h3>
        <dl>
          <dt>Piano:</dt>
          <dd>{data.plan === 'pro' ? 'Professional' : 'Basic'}</dd>
          <dt>Configurazione Iniziale:</dt>
          <dd>€{data.pricing?.setupFee || 500} (una tantum)</dd>
          <dt>Costo Mensile:</dt>
          <dd>€{data.plan === 'pro' ? (data.pricing?.proMonthly || 200) : (data.pricing?.basicMonthly || 100)}/mese</dd>
          {data.discountCode && (
            <>
              <dt>Codice Sconto:</dt>
              <dd>{data.discountCode}</dd>
            </>
          )}
        </dl>
      </div>

      <div className={styles.testSection}>
        <h3>Prossimi Passi</h3>
        <ol>
          <li>Salva il numero dell'assistente nei tuoi contatti WhatsApp</li>
          <li>Invia un messaggio di prova: "Ciao"</li>
          <li>L'assistente ti guiderà nell'utilizzo</li>
        </ol>
      </div>

      <div className={styles.stepActions}>
        <button onClick={onBack} className="button button-outline">
          Indietro
        </button>
        <button
          onClick={handlePayment}
          className="button button-primary"
          disabled={processing}
        >
          {processing ? 'Elaborazione...' : 'Procedi al Pagamento'}
        </button>
      </div>
    </div>
  )
}

export default function OnboardingSetup() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState({})
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/login')
        return
      }

      // Load existing customer data
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (customer) {
        console.log('Loading existing customer data:', customer)
        setSetupData({
          companyName: customer.company_name || '',
          phoneNumber: customer.phone_numbers?.[0] || '',
          additionalPhones: customer.phone_numbers?.slice(1).join(', ') || '',
          plan: customer.plan || 'basic'
        })
      } else if (error?.code === 'PGRST116') {
        // No customer record exists, that's ok - we'll create it when they complete step 1
        console.log('No customer record yet, will create during onboarding')
        // Try to load from localStorage if available (from signup)
        const pendingSignup = localStorage.getItem('pendingSignup')
        if (pendingSignup) {
          try {
            const data = JSON.parse(pendingSignup)
            setSetupData({
              companyName: data.companyName || '',
              phoneNumber: data.phoneNumber || '',
              plan: data.plan || 'basic'
            })
            console.log('Restored signup data from localStorage')
          } catch (e) {
            console.error('Error parsing pending signup data:', e)
          }
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { title: 'Informazioni', component: CompanyInfoStep },
    { title: 'Google', component: GoogleConnectionStep },
    { title: 'Piano', component: PlanSelectionStep },
    { title: 'Riepilogo', component: ReviewStep },
  ]

  const handleNext = async (stepData: any) => {
    const updatedData = { ...setupData, ...stepData }
    setSetupData(updatedData)
    
    // After first step (CompanyInfoStep), create customer record if it doesn't exist
    if (currentStep === 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Check if customer exists
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('id', user.id)
            .single()
          
          if (!existingCustomer) {
            console.log('Creating customer record...')
            const { error } = await supabase
              .from('customers')
              .insert({
                id: user.id,
                email: user.email,
                company_name: updatedData.companyName,
                phone_numbers: [updatedData.phoneNumber, ...(updatedData.additionalPhones ? updatedData.additionalPhones.split(',').map((p: string) => p.trim()).filter(Boolean) : [])],
                plan: updatedData.plan || 'basic'
              })
            
            if (error) {
              console.error('Error creating customer:', error)
            } else {
              console.log('Customer record created')
              // Clear localStorage after successful creation
              localStorage.removeItem('pendingSignup')
            }
          }
        }
      } catch (error) {
        console.error('Error in handleNext:', error)
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const CurrentStepComponent = steps[currentStep].component

  if (loading) {
    return (
      <div className={styles.onboardingContainer}>
        <div className={styles.onboardingCard}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Caricamento dati...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingCard}>
        <div className={styles.header}>
          <h1>Configurazione PICORTEX AI</h1>
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className={styles.steps}>
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`${styles.step} ${
                    index === currentStep ? styles.active : ''
                  } ${index < currentStep ? styles.completed : ''}`}
                >
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <CurrentStepComponent
            onNext={handleNext}
            onBack={currentStep > 0 ? handleBack : undefined}
            data={setupData}
          />
        </div>
      </div>
    </div>
  )
}