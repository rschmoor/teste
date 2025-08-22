'use client'

import { useEffect } from 'react'
import { usePerformance, reportWebVitals } from '@/hooks/usePerformance'

interface PerformanceMonitorProps {
  enableReporting?: boolean
  enableConsoleLogging?: boolean
}

export function PerformanceMonitor({ 
  enableReporting = true,
  enableConsoleLogging = process.env.NODE_ENV === 'development'
}: PerformanceMonitorProps) {
  const { metrics } = usePerformance((metric) => {
    if (enableReporting) {
      reportWebVitals(metric)
    }
    
    if (enableConsoleLogging) {
      const emoji = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴'
      console.log(`${emoji} ${metric.name.toUpperCase()}: ${metric.value}ms (${metric.rating})`)
    }
  })

  // Reportar métricas de navegação
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reportNavigationTiming = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation && enableConsoleLogging) {
          const metrics = {
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'TCP Connection': navigation.connectEnd - navigation.connectStart,
            'TLS Handshake': navigation.secureConnectionStart > 0 ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            'Request': navigation.responseStart - navigation.requestStart,
            'Response': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domComplete - navigation.responseEnd,
            'Load Complete': navigation.loadEventEnd - navigation.loadEventStart
          }

          console.group('📊 Navigation Timing')
          Object.entries(metrics).forEach(([name, value]) => {
            if (value > 0) {
              const status = value < 100 ? '🟢' : value < 300 ? '🟡' : '🔴'
              console.log(`${status} ${name}: ${value.toFixed(2)}ms`)
            }
          })
          console.groupEnd()
        }
      }
    }

    // Aguardar o carregamento completo
    if (document.readyState === 'complete') {
      reportNavigationTiming()
    } else {
      window.addEventListener('load', reportNavigationTiming)
      return () => window.removeEventListener('load', reportNavigationTiming)
    }
  }, [enableConsoleLogging])

  // Monitorar recursos carregados
  useEffect(() => {
    if (typeof window === 'undefined' || !enableConsoleLogging) return

    const reportResourceTiming = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      
      // Agrupar por tipo de recurso
      const resourcesByType = resources.reduce((acc, resource) => {
        const type = getResourceType(resource.name)
        if (!acc[type]) acc[type] = []
        acc[type].push(resource)
        return acc
      }, {} as Record<string, PerformanceResourceTiming[]>)

      console.group('📦 Resource Loading')
      Object.entries(resourcesByType).forEach(([type, resources]) => {
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        const avgDuration = resources.reduce((sum, r) => sum + r.duration, 0) / resources.length
        
        console.log(`${getResourceEmoji(type)} ${type}: ${resources.length} files, ${formatBytes(totalSize)}, avg ${avgDuration.toFixed(2)}ms`)
      })
      console.groupEnd()
    }

    const timer = setTimeout(reportResourceTiming, 2000) // Aguardar 2s após o carregamento
    return () => clearTimeout(timer)
  }, [enableConsoleLogging])

  return null // Componente invisível
}

// Utilitários
function getResourceType(url: string): string {
  if (url.includes('.js')) return 'JavaScript'
  if (url.includes('.css')) return 'CSS'
  if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'Images'
  if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'Fonts'
  if (url.includes('api/') || url.includes('/api')) return 'API'
  return 'Other'
}

function getResourceEmoji(type: string): string {
  const emojis: Record<string, string> = {
    'JavaScript': '📜',
    'CSS': '🎨',
    'Images': '🖼️',
    'Fonts': '🔤',
    'API': '🔌',
    'Other': '📄'
  }
  return emojis[type] || '📄'
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Hook para medir performance de operações específicas
export function useOperationTiming(operationName: string) {
  const startTiming = () => {
    const start = performance.now()
    
    return (additionalData?: Record<string, any>) => {
      const duration = performance.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️  ${operationName}: ${duration.toFixed(2)}ms`, additionalData)
      }
      
      // Reportar para analytics se necessário
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name: operationName,
          value: Math.round(duration)
        })
      }
      
      return duration
    }
  }
  
  return { startTiming }
}