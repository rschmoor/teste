'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCustomerArea } from '@/hooks/useCustomerArea'
import type { OrderWithItems } from '@/hooks/useCustomerArea'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string | null
}

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
  processing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Package },
  shipped: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Truck },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle }
}

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
}

const paymentStatusLabels = {
  pending: 'Pendente',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
  partially_refunded: 'Parcialmente Reembolsado'
}

export function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
  const { getOrder, cancelOrder } = useCustomerArea()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId])

  const fetchOrderDetails = async () => {
    if (!orderId) return
    
    setLoading(true)
    try {
      const orderData = await getOrder(orderId)
      setOrder(orderData)
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    
    setCancelling(true)
    try {
      await cancelOrder(order.id)
      await fetchOrderDetails() // Recarregar dados
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
    } finally {
      setCancelling(false)
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando detalhes do pedido...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-gray-600">Pedido não encontrado</p>
              <Button onClick={onClose} className="mt-4">Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const StatusIcon = statusColors[order.status].icon
  const shippingAddress = order.shipping_address as any
  const billingAddress = order.billing_address as any

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedido #{order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações do Pedido</span>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusColors[order.status].bg} ${statusColors[order.status].text}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusLabels[order.status]}
                  </Badge>
                  {order.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                    >
                      {cancelling ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        'Cancelar Pedido'
                      )}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Data do Pedido</p>
                    <p className="font-medium">
                      {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pagamento</p>
                    <p className="font-medium">{order.payment_method || 'Não informado'}</p>
                    <p className="text-xs text-gray-500">
                      {paymentStatusLabels[order.payment_status]}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
              
              {order.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Observações</p>
                      <p className="text-sm text-gray-600">{order.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
                    <Image
                      src={item.product.image_url || '/placeholder.jpg'}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded"
                      unoptimized
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.product.sku}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm">Qtd: {item.quantity}</span>
                        <span className="text-sm">Preço: {formatPrice(item.unit_price)}</span>
                        {item.discount_amount > 0 && (
                          <span className="text-sm text-green-600">
                            Desconto: -{formatPrice(item.discount_amount)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                {order.coupon_code && (
                  <div className="flex justify-between text-blue-600">
                    <span>Cupom ({order.coupon_code}):</span>
                    <span>Aplicado</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>{formatPrice(order.shipping_amount)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Impostos:</span>
                    <span>{formatPrice(order.tax_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereços */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Endereço de Entrega */}
            {shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{shippingAddress.recipient_name}</p>
                    <p>{shippingAddress.street}, {shippingAddress.number}</p>
                    {shippingAddress.complement && <p>{shippingAddress.complement}</p>}
                    <p>{shippingAddress.neighborhood}</p>
                    <p>{shippingAddress.city} - {shippingAddress.state}</p>
                    <p>CEP: {shippingAddress.postal_code}</p>
                    {shippingAddress.phone && (
                      <div className="flex items-center gap-1 mt-2">
                        <Phone className="h-3 w-3" />
                        <span>{shippingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Endereço de Cobrança */}
            {billingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Endereço de Cobrança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{billingAddress.recipient_name}</p>
                    <p>{billingAddress.street}, {billingAddress.number}</p>
                    {billingAddress.complement && <p>{billingAddress.complement}</p>}
                    <p>{billingAddress.neighborhood}</p>
                    <p>{billingAddress.city} - {billingAddress.state}</p>
                    <p>CEP: {billingAddress.postal_code}</p>
                    {billingAddress.phone && (
                      <div className="flex items-center gap-1 mt-2">
                        <Phone className="h-3 w-3" />
                        <span>{billingAddress.phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Timeline do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Pedido criado</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                </div>
                
                {order.status !== 'pending' && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Status atualizado para: {statusLabels[order.status]}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}