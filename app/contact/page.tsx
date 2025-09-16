'use client'

import Link from 'next/link'
import { useState } from 'react'
import styles from './contact.module.scss'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSending(false)
    setSent(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      })
      setSent(false)
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla Home
        </Link>

        <h1>Contattaci</h1>
        <p className={styles.intro}>
          Hai domande? Vuoi maggiori informazioni? Siamo qui per aiutarti.
          Compila il modulo o contattaci direttamente.
        </p>

        <div className={styles.contactGrid}>
          <div className={styles.contactForm}>
            <h2>Invia un Messaggio</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Il tuo nome"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tua@email.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="company">Azienda</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nome azienda (opzionale)"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">Oggetto *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleziona un argomento</option>
                  <option value="info">Informazioni generali</option>
                  <option value="pricing">Prezzi e piani</option>
                  <option value="support">Supporto tecnico</option>
                  <option value="partnership">Partnership</option>
                  <option value="demo">Richiesta demo</option>
                  <option value="other">Altro</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Messaggio *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Scrivi il tuo messaggio qui..."
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={sending || sent}
              >
                {sending ? 'Invio in corso...' : sent ? '✓ Inviato!' : 'Invia Messaggio'}
              </button>

              {sent && (
                <p className={styles.successMessage}>
                  Grazie per averci contattato! Ti risponderemo entro 24 ore.
                </p>
              )}
            </form>
          </div>

          <div className={styles.contactInfo}>
            <h2>Contatti Diretti</h2>

            <div className={styles.infoCard}>
              <h3>📧 Email</h3>
              <p>Per informazioni generali:</p>
              <a href="mailto:info@picortex.ai">info@picortex.ai</a>
              <p>Per supporto tecnico:</p>
              <a href="mailto:support@picortex.ai">support@picortex.ai</a>
            </div>

            <div className={styles.infoCard}>
              <h3>📞 Telefono</h3>
              <p>Lun-Ven, 9:00-18:00</p>
              <a href="tel:+390212345678">+39 02 1234 5678</a>
            </div>

            <div className={styles.infoCard}>
              <h3>📍 Sede</h3>
              <p>
                PICORTEX AI<br />
                Via dell'Innovazione, 42<br />
                20124 Milano (MI)<br />
                Italia
              </p>
            </div>

            <div className={styles.infoCard}>
              <h3>💬 Chat Live</h3>
              <p>
                Disponibile per clienti Pro<br />
                dal lunedì al venerdì<br />
                dalle 9:00 alle 18:00
              </p>
              <Link href="/dashboard" className={styles.chatLink}>
                Accedi alla chat →
              </Link>
            </div>

            <div className={styles.socialLinks}>
              <h3>Seguici</h3>
              <div className={styles.socials}>
                <a href="#" aria-label="LinkedIn">LinkedIn</a>
                <a href="#" aria-label="Twitter">Twitter</a>
                <a href="#" aria-label="Facebook">Facebook</a>
                <a href="#" aria-label="Instagram">Instagram</a>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.faqSection}>
          <h2>Domande Frequenti Rapide</h2>
          <div className={styles.quickFaq}>
            <div>
              <h4>Quanto tempo per l'attivazione?</h4>
              <p>L'attivazione è immediata dopo il pagamento. Puoi iniziare a usare il servizio in 5 minuti.</p>
            </div>
            <div>
              <h4>Posso provare gratuitamente?</h4>
              <p>Offriamo una garanzia di rimborso di 14 giorni. Se non sei soddisfatto, ti rimborsiamo.</p>
            </div>
            <div>
              <h4>Serve un contratto aziendale?</h4>
              <p>No, non serve alcun contratto. Puoi disdire in qualsiasi momento dal tuo dashboard.</p>
            </div>
            <div>
              <h4>Come funziona il supporto?</h4>
              <p>Email entro 24h per tutti. I clienti Pro hanno accesso alla chat live e supporto prioritario.</p>
            </div>
          </div>
          <p className={styles.faqLink}>
            Altre domande? Visita la nostra <Link href="/faq">pagina FAQ completa</Link>
          </p>
        </section>
      </div>
    </div>
  )
}