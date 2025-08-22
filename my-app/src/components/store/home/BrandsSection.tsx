'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  logo: string
}

const brands: Brand[] = [
  {
    id: '1',
    name: 'Nike',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo.png'
  },
  {
    id: '2', 
    name: 'Adidas',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Adidas-Logo.png'
  },
  {
    id: '3',
    name: 'Zara',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Zara-Logo.png'
  },
  {
    id: '4',
    name: 'H&M',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/HM-Logo.png'
  },
  {
    id: '5',
    name: 'Puma',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Puma-Logo.png'
  },
  {
    id: '6',
    name: 'Calvin Klein',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Calvin-Klein-Logo.png'
  }
]

export function BrandsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(6)
  const [fallbacks, setFallbacks] = useState<Record<string, boolean>>({})

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(2)
      } else if (window.innerWidth < 768) {
        setItemsPerView(3)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(4)
      } else {
        setItemsPerView(6)
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const maxIndex = Math.max(0, brands.length - itemsPerView)
        return prev >= maxIndex ? 0 : prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [itemsPerView])

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Marcas Parceiras
          </h2>
          <p className="text-gray-600">
            Trabalhamos com as melhores marcas do mercado
          </p>
        </div>

        {/* Brands Carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              width: `${(brands.length / itemsPerView) * 100}%`
            }}
          >
            {brands.map((brand) => (
              <div 
                key={brand.id}
                className="flex-shrink-0 px-4"
                style={{ width: `${100 / brands.length}%` }}
              >
                <div className="flex items-center justify-center h-20 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
                  {fallbacks[brand.id] ? (
                    <span className="text-gray-600 font-semibold">{brand.name}</span>
                  ) : (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={120}
                      height={48}
                      className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      onError={() => setFallbacks(prev => ({ ...prev, [brand.id]: true }))}
                      unoptimized
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.max(1, brands.length - itemsPerView + 1) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-gray-800 w-6' : 'bg-gray-300'
              }`}
              aria-label={`Ir para grupo de marcas ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}