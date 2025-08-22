'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Verificar se é iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Verificar se já está instalado (modo standalone)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Verificar se já foi instalado via PWA
    if ('getInstalledRelatedApps' in navigator) {
      const navWithRelated = navigator as unknown as { getInstalledRelatedApps?: () => Promise<unknown[]> };
      navWithRelated.getInstalledRelatedApps?.().then((relatedApps) => {
        setIsInstalled((relatedApps?.length ?? 0) > 0)
      })
    }

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevenir o prompt automático
      e.preventDefault()
      
      // Salvar o evento para usar depois
      setDeferredPrompt(e)
      
      // Mostrar nosso prompt customizado após um delay
      setTimeout(() => {
        if (!isInstalled && !isStandalone) {
          setShowPrompt(true)
        }
      }, 10000) // Mostrar após 10 segundos
    }

    // Listener para quando o app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // Mostrar feedback de sucesso
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('App Instalado!', {
            body: 'Boutique foi instalado com sucesso no seu dispositivo.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
          })
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled, isStandalone])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Mostrar o prompt de instalação
    deferredPrompt.prompt()

    // Aguardar a escolha do usuário
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('PWA instalado pelo usuário')
    } else {
      console.log('PWA rejeitado pelo usuário')
    }

    // Limpar o prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    
    // Não mostrar novamente por 7 dias
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Verificar se foi dispensado recentemente
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false)
        return
      }
    }
  }, [])

  // Não mostrar se já instalado ou em modo standalone
  if (isInstalled || isStandalone) {
    return null
  }

  // Prompt para iOS (instruções manuais)
  if (isIOS && showPrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                    Instalar App
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-blue-800 dark:text-blue-200">
                Adicione à tela inicial para acesso rápido
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Como instalar:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Toque no ícone de compartilhar</li>
                  <li>Selecione "Adicionar à Tela Inicial"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Prompt para Android/Desktop
  if (showPrompt && deferredPrompt) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-lg text-green-900 dark:text-green-100">
                    Instalar Boutique
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-green-600 hover:text-green-800 dark:text-green-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription className="text-green-800 dark:text-green-200">
                Instale nosso app para uma experiência mais rápida e offline
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <Monitor className="w-4 h-4" />
                  <span>Funciona offline</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleInstallClick}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                    className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300"
                  >
                    Agora não
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}

// Hook para verificar se o PWA está instalado
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Verificar modo standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Verificar se pode instalar
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true)
    }

    // Verificar se foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return {
    isInstalled,
    isStandalone,
    canInstall,
    isPWA: isInstalled || isStandalone
  }
}