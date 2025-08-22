'use client'

import { useEffect } from 'react'
import { initializePerformanceMonitoring } from '@/utils/performance'

export function PerformanceInitializer() {
  useEffect(() => {
    initializePerformanceMonitoring()
  }, [])

  return null
}