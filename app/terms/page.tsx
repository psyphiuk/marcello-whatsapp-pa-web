import Link from 'next/link'
import styles from './terms.module.scss'

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>
        
        <h1>Termini di Servizio</h1>
        <p className={styles.lastUpdated}>Ultimo aggiornamento: 27 Dicembre 2024</p>

        <section>
          <h2>1. Accettazione dei Termini</h2>
          <p>
            Utilizzando i servizi di PICORTEX AI ("noi", "nostro"), accetti di essere vincolato 
            da questi Termini di Servizio. Se non accetti questi termini, non utilizzare i nostri servizi.
          </p>
        </section>

        <section>
          <h2>2. Descrizione del Servizio</h2>
          <p>
            PICORTEX AI fornisce un servizio di assistente virtuale per WhatsApp Business che 
            consente l'automazione delle conversazioni e la gestione dei clienti attraverso 
            intelligenza artificiale.
          </p>
        </section>

        <section>
          <h2>3. Account Utente</h2>
          <p>
            Per utilizzare i nostri servizi, devi creare un account fornendo informazioni 
            accurate e complete. Sei responsabile della sicurezza del tuo account e di tutte 
            le attività che si verificano sotto il tuo account.
          </p>
        </section>

        <section>
          <h2>4. Utilizzo Accettabile</h2>
          <p>Ti impegni a non utilizzare i nostri servizi per:</p>
          <ul>
            <li>Violare leggi o regolamenti applicabili</li>
            <li>Inviare spam o messaggi non richiesti</li>
            <li>Impersonare altre persone o entità</li>
            <li>Trasmettere virus o codice dannoso</li>
            <li>Interferire con o interrompere i nostri servizi</li>
          </ul>
        </section>

        <section>
          <h2>5. Pagamenti e Fatturazione</h2>
          <p>
            I nostri servizi sono forniti su base di abbonamento mensile. I prezzi sono 
            soggetti a modifiche con preavviso di 30 giorni. I pagamenti sono elaborati 
            tramite Stripe e sono soggetti ai loro termini di servizio.
          </p>
        </section>

        <section>
          <h2>6. Proprietà Intellettuale</h2>
          <p>
            Tutti i diritti di proprietà intellettuale nei nostri servizi rimangono di 
            nostra proprietà. Ti concediamo una licenza limitata, non esclusiva e non 
            trasferibile per utilizzare i nostri servizi secondo questi termini.
          </p>
        </section>

        <section>
          <h2>7. Privacy e Protezione dei Dati</h2>
          <p>
            La tua privacy è importante per noi. Il trattamento dei dati personali è 
            descritto nella nostra <Link href="/privacy">Informativa sulla Privacy</Link>.
          </p>
        </section>

        <section>
          <h2>8. Limitazione di Responsabilità</h2>
          <p>
            In nessun caso PICORTEX AI sarà responsabile per danni indiretti, incidentali, 
            speciali, consequenziali o punitivi risultanti dall'uso o dall'impossibilità 
            di utilizzare i nostri servizi.
          </p>
        </section>

        <section>
          <h2>9. Modifiche ai Termini</h2>
          <p>
            Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
            Le modifiche saranno effettive immediatamente dopo la pubblicazione sul nostro sito.
          </p>
        </section>

        <section>
          <h2>10. Cessazione</h2>
          <p>
            Possiamo terminare o sospendere il tuo account e l'accesso ai nostri servizi 
            immediatamente, senza preavviso, per violazione di questi termini.
          </p>
        </section>

        <section>
          <h2>11. Legge Applicabile</h2>
          <p>
            Questi termini sono regolati dalle leggi italiane. Qualsiasi controversia sarà 
            risolta nei tribunali competenti in Italia.
          </p>
        </section>

        <section>
          <h2>12. Contatti</h2>
          <p>
            Per domande su questi Termini di Servizio, contattaci a:
            <br />
            Email: support@picortexai.com
          </p>
        </section>
      </div>
    </div>
  )
}