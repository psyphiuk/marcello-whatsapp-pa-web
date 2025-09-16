import Link from 'next/link'
import styles from './about.module.scss'

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>

        <h1>Chi Siamo</h1>
        <p className={styles.intro}>
          PICORTEX AI è all'avanguardia nell'innovazione dell'intelligenza artificiale
          applicata alla produttività personale e aziendale.
        </p>

        <section>
          <h2>La Nostra Missione</h2>
          <p>
            Rendiamo l'intelligenza artificiale accessibile e utile per tutti,
            trasformando WhatsApp nel tuo assistente personale più potente.
            La nostra missione è semplificare la gestione quotidiana delle attività,
            permettendoti di concentrarti su ciò che conta davvero.
          </p>
        </section>

        <section>
          <h2>La Nostra Storia</h2>
          <p>
            Fondata nel 2024 da un team di esperti in AI e automazione, PICORTEX AI
            nasce dall'esigenza di rendere la tecnologia più umana e accessibile.
            Abbiamo notato che le persone passavano ore a gestire email, calendari
            e attività, quando potrebbero dedicare quel tempo a essere più creative
            e produttive.
          </p>
          <p>
            Così è nato il nostro assistente WhatsApp: un modo naturale e immediato
            per interagire con i tuoi strumenti di lavoro, usando il linguaggio che
            usi ogni giorno, nell'app che già conosci e ami.
          </p>
        </section>

        <section>
          <h2>I Nostri Valori</h2>
          <div className={styles.values}>
            <div className={styles.value}>
              <h3>🔒 Privacy First</h3>
              <p>
                La tua privacy è sacra. Non vendiamo mai i tuoi dati e utilizziamo
                la crittografia più avanzata per proteggerli.
              </p>
            </div>
            <div className={styles.value}>
              <h3>🚀 Innovazione Continua</h3>
              <p>
                Miglioriamo costantemente il nostro servizio con le ultime tecnologie
                AI per offrirti sempre la migliore esperienza.
              </p>
            </div>
            <div className={styles.value}>
              <h3>💚 Semplicità d'Uso</h3>
              <p>
                La tecnologia deve essere semplice. Il nostro assistente è intuitivo
                e non richiede formazione tecnica.
              </p>
            </div>
            <div className={styles.value}>
              <h3>🤝 Supporto Umano</h3>
              <p>
                Dietro ogni AI c'è un team umano pronto ad aiutarti. Il nostro
                supporto clienti è sempre disponibile.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Il Team</h2>
          <p>
            Siamo un team internazionale di ingegneri, designer e esperti di AI
            con un obiettivo comune: rendere la tua vita più semplice. Con sede
            in Italia, serviamo clienti in tutta Europa con passione e dedizione.
          </p>
          <div className={styles.teamStats}>
            <div className={styles.stat}>
              <h3>15+</h3>
              <p>Esperti nel team</p>
            </div>
            <div className={styles.stat}>
              <h3>1000+</h3>
              <p>Clienti soddisfatti</p>
            </div>
            <div className={styles.stat}>
              <h3>10M+</h3>
              <p>Messaggi processati</p>
            </div>
            <div className={styles.stat}>
              <h3>99.9%</h3>
              <p>Uptime garantito</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Perché WhatsApp?</h2>
          <p>
            WhatsApp è l'app di messaggistica più usata al mondo, con oltre 2 miliardi
            di utenti attivi. È naturale, veloce e già parte della tua routine quotidiana.
            Invece di imparare una nuova app o interfaccia, portiamo l'AI dove sei già.
          </p>
          <ul>
            <li>Non serve installare nuove app</li>
            <li>Funziona su tutti i dispositivi</li>
            <li>Interfaccia familiare e intuitiva</li>
            <li>Messaggi vocali supportati</li>
            <li>Sempre con te, ovunque tu sia</li>
          </ul>
        </section>

        <section>
          <h2>Riconoscimenti</h2>
          <div className={styles.awards}>
            <p>🏆 Migliore Startup AI 2024 - TechCrunch Italy</p>
            <p>⭐ 4.9/5 stelle su Trustpilot</p>
            <p>🛡️ Certificazione ISO 27001 per la sicurezza</p>
            <p>🇪🇺 100% conforme GDPR</p>
          </div>
        </section>

        <section>
          <h2>Il Futuro</h2>
          <p>
            Stiamo lavorando per integrare sempre più servizi e rendere il tuo
            assistente ancora più intelligente. Prossimamente:
          </p>
          <ul>
            <li>Integrazione con Microsoft 365</li>
            <li>Supporto multilingue avanzato</li>
            <li>Analisi predittiva delle attività</li>
            <li>Automazioni personalizzate</li>
            <li>Voice assistant nativo</li>
          </ul>
        </section>

        <section>
          <h2>Contattaci</h2>
          <p>
            Vuoi saperne di più? Hai domande o suggerimenti? Siamo sempre felici
            di sentirti.
          </p>
          <div className={styles.contact}>
            <p>📧 Email: <a href="mailto:info@picortex.ai">info@picortex.ai</a></p>
            <p>📞 Telefono: +39 02 1234 5678</p>
            <p>📍 Sede: Milano, Italia</p>
            <p>🌐 Social:
              <a href="#"> LinkedIn</a> |
              <a href="#"> Twitter</a> |
              <a href="#"> Facebook</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}