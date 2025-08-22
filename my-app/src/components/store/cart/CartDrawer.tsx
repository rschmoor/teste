'use client'

import React, { useState } from 'react'
import { Plus, Minus, Trash2, ShoppingBag, Tag, X } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { TouchButton, TouchOptimized } from '@/components/ui/TouchTargets'
import { SwipeActionCard } from '@/components/ui/SwipeGestures'

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    clearCart,
    subtotal,
    total,
    itemCount,
    applyCoupon,
    removeCoupon,
    coupon
  } = useCart()
  
  const [couponCode, setCouponCode] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setIsApplyingCoupon(true)
    const success = await applyCoupon(couponCode.trim())
    if (success) {
      setCouponCode('')
    }
    setIsApplyingCoupon(false)
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
    } else {
      updateQuantity(itemId, newQuantity)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            MEU CARRINHO ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
          </SheetTitle>
          <SheetDescription>
            {items.length === 0 ? 'Seu carrinho está vazio' : `${itemCount} ${itemCount === 1 ? 'produto' : 'produtos'} no carrinho`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          <ScrollArea className="flex-1 pr-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Seu carrinho está vazio
                </h3>
                <p className="text-gray-500 mb-6">
                  Adicione produtos para começar suas compras
                </p>
                <TouchButton onClick={() => onOpenChange(false)} className="w-full">
                  Continuar Comprando
                </TouchButton>
              </div>
            ) : (
              <TouchOptimized>
                <div className="space-y-4">
                  {items.map((item) => (
                    <SwipeActionCard
                      key={item.id}
                      rightAction={{
                        icon: <Trash2 className="h-5 w-5 text-white" />,
                        color: '#ef4444',
                        onAction: () => removeItem(item.id)
                      }}
                      className="border rounded-lg"
                    >
                      <div className="flex gap-3 p-3 bg-white">
                    {/* Imagem do produto */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    
                    {/* Informações do produto */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.name}
                      </h4>
                      
                      {/* Variações */}
                      <div className="flex gap-2 mt-1">
                        {item.size && (
                          <Badge variant="secondary" className="text-xs">
                            Tam: {item.size}
                          </Badge>
                        )}
                        {item.color && (
                          <Badge variant="secondary" className="text-xs">
                            {item.color}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Controles de quantidade */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1">
                            <TouchButton
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-4 w-4" />
                            </TouchButton>
                            <span className="w-10 text-center text-sm font-medium px-2">
                              {item.quantity}
                            </span>
                            <TouchButton
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </TouchButton>
                          </div>
                        
                        {/* Preço */}
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(item.originalPrice * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Botão remover - visível apenas em desktop */}
                        <TouchButton
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 mt-1 p-0 hidden md:flex"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </TouchButton>
                        
                        {/* Instrução de swipe para mobile */}
                        <div className="md:hidden text-xs text-gray-400 mt-1">
                          Deslize para remover →
                        </div>
                      </div>
                      </div>
                    </SwipeActionCard>
                  ))}
                </div>
              </TouchOptimized>
            )}

          {/* Footer com resumo e ações */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Cupom de desconto */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="h-9"
                    />
                  </div>
                  <TouchButton
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode.trim() || isApplyingCoupon}
                    className="h-12 px-4"
                  >
                    {isApplyingCoupon ? 'Aplicando...' : 'APLICAR'}
                  </TouchButton>
                </div>
                
                {/* Cupom aplicado */}
                {coupon && (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center gap-2 text-green-700">
                      <Tag className="h-4 w-4" />
                      <span className="text-sm font-medium">{coupon.code}</span>
                    </div>
                    <TouchButton
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="h-8 w-8 p-0 text-green-700 hover:text-green-800"
                      aria-label="Remover cupom"
                    >
                      <X className="h-4 w-4" />
                    </TouchButton>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Resumo de valores */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {coupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({coupon.code}):</span>
                    <span>-{formatPrice(subtotal - total)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>TOTAL:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              {/* Botões de ação */}
              <TouchOptimized>
                <div className="space-y-3 mt-4">
                  <TouchButton 
                    variant="secondary" 
                    className="w-full h-12"
                    onClick={() => onOpenChange(false)}
                  >
                    CONTINUAR COMPRANDO
                  </TouchButton>
                  
                  <Link href="/carrinho" onClick={() => onOpenChange(false)}>
                    <TouchButton variant="primary" className="w-full h-12">
                      FINALIZAR COMPRA
                    </TouchButton>
                  </Link>
                  
                  {/* Limpar carrinho */}
                  <TouchButton
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="w-full h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Limpar Carrinho
                  </TouchButton>
                </div>
              </TouchOptimized>
            </div>
          )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}