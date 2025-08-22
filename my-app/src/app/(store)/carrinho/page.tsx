'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, ShoppingBag, Truck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { CheckoutTrustElements } from '@/components/ui/TrustElements'
import { ComponentErrorBoundary, CartErrorFallback } from '@/providers/ErrorBoundaryProvider'

interface ShippingOption {
  id: string
  name: string
  price: number
  days: string
  description: string
}

const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Entrega Padrão',
    price: 15.90,
    days: '5-7 dias úteis',
    description: 'Entrega pelos Correios'
  },
  {
    id: 'express',
    name: 'Entrega Expressa',
    price: 29.90,
    days: '2-3 dias úteis',
    description: 'Entrega rápida'
  },
  {
    id: 'same-day',
    name: 'Entrega no Mesmo Dia',
    price: 49.90,
    days: 'Hoje',
    description: 'Disponível para algumas regiões'
  }
]

export default function CartPage() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal, 
    total, 
    itemCount, 
    coupon, 
    applyCoupon, 
    removeCoupon 
  } = useCart()
  const [couponCode, setCouponCode] = useState('')
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption>(shippingOptions[0])
  const [zipCode, setZipCode] = useState('')
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)

  const shipping = selectedShipping.price
  const finalTotal = total + shipping

  const handleApplyCoupon = () => {
    applyCoupon(couponCode)
    setCouponCode('')
  }

  const handleCalculateShipping = () => {
    setIsCalculatingShipping(true)
    // Mock shipping calculation
    setTimeout(() => {
      setIsCalculatingShipping(false)
    }, 1000)
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-6">
            Adicione alguns produtos incríveis ao seu carrinho
          </p>
          <Button asChild>
            <Link href="/produtos">
              Continuar Comprando
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Carrinho de Compras</h1>
        <p className="text-muted-foreground">
          {itemCount} {itemCount === 1 ? 'item' : 'itens'} no seu carrinho
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items do Carrinho */}
        <ComponentErrorBoundary>
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={`${item.id}-${item.size}-${item.color}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      {item.size && (
                              <Badge variant="secondary">Tamanho: {item.size}</Badge>
                            )}
                            {item.color && (
                              <Badge variant="secondary">Cor: {item.color}</Badge>
                            )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(item.originalPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            ))}
          </div>
        </ComponentErrorBoundary>

        {/* Resumo do Pedido */}
        <ComponentErrorBoundary>
          <div className="space-y-6">
            {/* Calcular Frete */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Calcular Frete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite seu CEP"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={9}
                />
                <Button 
                  onClick={handleCalculateShipping}
                  disabled={isCalculatingShipping || !zipCode}
                  className="whitespace-nowrap"
                >
                  {isCalculatingShipping ? 'Calculando...' : 'Calcular'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {shippingOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedShipping.id === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedShipping(option)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{option.name}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-sm text-muted-foreground">{option.days}</p>
                      </div>
                      <p className="font-semibold">
                        {option.price === 0 ? 'Grátis' : formatPrice(option.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cupom de Desconto */}
          <Card>
            <CardHeader>
              <CardTitle>Cupom de Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coupon ? (
                <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">{coupon.code}</p>
                    <p className="text-sm text-green-600">{coupon.discount}% de desconto</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeCoupon}
                    className="text-green-800 hover:text-green-900"
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                    className="whitespace-nowrap"
                  >
                    Aplicar
                  </Button>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Cupons disponíveis:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>DESCONTO10 - 10% de desconto</li>
                  <li>PRIMEIRACOMPRA - 15% de desconto</li>
                  <li>FRETEGRATIS - Frete grátis</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                {coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({coupon.discount}%)</span>
                    <span>-{formatPrice(coupon.type === 'percentage' ? (subtotal * coupon.discount / 100) : coupon.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">
                    Finalizar Compra
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link href="/produtos">
                    Continuar Comprando
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
            {/* Trust Elements */}
            <CheckoutTrustElements className="mt-4" />
          </div>
        </ComponentErrorBoundary>
      </div>
    </div>
  )
}