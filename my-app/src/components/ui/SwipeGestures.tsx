'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeCarouselProps {
  children: ReactNode[]
  className?: string
  showIndicators?: boolean
  showArrows?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
  onSlideChange?: (index: number) => void
}

export function SwipeCarousel({
  children,
  className,
  showIndicators = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  onSlideChange
}: SwipeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5])

  const totalSlides = children.length

  // Auto play functionality
  useEffect(() => {
    if (!autoPlay || isDragging) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, totalSlides, isDragging])

  // Notify parent of slide changes
  useEffect(() => {
    onSlideChange?.(currentIndex)
  }, [currentIndex, onSlideChange])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    const threshold = 50
    const velocity = info.velocity.x
    const offset = info.offset.x

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset > 0 || velocity > 0) {
        // Swipe right - go to previous
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
      } else {
        // Swipe left - go to next
        setCurrentIndex((prev) => (prev + 1) % totalSlides)
      }
    }

    // Reset position
    x.set(0)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }

  return (
    <div className={cn("relative overflow-hidden", className)} ref={containerRef}>
      {/* Main carousel */}
      <motion.div
        className="flex"
        animate={{
          x: `-${currentIndex * 100}%`
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0"
            style={{ userSelect: isDragging ? 'none' : 'auto' }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Navigation arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 backdrop-blur-sm"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 backdrop-blur-sm"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Hook para detectar gestos de swipe
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > threshold
    const isRightSwipe = distanceX < -threshold
    const isUpSwipe = distanceY > threshold
    const isDownSwipe = distanceY < -threshold

    // Determine if horizontal or vertical swipe is more significant
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) onSwipeLeft?.()
      if (isRightSwipe) onSwipeRight?.()
    } else {
      if (isUpSwipe) onSwipeUp?.()
      if (isDownSwipe) onSwipeDown?.()
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}

// Componente para cards com swipe actions
interface SwipeActionCardProps {
  children: ReactNode
  leftAction?: {
    icon: ReactNode
    color: string
    onAction: () => void
  }
  rightAction?: {
    icon: ReactNode
    color: string
    onAction: () => void
  }
  className?: string
}

export function SwipeActionCard({
  children,
  leftAction,
  rightAction,
  className
}: SwipeActionCardProps) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-100, 0, 100], [0.8, 1, 0.8])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80
    const offset = info.offset.x

    if (offset > threshold && leftAction) {
      leftAction.onAction()
    } else if (offset < -threshold && rightAction) {
      rightAction.onAction()
    }

    // Reset position
    x.set(0)
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      {leftAction && (
        <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center" style={{ backgroundColor: leftAction.color }}>
          {leftAction.icon}
        </div>
      )}
      {rightAction && (
        <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center" style={{ backgroundColor: rightAction.color }}>
          {rightAction.icon}
        </div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className="relative z-10 bg-white"
      >
        {children}
      </motion.div>
    </div>
  )
}

// Componente para zoom com pinch gesture (simulado com scroll)
export function PinchZoom({ children, className }: {
  children: ReactNode
  className?: string
}) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.01
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3)
    setScale(newScale)
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div 
      className={cn("relative overflow-hidden cursor-grab", isDragging && "cursor-grabbing", className)}
      onWheel={handleWheel}
      onDoubleClick={resetZoom}
    >
      <motion.div
        drag
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        animate={{
          scale,
          x: position.x,
          y: position.y
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
      >
        {children}
      </motion.div>
      
      {scale > 1 && (
        <button
          onClick={resetZoom}
          className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10"
        >
          Reset
        </button>
      )}
    </div>
  )
}