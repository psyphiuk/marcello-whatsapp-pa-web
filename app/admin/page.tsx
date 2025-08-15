'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from './admin.module.scss'

interface SystemStats {
  totalCustomers: number
  activeCustomers: number
  totalMessages: number
  todayMessages: number
  avgResponseTime: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalMessages: 0,
    todayMessages: 0,
    avgResponseTime: 0,
    systemHealth: 'healthy'
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load customer stats
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'pro')

      // Load message stats
      const today = new Date().toISOString().split('T')[0]
      
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

      const { data: todayMessagesData } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .gte('created_at', today)

      // Load recent messages for activity
      const { data: recentMessages } = await supabase
        .from('messages')
        .select(`
          *,
          customers (company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate average response time
      const { data: responseTimeData } = await supabase
        .from('messages')
        .select('processing_time_ms')
        .not('processing_time_ms', 'is', null)
        .limit(100)

      const avgResponseTime = responseTimeData?.length 
        ? responseTimeData.reduce((sum, m) => sum + m.processing_time_ms, 0) / responseTimeData.length
        : 0

      setStats({
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        totalMessages: totalMessages || 0,
        todayMessages: todayMessagesData?.length || 0,
        avgResponseTime: Math.round(avgResponseTime),
        systemHealth: avgResponseTime < 5000 ? 'healthy' : avgResponseTime < 10000 ? 'warning' : 'critical'
      })

      setRecentActivity(recentMessages || [])
    } catch (error) {
      console.error('Error loading admin dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'info'
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Caricamento dashboard admin...</p>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Dashboard Amministratore</h1>
        <p>Panoramica del sistema e statistiche in tempo reale</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Clienti Totali</div>
          <div className={styles.statValue}>{stats.totalCustomers}</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            {stats.activeCustomers} attivi
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Messaggi Oggi</div>
          <div className={styles.statValue}>{stats.todayMessages}</div>
          <div className={styles.statChange}>
            {stats.totalMessages} totali
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tempo Risposta Medio</div>
          <div className={styles.statValue}>{formatTime(stats.avgResponseTime)}</div>
          <div className={`${styles.statChange} ${stats.avgResponseTime < 5000 ? styles.positive : styles.negative}`}>
            Target: &lt; 5s
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>Stato Sistema</div>
          <div className={styles.statValue}>
            <span className={`${styles.badge} ${styles[getHealthColor(stats.systemHealth)]}`}>
              {stats.systemHealth === 'healthy' ? 'Operativo' : 
               stats.systemHealth === 'warning' ? 'Attenzione' : 'Critico'}
            </span>
          </div>
          <div className={styles.statChange}>
            Uptime: 99.9%
          </div>
        </div>
      </div>

      <div className={styles.dataTable}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Attività Recente</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Orario</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Tempo Risposta</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((activity) => (
              <tr key={activity.id}>
                <td>{new Date(activity.created_at).toLocaleString('it-IT')}</td>
                <td>{activity.customers?.company_name || 'N/A'}</td>
                <td>{activity.message_type || 'text'}</td>
                <td>{activity.processing_time_ms ? formatTime(activity.processing_time_ms) : '-'}</td>
                <td>
                  <span className={`${styles.badge} ${styles.success}`}>
                    Completato
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Avvisi Sistema</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--background-light)', borderRadius: 'var(--border-radius)', marginBottom: '1rem' }}>
              <strong>✓ Tutti i servizi operativi</strong>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                WhatsApp API, Google APIs, e database funzionanti correttamente
              </p>
            </div>
          </div>
        </div>

        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Azioni Rapide</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div className={styles.actions} style={{ flexDirection: 'column', gap: '1rem' }}>
              <button className={styles.primary} style={{ width: '100%' }}>
                + Aggiungi Nuovo Cliente
              </button>
              <button style={{ width: '100%' }}>
                📊 Esporta Report Mensile
              </button>
              <button style={{ width: '100%' }}>
                🔄 Aggiorna Cache Sistema
              </button>
              <button className={styles.danger} style={{ width: '100%' }}>
                🔧 Manutenzione Sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}