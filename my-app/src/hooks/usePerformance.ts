'use client'

import { useEffect, useCallback, useRef } from 'react'

declare global {
  interface Window {
    gtag?: (command: string, name: string, params: Record<string, unknown>) => void
  }
}

// Tipos para Core Web Vitals
interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

interface PerformanceMetrics {
  lcp?: WebVitalMetric // Largest Contentful Paint
  fid?: WebVitalMetric // First Input Delay
  cls?: WebVitalMetric // Cumulative Layout Shift
  fcp?: WebVitalMetric // First Contentful Paint
  ttfb?: WebVitalMetric // Time to First Byte
}

// Thresholds para Core Web Vitals
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 }
}

// Função para determinar rating
function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

// Hook principal para monitoramento de performance
export function usePerformance(onMetric?: (metric: WebVitalMetric) => void) {
  const metricsRef = useRef<PerformanceMetrics>({})

  const reportMetric = useCallback((metric: WebVitalMetric) => {
    metricsRef.current[metric.name as keyof PerformanceMetrics] = metric
    onMetric?.(metric)
    
    // Log em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 ${metric.name}: ${metric.value}ms (${metric.rating})`, metric)
    }
  }, [onMetric])

  useEffect(() => {
    // Importar web-vitals dinamicamente
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportMetric)
      getFID(reportMetric)
      getFCP(reportMetric)
      getLCP(reportMetric)
      getTTFB(reportMetric)
    }).catch(() => {
      // Fallback manual se web-vitals não estiver disponível
      measurePerformanceManually()
    })
  }, [reportMetric, measurePerformanceManually])

  // Medição manual de performance
  const measurePerformanceManually = useCallback(() => {
    if (typeof window === 'undefined') return

    // Performance Observer para LCP
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as LargestContentfulPaint
          
          if (lastEntry) {
            const metric: WebVitalMetric = {
              name: 'lcp',
              value: lastEntry.startTime,
              rating: getRating(lastEntry.startTime, THRESHOLDS.lcp),
              delta: lastEntry.startTime,
              id: `lcp-${Date.now()}`
            }
            reportMetric(metric)
          }
        })
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (error) {
        console.warn('Performance Observer não suportado:', error)
      }
    }

    // Navigation Timing para TTFB
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart
        const metric: WebVitalMetric = {
          name: 'ttfb',
          value: ttfb,
          rating: getRating(ttfb, THRESHOLDS.ttfb),
          delta: ttfb,
          id: `ttfb-${Date.now()}`
        }
        reportMetric(metric)
      }
    }
  }, [reportMetric])

  return {
    metrics: metricsRef.current,
    measurePerformance: measurePerformanceManually
  }
}

// Hook para monitorar performance de componentes
export function useComponentPerformance(componentName: string) {
  const startTimeRef = useRef<number>()
  const renderCountRef = useRef(0)

  useEffect(() => {
    startTimeRef.current = performance.now()
    renderCountRef.current += 1

    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${componentName} render #${renderCountRef.current}: ${renderTime.toFixed(2)}ms`)
          
          // Alerta para renders lentos
          if (renderTime > 16) {
            console.warn(`🐌 Render lento detectado em ${componentName}: ${renderTime.toFixed(2)}ms`)
          }
        }
      }
    }
  })

  const measureAsyncOperation = useCallback((operationName: string) => {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️  ${componentName}.${operationName}: ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
  }, [componentName])

  return {
    renderCount: renderCountRef.current,
    measureAsyncOperation
  }
}

// Hook para lazy loading com performance
export function useLazyLoading<T extends HTMLElement>(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const elementRef = useRef<T>(null)
  const isIntersectingRef = useRef(false)
  const observerRef = useRef<IntersectionObserver>()

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isIntersectingRef.current) {
          isIntersectingRef.current = true
          
          // Medir tempo até o elemento entrar na viewport
          const loadTime = performance.now()
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`👁️  Elemento entrou na viewport em: ${loadTime.toFixed(2)}ms`)
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    observerRef.current = observer

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  return {
    ref: elementRef,
    isIntersecting: isIntersectingRef.current
  }
}

// Função para reportar métricas para analytics
export function reportWebVitals(metric: WebVitalMetric) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'cls' ? metric.value * 1000 : metric.value),
      non_interaction: true
    })
  }

  // Console log em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id
    })
  }
}