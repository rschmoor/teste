'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WifiOff, RefreshCw, Home, ShoppingBag, Heart, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function OfflinePage() {
  const router = useRouter()
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [cachedData, setCachedData] = useState<any>(null)

  useEffect(() => {
    // Verificar status da conexão
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Listeners para mudanças de conexão
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Status inicial
    updateOnlineStatus()

    // Tentar carregar dados do cache
    loadCachedData()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const loadCachedData = async () => {
    try {
      // Tentar carregar dados do cache do Service Worker
      const cache = await caches.open('boutique-api-v1')
      const cachedResponse = await cache.match('/api/products')
      
      if (cachedResponse) {
        const data = await cachedResponse.json()
        setCachedData(data)
      }
    } catch (error) {
      console.log('Nenhum dado em cache disponível')
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    
    try {
      // Tentar fazer uma requisição simples para verificar conectividade
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        // Se a conexão foi restaurada, redirecionar para a página anterior
        router.back()
      } else {
        throw new Error('Ainda offline')
      }
    } catch (error) {
      // Ainda offline, mostrar feedback
      setTimeout(() => setIsRetrying(false), 2000)
    }
  }

  const quickActions = [
    {
      icon: Home,
      label: 'Página Inicial',
      href: '/',
      description: 'Voltar ao início',
      available: true
    },
    {
      icon: ShoppingBag,
      label: 'Produtos',
      href: '/produtos',
      description: 'Ver produtos em cache',
      available: !!cachedData
    },
    {
      icon: Heart,
      label: 'Favoritos',
      href: '/wishlist',
      description: 'Seus produtos favoritos',
      available: true
    },
    {
      icon: Clock,
      label: 'Histórico',
      href: '/orders',
      description: 'Pedidos anteriores',
      available: true
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header com animação */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <WifiOff className="w-12 h-12 text-gray-500 dark:text-gray-400" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Você está offline
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Não foi possível conectar à internet. Mas você ainda pode navegar pelo conteúdo em cache!
          </p>
        </motion.div>

        {/* Status da conexão */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`} />
                Status: {isOnline ? 'Online' : 'Offline'}
              </CardTitle>
              <CardDescription>
                {isOnline 
                  ? 'Conexão restaurada! Você pode navegar normalmente.'
                  : 'Aguardando conexão com a internet...'
                }
              </CardDescription>
            </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Funcionalidades disponíveis offline */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              Disponível offline:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Produtos visualizados recentemente</li>
              <li>• Carrinho de compras salvo</li>
              <li>• Páginas visitadas anteriormente</li>
              <li>• Configurações da conta</li>
            </ul>
          </div>

          {/* Ações disponíveis */}
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
              variant="default"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando conexão...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/produtos">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Produtos
                </Link>
              </Button>
            </div>
          </div>

          {/* Dicas para o usuário */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Dicas:
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Verifique sua conexão Wi-Fi</li>
              <li>• Tente alternar entre Wi-Fi e dados móveis</li>
              <li>• Aguarde alguns instantes e tente novamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
        </motion.div>

      {/* Indicador de status da conexão */}
      <div className="fixed bottom-4 left-4 right-4">
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 flex items-center justify-center max-w-sm mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-700 font-medium">
              Sem conexão com a internet
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}