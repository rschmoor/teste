'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

export function MobileNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount: cartCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      href: '/'
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      href: '/busca'
    },
    {
      id: 'wishlist',
      label: 'Favoritos',
      icon: Heart,
      href: '/favoritos',
      badge: wishlistCount
    },
    {
      id: 'cart',
      label: 'Carrinho',
      icon: ShoppingCart,
      href: '/carrinho',
      badge: cartCount
    },
    {
      id: 'account',
      label: 'Conta',
      icon: User,
      href: '/conta'
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />
      
      <AnimatePresence>
        {isVisible && (
          <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            <div className="grid grid-cols-5 h-16">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 transition-colors",
                      "min-h-[44px] min-w-[44px] p-2", // Touch target 44px+
                      active 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    aria-label={item.label}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        "h-5 w-5 transition-transform",
                        active && "scale-110"
                      )} />
                      
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
                        >
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      active ? "text-blue-600" : "text-gray-600"
                    )}>
                      {item.label}
                    </span>
                    
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute top-0 left-1/2 w-8 h-1 bg-blue-600 rounded-full"
                        style={{ x: '-50%' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook para detectar se é mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}

// Componente para pull to refresh
export function PullToRefresh({ onRefresh, children }: {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const threshold = 80
  let startY = 0
  let currentY = 0

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return
    
    currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - startY)
    
    if (distance > 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && pullDistance > 10 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10"
            style={{
              transform: `translateX(-50%) translateY(${Math.max(0, pullDistance - 40)}px)`
            }}
          >
            <div className="bg-white rounded-full p-3 shadow-lg border">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear'
                } : { duration: 0.2 }}
              >
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content */}
      <motion.div
        animate={{
          y: isPulling ? pullDistance * 0.3 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}