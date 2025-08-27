'use client'

import { useState, useEffect } from 'react'

/**
 * React hook for CSRF token
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        setToken(data.token)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err)
        setLoading(false)
      })
  }, [])
  
  return { token, loading }
}