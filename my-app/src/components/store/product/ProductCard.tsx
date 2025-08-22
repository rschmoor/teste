'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Eye, ShoppingCart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  discount_percentage?: number
  rating?: number
  review_count?: number
  is_featured?: boolean
  is_on_sale?: boolean
  in_stock?: boolean
  stock_quantity?: number
  product_images?: {
    id: string
    image_url: string
    alt_text?: string
    is_primary: boolean
    display_order: number
  }[]
  categories?: {
    id: string
    name: string
    slug: string
  }
  colors?: string[]
  sizes?: string[]
  created_at: string
  updated_at: string
}

interface ProductCardProps {
  product: Product
  onQuickView?: (product: Product) => void
  onAddToCart?: (product: Product) => void
  onToggleFavorite?: (product: Product) => void
  className?: string
}

export function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onToggleFavorite,
  className
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const images = product.product_images?.sort((a, b) => a.display_order - b.display_order) || []
  const primaryImage = images.find(img => img.is_primary) || images[0]
  const secondaryImage = images[1]

  const discountPercentage = product.discount_percentage || 
    (product.original_price && product.price < product.original_price 
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    onToggleFavorite?.(product)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const installmentPrice = product.price / 7 // 7x sem juros

  return (
    <div 
      className={cn(
        "group relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/produtos/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {/* Main Image */}
          <Image
            src={primaryImage?.image_url || '/placeholder-product.svg'}
            alt={primaryImage?.alt_text || product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500",
              isHovered && secondaryImage ? "opacity-0" : "opacity-100"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Secondary Image on Hover */}
          {secondaryImage && (
            <Image
              src={secondaryImage.image_url}
              alt={secondaryImage.alt_text || product.name}
              fill
              className={cn(
                "object-cover transition-all duration-500",
                isHovered ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_featured && (
              <Badge variant="secondary" className="bg-blue-500 text-white">
                Destaque
              </Badge>
            )}
            {discountPercentage > 0 && (
              <Badge variant="destructive" className="bg-red-500 text-white">
                -{discountPercentage}%
              </Badge>
            )}
            {!product.in_stock && (
              <Badge variant="outline" className="bg-gray-500 text-white">
                Esgotado
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "absolute top-3 right-3 p-2 rounded-full transition-all duration-200",
              "bg-white/80 backdrop-blur-sm hover:bg-white",
              isFavorite ? "text-red-500" : "text-gray-600 hover:text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
          </button>

          {/* Hover Actions */}
          <div className={cn(
            "absolute inset-x-3 bottom-3 flex gap-2 transition-all duration-300",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleQuickView}
              className="flex-1 bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            {product.in_stock && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Comprar
              </Button>
            )}
          </div>

          {/* Sizes on Hover */}
          {product.sizes && product.sizes.length > 0 && (
            <div className={cn(
              "absolute inset-x-3 bottom-16 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                <p className="text-xs text-gray-600 mb-1">Tamanhos:</p>
                <div className="flex gap-1 flex-wrap">
                  {product.sizes.slice(0, 4).map((size) => (
                    <span
                      key={size}
                      className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-700"
                    >
                      {size}
                    </span>
                  ))}
                  {product.sizes.length > 4 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-700">
                      +{product.sizes.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.categories && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.categories.name}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(product.rating!)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({product.review_count || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.original_price)}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            </div>
            
            <p className="text-xs text-gray-600">
              ou 7x de {formatPrice(installmentPrice)} sem juros
            </p>
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Cores disponiveis:</p>
              <div className="flex gap-1">
                {product.colors.slice(0, 4).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {product.colors.length > 4 && (
                  <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{product.colors.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stock Info */}
          {product.stock_quantity && product.stock_quantity < 10 && product.in_stock && (
            <p className="text-xs text-orange-600 mt-2">
              Apenas {product.stock_quantity} em estoque
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}