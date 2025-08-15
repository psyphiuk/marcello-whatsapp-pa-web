'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from '../admin.module.scss'

interface UsageData {
  date: string
  messages: number
  tokens: number
  customers: number
}

interface CustomerUsage {
  company_name: string
  plan: string
  message_count: number
  tokens_used: number
  last_30_days: number
}

export default function AnalyticsDashboard() {
  const [dailyUsage, setDailyUsage] = useState<UsageData[]>([])
  const [customerUsage, setCustomerUsage] = useState<CustomerUsage[]>([])
  const [totals, setTotals] = useState({
    totalMessages: 0,
    totalTokens: 0,
    avgMessagesPerDay: 0,
    avgResponseTime: 0,
    peakHour: '',
    topFeature: ''
  })
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      // Load daily usage data
      const { data: usageData } = await supabase
        .from('usage_metrics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      // Aggregate by date
      const dailyData: { [key: string]: UsageData } = {}
      
      if (usageData) {
        usageData.forEach(metric => {
          const date = metric.date
          if (!dailyData[date]) {
            dailyData[date] = {
              date,
              messages: 0,
              tokens: 0,
              customers: 0
            }
          }
          dailyData[date].messages += metric.message_count || 0
          dailyData[date].tokens += metric.tokens_used || 0
          dailyData[date].customers += 1
        })
      }

      setDailyUsage(Object.values(dailyData))

      // Load customer usage
      const { data: customers } = await supabase
        .from('customers')
        .select('id, company_name, plan')

      if (customers) {
        const customerUsageData = await Promise.all(
          customers.map(async (customer) => {
            const { data: metrics } = await supabase
              .from('usage_metrics')
              .select('message_count, tokens_used')
              .eq('customer_id', customer.id)
              .gte('date', startDate.toISOString().split('T')[0])

            const totalMessages = metrics?.reduce((sum, m) => sum + (m.message_count || 0), 0) || 0
            const totalTokens = metrics?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0

            return {
              company_name: customer.company_name,
              plan: customer.plan,
              message_count: totalMessages,
              tokens_used: totalTokens,
              last_30_days: totalMessages
            }
          })
        )

        customerUsageData.sort((a, b) => b.message_count - a.message_count)
        setCustomerUsage(customerUsageData.slice(0, 10)) // Top 10 customers
      }

      // Calculate totals
      const totalMessages = dailyData ? Object.values(dailyData).reduce((sum, d) => sum + d.messages, 0) : 0
      const totalTokens = dailyData ? Object.values(dailyData).reduce((sum, d) => sum + d.tokens, 0) : 0
      const avgMessagesPerDay = totalMessages / parseInt(dateRange)

      // Load response time data
      const { data: responseData } = await supabase
        .from('messages')
        .select('processing_time_ms')
        .not('processing_time_ms', 'is', null)
        .gte('created_at', startDate.toISOString())
        .limit(1000)

      const avgResponseTime = responseData?.length 
        ? responseData.reduce((sum, m) => sum + m.processing_time_ms, 0) / responseData.length
        : 0

      // Analyze peak hour (simplified)
      const { data: hourlyData } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .limit(1000)

      const hourCounts: { [key: number]: number } = {}
      hourlyData?.forEach(m => {
        const hour = new Date(m.created_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })

      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '0'

      setTotals({
        totalMessages,
        totalTokens,
        avgMessagesPerDay: Math.round(avgMessagesPerDay),
        avgResponseTime: Math.round(avgResponseTime),
        peakHour: `${peakHour}:00 - ${(parseInt(peakHour) + 1) % 24}:00`,
        topFeature: 'Calendar'
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento analytics...</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Analytics & Reportistica</h1>
        <p>Analisi dettagliata dell'utilizzo e delle performance</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            fontSize: '1rem'
          }}
        >
          <option value="7">Ultimi 7 giorni</option>
          <option value="30">Ultimi 30 giorni</option>
          <option value="90">Ultimi 90 giorni</option>
        </select>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Messaggi Totali</div>
          <div className={styles.statValue}>{formatNumber(totals.totalMessages)}</div>
          <div className={styles.statChange}>
            Media: {totals.avgMessagesPerDay}/giorno
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Token Utilizzati</div>
          <div className={styles.statValue}>{formatNumber(totals.totalTokens)}</div>
          <div className={styles.statChange}>
            OpenAI GPT-4
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tempo Risposta Medio</div>
          <div className={styles.statValue}>{(totals.avgResponseTime / 1000).toFixed(1)}s</div>
          <div className={`${styles.statChange} ${totals.avgResponseTime < 5000 ? styles.positive : styles.negative}`}>
            Target: &lt; 5s
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ora di Punta</div>
          <div className={styles.statValue} style={{ fontSize: '1.5rem' }}>{totals.peakHour}</div>
          <div className={styles.statChange}>
            Maggior traffico
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Utilizzo Giornaliero</h2>
          </div>
          <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '4px' }}>
              {dailyUsage.map((day, index) => {
                const maxMessages = Math.max(...dailyUsage.map(d => d.messages), 1)
                const height = (day.messages / maxMessages) * 100
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      backgroundColor: 'var(--primary-color)',
                      height: `${height}%`,
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      minHeight: '2px'
                    }}
                    title={`${new Date(day.date).toLocaleDateString('it-IT')}: ${day.messages} messaggi`}
                  >
                    {index % 7 === 0 && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap'
                      }}>
                        {new Date(day.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dataTable}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Top 10 Clienti per Utilizzo</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Azienda</th>
              <th>Piano</th>
              <th>Messaggi ({dateRange} giorni)</th>
              <th>Token Utilizzati</th>
              <th>Media/Giorno</th>
            </tr>
          </thead>
          <tbody>
            {customerUsage.map((customer, index) => (
              <tr key={index}>
                <td>
                  <strong>{customer.company_name}</strong>
                </td>
                <td>
                  <span className={`${styles.badge} ${customer.plan === 'pro' ? styles.info : styles.warning}`}>
                    {customer.plan === 'pro' ? 'Professional' : 'Basic'}
                  </span>
                </td>
                <td>{customer.message_count}</td>
                <td>{formatNumber(customer.tokens_used)}</td>
                <td>{Math.round(customer.message_count / parseInt(dateRange))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Funzionalità più Utilizzate</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>📅 Calendar</span>
                <strong>45%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: '45%', height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>✅ Tasks</span>
                <strong>25%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: 'var(--secondary-color)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>👥 Contacts</span>
                <strong>20%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: '20%', height: '100%', backgroundColor: '#ffa500', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>📧 Email</span>
                <strong>10%</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: '10%', height: '100%', backgroundColor: '#4285f4', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Statistiche Chiave</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Tasso di Successo</span>
                <strong style={{ color: 'var(--primary-color)' }}>98.5%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Messaggi Audio</span>
                <strong>35%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Lingua Italiana</span>
                <strong>92%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span>Costo Medio/Msg</span>
                <strong>€0.05</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className={styles.primary} style={{ padding: '0.75rem 2rem' }}>
          📊 Esporta Report Completo
        </button>
      </div>
    </div>
  )
}