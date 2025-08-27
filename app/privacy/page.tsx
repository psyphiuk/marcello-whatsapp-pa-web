import Link from 'next/link'
import styles from './privacy.module.scss'

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>
        
        <h1>Informativa sulla Privacy</h1>
        <p className={styles.lastUpdated}>Ultimo aggiornamento: 27 Dicembre 2024</p>

        <section>
          <h2>1. Introduzione</h2>
          <p>
            PICORTEX AI ("noi", "nostro") rispetta la tua privacy e si impegna a proteggere 
            i tuoi dati personali. Questa informativa sulla privacy ti informerà su come 
            trattiamo i tuoi dati personali quando utilizzi il nostro servizio.
          </p>
        </section>

        <section>
          <h2>2. Dati che Raccogliamo</h2>
          <p>Possiamo raccogliere e trattare i seguenti tipi di dati:</p>
          <ul>
            <li><strong>Dati di registrazione:</strong> Nome, email, nome azienda, numero di telefono</li>
            <li><strong>Dati di pagamento:</strong> Elaborati da Stripe (non conserviamo i dettagli della carta)</li>
            <li><strong>Dati di utilizzo:</strong> Metriche sull'uso del servizio, messaggi WhatsApp elaborati</li>
            <li><strong>Dati tecnici:</strong> Indirizzo IP, tipo di browser, fuso orario</li>
          </ul>
        </section>

        <section>
          <h2>3. Come Utilizziamo i Tuoi Dati</h2>
          <p>Utilizziamo i tuoi dati per:</p>
          <ul>
            <li>Fornire e mantenere il nostro servizio</li>
            <li>Gestire il tuo account e l'abbonamento</li>
            <li>Processare i pagamenti</li>
            <li>Fornire assistenza clienti</li>
            <li>Migliorare il nostro servizio</li>
            <li>Inviarti comunicazioni importanti sul servizio</li>
            <li>Rispettare obblighi legali</li>
          </ul>
        </section>

        <section>
          <h2>4. Base Legale per il Trattamento</h2>
          <p>
            Trattiamo i tuoi dati personali sulla base di:
          </p>
          <ul>
            <li><strong>Contratto:</strong> Per fornire i servizi richiesti</li>
            <li><strong>Consenso:</strong> Quando hai dato il consenso esplicito</li>
            <li><strong>Interesse legittimo:</strong> Per migliorare i nostri servizi</li>
            <li><strong>Obbligo legale:</strong> Per conformarci alle leggi applicabili</li>
          </ul>
        </section>

        <section>
          <h2>5. Condivisione dei Dati</h2>
          <p>
            Possiamo condividere i tuoi dati con:
          </p>
          <ul>
            <li><strong>Fornitori di servizi:</strong> Stripe per i pagamenti, Supabase per l'hosting</li>
            <li><strong>WhatsApp/Meta:</strong> Per l'integrazione del servizio WhatsApp Business</li>
            <li><strong>Autorità legali:</strong> Se richiesto dalla legge</li>
          </ul>
          <p>
            Non vendiamo mai i tuoi dati personali a terzi.
          </p>
        </section>

        <section>
          <h2>6. Sicurezza dei Dati</h2>
          <p>
            Implementiamo misure di sicurezza tecniche e organizzative appropriate per 
            proteggere i tuoi dati personali, tra cui:
          </p>
          <ul>
            <li>Crittografia dei dati in transito e a riposo</li>
            <li>Accesso limitato ai dati personali</li>
            <li>Monitoraggio regolare della sicurezza</li>
            <li>Autenticazione a due fattori disponibile</li>
          </ul>
        </section>

        <section>
          <h2>7. Conservazione dei Dati</h2>
          <p>
            Conserviamo i tuoi dati personali solo per il tempo necessario agli scopi 
            descritti in questa informativa. I dati dell'account vengono conservati finché 
            il tuo account è attivo. Dopo la cancellazione dell'account, alcuni dati possono 
            essere conservati per obblighi legali o contabili.
          </p>
        </section>

        <section>
          <h2>8. I Tuoi Diritti (GDPR)</h2>
          <p>Hai il diritto di:</p>
          <ul>
            <li><strong>Accesso:</strong> Richiedere una copia dei tuoi dati personali</li>
            <li><strong>Rettifica:</strong> Correggere dati inesatti o incompleti</li>
            <li><strong>Cancellazione:</strong> Richiedere la cancellazione dei tuoi dati</li>
            <li><strong>Limitazione:</strong> Limitare il trattamento dei tuoi dati</li>
            <li><strong>Portabilità:</strong> Ricevere i tuoi dati in formato strutturato</li>
            <li><strong>Opposizione:</strong> Opporti al trattamento dei tuoi dati</li>
            <li><strong>Revoca del consenso:</strong> Ritirare il consenso in qualsiasi momento</li>
          </ul>
        </section>

        <section>
          <h2>9. Cookie</h2>
          <p>
            Utilizziamo cookie essenziali per il funzionamento del servizio. Questi includono 
            cookie di sessione e preferenze. Non utilizziamo cookie di tracciamento o marketing 
            di terze parti.
          </p>
        </section>

        <section>
          <h2>10. Trasferimenti Internazionali</h2>
          <p>
            I tuoi dati possono essere trasferiti e trattati in paesi al di fuori dell'UE. 
            In tali casi, garantiamo che vengano applicate misure di protezione appropriate 
            conformi al GDPR.
          </p>
        </section>

        <section>
          <h2>11. Minori</h2>
          <p>
            Il nostro servizio non è rivolto a minori di 18 anni. Non raccogliamo 
            consapevolmente dati personali da minori.
          </p>
        </section>

        <section>
          <h2>12. Modifiche alla Privacy Policy</h2>
          <p>
            Possiamo aggiornare questa informativa periodicamente. Ti informeremo di 
            eventuali modifiche pubblicando la nuova informativa su questa pagina e 
            aggiornando la data di "Ultimo aggiornamento".
          </p>
        </section>

        <section>
          <h2>13. Contatti e DPO</h2>
          <p>
            Per esercitare i tuoi diritti o per domande sulla privacy, contattaci:
          </p>
          <p>
            <strong>Email:</strong> privacy@picortexai.com<br />
            <strong>Responsabile Protezione Dati (DPO):</strong> dpo@picortexai.com<br />
            <strong>Indirizzo:</strong> [Inserire indirizzo aziendale]
          </p>
        </section>

        <section>
          <h2>14. Autorità di Controllo</h2>
          <p>
            Hai il diritto di presentare un reclamo all'autorità di controllo competente. 
            In Italia, l'autorità è il Garante per la protezione dei dati personali 
            (www.garanteprivacy.it).
          </p>
        </section>
      </div>
    </div>
  )
}