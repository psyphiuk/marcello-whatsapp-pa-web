'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from '../admin.module.scss'

interface PricingConfig {
  setupFee: number
  basicMonthly: number
  proMonthly: number
  currency: string
}

interface DiscountCode {
  id: string
  code: string
  percent_off: number
  skip_setup_fee: boolean
  active: boolean
  uses_count: number
  max_uses?: number
  expires_at?: string
  created_at: string
}

export default function PricingConfiguration() {
  const [pricing, setPricing] = useState<PricingConfig>({
    setupFee: 500,
    basicMonthly: 100,
    proMonthly: 200,
    currency: 'EUR'
  })
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddDiscount, setShowAddDiscount] = useState(false)

  useEffect(() => {
    loadPricingData()
  }, [])

  const loadPricingData = async () => {
    try {
      // Load pricing configuration
      const { data: config } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'pricing')
        .single()

      if (config?.value) {
        setPricing(config.value)
      }

      // Load discount codes
      const { data: codes } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (codes) {
        setDiscountCodes(codes)
      }
    } catch (error) {
      console.error('Error loading pricing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePricing = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: 'pricing',
          value: pricing,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Prezzi aggiornati con successo!')
    } catch (error) {
      console.error('Error saving pricing:', error)
      alert('Errore nel salvataggio dei prezzi')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleDiscount = async (discountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ active: !currentStatus })
        .eq('id', discountId)

      if (!error) {
        loadPricingData()
      }
    } catch (error) {
      console.error('Error toggling discount:', error)
    }
  }

  const handleDeleteDiscount = async (discountId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo codice sconto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discountId)

      if (!error) {
        loadPricingData()
      }
    } catch (error) {
      console.error('Error deleting discount:', error)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento configurazione prezzi...</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Configurazione Prezzi & Sconti</h1>
        <p>Gestisci i prezzi dei piani e i codici sconto</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Prezzi dei Piani</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Configurazione Iniziale (€)
              </label>
              <input
                type="number"
                value={pricing.setupFee}
                onChange={(e) => setPricing({ ...pricing, setupFee: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: 'var(--text-secondary)' }}>
                Pagamento una tantum per la configurazione
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Piano Basic - Mensile (€)
              </label>
              <input
                type="number"
                value={pricing.basicMonthly}
                onChange={(e) => setPricing({ ...pricing, basicMonthly: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: 'var(--text-secondary)' }}>
                Fino a 20 messaggi al giorno
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Piano Professional - Mensile (€)
              </label>
              <input
                type="number"
                value={pricing.proMonthly}
                onChange={(e) => setPricing({ ...pricing, proMonthly: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: 'var(--text-secondary)' }}>
                Messaggi illimitati e tutte le funzionalità
              </small>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={saving}
              className={styles.primary}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {saving ? 'Salvataggio...' : 'Salva Prezzi'}
            </button>
          </div>
        </div>

        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Codici Speciali</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--background-light)', borderRadius: 'var(--border-radius)' }}>
              <h4 style={{ marginTop: 0 }}>🔐 Codici Segreti (Backend Only)</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Questi codici funzionano solo nel backend e non sono mai esposti al frontend:
              </p>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <code style={{ backgroundColor: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    marcello-psyphi
                  </code>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    → Attiva admin + setup gratuito
                  </span>
                </li>
                <li>
                  <code style={{ backgroundColor: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    configurazione-gratuita
                  </code>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    → Salta pagamento iniziale
                  </span>
                </li>
              </ul>
            </div>

            <div style={{ padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                I codici speciali sono gestiti direttamente nel codice backend per massima sicurezza
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dataTable}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Codici Sconto</h2>
          <button
            onClick={() => setShowAddDiscount(true)}
            className={styles.primary}
            style={{ padding: '0.5rem 1rem' }}
          >
            + Aggiungi Codice
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Codice</th>
              <th>Sconto</th>
              <th>Setup Gratuito</th>
              <th>Utilizzi</th>
              <th>Scadenza</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {discountCodes.map((discount) => (
              <tr key={discount.id}>
                <td>
                  <code style={{ backgroundColor: 'var(--background-light)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {discount.code}
                  </code>
                </td>
                <td>{discount.percent_off}%</td>
                <td>
                  {discount.skip_setup_fee ? (
                    <span className={`${styles.badge} ${styles.success}`}>Sì</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.warning}`}>No</span>
                  )}
                </td>
                <td>
                  {discount.uses_count}
                  {discount.max_uses && ` / ${discount.max_uses}`}
                </td>
                <td>
                  {discount.expires_at 
                    ? new Date(discount.expires_at).toLocaleDateString('it-IT')
                    : 'Mai'
                  }
                </td>
                <td>
                  <span className={`${styles.badge} ${discount.active ? styles.success : styles.error}`}>
                    {discount.active ? 'Attivo' : 'Disattivato'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => handleToggleDiscount(discount.id, discount.active)}>
                      {discount.active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button onClick={() => handleDeleteDiscount(discount.id)} className={styles.danger}>
                      Elimina
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddDiscount && (
        <AddDiscountModal
          onClose={() => setShowAddDiscount(false)}
          onSuccess={() => {
            setShowAddDiscount(false)
            loadPricingData()
          }}
        />
      )}
    </div>
  )
}

function AddDiscountModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: '',
    percent_off: 10,
    skip_setup_fee: false,
    max_uses: '',
    expires_at: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const discountData: any = {
        code: formData.code.toUpperCase(),
        percent_off: formData.percent_off,
        skip_setup_fee: formData.skip_setup_fee,
        active: true,
        uses_count: 0
      }

      if (formData.max_uses) {
        discountData.max_uses = parseInt(formData.max_uses)
      }

      if (formData.expires_at) {
        discountData.expires_at = new Date(formData.expires_at).toISOString()
      }

      const { error } = await supabase
        .from('discount_codes')
        .insert(discountData)

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error creating discount:', error)
      alert('Errore nella creazione del codice sconto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--border-radius)',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2>Aggiungi Codice Sconto</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Codice</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              placeholder="SCONTO2025"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Percentuale Sconto</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.percent_off}
              onChange={(e) => setFormData({ ...formData, percent_off: parseInt(e.target.value) })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.skip_setup_fee}
                onChange={(e) => setFormData({ ...formData, skip_setup_fee: e.target.checked })}
              />
              Setup gratuito (salta i €500 iniziali)
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Utilizzi Massimi (opzionale)</label>
            <input
              type="number"
              value={formData.max_uses}
              onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
              placeholder="Illimitati"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Scadenza (opzionale)</label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Annulla
            </button>
            <button 
              type="submit"
              disabled={saving}
              className={styles.primary}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {saving ? 'Creazione...' : 'Crea Codice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}