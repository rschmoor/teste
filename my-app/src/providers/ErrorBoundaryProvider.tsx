'use client'

import React, { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { toast } from 'sonner'

interface ErrorBoundaryProviderProps {
  children: ReactNode
}

export function ErrorBoundaryProvider({ children }: ErrorBoundaryProviderProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary:', error, errorInfo)
    }

    // Report to error monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      console.error('Production Error:', error.message)
    }

    // Show user-friendly notification
    toast.error('Erro na aplicação', {
      description: 'Ocorreu um erro inesperado. A página será recarregada.',
      duration: 5000,
      action: {
        label: 'Recarregar agora',
        onClick: () => window.location.reload()
      }
    })
  }

  return (
    <ErrorBoundary
      level="critical"
      onError={handleError}
      showToast={false} // We handle toast manually above
    >
      {children}
    </ErrorBoundary>
  )
}

// Fallback components for different sections
export function AdminErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Erro no Painel Administrativo</h2>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro inesperado no painel administrativo.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  )
}

export function SearchErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Erro na Busca</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os resultados da busca.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  )
}

export function CartErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Erro no Carrinho</h2>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro ao carregar o carrinho de compras.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Recarregar
        </button>
      </div>
    </div>
  )
}

export function CheckoutErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Erro no Checkout</h2>
        <p className="text-muted-foreground mb-4">
          Ocorreu um erro durante o processo de checkout.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  )
}

export function ProductErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">Erro ao Carregar Produto</h2>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar as informações do produto.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  )
}

// Specific error boundaries for different sections
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page" showToast={true}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component" showToast={false}>
      {children}
    </ErrorBoundary>
  )
}

// Error boundary for async operations
export function AsyncErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const handleAsyncError = (error: Error) => {
    console.error('Async operation error:', error)
    
    toast.error('Erro na operação', {
      description: error.message || 'Falha ao executar operação.',
      action: {
        label: 'Tentar novamente',
        onClick: () => window.location.reload()
      }
    })
  }

  return (
    <ErrorBoundary
      level="component"
      onError={handleAsyncError}
      fallback={fallback}
      showToast={false}
    >
      {children}
    </ErrorBoundary>
  )
}