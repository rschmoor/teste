'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { CartItem as CartItemType } from '@/types/cart'

interface CartItemProps {
  item: CartItemType
  variant?: 'drawer' | 'page'
  showImage?: boolean
}

export function CartItem({ item, variant = 'page', showImage = true }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    
    setIsUpdating(true)
    try {
      updateQuantity(item.id, newQuantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = () => {
    removeItem(item.id)
  }

  const isDrawer = variant === 'drawer'
  const imageSize = isDrawer ? 'w-16 h-16' : 'w-24 h-24'

  return (
    <div className={`flex gap-3 ${isDrawer ? 'p-3' : 'p-4'}`}>
      {showImage && (
        <div className={`relative ${imageSize} flex-shrink-0`}>
          <Image
            src={item.image || '/placeholder.jpg'}
            alt={item.name}
            fill
            className="object-cover rounded-md"
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold truncate ${isDrawer ? 'text-sm' : 'text-base'}`}>
              {item.name}
            </h3>
            <p className={`text-muted-foreground ${isDrawer ? 'text-xs' : 'text-sm'}`}>
              {item.brand}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size={isDrawer ? 'sm' : 'sm'}
            onClick={handleRemove}
            className="text-destructive hover:text-destructive flex-shrink-0 ml-2"
          >
            <Trash2 className={isDrawer ? 'h-3 w-3' : 'h-4 w-4'} />
          </Button>
        </div>
        
        {/* Variações */}
        {(item.size || item.color) && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {item.size && (
              <Badge variant="secondary" className={isDrawer ? 'text-xs px-1.5 py-0.5' : 'text-xs'}>
                {item.size}
              </Badge>
            )}
            {item.color && (
              <Badge variant="secondary" className={isDrawer ? 'text-xs px-1.5 py-0.5' : 'text-xs'}>
                {item.color}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          {/* Controles de Quantidade */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size={isDrawer ? 'sm' : 'sm'}
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className={isDrawer ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}
            >
              <Minus className={isDrawer ? 'h-2 w-2' : 'h-3 w-3'} />
            </Button>
            
            <span className={`min-w-[2rem] text-center ${isDrawer ? 'text-sm' : 'text-base'}`}>
              {item.quantity}
            </span>
            
            <Button
              variant="outline"
              size={isDrawer ? 'sm' : 'sm'}
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating}
              className={isDrawer ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'}
            >
              <Plus className={isDrawer ? 'h-2 w-2' : 'h-3 w-3'} />
            </Button>
          </div>
          
          {/* Preços */}
          <div className="text-right">
            <p className={`font-semibold ${isDrawer ? 'text-sm' : 'text-base'}`}>
              {formatPrice(item.price * item.quantity)}
            </p>
            {item.originalPrice && item.originalPrice > item.price && (
              <p className={`text-muted-foreground line-through ${isDrawer ? 'text-xs' : 'text-sm'}`}>
                {formatPrice(item.originalPrice * item.quantity)}
              </p>
            )}
            {item.originalPrice && item.originalPrice > item.price && (
              <p className={`text-green-600 font-medium ${isDrawer ? 'text-xs' : 'text-sm'}`}>
                Economize {formatPrice((item.originalPrice - item.price) * item.quantity)}
              </p>
            )}
          </div>
        </div>
        
        {/* Indicador de Promoção */}
        {item.originalPrice && item.originalPrice > item.price && (
          <div className="mt-2">
            <Badge variant="destructive" className={isDrawer ? 'text-xs' : 'text-xs'}>
              🔥 Promoção
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartItem