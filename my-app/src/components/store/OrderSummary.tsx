'use client'

import { useCart } from '@/contexts/CartContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Truck, Tag, CreditCard, MapPin } from 'lucide-react'
import Image from 'next/image'

interface OrderSummaryProps {
  shipping?: {
    method: string
    price: number
    estimatedDays: number
  }
  discount?: {
    code: string
    amount: number
    type: 'percentage' | 'fixed'
  }
  address?: {
    street: string
    number: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  paymentMethod?: {
    type: string
    details: string
  }
  showItems?: boolean
  showAddress?: boolean
  showPayment?: boolean
  className?: string
}

export function OrderSummary({
  shipping,
  discount,
  address,
  paymentMethod,
  showItems = true,
  showAddress = false,
  showPayment = false,
  className
}: OrderSummaryProps) {
  const { items, total: cartTotal, itemCount } = useCart()

  const subtotal = cartTotal
  const shippingCost = shipping?.price || 0
  const discountAmount = discount
    ? discount.type === 'percentage'
      ? (subtotal * discount.amount) / 100
      : discount.amount
    : 0
  const total = subtotal + shippingCost - discountAmount

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Itens do Carrinho */}
        {showItems && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Itens ({itemCount})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.size && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.size}
                        </Badge>
                      )}
                      {item.color && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {item.color}
                        </Badge>
                      )}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endereço de Entrega */}
        {showAddress && address && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço de Entrega
              </h4>
              <div className="text-sm">
                <p>{address.street}, {address.number}</p>
                <p>{address.neighborhood}</p>
                <p>{address.city} - {address.state}</p>
                <p>CEP: {address.zipCode}</p>
              </div>
            </div>
          </>
        )}

        {/* Forma de Pagamento */}
        {showPayment && paymentMethod && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Forma de Pagamento
              </h4>
              <div className="text-sm">
                <p className="font-medium">{paymentMethod.type}</p>
                <p className="text-muted-foreground">{paymentMethod.details}</p>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Cálculos */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {shipping && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {shipping.method}
                {shipping.estimatedDays > 0 && (
                  <span className="text-muted-foreground">
                    ({shipping.estimatedDays} dias úteis)
                  </span>
                )}
              </span>
              <span>
                {shipping.price === 0 ? 'Grátis' : formatPrice(shipping.price)}
              </span>
            </div>
          )}
          
          {discount && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Desconto ({discount.code})
              </span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
        </div>

        <Separator />
        
        {/* Total */}
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        
        {/* Informações adicionais */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Preços incluem impostos</p>
          <p>• Frete calculado no checkout</p>
          {shipping && shipping.estimatedDays > 0 && (
            <p>• Prazo de entrega: {shipping.estimatedDays} dias úteis</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default OrderSummary