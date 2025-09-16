import Link from 'next/link'
import styles from './docs.module.scss'

export default function DocsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>

        <h1>Documentazione</h1>
        <p className={styles.intro}>
          Guida completa per configurare e utilizzare il tuo assistente personale WhatsApp.
        </p>

        <section>
          <h2>🚀 Guida Rapida</h2>
          <div className={styles.quickStart}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h3>Registrazione</h3>
                <p>Crea il tuo account e verifica la tua email</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h3>Collegamento Google</h3>
                <p>Autorizza l'accesso a Google Workspace</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h3>Configurazione WhatsApp</h3>
                <p>Scansiona il QR code con WhatsApp</p>
              </div>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNumber}>4</span>
              <div>
                <h3>Attivazione</h3>
                <p>Scegli il piano e inizia ad usare l'assistente</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>📱 Comandi WhatsApp</h2>
          <div className={styles.commands}>
            <h3>Calendario</h3>
            <ul>
              <li><code>"Cosa ho oggi?"</code> - Mostra gli appuntamenti del giorno</li>
              <li><code>"Aggiungi riunione domani alle 15"</code> - Crea un evento</li>
              <li><code>"Cancella appuntamento delle 10"</code> - Rimuove un evento</li>
              <li><code>"Programma della settimana"</code> - Mostra gli eventi settimanali</li>
            </ul>

            <h3>Email</h3>
            <ul>
              <li><code>"Leggi ultime email"</code> - Mostra email recenti</li>
              <li><code>"Email non lette"</code> - Mostra solo le non lette</li>
              <li><code>"Cerca email di Mario"</code> - Cerca email da un mittente</li>
              <li><code>"Rispondi con: Grazie, ci vediamo domani"</code> - Invia una risposta</li>
            </ul>

            <h3>Contatti</h3>
            <ul>
              <li><code>"Numero di Giovanni"</code> - Trova un contatto</li>
              <li><code>"Aggiungi contatto Maria 333-1234567"</code> - Crea nuovo contatto</li>
              <li><code>"Email del commercialista"</code> - Trova email di un contatto</li>
            </ul>

            <h3>Note e Attività</h3>
            <ul>
              <li><code>"Ricordami di chiamare il dentista"</code> - Crea promemoria</li>
              <li><code>"Lista della spesa"</code> - Mostra o crea liste</li>
              <li><code>"Aggiungi alla lista: comprare il pane"</code> - Aggiunge elementi</li>
            </ul>
          </div>
        </section>

        <section>
          <h2>🔧 Configurazione Avanzata</h2>

          <h3>Personalizzazione Risposte</h3>
          <p>
            Puoi personalizzare il modo in cui l'assistente risponde accedendo alle
            impostazioni del tuo dashboard:
          </p>
          <ul>
            <li>Lingua preferita (Italiano/Inglese)</li>
            <li>Formalità delle risposte</li>
            <li>Orari di disponibilità</li>
            <li>Notifiche automatiche</li>
          </ul>

          <h3>Integrazioni</h3>
          <p>L'assistente si integra automaticamente con:</p>
          <ul>
            <li>Google Calendar</li>
            <li>Gmail</li>
            <li>Google Contacts</li>
            <li>Google Drive (prossimamente)</li>
            <li>Google Tasks (prossimamente)</li>
          </ul>

          <h3>Limiti e Quote</h3>
          <div className={styles.limits}>
            <table>
              <thead>
                <tr>
                  <th>Funzione</th>
                  <th>Piano Basic</th>
                  <th>Piano Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Messaggi al giorno</td>
                  <td>100</td>
                  <td>Illimitati</td>
                </tr>
                <tr>
                  <td>Eventi calendario</td>
                  <td>50/mese</td>
                  <td>Illimitati</td>
                </tr>
                <tr>
                  <td>Email gestite</td>
                  <td>200/mese</td>
                  <td>Illimitate</td>
                </tr>
                <tr>
                  <td>Contatti</td>
                  <td>500</td>
                  <td>Illimitati</td>
                </tr>
                <tr>
                  <td>Supporto</td>
                  <td>Email</td>
                  <td>Prioritario</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>🔒 Sicurezza e Privacy</h2>
          <p>
            I tuoi dati sono protetti con i più alti standard di sicurezza:
          </p>
          <ul>
            <li>Crittografia end-to-end per tutti i messaggi</li>
            <li>Autenticazione a due fattori (2FA)</li>
            <li>Conformità GDPR</li>
            <li>Server in Europa</li>
            <li>Backup automatici giornalieri</li>
            <li>Nessuna condivisione dati con terze parti</li>
          </ul>
        </section>

        <section>
          <h2>❓ Risoluzione Problemi</h2>

          <h3>L'assistente non risponde</h3>
          <ol>
            <li>Verifica la connessione internet</li>
            <li>Controlla che il numero sia corretto nel dashboard</li>
            <li>Assicurati che l'abbonamento sia attivo</li>
            <li>Prova a disconnettere e riconnettere WhatsApp</li>
          </ol>

          <h3>Errore di sincronizzazione Google</h3>
          <ol>
            <li>Vai nelle impostazioni del dashboard</li>
            <li>Clicca su "Riconnetti Google"</li>
            <li>Autorizza nuovamente l'accesso</li>
            <li>Attendi 5 minuti per la sincronizzazione</li>
          </ol>

          <h3>Messaggi duplicati</h3>
          <p>
            Se ricevi risposte duplicate, potrebbe esserci un problema di rete.
            Contatta il supporto per assistenza.
          </p>
        </section>

        <section>
          <h2>📞 Supporto</h2>
          <p>
            Hai bisogno di aiuto? Siamo qui per te:
          </p>
          <ul>
            <li>Email: <a href="mailto:support@picortex.ai">support@picortex.ai</a></li>
            <li>Chat dal dashboard (Piano Pro)</li>
            <li>FAQ: <Link href="/faq">Domande Frequenti</Link></li>
          </ul>
        </section>
      </div>
    </div>
  )
}