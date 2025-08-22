import { useState, useCallback, useRef } from 'react'

interface OptimisticState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface MutationResult<TData> {
  mutate: (fn: () => Promise<TData>) => Promise<TData | null>
  reset: () => void
  state: OptimisticState<TData>
}

export function useOptimisticUpdates<T>(): MutationResult<T> {
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isLoading: false,
    error: null,
  })
  const mountedRef = useRef(true)

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null })
  }, [])

  const mutate = useCallback(async (fn: () => Promise<T>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await fn()
      if (!mountedRef.current) return null
      setState({ data: result, isLoading: false, error: null })
      return result
    } catch (err) {
      if (!mountedRef.current) return null
      const message = err instanceof Error ? err.message : 'Erro inesperado'
      setState(prev => ({ ...prev, isLoading: false, error: message }))
      return null
    }
  }, [])

  return {
    mutate,
    reset,
    state,
  }
}