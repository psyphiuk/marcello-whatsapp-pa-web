'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './faq.module.scss'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  // Generale
  {
    category: 'Generale',
    question: 'Cos\'è l\'Assistente Personale WhatsApp?',
    answer: 'È un servizio che trasforma WhatsApp nel tuo assistente personale AI. Puoi gestire calendario, email, contatti e attività di Google Workspace semplicemente inviando messaggi vocali o di testo in italiano.'
  },
  {
    category: 'Generale',
    question: 'Come funziona esattamente?',
    answer: 'Dopo la registrazione, colleghi il tuo account Google e poi aggiungi il nostro numero WhatsApp ai tuoi contatti. Da quel momento, puoi inviare comandi naturali come "Cosa ho oggi?" o "Aggiungi riunione domani alle 15" e l\'assistente eseguirà le azioni richieste.'
  },
  {
    category: 'Generale',
    question: 'Serve installare qualche app?',
    answer: 'No! Usi solo WhatsApp che hai già sul tuo telefono. Il nostro servizio funziona attraverso WhatsApp Web/Business API, quindi non serve installare nulla di nuovo.'
  },

  // Configurazione
  {
    category: 'Configurazione',
    question: 'Quanto tempo ci vuole per attivare il servizio?',
    answer: 'L\'attivazione è immediata! Dopo il pagamento, in soli 5 minuti puoi completare la configurazione: 1) Collegare Google Account, 2) Aggiungere il numero WhatsApp, 3) Iniziare a usare l\'assistente.'
  },
  {
    category: 'Configurazione',
    question: 'Posso usarlo con più account Google?',
    answer: 'Attualmente supportiamo un account Google per utente. Se hai bisogno di gestire più account, contattaci per soluzioni personalizzate enterprise.'
  },
  {
    category: 'Configurazione',
    question: 'Funziona con WhatsApp Business?',
    answer: 'Sì, funziona sia con WhatsApp normale che con WhatsApp Business. Puoi usare l\'app che preferisci.'
  },

  // Prezzi e Pagamenti
  {
    category: 'Prezzi',
    question: 'Quanto costa il servizio?',
    answer: 'Offriamo due piani: Basic a 29€/mese con 100 messaggi al giorno, e Pro a 49€/mese con messaggi illimitati e supporto prioritario. C\'è anche una quota di configurazione iniziale di 50€ (spesso in promozione gratuita).'
  },
  {
    category: 'Prezzi',
    question: 'C\'è un periodo di prova gratuito?',
    answer: 'Non offriamo una prova gratuita, ma hai una garanzia di rimborso di 14 giorni. Se non sei soddisfatto, ti rimborsiamo completamente.'
  },
  {
    category: 'Prezzi',
    question: 'Posso cambiare piano in qualsiasi momento?',
    answer: 'Certo! Puoi passare da Basic a Pro (o viceversa) in qualsiasi momento dal tuo dashboard. Il cambio sarà effettivo dal prossimo ciclo di fatturazione.'
  },
  {
    category: 'Prezzi',
    question: 'Come funziona la fatturazione?',
    answer: 'La fatturazione è mensile e automatica tramite carta di credito (gestiamo i pagamenti con Stripe). Riceverai sempre la fattura via email.'
  },

  // Funzionalità
  {
    category: 'Funzionalità',
    question: 'Quali comandi posso usare?',
    answer: 'Puoi usare linguaggio naturale! Esempi: "Cosa ho domani?", "Aggiungi appuntamento", "Leggi email", "Trova numero di Mario", "Ricordami di chiamare il dentista". L\'AI capisce il contesto e risponde di conseguenza.'
  },
  {
    category: 'Funzionalità',
    question: 'Posso usare i messaggi vocali?',
    answer: 'Sì! Puoi inviare messaggi vocali e l\'assistente li trascriverà automaticamente, eseguirà il comando e ti risponderà. Perfetto quando sei in movimento.'
  },
  {
    category: 'Funzionalità',
    question: 'L\'assistente può inviare email per me?',
    answer: 'Sì, può comporre e inviare email. Devi solo dire qualcosa come "Invia email a Giovanni: Confermiamo la riunione di domani alle 15. Cordiali saluti." e l\'email verrà inviata.'
  },
  {
    category: 'Funzionalità',
    question: 'Funziona anche in inglese?',
    answer: 'Sì, l\'assistente capisce e risponde sia in italiano che in inglese. Puoi impostare la lingua preferita nelle impostazioni.'
  },

  // Sicurezza e Privacy
  {
    category: 'Sicurezza',
    question: 'I miei dati sono al sicuro?',
    answer: 'Assolutamente sì. Utilizziamo crittografia end-to-end, server in Europa, siamo conformi GDPR e non condividiamo MAI i tuoi dati con terze parti. Abbiamo anche la certificazione ISO 27001 per la sicurezza.'
  },
  {
    category: 'Sicurezza',
    question: 'Dove vengono salvati i miei dati?',
    answer: 'I dati sono salvati su server sicuri in Europa (Supabase). I messaggi WhatsApp sono processati in tempo reale e non vengono conservati. Solo i metadati necessari per il funzionamento vengono salvati.'
  },
  {
    category: 'Sicurezza',
    question: 'Posso cancellare i miei dati?',
    answer: 'Sì, in qualsiasi momento. Dal dashboard puoi richiedere la cancellazione completa dei tuoi dati. Entro 48 ore tutto verrà eliminato permanentemente.'
  },
  {
    category: 'Sicurezza',
    question: 'L\'assistente può accedere a tutti i miei dati Google?',
    answer: 'No, accede solo ai dati che autorizzi esplicitamente (Calendar, Gmail, Contacts). Puoi revocare i permessi in qualsiasi momento dalle impostazioni Google.'
  },

  // Problemi Tecnici
  {
    category: 'Supporto',
    question: 'L\'assistente non risponde, cosa faccio?',
    answer: '1) Verifica la connessione internet, 2) Controlla che il numero sia salvato correttamente, 3) Assicurati che l\'abbonamento sia attivo. Se il problema persiste, contatta il supporto.'
  },
  {
    category: 'Supporto',
    question: 'Ricevo risposte duplicate, è normale?',
    answer: 'No, non è normale. Potrebbe essere un problema temporaneo di rete. Prova a: 1) Riavviare WhatsApp, 2) Verificare di non avere WhatsApp Web aperto su più dispositivi. Se persiste, contattaci.'
  },
  {
    category: 'Supporto',
    question: 'Posso usarlo all\'estero?',
    answer: 'Sì! Funziona ovunque tu abbia una connessione internet. Non ci sono limitazioni geografiche.'
  },
  {
    category: 'Supporto',
    question: 'Come posso contattare il supporto?',
    answer: 'Email: support@picortex.ai (risposta entro 24h). I clienti Pro hanno anche accesso alla chat live dal lunedì al venerdì, 9:00-18:00.'
  },

  // Account e Abbonamento
  {
    category: 'Account',
    question: 'Posso condividere l\'account con colleghi?',
    answer: 'Ogni account è personale e collegato a un singolo numero WhatsApp. Per team aziendali offriamo piani dedicati con più utenti.'
  },
  {
    category: 'Account',
    question: 'Come posso disdire l\'abbonamento?',
    answer: 'Puoi disdire in qualsiasi momento dal tuo dashboard, senza penali. L\'accesso continuerà fino alla fine del periodo già pagato.'
  },
  {
    category: 'Account',
    question: 'Cosa succede se supero i limiti del piano Basic?',
    answer: 'Riceverai un avviso quando raggiungi l\'80% del limite giornaliero. Superato il limite, l\'assistente ti inviterà a passare al piano Pro per continuare.'
  },
  {
    category: 'Account',
    question: 'Posso riattivare un account cancellato?',
    answer: 'Sì, entro 30 giorni dalla cancellazione puoi riattivare l\'account con tutti i dati. Dopo 30 giorni, dovrai creare un nuovo account.'
  }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const categories = ['Tutte', ...Array.from(new Set(faqs.map(faq => faq.category)))]

  const filteredFAQs = selectedCategory === 'Tutte'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory)

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>

        <h1>Domande Frequenti (FAQ)</h1>
        <p className={styles.intro}>
          Trova rapidamente le risposte alle domande più comuni sul nostro servizio.
        </p>

        <div className={styles.categories}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              {category !== 'Tutte' && (
                <span className={styles.count}>
                  {faqs.filter(faq => faq.category === category).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.faqList}>
          {filteredFAQs.map((faq, index) => {
            const globalIndex = faqs.indexOf(faq)
            const isExpanded = expandedItems.has(globalIndex)

            return (
              <div
                key={globalIndex}
                className={`${styles.faqItem} ${isExpanded ? styles.expanded : ''}`}
              >
                <button
                  className={styles.question}
                  onClick={() => toggleExpanded(globalIndex)}
                >
                  <span>{faq.question}</span>
                  <span className={styles.icon}>{isExpanded ? '−' : '+'}</span>
                </button>
                {isExpanded && (
                  <div className={styles.answer}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <section className={styles.stillNeedHelp}>
          <h2>Non hai trovato la risposta?</h2>
          <p>
            Il nostro team di supporto è sempre pronto ad aiutarti con qualsiasi domanda.
          </p>
          <div className={styles.helpOptions}>
            <Link href="/contact" className={styles.helpButton}>
              Contattaci
            </Link>
            <a href="mailto:support@picortex.ai" className={styles.helpButton}>
              Invia Email
            </a>
            <Link href="/docs" className={styles.helpButton}>
              Documentazione
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}