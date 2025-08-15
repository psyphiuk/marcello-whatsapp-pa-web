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
      // Initialize OAuth flow
      const redirectUrl = `${window.location.origin}/api/auth/google/callback`
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/gmail.modify')
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
      
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
            <span className={styles.amount}>€100</span>
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
            <span className={styles.amount}>€200</span>
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
        Nota: È prevista una configurazione iniziale di €500 (una tantum)
      </div>

      <div className={styles.stepActions}>
        <button onClick={onBack} className="button button-outline">
          Indietro
        </button>
        <button
          onClick={() => onNext({ plan: selectedPlan })}
          className="button button-primary"
        >
          Continua
        </button>
      </div>
    </div>
  )
}

function ReviewStep({ onNext, onBack, data }: StepProps) {
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleComplete = async () => {
    setSaving(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Update customer record
        const phoneNumbers = [data.phoneNumber]
        if (data.additionalPhones) {
          phoneNumbers.push(...data.additionalPhones.split('\n').filter(Boolean))
        }

        const { error } = await supabase
          .from('customers')
          .update({
            company_name: data.companyName,
            phone_numbers: phoneNumbers,
            plan: data.plan,
            settings: {
              onboarding_completed: true,
              onboarding_date: new Date().toISOString(),
            }
          })
          .eq('id', user.id)

        if (error) throw error

        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Error saving setup:', error)
      setSaving(false)
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
          <dt>Costo Mensile:</dt>
          <dd>€{data.plan === 'pro' ? '200' : '100'}/mese</dd>
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
          onClick={handleComplete}
          className="button button-primary"
          disabled={saving}
        >
          {saving ? 'Completamento...' : 'Completa Configurazione'}
        </button>
      </div>
    </div>
  )
}

export default function OnboardingSetup() {
  const [currentStep, setCurrentStep] = useState(0)
  const [setupData, setSetupData] = useState({})

  const steps = [
    { title: 'Informazioni', component: CompanyInfoStep },
    { title: 'Google', component: GoogleConnectionStep },
    { title: 'Piano', component: PlanSelectionStep },
    { title: 'Riepilogo', component: ReviewStep },
  ]

  const handleNext = (stepData: any) => {
    setSetupData({ ...setupData, ...stepData })
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