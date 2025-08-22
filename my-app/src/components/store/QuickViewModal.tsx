'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  Heart, 
  ShoppingCart,
  X,
  Plus,
  Minus,
  Truck,
  Shield,
  RotateCcw
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/product'
import ColorSelector from './ColorSelector'
import SizeSelector from './SizeSelector'

interface QuickViewModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: Product, selectedColor?: string, selectedSize?: string, quantity?: number) => void
  onToggleFavorite?: (product: Product) => void
  isFavorite?: boolean
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false
}: QuickViewModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  if (!product) return null

  const discountPercentage = product.sale_price
    ? Math.round((1 - product.sale_price / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    onAddToCart?.(product, selectedColor, selectedSize, quantity)
  }

  const handleToggleFavorite = () => {
    onToggleFavorite?.(product)
  }

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

  // Mock colors and sizes - em produção viriam do produto
  const colors = ['#000000', '#FFFFFF', '#FF0000', '#0000FF']
  const sizes = [
    { size: 'PP', available: true },
    { size: 'P', available: true },
    { size: 'M', available: true },
    { size: 'G', available: false },
    { size: 'GG', available: true },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Visualização Rápida do Produto</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group">
              {!imageError ? (
                <Image
                  src={product.image || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className={`object-cover transition-all duration-300 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true)
                    setImageLoading(false)
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded" />
                    <p>Imagem não disponível</p>
                  </div>
                </div>
              )}
              
              {/* Loading skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">

                {product.sale_price && discountPercentage > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Favorite button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`} />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand and Name */}
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                {product.brand}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h2>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.average_rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} avaliações)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              {product.sale_price ? (
                <>
                  <span className="text-2xl font-bold text-red-600">
                    R$ {product.sale_price.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    R$ {product.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  R$ {product.price.toFixed(2)}
                </span>
              )}
            </div>

            <Separator />

            {/* Color Selection */}
            {colors.length > 0 && (
              <ColorSelector
                colors={colors.map(color => ({ name: color, value: color, available: true }))}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                variant="default"
              />
            )}

            {/* Size Selection */}
            <SizeSelector
              sizes={sizes}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              variant="default"
            />

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Quantidade
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Adicionar ao Carrinho
            </Button>

            {/* View Full Details Link */}
            <Link href={`/produto/${product.sku || product.id}`}>
              <Button variant="outline" className="w-full" size="lg">
                Ver Detalhes Completos
              </Button>
            </Link>

            <Separator />

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-4 w-4" />
                <span>Frete grátis acima de R$ 199</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RotateCcw className="h-4 w-4" />
                <span>Troca grátis em até 30 dias</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Compra 100% segura</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Skeleton component for loading state
export function QuickViewModalSkeleton() {
  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {/* Image Skeleton */}
          <div className="aspect-[3/4] bg-gray-200 rounded-lg" />
          
          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="h-px bg-gray-200" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}