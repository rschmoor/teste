'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description: string
  price: number
  sale_price: number
  sku: string
  image_url: string
  category_id: string
  is_promotion: boolean
  discount_percentage?: number
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(4)

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1)
      } else if (window.innerWidth < 768) {
        setItemsPerView(2)
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3)
      } else {
        setItemsPerView(4)
      }
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  // Fetch featured products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_promotion', true)
          .limit(8)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching products:', error)
          return
        }

        // Calculate discount percentage
        const productsWithDiscount = data?.map(product => ({
          ...product,
          discount_percentage: product.price > product.sale_price 
            ? Math.round(((product.price - product.sale_price) / product.price) * 100)
            : 0
        })) || []

        setProducts(productsWithDiscount)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const maxIndex = Math.max(0, products.length - itemsPerView)

  const goToPrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Produtos em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-80" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Produtos em Destaque</h2>
          <p className="text-gray-600">Nenhum produto em promoção encontrado.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Produtos em Destaque
          </h2>
          <p className="text-gray-600 text-lg">
            Ofertas especiais selecionadas especialmente para você
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          {products.length > itemsPerView && (
            <>
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 transition-all duration-200',
                  currentIndex === 0 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-50 hover:shadow-xl'
                )}
                aria-label="Produtos anteriores"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={goToNext}
                disabled={currentIndex >= maxIndex}
                className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 transition-all duration-200',
                  currentIndex >= maxIndex 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-gray-50 hover:shadow-xl'
                )}
                aria-label="Próximos produtos"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Products Grid */}
          <div className="overflow-hidden mx-8">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                width: `${(products.length / itemsPerView) * 100}%`
              }}
            >
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / products.length}%` }}
                >
                  <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={product.image_url || 'https://picsum.photos/300/300?random=' + product.id}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                      
                      {/* Discount Badge */}
                      {product.discount_percentage && product.discount_percentage > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white">        
                          -{product.discount_percentage}%
                        </Badge>
                      )}
                      
                      {/* Wishlist Button */}
                      <button className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        {product.price > product.sale_price ? (
                          <>
                            <span className="text-gray-400 line-through text-sm">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-red-600 font-bold text-lg">
                              {formatPrice(product.sale_price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg">
                            {formatPrice(product.sale_price)}
                          </span>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Link href={`/produto/${product.sku || product.id}`}>
                        <Button className="w-full" size="sm">
                          Ver Produto
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/promocoes">
            <Button variant="outline" size="lg">
              Ver Todas as Promoções
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}