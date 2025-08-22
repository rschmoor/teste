'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/store/ProductCard'
import { Product } from '@/types/product'

interface RelatedProductsProps {
  products: Product[]
  isLoading?: boolean
  title?: string
  className?: string
}

export function RelatedProducts({
  products,
  isLoading = false,
  title = 'Produtos Relacionados',
  className = ''
}: RelatedProductsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4
  }
  
  const maxIndex = Math.max(0, products.length - itemsPerView.desktop)
  
  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const container = containerRef.current
      const itemWidth = container.scrollWidth / products.length
      container.scrollTo({
        left: index * itemWidth,
        behavior: 'smooth'
      })
      setCurrentIndex(index)
    }
  }
  
  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1)
    scrollToIndex(newIndex)
  }
  
  const handleNext = () => {
    const newIndex = Math.min(maxIndex, currentIndex + 1)
    scrollToIndex(newIndex)
  }
  
  if (isLoading) {
    return (
      <div className={`mt-16 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} viewMode="grid" />
          ))}
        </div>
      </div>
    )
  }
  
  if (!products || products.length === 0) {
    return (
      <div className={`mt-16 ${className}`}>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">{title}</h2>
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum produto relacionado encontrado.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`mt-16 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        
        {/* Navigation buttons - only show if there are more items than can be displayed */}
        {products.length > itemsPerView.desktop && (
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Products Grid/Carousel */}
      <div className="relative">
        {/* Desktop: Carousel with navigation */}
        <div className="hidden lg:block">
          <div 
            ref={containerRef}
            className="flex gap-6 overflow-x-hidden scroll-smooth"
            style={{
              transform: `translateX(-${currentIndex * (100 / itemsPerView.desktop)}%)`
            }}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-1/4">
                <ProductCard 
                  product={product}
                  viewMode="grid"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile/Tablet: Responsive grid */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.slice(0, 6).map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                viewMode="grid"
              />
            ))}
          </div>
          
          {/* Show more button on mobile if there are more products */}
          {products.length > 6 && (
            <div className="mt-6 text-center">
              <Button variant="outline">
                Ver Mais Produtos
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Dots indicator for mobile */}
      {products.length > itemsPerView.mobile && (
        <div className="flex justify-center mt-6 lg:hidden">
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === Math.floor(currentIndex / 2)
                    ? 'bg-gray-900'
                    : 'bg-gray-300'
                }`}
                onClick={() => scrollToIndex(index * 2)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RelatedProducts