'use client'

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals'
import { useState, useEffect } from 'react'

// Interface para gtag
interface GtagWindow extends Window {
  gtag: (command: string, action: string, parameters: Record<string, unknown>) => void
}

// Interface para navigator connection
interface NavigatorConnection extends Navigator {
  connection: {
    effectiveType: string
  }
}

// Tipos para métricas de performance
interface PerformanceMetrics {
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
}

// Thresholds para Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // ms
  FID: { good: 100, poor: 300 }, // ms
  CLS: { good: 0.1, poor: 0.25 }, // score
  FCP: { good: 1800, poor: 3000 }, // ms
  TTFB: { good: 800, poor: 1800 }, // ms
}

// Função para classificar métricas
function getMetricRating(name: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Classe para gerenciar métricas de performance
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  }

  private callbacks: Array<(metrics: PerformanceMetrics) => void> = []

  constructor() {
    this.initializeMetrics()
  }

  private initializeMetrics() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    getLCP((metric: Metric) => {
      this.metrics.lcp = metric.value
      this.notifyCallbacks()
      this.sendToAnalytics('LCP', metric)
    })

    // First Input Delay
    getFID((metric: Metric) => {
      this.metrics.fid = metric.value
      this.notifyCallbacks()
      this.sendToAnalytics('FID', metric)
    })

    // Cumulative Layout Shift
    getCLS((metric: Metric) => {
      this.metrics.cls = metric.value
      this.notifyCallbacks()
      this.sendToAnalytics('CLS', metric)
    })

    // First Contentful Paint
    getFCP((metric: Metric) => {
      this.metrics.fcp = metric.value
      this.notifyCallbacks()
      this.sendToAnalytics('FCP', metric)
    })

    // Time to First Byte
    getTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value
      this.notifyCallbacks()
      this.sendToAnalytics('TTFB', metric)
    })
  }

  private sendToAnalytics(name: string, metric: Metric) {
    const rating = getMetricRating(name as keyof typeof THRESHOLDS, metric.value)
    
    // Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as GtagWindow).gtag('event', name, {
        value: Math.round(metric.value),
        metric_rating: rating,
        metric_delta: metric.delta,
        metric_id: metric.id,
        page_path: window.location.pathname,
      })
    }

    // Console log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`${name}: ${metric.value} (${rating})`, metric)
    }

    // Enviar para serviço de monitoramento personalizado
    this.sendToCustomAnalytics(name, metric, rating)
  }

  private async sendToCustomAnalytics(name: string, metric: Metric, rating: string) {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          value: metric.value,
          rating,
          delta: metric.delta,
          id: metric.id,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      })
    } catch (error) {
      console.error('Erro ao enviar métricas:', error)
    }
  }

  private notifyCallbacks() {
    this.callbacks.forEach(callback => callback(this.metrics))
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public getScore(): number {
    const { lcp, fid, cls } = this.metrics
    if (lcp === null || fid === null || cls === null) return 0

    let score = 0
    
    // LCP Score (40% weight)
    if (lcp <= THRESHOLDS.LCP.good) score += 40
    else if (lcp <= THRESHOLDS.LCP.poor) score += 20
    
    // FID Score (30% weight)
    if (fid <= THRESHOLDS.FID.good) score += 30
    else if (fid <= THRESHOLDS.FID.poor) score += 15
    
    // CLS Score (30% weight)
    if (cls <= THRESHOLDS.CLS.good) score += 30
    else if (cls <= THRESHOLDS.CLS.poor) score += 15

    return score
  }
}

// Instância global do monitor
export const performanceMonitor = new PerformanceMonitor()

// Hook para usar métricas de performance
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  })

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setMetrics)
    setMetrics(performanceMonitor.getMetrics())
    return unsubscribe
  }, [])

  return metrics
}

// Utilitários para otimização de performance

// Preload de recursos críticos
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (type) link.type = type
  document.head.appendChild(link)
}

// Prefetch de recursos
export function prefetchResource(href: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

// DNS prefetch
export function dnsPrefetch(hostname: string) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = `//${hostname}`
  document.head.appendChild(link)
}

// Preconnect
export function preconnect(href: string, crossorigin = false) {
  if (typeof document === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = href
  if (crossorigin) link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
}

// Otimização de imagens
export function optimizeImage(src: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
} = {}) {
  const { width, height, quality = 75, format = 'webp' } = options
  
  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  params.set('f', format)
  
  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`
}

// Debounce para otimizar eventos
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle para otimizar eventos
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Intersection Observer para lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  if (typeof window === 'undefined') return null

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  })
}

// Medição de performance customizada
export class PerformanceMeasure {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
  }

  end(): number {
    const duration = performance.now() - this.startTime
    
    // Marcar no Performance Timeline
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${this.name}-end`)
      performance.measure(this.name, `${this.name}-start`, `${this.name}-end`)
    }

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`${this.name}: ${duration.toFixed(2)}ms`)
    }

    // Enviar para analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as GtagWindow).gtag('event', 'timing_complete', {
        name: this.name,
        value: Math.round(duration),
      })
    }

    return duration
  }
}

// Função para iniciar medição
export function startMeasure(name: string): PerformanceMeasure {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${name}-start`)
  }
  return new PerformanceMeasure(name)
}

// Bundle analyzer para desenvolvimento
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  console.group('Bundle Analysis')
  
  scripts.forEach((script: HTMLScriptElement) => {
    console.log('Script:', script.src)
  })
  
  styles.forEach((style: HTMLLinkElement) => {
    console.log('Style:', style.href)
  })
  
  console.groupEnd()
}

// Detectar conexão lenta
export function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false
  }
  
  const connection = (navigator as NavigatorConnection).connection
  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
}

// Otimizações baseadas na conexão
export function getOptimizationsForConnection() {
  const isSlow = isSlowConnection()
  
  return {
    imageQuality: isSlow ? 50 : 75,
    enableLazyLoading: true,
    prefetchLimit: isSlow ? 2 : 5,
    enableServiceWorker: true,
    cacheStrategy: isSlow ? 'cache-first' : 'network-first',
  }
}

// Inicializar otimizações automáticas
export function initializePerformanceOptimizations() {
  if (typeof window === 'undefined') return

  // Preconnect para recursos externos
  preconnect('https://fonts.googleapis.com')
  preconnect('https://fonts.gstatic.com', true)
  
  // DNS prefetch para CDNs
  dnsPrefetch('cdn.jsdelivr.net')
  dnsPrefetch('unpkg.com')
  
  // Analisar bundle em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    setTimeout(analyzeBundleSize, 2000)
  }
  

}

// Auto-inicializar quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Aguardar o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePerformanceOptimizations)
  } else {
    initializePerformanceOptimizations()
  }
}