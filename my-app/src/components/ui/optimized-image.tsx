'use client'

import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { createIntersectionObserver } from '@/lib/performance'

// Tipos para o componente
interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  fill?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
  aspectRatio?: string
  rounded?: boolean
  shadow?: boolean
  overlay?: boolean
  overlayContent?: React.ReactNode
  zoomOnHover?: boolean
  lazyRoot?: Element | null
  lazyRootMargin?: string
  lazyThreshold?: number
}

// Gerar blur placeholder automaticamente
function generateBlurDataURL(width: number = 10, height: number = 10): string {
  if (typeof document === 'undefined') {
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
  }
  
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // Gradiente suave
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL()
}

// Componente principal
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio,
  rounded = false,
  shadow = false,
  overlay = false,
  overlayContent,
  zoomOnHover = false,
  lazyRoot = null,
  lazyRootMargin = '50px',
  lazyThreshold = 0.1,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(priority || loading === 'eager')
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority || loading === 'eager' || isInView) return

    const element = imgRef.current
    if (!element) return

    observerRef.current = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      {
        root: lazyRoot,
        rootMargin: lazyRootMargin,
        threshold: lazyThreshold,
      }
    )

    if (observerRef.current) {
      observerRef.current.observe(element)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [priority, loading, isInView, lazyRoot, lazyRootMargin, lazyThreshold])

  // Gerar blur placeholder se não fornecido
  const finalBlurDataURL = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL() : undefined)

  // Gerar sizes responsivo se não fornecido
  const responsiveSizes = sizes || (
    fill ? '100vw' : 
    width ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${width}px` :
    '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  )

  // Handlers
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setCurrentSrc(fallbackSrc)
    onError?.()
  }

  // Classes CSS
  const containerClasses = cn(
    'relative overflow-hidden',
    {
      'rounded-lg': rounded,
      'shadow-lg': shadow,
      'group cursor-pointer': zoomOnHover,
    },
    className
  )

  const imageClasses = cn(
    'transition-all duration-300',
    {
      'opacity-0': !isLoaded && !hasError,
      'opacity-100': isLoaded || hasError,
      'group-hover:scale-105': zoomOnHover,
      'blur-sm': !isLoaded && placeholder === 'blur',
    }
  )

  // Estilo do container
  const containerStyle: React.CSSProperties = {
    aspectRatio: aspectRatio || (width && height ? `${width}/${height}` : undefined),
  }

  return (
    <div 
      ref={imgRef}
      className={containerClasses}
      style={containerStyle}
    >
      {/* Placeholder enquanto não carrega */}
      {!isInView && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Imagem principal */}
      {isInView && (
        <Image
          src={currentSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={finalBlurDataURL}
          sizes={responsiveSizes}
          className={imageClasses}
          style={{
            objectFit: fill ? objectFit : undefined,
            objectPosition: fill ? objectPosition : undefined,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Overlay */}
      {overlay && overlayContent && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {overlayContent}
        </div>
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="w-12 h-12 mx-auto mb-2">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm">Erro ao carregar</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para galeria de imagens
interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    width?: number
    height?: number
  }>
  className?: string
  itemClassName?: string
  columns?: number
  gap?: number
  aspectRatio?: string
  rounded?: boolean
  shadow?: boolean
  zoomOnHover?: boolean
  onImageClick?: (index: number) => void
}

export function ImageGallery({
  images,
  className,
  itemClassName,
  columns = 3,
  gap = 4,
  aspectRatio = '1/1',
  rounded = true,
  shadow = true,
  zoomOnHover = true,
  onImageClick,
}: ImageGalleryProps) {
  const gridClasses = cn(
    'grid',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
      'grid-cols-5': columns === 5,
      'grid-cols-6': columns === 6,
      'gap-1': gap === 1,
      'gap-2': gap === 2,
      'gap-4': gap === 4,
      'gap-6': gap === 6,
      'gap-8': gap === 8,
    },
    className
  )

  return (
    <div className={gridClasses}>
      {images.map((image, index) => (
        <div
          key={index}
          className={cn('cursor-pointer', itemClassName)}
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            fill
            aspectRatio={aspectRatio}
            rounded={rounded}
            shadow={shadow}
            zoomOnHover={zoomOnHover}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>
      ))}
    </div>
  )
}

// Componente para avatar otimizado
interface OptimizedAvatarProps {
  src?: string
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fallback?: string
  className?: string
  priority?: boolean
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
  priority = false,
}: OptimizedAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  }

  const sizePx = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  }

  if (!src) {
    return (
      <div className={cn(
        'rounded-full bg-gray-200 flex items-center justify-center text-gray-500',
        sizeClasses[size],
        className
      )}>
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePx[size]}
      height={sizePx[size]}
      className={cn('rounded-full', sizeClasses[size], className)}
      priority={priority}
      quality={90}
      objectFit="cover"
    />
  )
}

// Hook para preload de imagens
export function useImagePreload(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const preloadImages = useCallback(async () => {
    setIsLoading(true)
    const promises = urls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = document.createElement('img')
        img.onload = () => resolve(url)
        img.onerror = reject
        img.src = url
      })
    })

    try {
      const loaded = await Promise.allSettled(promises)
      const successful = loaded
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value)
      
      setLoadedImages(new Set(successful))
    } catch (error) {
      console.error('Erro ao precarregar imagens:', error)
    } finally {
      setIsLoading(false)
    }
  }, [urls])

  useEffect(() => {
    if (urls.length > 0) {
      preloadImages()
    }
  }, [preloadImages, urls.length])

  return { loadedImages, isLoading, preloadImages }
}

export default OptimizedImage