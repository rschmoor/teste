'use client'

import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { CartDrawer } from './CartDrawer'

interface CartButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showText?: boolean
}

export function CartButton({ 
  variant = 'ghost', 
  size = 'default',
  showText = false 
}: CartButtonProps) {
  const { itemCount, openCart } = useCart()

  return (
    <CartDrawer>
      <Button 
        variant={variant} 
        size={size} 
        className="relative"
        onClick={openCart}
      >
        <ShoppingCart className="h-5 w-5" />
        {showText && (
          <span className="ml-2">Carrinho</span>
        )}
        {itemCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>
    </CartDrawer>
  )
}

export default CartButton