'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  Heart, 
  Share2, 
  Minus, 
  Plus,
  Truck,
  RotateCcw,
  Shield,
  MapPin
} from 'lucide-react'
import ColorSelector from '../ColorSelector'
import SizeSelector from '../SizeSelector'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface ProductColor {
  name: string
  value: string
  image?: string
}

export interface ProductSize {
  name: string
  value: string
  inStock: boolean
}

export interface ProductInfoProps {
  // Basic product info
  brand: string
  name: string
  sku: string
  rating: number
  reviewCount: number
  
  // Pricing
  price: number
  originalPrice?: number
  discount?: number
  installments?: {
    count: number
    value: number
    hasInterest: boolean
  }
  
  // Variations
  colors: ProductColor[]
  sizes: ProductSize[]
  selectedColor: string
  selectedSize: string
  onColorChange: (color: string) => void
  onSizeChange: (size: string) => void
  
  // Quantity and actions
  quantity: number
  onQuantityChange: (quantity: number) => void
  onAddToCart: () => void
  onBuyNow: () => void
  onToggleFavorite: () => void
  isFavorite: boolean
  
  // Stock and availability
  inStock: boolean
  stockQuantity?: number
  
  // Shipping
  freeShippingThreshold?: number
  
  // Loading states
  isLoading?: boolean
  isAddingToCart?: boolean
}

export function ProductInfo({
  brand,
  name,
  sku,
  rating,
  reviewCount,
  price,
  originalPrice,
  discount,
  installments,
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  quantity,
  onQuantityChange,
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  isFavorite,
  inStock,
  stockQuantity,
  freeShippingThreshold = 199,
  isLoading = false,
  isAddingToCart = false
}: ProductInfoProps) {
  const [zipCode, setZipCode] = useState('')
  const [shippingCalculated, setShippingCalculated] = useState(false)
  
  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }
  
  const handleQuantityIncrease = () => {
    if (stockQuantity && quantity < stockQuantity) {
      onQuantityChange(quantity + 1)
    } else if (!stockQuantity) {
      onQuantityChange(quantity + 1)
    }
  }
  
  const calculateShipping = () => {
    // Mock shipping calculation
    setShippingCalculated(true)
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${brand} - ${name}`,
          text: `Confira este produto: ${name}`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Erro ao compartilhar:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-40" />
        </div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Brand and Product Name */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600 uppercase tracking-wide">{brand}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{name}</h1>
        <p className="text-sm text-gray-500">SKU: {sku}</p>
      </div>
      
      {/* Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i < Math.floor(rating)
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{rating}</span>
        <span className="text-sm text-gray-500">({reviewCount} avaliações)</span>
      </div>
      
      {/* Pricing */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {originalPrice && originalPrice > price && (
            <span className="text-lg text-gray-400 line-through">
              DE {formatPrice(originalPrice)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          {discount && (
            <Badge variant="destructive" className="text-sm">
              -{discount}% OFF
            </Badge>
          )}
        </div>
        {originalPrice && originalPrice > price && (
          <p className="text-sm text-green-600 font-medium">
            Economia de {formatPrice(originalPrice - price)}
          </p>
        )}
        {installments && (
          <p className="text-sm text-gray-600">
            ou {installments.count}x de {formatPrice(installments.value)} 
            {installments.hasInterest ? 'com juros' : 'sem juros'}
          </p>
        )}
      </div>
      
      <Separator />
      
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium uppercase tracking-wide">
            COR: {colors.find(c => c.value === selectedColor)?.name}
          </Label>
          <ColorSelector
            colors={colors.map(color => ({
              name: color.name,
              value: color.value,
              available: true // Assumindo que todas as cores estão disponíveis
            }))}
            selectedColor={selectedColor}
            onColorChange={onColorChange}
          />
        </div>
      )}
      
      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium uppercase tracking-wide">
              TAMANHO: {selectedSize || 'Selecione'}
            </Label>
            <Button variant="link" size="sm" className="text-xs p-0 h-auto">
              Guia de Medidas
            </Button>
          </div>
          <SizeSelector
            sizes={sizes.map(size => ({
              size: size.value,
              available: size.inStock
            }))}
            selectedSize={selectedSize}
            onSizeChange={onSizeChange}
          />
        </div>
      )}
      
      {/* Quantity */}
      <div className="space-y-3">
        <Label className="text-sm font-medium uppercase tracking-wide">
          QUANTIDADE
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuantityDecrease}
              disabled={quantity <= 1}
              className="h-10 w-10 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleQuantityIncrease}
              disabled={stockQuantity ? quantity >= stockQuantity : false}
              className="h-10 w-10 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {stockQuantity && (
            <span className="text-sm text-gray-500">
              {stockQuantity} disponíveis
            </span>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <Button 
          onClick={onBuyNow}
          size="lg" 
          className="w-full h-12 text-base font-semibold"
          disabled={!inStock || !selectedSize}
        >
          COMPRAR AGORA
        </Button>
        <Button 
          onClick={onAddToCart}
          variant="outline" 
          size="lg" 
          className="w-full h-12 text-base font-semibold"
          disabled={!inStock || !selectedSize || isAddingToCart}
        >
          {isAddingToCart ? 'ADICIONANDO...' : 'ADICIONAR AO CARRINHO'}
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={onToggleFavorite}
            variant="outline"
            size="lg"
            className="flex-1 h-12"
          >
            <Heart className={cn(
              "h-4 w-4 mr-2",
              isFavorite && "fill-current text-red-500"
            )} />
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="lg"
            className="flex-1 h-12"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
      
      {/* Benefits */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-4 w-4 text-green-600" />
            <span>
              {price >= freeShippingThreshold 
                ? 'Frete grátis para todo o Brasil'
                : `Frete grátis acima de ${formatPrice(freeShippingThreshold)}`
              }
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="h-4 w-4 text-blue-600" />
            <span>Devolução grátis em 30 dias</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-purple-600" />
            <span>Compra 100% segura</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Shipping Calculator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4" />
            <Label className="text-sm font-medium">Calcular frete e prazo</Label>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Digite seu CEP"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={9}
              className="flex-1"
            />
            <Button onClick={calculateShipping} variant="outline">
              OK
            </Button>
          </div>
          {shippingCalculated && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>PAC:</span>
                  <span>R$ 15,90 - até 8 dias úteis</span>
                </div>
                <div className="flex justify-between">
                  <span>SEDEX:</span>
                  <span>R$ 25,90 - até 3 dias úteis</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Stock Status */}
      {!inStock && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 font-medium">
            Produto indisponível no momento
          </p>
        </div>
      )}
    </div>
  )
}