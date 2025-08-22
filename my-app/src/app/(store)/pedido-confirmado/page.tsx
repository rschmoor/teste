'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useOrders } from '@/hooks/useOrders'
import { Tables } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Truck, Loader2, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

type Order = Tables<'orders'>

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id')
  const { getOrder, loading } = useOrders()
  const [order, setOrder] = useState<Order | null>(null)
  
  useEffect(() => {
    window.scrollTo(0, 0)

    if (!orderId) return

    ;(async () => {
      try {
        const orderData = await getOrder(orderId)
        if (orderData) {
          setOrder(orderData)
        }
      } catch (error) {
        console.error('Erro ao carregar dados do pedido:', error)
      }
    })()
  }, [orderId, getOrder])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getDeliveryDate = () => {
    if (!order) return new Date()
    const deliveryDate = new Date(order.created_at)
    deliveryDate.setDate(deliveryDate.getDate() + 7) // 7 dias úteis
    return deliveryDate
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      confirmed: { label: 'Confirmado', variant: 'default' as const },
      processing: { label: 'Processando', variant: 'default' as const },
      shipped: { label: 'Enviado', variant: 'default' as const },
      delivered: { label: 'Entregue', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    }
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando dados do pedido...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        {/* Success Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-green-600">Pedido Confirmado!</h1>
          <p className="text-lg text-muted-foreground">
            Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
          </p>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Número do Pedido</p>
                <p className="font-semibold">#{order.order_number || `PED-${order.id.slice(-6)}`}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Data do Pedido</p>
                <p className="font-semibold">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Status</p>
                <Badge variant={getStatusBadge(order.status).variant}>
                  {getStatusBadge(order.status).label}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Previsão de Entrega</p>
                <p className="font-semibold">
                  {formatDate(getDeliveryDate().toISOString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Processamento do Pagamento</p>
                  <p className="text-sm text-muted-foreground">
                    Seu pagamento está sendo processado. Você receberá uma confirmação por email.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Preparação do Pedido</p>
                  <p className="text-sm text-muted-foreground">
                    Nosso time irá separar e embalar seus produtos com cuidado.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Envio e Entrega</p>
                  <p className="text-sm text-muted-foreground">
                    Você receberá o código de rastreamento assim que o pedido for enviado.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📧 Um email de confirmação foi enviado para você com todos os detalhes do pedido.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/produtos">
              Continuar Comprando
            </Link>
          </Button>
          
          <Button asChild>
            <Link href="/minha-conta/pedidos">
              Acompanhar Pedido
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Precisa de ajuda? Entre em contato conosco pelo{' '}
            <Link href="/contato" className="text-primary hover:underline">
              atendimento ao cliente
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}