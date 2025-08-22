'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showToast?: boolean
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Show toast notification
    if (this.props.showToast !== false) {
      toast.error('Ops! Algo deu errado', {
        description: 'Ocorreu um erro inesperado. Tente recarregar a página.',
        action: {
          label: 'Recarregar',
          onClick: () => window.location.reload()
        }
      })
    }

    // Report error to monitoring service (e.g., Sentry)
    // if (process.env.NODE_ENV === 'production') {
    //   reportError(error, errorInfo)
    // }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI based on error level
      return this.renderDefaultFallback()
    }

    return this.props.children
  }

  private renderDefaultFallback() {
    const { level = 'component' } = this.props
    const { error } = this.state

    if (level === 'critical') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                Erro Crítico
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Ocorreu um erro crítico na aplicação. Por favor, recarregue a página ou entre em contato com o suporte.
              </p>
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="text-left bg-gray-100 p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{error.toString()}</pre>
                </details>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (level === 'page') {
      return (
        <div className="min-h-[400px] flex items-center justify-center px-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg text-gray-900">
                Erro na Página
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Não foi possível carregar esta página. Tente novamente ou volte para a página anterior.
              </p>
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="text-left bg-gray-100 p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{error.toString()}</pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button variant="outline" onClick={this.handleGoBack} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    // Component level error
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Erro no Componente
            </h3>
            <p className="text-sm text-red-700 mb-3">
              Este componente encontrou um erro e não pode ser exibido.
            </p>
            
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mb-3">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Detalhes do erro
                </summary>
                <pre className="mt-1 text-xs text-red-700 whitespace-pre-wrap bg-red-100 p-2 rounded">
                  {error.toString()}
                </pre>
              </details>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleRetry}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }
}

// Hook para usar error boundary programaticamente
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Log error
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // Show toast
    toast.error('Erro inesperado', {
      description: error.message || 'Ocorreu um erro inesperado.',
      action: {
        label: 'Recarregar',
        onClick: () => window.location.reload()
      }
    })
    
    // Report to monitoring service
    // reportError(error, errorInfo)
  }
}

// Higher-order component para envolver componentes com error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Componentes específicos para diferentes tipos de erro
export function ProductErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="p-6 text-center border border-gray-200 rounded-lg bg-gray-50">
      <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Erro ao carregar produto
      </h3>
      <p className="text-gray-600 mb-4">
        Não foi possível carregar as informações do produto.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  )
}

export function CartErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="p-4 text-center">
      <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
      <p className="text-sm text-gray-600 mb-3">
        Erro ao carregar carrinho
      </p>
      <Button size="sm" onClick={onRetry} variant="outline">
        <RefreshCw className="w-3 h-3 mr-1" />
        Tentar Novamente
      </Button>
    </div>
  )
}

export function SearchErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="p-8 text-center">
      <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Erro na busca
      </h3>
      <p className="text-gray-600 mb-4">
        Não foi possível realizar a busca. Tente novamente.
      </p>
      <Button onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  )
}