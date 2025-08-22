"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar"
import { ExternalLink, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { formatPrice } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
  items_count: number
}

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const fetchRecentOrders = async () => {
    try {
      setLoading(true)
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          total_amount,
          status,
          created_at,
          order_items(id)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Erro ao buscar pedidos recentes:', error)
        return
      }

      const formattedOrders: RecentOrder[] = orders?.map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        items_count: order.order_items?.length || 0
      })) || []

      setRecentOrders(formattedOrders)
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pendente',
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-yellow-600'
        }
      case 'processing':
        return {
          label: 'Processando',
          variant: 'default' as const,
          icon: Package,
          color: 'text-blue-600'
        }
      case 'shipped':
        return {
          label: 'Enviado',
          variant: 'outline' as const,
          icon: Package,
          color: 'text-purple-600'
        }
      case 'delivered':
        return {
          label: 'Entregue',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        }
      case 'cancelled':
        return {
          label: 'Cancelado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        }
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: Clock,
          color: 'text-gray-600'
        }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recentOrders.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhum pedido encontrado
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {recentOrders.map((order) => {
        const statusConfig = getStatusConfig(order.status)
        const StatusIcon = statusConfig.icon
        
        return (
          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {getInitials(order.customer_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium leading-none">
                    #{order.order_number}
                  </p>
                  <Badge variant={statusConfig.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.customer_name} • {order.items_count} {order.items_count === 1 ? 'item' : 'itens'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatPrice(order.total_amount)}
                </p>
              </div>
              <Link href={`/admin/pedidos/${order.id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )
      })}
      
      <div className="pt-2">
        <Link href="/admin/pedidos">
          <Button variant="outline" size="sm" className="w-full">
            Ver todos os pedidos
          </Button>
        </Link>
      </div>
    </div>
  )
}