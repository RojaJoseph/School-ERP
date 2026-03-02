import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import { toast } from 'react-toastify'

interface UseApiOptions<T> {
  url: string
  params?: Record<string, any>
  transform?: (data: any) => T
  onError?: (err: any) => void
  enabled?: boolean
}

export function useApi<T>({ url, params, transform, onError, enabled = true }: UseApiOptions<T>) {
  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url, { params })
      setData(transform ? transform(res.data) : res.data)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to load data'
      setError(msg)
      if (onError) onError(err)
    } finally {
      setLoading(false)
    }
  }, [url, JSON.stringify(params), enabled])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
