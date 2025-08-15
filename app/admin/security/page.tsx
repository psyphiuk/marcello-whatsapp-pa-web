'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import styles from '../admin.module.scss'

interface SecurityMetrics {
  totalLoginAttempts: number
  failedLoginAttempts: number
  activeSessions: number
  mfaEnabledUsers: number
  recentSecurityEvents: SecurityEvent[]
  suspiciousActivities: SuspiciousActivity[]
  ipWhitelist: IPEntry[]
}

interface SecurityEvent {
  id: string
  action: string
  resource: string
  user_id: string
  ip_address: string
  created_at: string
  status_code?: number
  error_message?: string
}

interface SuspiciousActivity {
  id: string
  description: string
  ip_address: string
  user_agent: string
  created_at: string
}

interface IPEntry {
  id: string
  ip_address: string
  description: string
  active: boolean
  created_at: string
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLoginAttempts: 0,
    failedLoginAttempts: 0,
    activeSessions: 0,
    mfaEnabledUsers: 0,
    recentSecurityEvents: [],
    suspiciousActivities: [],
    ipWhitelist: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'sessions' | 'whitelist'>('overview')
  const [newIP, setNewIP] = useState({ address: '', description: '' })

  useEffect(() => {
    loadSecurityMetrics()
    const interval = setInterval(loadSecurityMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSecurityMetrics = async () => {
    try {
      // Get failed login attempts (last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: failedLogins } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .gte('attempt_time', oneDayAgo)

      // Get active sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .gt('expires_at', new Date().toISOString())

      // Get MFA enabled users count
      const { data: mfaUsers } = await supabase
        .from('customers')
        .select('id')
        .eq('mfa_enabled', true)

      // Get recent security events
      const { data: events } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      // Get suspicious activities
      const { data: suspicious } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('action', 'SUSPICIOUS_ACTIVITY')
        .order('created_at', { ascending: false })
        .limit(20)

      // Get IP whitelist
      const { data: whitelist } = await supabase
        .from('admin_ip_whitelist')
        .select('*')
        .order('created_at', { ascending: false })

      setMetrics({
        totalLoginAttempts: (failedLogins?.length || 0) + (sessions?.length || 0),
        failedLoginAttempts: failedLogins?.length || 0,
        activeSessions: sessions?.length || 0,
        mfaEnabledUsers: mfaUsers?.length || 0,
        recentSecurityEvents: events || [],
        suspiciousActivities: suspicious || [],
        ipWhitelist: whitelist || []
      })
    } catch (error) {
      console.error('Error loading security metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const addIPToWhitelist = async () => {
    if (!newIP.address) return

    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .insert({
          ip_address: newIP.address,
          description: newIP.description,
          active: true
        })

      if (error) throw error

      setNewIP({ address: '', description: '' })
      loadSecurityMetrics()
    } catch (error) {
      console.error('Error adding IP to whitelist:', error)
      alert('Errore nell\'aggiunta dell\'IP')
    }
  }

  const toggleIPStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_ip_whitelist')
        .update({ active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadSecurityMetrics()
    } catch (error) {
      console.error('Error toggling IP status:', error)
    }
  }

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
      loadSecurityMetrics()
    } catch (error) {
      console.error('Error terminating session:', error)
      alert('Errore nella terminazione della sessione')
    }
  }

  if (loading) {
    return <div className={styles.loading}>Caricamento metriche di sicurezza...</div>
  }

  return (
    <div className={styles.securityDashboard}>
      <h1>🔒 Centro Sicurezza</h1>

      {/* Security Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics.activeSessions}</div>
          <div className={styles.metricLabel}>Sessioni Attive</div>
          <div className={styles.metricTrend}>↑ Tempo reale</div>
        </div>

        <div className={`${styles.metricCard} ${styles.warning}`}>
          <div className={styles.metricValue}>{metrics.failedLoginAttempts}</div>
          <div className={styles.metricLabel}>Accessi Falliti (24h)</div>
          <div className={styles.metricTrend}>
            {metrics.failedLoginAttempts > 10 ? '⚠️ Alto' : '✓ Normale'}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{metrics.mfaEnabledUsers}</div>
          <div className={styles.metricLabel}>Utenti con MFA</div>
          <div className={styles.metricTrend}>🛡️ Protetti</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {Math.round((metrics.activeSessions / Math.max(metrics.totalLoginAttempts, 1)) * 100)}%
          </div>
          <div className={styles.metricLabel}>Tasso di Successo</div>
          <div className={styles.metricTrend}>📊 Ultimi accessi</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={selectedTab === 'overview' ? styles.active : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Panoramica
        </button>
        <button
          className={selectedTab === 'events' ? styles.active : ''}
          onClick={() => setSelectedTab('events')}
        >
          Eventi di Sicurezza
        </button>
        <button
          className={selectedTab === 'sessions' ? styles.active : ''}
          onClick={() => setSelectedTab('sessions')}
        >
          Sessioni Attive
        </button>
        <button
          className={selectedTab === 'whitelist' ? styles.active : ''}
          onClick={() => setSelectedTab('whitelist')}
        >
          IP Whitelist
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <div className={styles.overview}>
            <h2>Attività Sospette Recenti</h2>
            {metrics.suspiciousActivities.length === 0 ? (
              <p className={styles.noData}>Nessuna attività sospetta rilevata ✓</p>
            ) : (
              <div className={styles.eventsList}>
                {metrics.suspiciousActivities.map(activity => (
                  <div key={activity.id} className={styles.eventItem}>
                    <div className={styles.eventIcon}>⚠️</div>
                    <div className={styles.eventDetails}>
                      <div className={styles.eventDescription}>{activity.description}</div>
                      <div className={styles.eventMeta}>
                        IP: {activity.ip_address} • {new Date(activity.created_at).toLocaleString('it-IT')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2>Raccomandazioni di Sicurezza</h2>
            <div className={styles.recommendations}>
              {metrics.mfaEnabledUsers < 5 && (
                <div className={styles.recommendation}>
                  <span className={styles.icon}>📱</span>
                  <span>Attiva MFA per più utenti amministratori</span>
                </div>
              )}
              {metrics.failedLoginAttempts > 20 && (
                <div className={styles.recommendation}>
                  <span className={styles.icon}>🚫</span>
                  <span>Alto numero di tentativi falliti - Verifica possibili attacchi</span>
                </div>
              )}
              {metrics.ipWhitelist.length === 0 && (
                <div className={styles.recommendation}>
                  <span className={styles.icon}>🌐</span>
                  <span>Configura IP whitelist per accesso amministrativo</span>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'events' && (
          <div className={styles.events}>
            <h2>Eventi di Sicurezza Recenti</h2>
            <div className={styles.eventsTable}>
              <table>
                <thead>
                  <tr>
                    <th>Azione</th>
                    <th>Risorsa</th>
                    <th>IP</th>
                    <th>Stato</th>
                    <th>Data/Ora</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentSecurityEvents.map(event => (
                    <tr key={event.id} className={event.error_message ? styles.error : ''}>
                      <td>{event.action}</td>
                      <td>{event.resource}</td>
                      <td>{event.ip_address || 'N/A'}</td>
                      <td>
                        {event.status_code ? (
                          <span className={event.status_code >= 400 ? styles.statusError : styles.statusOk}>
                            {event.status_code}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>{new Date(event.created_at).toLocaleString('it-IT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'sessions' && (
          <div className={styles.sessions}>
            <h2>Sessioni Attive</h2>
            <div className={styles.sessionsList}>
              {metrics.activeSessions === 0 ? (
                <p className={styles.noData}>Nessuna sessione attiva</p>
              ) : (
                <div className={styles.eventsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Utente</th>
                        <th>IP</th>
                        <th>User Agent</th>
                        <th>Ultima Attività</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sessions would be mapped here */}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'whitelist' && (
          <div className={styles.whitelist}>
            <h2>Gestione IP Whitelist</h2>
            
            <div className={styles.addIP}>
              <input
                type="text"
                placeholder="Indirizzo IP (es. 192.168.1.1)"
                value={newIP.address}
                onChange={(e) => setNewIP({ ...newIP, address: e.target.value })}
              />
              <input
                type="text"
                placeholder="Descrizione"
                value={newIP.description}
                onChange={(e) => setNewIP({ ...newIP, description: e.target.value })}
              />
              <button onClick={addIPToWhitelist} className="button button-primary">
                Aggiungi IP
              </button>
            </div>

            <div className={styles.ipList}>
              {metrics.ipWhitelist.length === 0 ? (
                <p className={styles.noData}>Nessun IP in whitelist</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>IP</th>
                      <th>Descrizione</th>
                      <th>Stato</th>
                      <th>Aggiunto</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.ipWhitelist.map(ip => (
                      <tr key={ip.id}>
                        <td>{ip.ip_address}</td>
                        <td>{ip.description}</td>
                        <td>
                          <span className={ip.active ? styles.active : styles.inactive}>
                            {ip.active ? 'Attivo' : 'Disattivo'}
                          </span>
                        </td>
                        <td>{new Date(ip.created_at).toLocaleDateString('it-IT')}</td>
                        <td>
                          <button
                            onClick={() => toggleIPStatus(ip.id, ip.active)}
                            className={styles.toggleButton}
                          >
                            {ip.active ? 'Disattiva' : 'Attiva'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}