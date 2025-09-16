import Link from 'next/link'
import styles from './page.module.scss'

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.nav}>
        <div className="container">
          <div className={styles.navContent}>
            <div className={styles.logo}>
              <h2>PICORTEX AI</h2>
            </div>
            <div className={styles.navLinks}>
              <Link href="#features">Funzionalità</Link>
              <Link href="#pricing">Prezzi</Link>
              <Link href="/login" className="button button-outline">Accedi</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1>Il tuo Assistente Personale su WhatsApp</h1>
            <p className={styles.heroSubtitle}>
              Gestisci calendario, contatti, email e attività di Google Workspace 
              direttamente da WhatsApp. Parla o scrivi in italiano, 
              il tuo assistente AI capisce tutto.
            </p>
            <div className={styles.heroCta}>
              <Link href="/signup" className="button button-primary button-large">
                Inizia Ora
              </Link>
              <Link href="#demo" className="button button-outline button-large">
                Guarda la Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Cosa puoi fare</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📅</div>
              <h3>Gestione Calendario</h3>
              <p>
                "Crea una riunione domani alle 15 con Marco" - 
                Il tuo assistente crea eventi, controlla disponibilità 
                e gestisce inviti automaticamente.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>👥</div>
              <h3>Contatti Intelligenti</h3>
              <p>
                "Aggiungi il numero di Giovanni" - 
                Salva e aggiorna contatti in Google Contacts 
                con un semplice messaggio.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✅</div>
              <h3>Gestione Attività</h3>
              <p>
                "Ricordami di chiamare il commercialista" - 
                Crea, modifica e completa attività in Google Tasks 
                senza aprire altre app.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📧</div>
              <h3>Email Rapide</h3>
              <p>
                "Invia una mail a Laura per confermare l'appuntamento" - 
                Componi e invia email direttamente da WhatsApp.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🎙️</div>
              <h3>Messaggi Vocali</h3>
              <p>
                Non hai tempo di scrivere? Invia un messaggio vocale 
                e ricevi risposte testuali o audio.
              </p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🇮🇹</div>
              <h3>100% Italiano</h3>
              <p>
                Progettato per professionisti italiani. 
                Comprende il contesto e le espressioni locali.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Come Funziona</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Registrati</h3>
              <p>Crea il tuo account in meno di un minuto</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Collega Google</h3>
              <p>Autorizza l'accesso sicuro ai tuoi servizi Google</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Aggiungi su WhatsApp</h3>
              <p>Salva il numero del tuo assistente personale</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h3>Inizia a Usare</h3>
              <p>Scrivi o parla, il tuo assistente è pronto!</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.pricing}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Scegli il tuo Piano</h2>
          <div className={styles.pricingCards}>
            <div className={styles.pricingCard}>
              <h3>Basic</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>€100</span>
                <span className={styles.pricePeriod}>/mese</span>
              </div>
              <ul className={styles.features}>
                <li>✓ Fino a 20 messaggi al giorno</li>
                <li>✓ Calendario e Contatti</li>
                <li>✓ Attività (Tasks)</li>
                <li>✓ Messaggi vocali</li>
                <li>✓ Supporto email</li>
              </ul>
              <Link href="/signup?plan=basic" className="button button-outline">
                Scegli Basic
              </Link>
            </div>
            <div className={`${styles.pricingCard} ${styles.featured}`}>
              <div className={styles.badge}>Più Popolare</div>
              <h3>Professional</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>€200</span>
                <span className={styles.pricePeriod}>/mese</span>
              </div>
              <ul className={styles.features}>
                <li>✓ Messaggi illimitati</li>
                <li>✓ Tutte le funzionalità Basic</li>
                <li>✓ Integrazione Email (Gmail)</li>
                <li>✓ Risposte audio (TTS)</li>
                <li>✓ Supporto prioritario</li>
                <li>✓ Backup automatici</li>
              </ul>
              <Link href="/signup?plan=pro" className="button button-primary">
                Scegli Professional
              </Link>
            </div>
          </div>
          <p className={styles.setupFee}>
            * Configurazione iniziale: €500 (una tantum)
          </p>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Pronto a Risparmiare Tempo?</h2>
            <p>
              Unisciti a centinaia di professionisti che hanno già 
              automatizzato le loro attività quotidiane
            </p>
            <Link href="/signup" className="button button-secondary button-large">
              Attiva il Servizio
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerColumn}>
              <h4>PICORTEX AI</h4>
              <p>Il tuo assistente personale su WhatsApp per Google Workspace</p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Prodotto</h4>
              <Link href="#features">Funzionalità</Link>
              <Link href="#pricing">Prezzi</Link>
              <Link href="/docs">Documentazione</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Azienda</h4>
              <Link href="/about">Chi Siamo</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Termini di Servizio</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Supporto</h4>
              <Link href="/contact">Contattaci</Link>
              <Link href="/faq">FAQ</Link>
              <a href="mailto:support@picortex.ai">support@picortex.ai</a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; 2025 PICORTEX AI. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}