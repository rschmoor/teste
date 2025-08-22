'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff, Download, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOnline: boolean
  hasUpdate: boolean
  isUpdating: boolean
  registration: ServiceWorkerRegistration | null
  version: string
}

export function ServiceWorkerManager() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    isUpdating: false,
    registration: null,
    version: '1.0.0'
  })

  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [cacheSize, setCacheSize] = useState<string>('0 MB')

  useEffect(() => {
    // Verificar suporte ao Service Worker
    if ('serviceWorker' in navigator) {
      setSwState(prev => ({ ...prev, isSupported: true }))
      registerServiceWorker()
    }

    // Listeners para status da conexão
    const handleOnline = () => setSwState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSwState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Calcular tamanho do cache
    calculateCacheSize()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      setSwState(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }))

      // Verificar se há uma atualização esperando
      if (registration.waiting) {
        setSwState(prev => ({ ...prev, hasUpdate: true }))
        setShowUpdatePrompt(true)
      }

      // Listener para novas atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwState(prev => ({ ...prev, hasUpdate: true }))
              setShowUpdatePrompt(true)
            }
          })
        }
      })

      // Listener para mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data
        
        switch (type) {
          case 'SW_VERSION':
            setSwState(prev => ({ ...prev, version: payload.version }))
            break
          case 'CACHE_UPDATED':
            toast.success('Cache atualizado com sucesso!')
            calculateCacheSize()
            break
          case 'OFFLINE_FALLBACK':
            toast.info('Você está offline. Mostrando conteúdo em cache.')
            break
        }
      })

      // Solicitar versão do Service Worker
      if (registration.active) {
        registration.active.postMessage({ type: 'GET_VERSION' })
      }

      console.log('Service Worker registrado com sucesso')
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error)
      toast.error('Erro ao registrar Service Worker')
    }
  }

  const updateServiceWorker = async () => {
    if (!swState.registration) return

    setSwState(prev => ({ ...prev, isUpdating: true }))

    try {
      // Enviar mensagem para o Service Worker pular a espera
      if (swState.registration.waiting) {
        swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      // Aguardar o novo Service Worker assumir o controle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      setShowUpdatePrompt(false)
      toast.success('Atualizando aplicação...')
    } catch (error) {
      console.error('Erro ao atualizar Service Worker:', error)
      toast.error('Erro ao atualizar aplicação')
    } finally {
      setSwState(prev => ({ ...prev, isUpdating: false }))
    }
  }

  const clearCache = async () => {
    if (!swState.registration) return

    try {
      // Enviar mensagem para limpar cache
      if (swState.registration.active) {
        swState.registration.active.postMessage({ type: 'CLEAR_CACHE' })
      }

      // Limpar cache do navegador também
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      setCacheSize('0 MB')
      toast.success('Cache limpo com sucesso!')
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
      toast.error('Erro ao limpar cache')
    }
  }

  const calculateCacheSize = async () => {
    if (!('caches' in window)) return

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()
        
        for (const request of requests) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
      setCacheSize(`${sizeInMB} MB`)
    } catch (error) {
      console.error('Erro ao calcular tamanho do cache:', error)
    }
  }

  const forceUpdate = async () => {
    if (!swState.registration) return

    try {
      await swState.registration.update()
      toast.success('Verificando atualizações...')
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error)
      toast.error('Erro ao verificar atualizações')
    }
  }

  if (!swState.isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200">
            Service Worker não suportado
          </CardTitle>
          <CardDescription className="text-yellow-700 dark:text-yellow-300">
            Seu navegador não suporta Service Workers. Algumas funcionalidades offline podem não estar disponíveis.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Prompt de Atualização */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-200">
                  Nova versão disponível!
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Uma nova versão da aplicação está disponível. Atualize para obter as últimas funcionalidades.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={updateServiceWorker}
                    disabled={swState.isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {swState.isUpdating ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {swState.isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUpdatePrompt(false)}
                  >
                    Depois
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status do Service Worker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {swState.isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              Status da Aplicação
            </CardTitle>
            <Badge variant={swState.isRegistered ? 'default' : 'secondary'}>
              v{swState.version}
            </Badge>
          </div>
          <CardDescription>
            Informações sobre o Service Worker e cache da aplicação
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={swState.isOnline ? 'default' : 'destructive'}>
                  {swState.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Service Worker:</span>
                <Badge variant={swState.isRegistered ? 'default' : 'secondary'}>
                  {swState.isRegistered ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cache:</span>
                <span className="text-sm text-muted-foreground">{cacheSize}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Atualização:</span>
                <Badge variant={swState.hasUpdate ? 'destructive' : 'default'}>
                  {swState.hasUpdate ? 'Disponível' : 'Atualizado'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={forceUpdate}
              disabled={swState.isUpdating}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar Atualizações
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook para usar o Service Worker
export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Registrar Service Worker se suportado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          setRegistration(reg)
          
          // Verificar atualizações
          if (reg.waiting) {
            setHasUpdate(true)
          }
          
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true)
                }
              })
            }
          })
        })
        .catch(console.error)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateApp = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  return {
    isOnline,
    hasUpdate,
    updateApp,
    registration
  }
}