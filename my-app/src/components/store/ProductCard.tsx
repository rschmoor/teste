'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Heart, 
  Eye, 
  ShoppingCart,
  Plus,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { Product } from '@/types/product'
import { cn } from '@/lib/utils'
import { FadeIn, ScaleButton, HoverCard, SuccessAnimation } from '@/components/ui/Animations'
import { TouchButton, TouchOptimized } from '@/components/ui/TouchTargets'

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
  onQuickView?: (product: Product) => void
  className?: string
  showRemoveFromWishlist?: boolean
}

export default function ProductCard({
  product,
  viewMode = 'grid',
  onQuickView,
  className = '',
  showRemoveFromWishlist = false
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const { toggleItem, isInWishlist, removeItem } = useWishlist()
  const { addItem } = useCart()
  
  const isFavorite = isInWishlist(product.id)

  const discountPercentage = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    addItem(product, product.product_variants?.[0]?.size || 'M', product.product_variants?.[0]?.color || 'Único', 1)
    setIsAnimating(true)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAnimating(true)
    
    // Animação de feedback
    setTimeout(() => setIsAnimating(false), 300)
    
    toggleItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      brand: product.brand || '',
      price: product.sale_price || product.price,
      originalPrice: product.price,
      image: product.product_images?.[0]?.image_url || product.image || '/images/placeholder-product.jpg',
      category: product.category || ''
    })
  }

  const handleRemoveFromWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    removeItem(product.id)
  }

  const ProductImage = () => (
    <div className={`relative w-full ${
      viewMode === 'list' ? 'h-48' : 'h-64'
    } bg-gray-100 overflow-hidden group`}>
      {!imageError && product.image && product.image.trim() !== '' ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } ${
            viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'
          }`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true)
            setImageLoading(false)
          }}
        />
      ) : (
        <div className={`w-full h-full bg-gray-200 flex items-center justify-center ${
          viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'
        }`}>
          <div className="text-gray-400 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded" />
            <p className="text-xs">Imagem não disponível</p>
          </div>
        </div>
      )}
      
      {/* Loading skeleton */}
      {imageLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${
          viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'
        }`} />
      )}
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
        {product.is_featured && (
          <Badge variant="default" className="text-xs">
            Destaque
          </Badge>
        )}
        {product.sale_price && product.sale_price < product.price && discountPercentage > 0 && (
          <Badge variant="destructive" className="text-xs">
            -{discountPercentage}%
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        {/* Botão de favoritar */}
        <ScaleButton>
          <TouchButton
            size="sm"
            variant="secondary"
            className={cn(
              "h-10 w-10 p-0 bg-white/90 hover:bg-white transition-all duration-300",
              isAnimating && "scale-125",
              isFavorite && "bg-red-50 hover:bg-red-100"
            )}
            onClick={() => handleToggleFavorite({} as React.MouseEvent)}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={cn(
              "h-5 w-5 transition-all duration-300",
              isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-600 hover:text-red-500',
              isAnimating && "animate-pulse"
            )} />
          </TouchButton>
        </ScaleButton>
        
        {/* Botão de remover da wishlist (apenas na página de favoritos) */}
        {showRemoveFromWishlist && (
          <TouchButton
            size="sm"
            variant="secondary"
            className="h-10 w-10 p-0 bg-red-500/90 hover:bg-red-500"
            onClick={() => handleRemoveFromWishlist({} as React.MouseEvent)}
            aria-label="Remover dos favoritos"
          >
            <Trash2 className="h-5 w-5 text-white" />
          </TouchButton>
        )}
        
        {onQuickView && (
          <TouchButton
            size="sm"
            variant="secondary"
            className="h-10 w-10 p-0 bg-white/90 hover:bg-white"
            onClick={() => handleQuickView({} as React.MouseEvent)}
            aria-label="Visualização rápida"
          >
            <Eye className="h-5 w-5 text-gray-600" />
          </TouchButton>
        )}
      </div>


    </div>
  )

  const ProductInfo = () => (
    <div className={`p-4 space-y-2 ${
      viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''
    }`}>
      <div className="space-y-2">
        {/* Brand */}
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {product.brand}
        </p>
        
        {/* Name */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        {/* Rating */}
        {product.average_rating && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(product.average_rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              {product.average_rating.toFixed(1)} ({product.review_count || 0})
            </span>
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            R$ {(product.price || 0).toFixed(2)}
          </span>
          {product.sale_price && product.sale_price < product.price && (
            <span className="text-sm text-gray-500 line-through">
              R$ {product.price.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Colors preview */}
        {product.product_variants && product.product_variants.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Cores:</span>
            <div className="flex gap-1">
              {product.product_variants.slice(0, 4).map((variant, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: variant.color }}
                  title={variant.color}
                />
              ))}
              {product.product_variants.length > 4 && (
                <span className="text-xs text-gray-500">+{product.product_variants.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <TouchOptimized>
        <div className={`flex gap-2 ${
          viewMode === 'list' ? 'mt-4' : 'mt-3'
        }`}>
          <ScaleButton className="flex-1" asChild>
            <TouchButton variant="secondary" size="sm" className="h-12">
              <Link href={`/produto/${product.sku || product.id}`} className="flex items-center justify-center w-full">
                Ver Produto
              </Link>
            </TouchButton>
          </ScaleButton>

        </div>
      </TouchOptimized>
    </div>
  )

  return (
    <>
      <FadeIn>
        <HoverCard className={className}>
          <Card className="group overflow-hidden border-0 shadow-sm">
            <CardContent className={`p-0 ${
              viewMode === 'list' ? 'flex' : ''
            }`}>
              {viewMode === 'list' ? (
                <div className="flex w-full">
                  <div className="w-48 flex-shrink-0">
                    <ProductImage />
                  </div>
                  <ProductInfo />
                </div>
              ) : (
                <div>
                  <ProductImage />
                  <ProductInfo />
                </div>
              )}
            </CardContent>
          </Card>
        </HoverCard>
      </FadeIn>
      
      <SuccessAnimation 
        show={isAnimating} 
        onComplete={() => setIsAnimating(false)}
      />
    </>
  )
}

// Skeleton component for loading state
export function ProductCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  return (
    <Card className="animate-pulse">
      <CardContent className={`p-0 ${
        viewMode === 'list' ? 'flex' : ''
      }`}>
        <div className={`${
          viewMode === 'list' ? 'w-48 flex-shrink-0' : ''
        }`}>
          <div className={`w-full ${
            viewMode === 'list' ? 'h-48' : 'h-64'
          } bg-gray-200 ${
            viewMode === 'list' ? 'rounded-l-lg' : 'rounded-t-lg'
          }`} />
        </div>
        <div className={`p-4 space-y-3 ${
          viewMode === 'list' ? 'flex-1' : ''
        }`}>
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded w-full" />
        </div>
      </CardContent>
    </Card>
  )
}