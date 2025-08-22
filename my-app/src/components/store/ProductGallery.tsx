'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ProductImage {
  id: string
  url: string
  alt: string
  caption?: string
}

interface ProductGalleryProps {
  images: ProductImage[]
  className?: string
  showThumbnails?: boolean
}

export function ProductGallery({ 
  images, 
  className = '', 
  showThumbnails = true 
}: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)

  const currentImage = images[currentIndex]

  const goToImage = (index: number) => {
    setCurrentIndex(index)
    setZoomLevel(1)
    setIsZoomed(false)
  }

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    goToImage(newIndex)
  }

  const goToNext = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    goToImage(newIndex)
  }

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom)
    setIsZoomed(newZoom > 1)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return
      
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'Escape':
          setIsModalOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, currentIndex])

  // Reset zoom when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setZoomLevel(1)
      setIsZoomed(false)
    }
  }, [isModalOpen])

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-96 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded" />
          <p>Nenhuma imagem disponível</p>
        </div>
      </div>
    )
  }

  const GalleryContent = ({ isModal = false }: { isModal?: boolean }) => {
    return (
      <div className={`relative ${isModal ? 'w-full h-full' : ''}`}>
        {/* Main Image */}
        <div 
          className={`relative bg-gray-100 rounded-lg overflow-hidden ${
            isModal ? 'h-full' : 'aspect-square'
          }`}
        >
          {currentImage ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              className={`object-cover transition-transform duration-200 ${
                isZoomed ? `scale-${Math.round(zoomLevel * 100)}` : ''
              }`}
              sizes={isModal ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
              priority={currentIndex === 0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded" />
                <p>Imagem não disponível</p>
              </div>
            </div>
          )}

          {/* Navigation arrows - only show if more than 1 image */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-md"
                onClick={goToPrevious}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white/90 shadow-md"
                onClick={goToNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Zoom controls - only in modal */}
          {isModal && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70 h-8 w-8"
                onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
                disabled={zoomLevel <= 1}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70 h-8 w-8"
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Zoom indicator */}
          {isZoomed && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {Math.round(zoomLevel * 100)}%
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && images.length > 1 && !isModal && (
          <div className="mt-4">
            {/* Desktop: Grid layout */}
            <div className="hidden md:grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === index
                      ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 12vw"
                  />
                </button>
              ))}
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => goToImage(index)}
                    className={`relative flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border-2 transition-all w-16 h-16 ${
                      currentIndex === index
                        ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1'
                        : 'border-transparent'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image caption */}
        {currentImage?.caption && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {currentImage.caption}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <GalleryContent />

      {/* Modal for full-screen view */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white/90 shadow-md"
            onClick={() => setIsModalOpen(true)}
            aria-label="Open full screen view"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl w-full h-full p-0 bg-black/90">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-white/20 text-white hover:bg-white/30"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <GalleryContent isModal />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Skeleton component for loading state
export function ProductGallerySkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image skeleton */}
      <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
      
      {/* Thumbnails skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}