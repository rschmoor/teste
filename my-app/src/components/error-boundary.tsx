'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // Chamar callback personalizado se fornecido
    this.props.onError?.(error, errorInfo)

    // Em produção, enviar erro para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Implementar integração com serviços como Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      // Enviar para API de logging
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch(console.error)
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleReportBug = () => {
    const { error, errorInfo } = this.state
    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      component: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    // Abrir modal de report ou redirecionar para formulário
    const subject = encodeURIComponent('Bug Report - Boutique Store')
    const body = encodeURIComponent(`
Descrição do erro:
${JSON.stringify(bugReport, null, 2)}

Descreva o que você estava fazendo quando o erro ocorreu:

`)
    
    window.open(`mailto:support@boutique.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback padrão
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Oops! Algo deu errado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Detalhes do erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Detalhes do erro:</h3>
                  <p className="text-sm text-gray-700 font-mono break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600">
                        Stack trace
                      </summary>
                      <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="space-y-3">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">
                      <Home className="mr-2 h-4 w-4" />
                      Ir para início
                    </Link>
                  </Button>
                  
                  <Button 
                    onClick={this.handleReportBug}
                    variant="outline" 
                    className="w-full"
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Reportar bug
                  </Button>
                </div>
              </div>

              {/* Informações de ajuda */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  O que você pode fazer:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Recarregar a página</li>
                  <li>• Verificar sua conexão com a internet</li>
                  <li>• Tentar novamente em alguns minutos</li>
                  <li>• Entrar em contato conosco se o problema persistir</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar error boundary com hooks
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Implementar logging
    }
  }
}

// Componente funcional para error boundary
export function ErrorBoundaryWrapper({ 
  children, 
  fallback,
  onError 
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

// Error boundary específico para componentes de produto
export function ProductErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar produto</h3>
          <p className="text-gray-600 mb-4">Não foi possível carregar as informações do produto.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary para carrinho
export function CartErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro no carrinho</h3>
          <p className="text-gray-600 mb-4">Houve um problema com seu carrinho de compras.</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Recarregar
            </Button>
            <Button asChild>
              <Link href="/produtos">
                Continuar comprando
              </Link>
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary