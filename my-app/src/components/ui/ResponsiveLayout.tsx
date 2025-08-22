'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Hook para detectar tamanho da tela
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Call once to set initial state

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return screenSize
}

// Hook para detectar orientação
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  )

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return orientation
}

// Componente para layout responsivo
interface ResponsiveLayoutProps {
  children: React.ReactNode
  mobileClass?: string
  tabletClass?: string
  desktopClass?: string
  className?: string
}

export function ResponsiveLayout({
  children,
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
  className = ''
}: ResponsiveLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useScreenSize()

  const responsiveClass = cn(
    className,
    {
      [mobileClass]: isMobile,
      [tabletClass]: isTablet,
      [desktopClass]: isDesktop
    }
  )

  return (
    <div className={responsiveClass}>
      {children}
    </div>
  )
}

// Componente para mostrar/ocultar baseado no tamanho da tela
interface ShowOnProps {
  children: React.ReactNode
  mobile?: boolean
  tablet?: boolean
  desktop?: boolean
}

export function ShowOn({ children, mobile = false, tablet = false, desktop = false }: ShowOnProps) {
  const { isMobile, isTablet, isDesktop } = useScreenSize()

  const shouldShow = (
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop)
  )

  if (!shouldShow) return null

  return <>{children}</>
}

// Componente para ocultar baseado no tamanho da tela
interface HideOnProps {
  children: React.ReactNode
  mobile?: boolean
  tablet?: boolean
  desktop?: boolean
}

export function HideOn({ children, mobile = false, tablet = false, desktop = false }: HideOnProps) {
  const { isMobile, isTablet, isDesktop } = useScreenSize()

  const shouldHide = (
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop)
  )

  if (shouldHide) return null

  return <>{children}</>
}

// Componente para grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode
  mobileColumns?: number
  tabletColumns?: number
  desktopColumns?: number
  gap?: number
  className?: string
}

export function ResponsiveGrid({
  children,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 4,
  className = ''
}: ResponsiveGridProps) {
  const { isMobile, isTablet } = useScreenSize()

  const columns = isMobile ? mobileColumns : isTablet ? tabletColumns : desktopColumns

  const gridClass = cn(
    'grid',
    `grid-cols-${columns}`,
    `gap-${gap}`,
    className
  )

  return (
    <div className={gridClass}>
      {children}
    </div>
  )
}

// Componente para container responsivo
interface ResponsiveContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

export function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = ''
}: ResponsiveContainerProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2',
    md: 'px-4 py-4',
    lg: 'px-6 py-6'
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const containerClass = cn(
    'mx-auto',
    maxWidthClasses[maxWidth],
    paddingClasses[padding],
    className
  )

  return (
    <div className={containerClass}>
      {children}
    </div>
  )
}

// Componente para texto responsivo
interface ResponsiveTextProps {
  children: React.ReactNode
  mobileSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  tabletSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  desktopSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  className?: string
}

export function ResponsiveText({
  children,
  mobileSize = 'base',
  tabletSize = 'lg',
  desktopSize = 'xl',
  className = ''
}: ResponsiveTextProps) {
  const { isMobile, isTablet } = useScreenSize()

  const size = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize

  const textClass = cn(
    `text-${size}`,
    className
  )

  return (
    <span className={textClass}>
      {children}
    </span>
  )
}

// Componente para espaçamento responsivo
interface ResponsiveSpacingProps {
  children: React.ReactNode
  mobileSpacing?: number
  tabletSpacing?: number
  desktopSpacing?: number
  direction?: 'vertical' | 'horizontal' | 'all'
  className?: string
}

export function ResponsiveSpacing({
  children,
  mobileSpacing = 2,
  tabletSpacing = 4,
  desktopSpacing = 6,
  direction = 'all',
  className = ''
}: ResponsiveSpacingProps) {
  const { isMobile, isTablet } = useScreenSize()

  const spacing = isMobile ? mobileSpacing : isTablet ? tabletSpacing : desktopSpacing

  const spacingClasses = {
    vertical: `py-${spacing}`,
    horizontal: `px-${spacing}`,
    all: `p-${spacing}`
  }

  const spacingClass = cn(
    spacingClasses[direction],
    className
  )

  return (
    <div className={spacingClass}>
      {children}
    </div>
  )
}

// Hook para detectar se está em modo landscape em mobile
export function useMobileLandscape() {
  const { isMobile } = useScreenSize()
  const orientation = useOrientation()
  
  return isMobile && orientation === 'landscape'
}

// Hook para detectar se o usuário está usando touch
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }

    checkTouch()
    window.addEventListener('touchstart', checkTouch, { once: true })

    return () => {
      window.removeEventListener('touchstart', checkTouch)
    }
  }, [])

  return isTouch
}

// Componente para safe area (notch, etc.)
interface SafeAreaProps {
  children: React.ReactNode
  top?: boolean
  bottom?: boolean
  left?: boolean
  right?: boolean
  className?: string
}

export function SafeArea({
  children,
  top = true,
  bottom = true,
  left = true,
  right = true,
  className = ''
}: SafeAreaProps) {
  const safeAreaClass = cn(
    {
      'pt-safe': top,
      'pb-safe': bottom,
      'pl-safe': left,
      'pr-safe': right
    },
    className
  )

  return (
    <div className={safeAreaClass}>
      {children}
    </div>
  )
}