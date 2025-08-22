'use client'

import { lazy, ComponentType, LazyExoticComponent, Suspense, useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import * as React from 'react'

// Tipo para componentes lazy
type LazyComponentType<T extends Record<string, unknown> = Record<string, unknown>> = LazyExoticComponent<ComponentType<T>>

// Hook para criar componentes lazy com fallback personalizado
export function useLazyComponent<T extends Record<string, unknown> = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>
): LazyComponentType<T> {
  return lazy(importFn)
}

// Wrapper para Suspense com fallback padrão
interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  wrapperClass?: string
}

export function LazyWrapper({ children, fallback, wrapperClass }: LazyWrapperProps) {
  const defaultFallback = fallback || <Skeleton className={wrapperClass} />
  
  return (
    <Suspense fallback={defaultFallback}>
      {children}
    </Suspense>
  )
}

// Componentes lazy pré-configurados para uso comum
export const LazyComponents = {
  // Product components
  ProductCard: lazy(() => import('@/components/product/ProductCard')),
  ProductGrid: lazy(() => import('@/components/product/ProductGrid')),
  ProductDetail: lazy(() => import('@/components/product/ProductDetail')),
  ProductGallery: lazy(() => import('@/components/product/ProductGallery')),
  
  // Cart components
  CartSidebar: lazy(() => import('@/components/cart/CartSidebar')),
  CartItem: lazy(() => import('@/components/cart/CartItem')),
  CartSummary: lazy(() => import('@/components/cart/CartSummary')),
  
  // Checkout components
  CheckoutForm: lazy(() => import('@/components/checkout/CheckoutForm')),
  PaymentForm: lazy(() => import('@/components/checkout/PaymentForm')),
  ShippingForm: lazy(() => import('@/components/checkout/ShippingForm')),
  
  // Admin components
  AdminDashboard: lazy(() => import('@/components/admin/Dashboard')),
  ProductManager: lazy(() => import('@/components/admin/ProductManager')),
  OrderManager: lazy(() => import('@/components/admin/OrderManager')),
  ChatViewer: lazy(() => import('@/components/admin/ChatViewer')),
  
  // UI components
  DataTable: lazy(() => import('@/components/ui/data-table')),
  ImageGallery: lazy(() => import('@/components/ui/optimized-image').then(m => ({ default: m.ImageGallery }))),
  Chart: lazy(() => import('@/components/ui/chart')),
  
  // Modal components
  Modal: lazy(() => import('@/components/ui/modal')),
  Dialog: lazy(() => import('@/components/ui/dialog')),
  Drawer: lazy(() => import('@/components/ui/drawer')),
  
  // Form components
  ContactForm: lazy(() => import('@/components/forms/ContactForm')),
  NewsletterForm: lazy(() => import('@/components/forms/NewsletterForm')),
  ReviewForm: lazy(() => import('@/components/forms/ReviewForm')),
}

// Fallbacks pré-configurados
export const LazyFallbacks = {
  ProductCard: () => <Skeleton className="h-80 w-full rounded-lg" />,
  ProductGrid: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-80 w-full rounded-lg" />
      ))}
    </div>
  ),
  ProductDetail: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton className="h-96 w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  ),
  CartSidebar: () => (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-16 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
  AdminDashboard: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    </div>
  ),
  Form: () => (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  ),
  Chart: () => <Skeleton className="h-64 w-full rounded-lg" />,
  Table: () => (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  ),
}

// Hook para preload de componentes
export function usePreloadComponent(importFn: () => Promise<unknown>) {
  return {
    preload: () => {
      importFn()
    }
  }
}

// Hook para lazy loading baseado em visibilidade
export function useLazyLoadOnView<T extends Record<string, unknown> = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: IntersectionObserverInit = {}
) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      options
    )

    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref, shouldLoad, options])

  const LazyComponent = shouldLoad ? lazy(importFn) : null

  return { LazyComponent, setRef, shouldLoad }
}

// Componente para lazy loading baseado em visibilidade
interface LazyOnViewProps<T extends Record<string, unknown> = Record<string, unknown>> {
  importFn: () => Promise<{ default: ComponentType<T> }>
  fallback?: React.ReactNode
  props?: T
  containerClass?: string
  observerOptions?: IntersectionObserverInit
}

export function LazyOnView<T extends Record<string, unknown> = Record<string, unknown>>({ 
  importFn, 
  fallback, 
  props, 
  containerClass,
  observerOptions 
}: LazyOnViewProps<T>) {
  const { LazyComponent, setRef, shouldLoad } = useLazyLoadOnView(importFn, observerOptions)
  
  if (!shouldLoad) {
    return (
      <div 
        ref={setRef} 
        className={containerClass}
      >
        {fallback || <Skeleton className="h-32 w-full" />}
      </div>
    )
  }
  
  if (!LazyComponent) {
    return fallback || <Skeleton className={containerClass} />
  }
  
  return (
    <Suspense fallback={fallback || <Skeleton className={containerClass} />}>
      <LazyComponent {...(props as T)} />
    </Suspense>
  )
}

// Componentes de rota lazy
export const RouteComponents = {
  Home: lazy(() => import('@/app/page')),
  Products: lazy(() => import('@/app/produtos/page')),
  ProductDetail: lazy(() => import('@/app/produtos/[id]/page')),
  Cart: lazy(() => import('@/app/carrinho/page')),
  Checkout: lazy(() => import('@/app/checkout/page')),
  Profile: lazy(() => import('@/app/perfil/page')),
  Admin: lazy(() => import('@/app/admin/page')),
  AdminDashboard: lazy(() => import('@/app/admin/dashboard/page')),
  AdminProducts: lazy(() => import('@/app/admin/produtos/page')),
  AdminOrders: lazy(() => import('@/app/admin/pedidos/page')),
  AdminChat: lazy(() => import('@/app/admin/chat/page')),
}

// Hook para analytics de lazy loading
export function useLazyLoadingAnalytics() {
  const trackLazyLoad = (componentName: string, loadTime: number) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'lazy_component_load', {
        component_name: componentName,
        load_time: loadTime,
        event_category: 'performance'
      })
    }
  }

  return { trackLazyLoad }
}