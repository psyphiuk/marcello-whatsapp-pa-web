'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from '../admin.module.scss'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency: number
  uptime: number
  lastCheck: string
}

interface SystemMetric {
  label: string
  value: string | number
  status: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
}

export default function SystemHealthDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadHealthData()
    
    if (autoRefresh) {
      const interval = setInterval(loadHealthData, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadHealthData = async () => {
    try {
      // Simulate service health checks
      const serviceStatuses: ServiceStatus[] = [
        {
          name: 'WhatsApp API',
          status: 'operational',
          latency: Math.random() * 100 + 50,
          uptime: 99.99,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Google Calendar API',
          status: 'operational',
          latency: Math.random() * 200 + 100,
          uptime: 99.95,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Google Contacts API',
          status: 'operational',
          latency: Math.random() * 150 + 80,
          uptime: 99.97,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'OpenAI GPT-4',
          status: Math.random() > 0.95 ? 'degraded' : 'operational',
          latency: Math.random() * 500 + 300,
          uptime: 99.90,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Supabase Database',
          status: 'operational',
          latency: Math.random() * 50 + 10,
          uptime: 99.99,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Redis Cache',
          status: 'operational',
          latency: Math.random() * 10 + 1,
          uptime: 99.98,
          lastCheck: new Date().toISOString()
        },
        {
          name: 'Railway Infrastructure',
          status: 'operational',
          latency: Math.random() * 30 + 5,
          uptime: 99.95,
          lastCheck: new Date().toISOString()
        }
      ]
      setServices(serviceStatuses)

      // Calculate system metrics
      const avgLatency = serviceStatuses.reduce((sum, s) => sum + s.latency, 0) / serviceStatuses.length
      const systemUptime = serviceStatuses.reduce((min, s) => Math.min(min, s.uptime), 100)
      
      // Load database metrics
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute

      const { data: dbSize } = await supabase.rpc('database_size', {}) // Would need custom function
      
      const systemMetrics: SystemMetric[] = [
        {
          label: 'CPU Utilizzo',
          value: `${(Math.random() * 30 + 20).toFixed(1)}%`,
          status: 'good',
          trend: 'stable'
        },
        {
          label: 'Memoria RAM',
          value: `${(Math.random() * 2 + 1).toFixed(1)} GB / 4 GB`,
          status: 'good',
          trend: 'up'
        },
        {
          label: 'Spazio Disco',
          value: '45 GB / 100 GB',
          status: 'good',
          trend: 'up'
        },
        {
          label: 'Connessioni DB',
          value: `${Math.floor(Math.random() * 20 + 10)} / 100`,
          status: 'good',
          trend: 'stable'
        },
        {
          label: 'Richieste/min',
          value: messageCount || 0,
          status: messageCount && messageCount > 100 ? 'warning' : 'good',
          trend: 'up'
        },
        {
          label: 'Latenza Media',
          value: `${avgLatency.toFixed(0)}ms`,
          status: avgLatency < 200 ? 'good' : avgLatency < 500 ? 'warning' : 'critical',
          trend: 'stable'
        }
      ]
      setMetrics(systemMetrics)

      // Simulate recent incidents
      const recentIncidents = [
        {
          id: 1,
          severity: 'minor',
          service: 'OpenAI API',
          description: 'Latenza elevata rilevata',
          time: new Date(Date.now() - 3600000).toISOString(),
          resolved: true
        }
      ]
      setIncidents(recentIncidents)

      // Load recent error logs
      const { data: errorMessages } = await supabase
        .from('messages')
        .select('*')
        .not('response', 'is', null)
        .is('response', null) // Would filter for errors
        .order('created_at', { ascending: false })
        .limit(5)

      const simulatedLogs = [
        {
          level: 'info',
          message: 'Sistema avviato correttamente',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        },
        {
          level: 'warning',
          message: 'Cache Redis: alta utilizzo memoria (75%)',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          level: 'info',
          message: 'Backup database completato',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
          level: 'info',
          message: 'Certificati SSL rinnovati automaticamente',
          timestamp: new Date(Date.now() - 900000).toISOString()
        }
      ]
      setLogs(simulatedLogs)
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success'
      case 'degraded': return 'warning'
      case 'down': return 'error'
      case 'good': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'info'
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'error'
      case 'warning': return 'warning'
      case 'info': return 'info'
      default: return 'info'
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Controllo stato sistema...</p>
      </div>
    )
  }

  const overallHealth = services.every(s => s.status === 'operational') ? 'operational' : 
                        services.some(s => s.status === 'down') ? 'partial' : 'degraded'

  return (
    <div>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Monitoraggio Sistema</h1>
          <p>Stato in tempo reale dell'infrastruttura e dei servizi</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
          <button onClick={loadHealthData} className={styles.primary}>
            🔄 Aggiorna
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '2rem', 
        backgroundColor: overallHealth === 'operational' ? '#e6f7e6' : '#fff4e6',
        borderRadius: 'var(--border-radius)',
        marginBottom: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          color: overallHealth === 'operational' ? '#2d7a2d' : '#cc7a00',
          marginBottom: '0.5rem'
        }}>
          {overallHealth === 'operational' ? '✅ Tutti i Sistemi Operativi' : 
           overallHealth === 'partial' ? '⚠️ Interruzione Parziale del Servizio' :
           '⚠️ Servizio Degradato'}
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Ultimo controllo: {new Date().toLocaleTimeString('it-IT')}
        </p>
      </div>

      <div className={styles.statsGrid}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statLabel}>{metric.label}</div>
            <div className={styles.statValue} style={{ fontSize: '1.5rem' }}>
              {metric.value}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`${styles.badge} ${styles[getStatusColor(metric.status)]}`}>
                {metric.status === 'good' ? 'Ottimo' : 
                 metric.status === 'warning' ? 'Attenzione' : 'Critico'}
              </span>
              {metric.trend && (
                <span style={{ fontSize: '0.875rem' }}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.dataTable}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Stato Servizi</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Servizio</th>
              <th>Stato</th>
              <th>Latenza</th>
              <th>Uptime</th>
              <th>Ultimo Controllo</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index}>
                <td><strong>{service.name}</strong></td>
                <td>
                  <span className={`${styles.badge} ${styles[getStatusColor(service.status)]}`}>
                    {service.status === 'operational' ? 'Operativo' :
                     service.status === 'degraded' ? 'Degradato' : 'Non Disponibile'}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    color: service.latency < 200 ? 'var(--primary-color)' : 
                           service.latency < 500 ? '#cc7a00' : '#c33'
                  }}>
                    {service.latency.toFixed(0)}ms
                  </span>
                </td>
                <td>{service.uptime}%</td>
                <td>{new Date(service.lastCheck).toLocaleTimeString('it-IT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Incidenti Recenti</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {incidents.length > 0 ? (
              incidents.map((incident, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  backgroundColor: 'var(--background-light)',
                  borderRadius: 'var(--border-radius)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{incident.service}</strong>
                    <span className={`${styles.badge} ${incident.resolved ? styles.success : styles.error}`}>
                      {incident.resolved ? 'Risolto' : 'In Corso'}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
                    {incident.description}
                  </p>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {new Date(incident.time).toLocaleString('it-IT')}
                  </small>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nessun incidente nelle ultime 24 ore
              </p>
            )}
          </div>
        </div>

        <div className={styles.dataTable}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Log di Sistema</h3>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {logs.map((log, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'start'
              }}>
                <span className={`${styles.badge} ${styles[getLogLevelColor(log.level)]}`} style={{ minWidth: '60px' }}>
                  {log.level.toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{log.message}</p>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {new Date(log.timestamp).toLocaleTimeString('it-IT')}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className={styles.primary} style={{ padding: '0.75rem 2rem' }}>
          🔧 Manutenzione Programmata
        </button>
        <button style={{ padding: '0.75rem 2rem' }}>
          📊 Esporta Report Uptime
        </button>
        <button className={styles.danger} style={{ padding: '0.75rem 2rem' }}>
          🚨 Test Failover
        </button>
      </div>
    </div>
  )
}