'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from '../admin.module.scss'

interface Invoice {
  id: string
  customer_name: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  date: string
  plan: string
}

interface Revenue {
  month: string
  recurring: number
  setup: number
  total: number
}

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [revenue, setRevenue] = useState<Revenue[]>([])
  const [stats, setStats] = useState({
    monthlyRecurring: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    avgCustomerValue: 0,
    pendingPayments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      // Load customers for billing simulation
      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

      if (customers) {
        // Simulate invoices based on customers
        const simulatedInvoices: Invoice[] = customers.map(customer => {
          const amount = customer.plan === 'pro' ? 200 : 100
          const daysOld = Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))
          const status = daysOld < 30 ? 'paid' : daysOld < 60 ? 'pending' : 'overdue'
          
          return {
            id: customer.id.substring(0, 8),
            customer_name: customer.company_name,
            amount,
            status,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            plan: customer.plan
          }
        })

        setInvoices(simulatedInvoices.slice(0, 10))

        // Calculate stats
        const activeSubscriptions = customers.filter(c => c.settings?.active !== false).length
        const monthlyRecurring = customers.reduce((sum, c) => {
          if (c.settings?.active !== false) {
            return sum + (c.plan === 'pro' ? 200 : 100)
          }
          return sum
        }, 0)

        const pendingPayments = simulatedInvoices
          .filter(i => i.status === 'pending')
          .reduce((sum, i) => sum + i.amount, 0)

        setStats({
          monthlyRecurring,
          totalRevenue: monthlyRecurring * 3, // Simulate 3 months
          activeSubscriptions,
          churnRate: 5.2, // Simulated
          avgCustomerValue: monthlyRecurring / Math.max(activeSubscriptions, 1),
          pendingPayments
        })

        // Simulate revenue data
        const revenueData: Revenue[] = []
        const months = ['Ottobre', 'Novembre', 'Dicembre']
        months.forEach((month, index) => {
          const baseRecurring = monthlyRecurring * (0.7 + index * 0.15)
          const setupFees = Math.floor(Math.random() * 3) * 500
          revenueData.push({
            month,
            recurring: baseRecurring,
            setup: setupFees,
            total: baseRecurring + setupFees
          })
        })
        setRevenue(revenueData)
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'pending': return 'warning'
      case 'overdue': return 'error'
      default: return 'info'
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento dati fatturazione...</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Fatturazione & Pagamenti</h1>
        <p>Gestione fatture, abbonamenti e pagamenti</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ricavi Ricorrenti Mensili</div>
          <div className={styles.statValue}>{formatCurrency(stats.monthlyRecurring)}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            +15% vs mese precedente
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ricavi Totali (3 mesi)</div>
          <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
          <div className={styles.statChange}>
            Include setup fees
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Abbonamenti Attivi</div>
          <div className={styles.statValue}>{stats.activeSubscriptions}</div>
          <div className={styles.statChange}>
            Churn rate: {stats.churnRate}%
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Valore Medio Cliente</div>
          <div className={styles.statValue}>{formatCurrency(stats.avgCustomerValue)}</div>
          <div className={styles.statChange}>
            Per mese
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Andamento Ricavi</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Mese</th>
                <th>Ricorrenti</th>
                <th>Setup Fees</th>
                <th>Totale</th>
                <th>Crescita</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((month, index) => (
                <tr key={index}>
                  <td><strong>{month.month}</strong></td>
                  <td>{formatCurrency(month.recurring)}</td>
                  <td>{formatCurrency(month.setup)}</td>
                  <td><strong>{formatCurrency(month.total)}</strong></td>
                  <td>
                    <span className={`${styles.badge} ${styles.success}`}>
                      +{(15 + index * 5)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.dataTable}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Fatture Recenti</h2>
          {stats.pendingPayments > 0 && (
            <span className={`${styles.badge} ${styles.warning}`}>
              {formatCurrency(stats.pendingPayments)} in attesa
            </span>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>ID Fattura</th>
              <th>Cliente</th>
              <th>Piano</th>
              <th>Importo</th>
              <th>Data</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <code>#{invoice.id}</code>
                </td>
                <td>{invoice.customer_name}</td>
                <td>
                  <span className={`${styles.badge} ${invoice.plan === 'pro' ? styles.info : styles.warning}`}>
                    {invoice.plan === 'pro' ? 'Professional' : 'Basic'}
                  </span>
                </td>
                <td><strong>{formatCurrency(invoice.amount)}</strong></td>
                <td>{new Date(invoice.date).toLocaleDateString('it-IT')}</td>
                <td>
                  <span className={`${styles.badge} ${styles[getStatusColor(invoice.status)]}`}>
                    {invoice.status === 'paid' ? 'Pagata' : 
                     invoice.status === 'pending' ? 'In Attesa' : 'Scaduta'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button>Visualizza</button>
                    {invoice.status === 'pending' && (
                      <button className={styles.primary}>Sollecita</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Distribuzione Piani</h3>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `conic-gradient(var(--primary-color) 0deg 216deg, var(--secondary-color) 216deg 360deg)`,
                  margin: '0 auto 1rem'
                }}></div>
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--primary-color)', marginRight: '0.5rem' }}></span>
                    Professional: 60%
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--secondary-color)', marginRight: '0.5rem' }}></span>
                    Basic: 40%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Integrazioni Pagamento</h3>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>Stripe</strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Pagamenti con carta
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.success}`}>Attivo</span>
              </div>
              
              <div style={{
                padding: '1rem',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>SEPA Direct Debit</strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Addebito bancario
                  </p>
                </div>
                <span className={`${styles.badge} ${styles.warning}`}>In Arrivo</span>
              </div>
              
              <button className={styles.primary} style={{ marginTop: '1rem' }}>
                + Aggiungi Metodo di Pagamento
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className={styles.primary} style={{ padding: '0.75rem 2rem' }}>
          💳 Gestisci Abbonamenti
        </button>
        <button style={{ padding: '0.75rem 2rem' }}>
          📄 Genera Report Fiscale
        </button>
        <button style={{ padding: '0.75rem 2rem' }}>
          📧 Invia Solleciti di Massa
        </button>
      </div>
    </div>
  )
}