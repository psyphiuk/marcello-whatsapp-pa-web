'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateSecurePassword } from '@/lib/security/password'
import styles from '../admin.module.scss'

interface Customer {
  id: string
  company_name: string
  phone_numbers: string[]
  plan: string
  created_at: string
  settings: any
  message_count?: number
  last_active?: string
}

export default function CustomersManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      // Load customers with their usage stats
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (customersData) {
        // Load message counts for each customer
        const customersWithStats = await Promise.all(
          customersData.map(async (customer) => {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('customer_id', customer.id)

            const { data: lastMessage } = await supabase
              .from('messages')
              .select('created_at')
              .eq('customer_id', customer.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            return {
              ...customer,
              message_count: count || 0,
              last_active: lastMessage?.created_at
            }
          })
        )

        setCustomers(customersWithStats)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (customerId: string, currentStatus: any) => {
    try {
      const newSettings = {
        ...currentStatus,
        active: !currentStatus.active
      }

      const { error } = await supabase
        .from('customers')
        .update({ settings: newSettings })
        .eq('id', customerId)

      if (!error) {
        loadCustomers()
      }
    } catch (error) {
      console.error('Error updating customer status:', error)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Questa azione è irreversibile.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (!error) {
        loadCustomers()
        setSelectedCustomer(null)
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_numbers.some(phone => phone.includes(searchTerm))
  )

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento clienti...</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Gestione Clienti</h1>
        <p>Gestisci tutti i clienti e le loro configurazioni</p>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Cerca per nome o numero..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            fontSize: '1rem'
          }}
        />
        <button 
          className={`${styles.primary}`}
          onClick={() => setShowAddModal(true)}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          + Aggiungi Cliente
        </button>
      </div>

      <div className={styles.dataTable}>
        <table>
          <thead>
            <tr>
              <th>Azienda</th>
              <th>Piano</th>
              <th>Telefono</th>
              <th>Messaggi</th>
              <th>Ultima Attività</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <strong>{customer.company_name}</strong>
                  <br />
                  <small style={{ color: 'var(--text-secondary)' }}>
                    ID: {customer.id.substring(0, 8)}...
                  </small>
                </td>
                <td>
                  <span className={`${styles.badge} ${customer.plan === 'pro' ? styles.info : styles.warning}`}>
                    {customer.plan === 'pro' ? 'Professional' : 'Basic'}
                  </span>
                </td>
                <td>
                  {customer.phone_numbers[0]}
                  {customer.phone_numbers.length > 1 && (
                    <small style={{ display: 'block', color: 'var(--text-secondary)' }}>
                      +{customer.phone_numbers.length - 1} altri
                    </small>
                  )}
                </td>
                <td>{customer.message_count}</td>
                <td>
                  {customer.last_active 
                    ? new Date(customer.last_active).toLocaleDateString('it-IT')
                    : 'Mai'
                  }
                </td>
                <td>
                  <span className={`${styles.badge} ${customer.settings?.active !== false ? styles.success : styles.error}`}>
                    {customer.settings?.active !== false ? 'Attivo' : 'Sospeso'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => setSelectedCustomer(customer)}>
                      Dettagli
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(customer.id, customer.settings)}
                      className={customer.settings?.active !== false ? styles.danger : styles.primary}
                    >
                      {customer.settings?.active !== false ? 'Sospendi' : 'Attiva'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>Dettagli Cliente</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Azienda:</strong> {selectedCustomer.company_name}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Piano:</strong> {selectedCustomer.plan === 'pro' ? 'Professional' : 'Basic'}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Numeri WhatsApp:</strong>
              <ul style={{ marginTop: '0.5rem' }}>
                {selectedCustomer.phone_numbers.map((phone, index) => (
                  <li key={index}>{phone}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Creato il:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString('it-IT')}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Messaggi Totali:</strong> {selectedCustomer.message_count}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Ultima Attività:</strong> {
                selectedCustomer.last_active 
                  ? new Date(selectedCustomer.last_active).toLocaleString('it-IT')
                  : 'Mai'
              }
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Google Workspace:</strong> {
                selectedCustomer.settings?.google_connected 
                  ? '✓ Collegato' 
                  : '✗ Non collegato'
              }
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Chiudi
              </button>
              <button 
                onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                className={styles.danger}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Elimina Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddCustomerModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadCustomers()
          }}
        />
      )}
    </div>
  )
}

function AddCustomerModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    companyName: '',
    phoneNumber: '',
    plan: 'basic'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: generateSecurePassword(16), // Generate secure password
        options: {
          data: {
            company_name: formData.companyName,
            phone_number: formData.phoneNumber,
            plan: formData.plan,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create customer record
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            id: authData.user.id,
            company_name: formData.companyName,
            phone_numbers: [formData.phoneNumber],
            plan: formData.plan,
            settings: { 
              active: true,
              onboarding_completed: false
            }
          })

        if (customerError) throw customerError

        onSuccess()
      }
    } catch (error: any) {
      console.error('Error creating customer:', error)
      alert('Errore nella creazione del cliente: ' + error.message)
    } finally {
      setLoading(false)
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
        <h2>Aggiungi Nuovo Cliente</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nome Azienda</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Numero WhatsApp</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
              placeholder="+39 333 1234567"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Piano</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)'
              }}
            >
              <option value="basic">Basic (€100/mese)</option>
              <option value="pro">Professional (€200/mese)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Annulla
            </button>
            <button 
              type="submit"
              disabled={loading}
              className={styles.primary}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {loading ? 'Creazione...' : 'Crea Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}