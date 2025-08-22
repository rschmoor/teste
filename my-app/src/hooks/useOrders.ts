import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tables, TablesInsert } from '@/lib/supabase/types'
import { CartItem } from '@/contexts/CartContext'

type Order = Tables<'orders'>
type OrderInsert = TablesInsert<'orders'>
type OrderItem = Tables<'order_items'>
type OrderItemInsert = TablesInsert<'order_items'>

export interface CreateOrderData {
  customerData: {
    name: string
    email: string
    phone: string
    cpf: string
  }
  shippingAddress: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  billingAddress?: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
  }
  paymentMethod: string
  items: CartItem[]
  subtotal: number
  shippingCost: number
  discountAmount: number
  discountCode?: string
  totalAmount: number
}

interface UseOrdersParams {
  search?: string
  status?: string
  paymentStatus?: string
  dateRange?: string
}

export function useOrders(params?: UseOrdersParams) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  // Buscar todos os pedidos com filtros
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(
              id,
              name,
              image_url,
              sku
            )
          ),
          user_profiles!inner(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Aplicar filtros se fornecidos
      if (params?.search) {
        query = query.or(`order_number.ilike.%${params.search}%,user_profiles.full_name.ilike.%${params.search}%,user_profiles.email.ilike.%${params.search}%`)
      }

      if (params?.status) {
        query = query.eq('status', params.status)
      }

      if (params?.paymentStatus) {
        query = query.eq('payment_status', params.paymentStatus)
      }

      if (params?.dateRange) {
        const now = new Date()
        let startDate: Date

        switch (params.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3
            startDate = new Date(now.getFullYear(), quarterStart, 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Erro ao buscar pedidos: ${error.message}`)
      }

      setOrders(data || [])
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [params?.search, params?.status, params?.paymentStatus, params?.dateRange])

  // Recarregar pedidos
  const refetch = () => {
    fetchOrders()
  }

  // Atualizar status de pagamento
  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) {
        throw new Error(`Erro ao atualizar status de pagamento: ${error.message}`)
      }

      // Recarregar pedidos após atualização
      await fetchOrders()
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Carregar pedidos quando os parâmetros mudarem
  useEffect(() => {
    if (params !== undefined) {
      fetchOrders()
    }
  }, [fetchOrders, params])

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `ORD-${timestamp.slice(-6)}-${random}`
  }

  const createOrder = async (orderData: CreateOrderData): Promise<Order | null> => {
    setLoading(true)
    setError(null)

    try {
      const orderNumber = generateOrderNumber()

      // Criar o pedido
      const orderInsert: OrderInsert = {
        order_number: orderNumber,
        status: 'pending',
        total_amount: orderData.totalAmount,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost,
        discount_amount: orderData.discountAmount,
        discount_code: orderData.discountCode || null,
        payment_method: orderData.paymentMethod,
        payment_status: 'pending',
        shipping_address: orderData.shippingAddress,
        billing_address: orderData.billingAddress || null,
        customer_data: orderData.customerData,
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single()

      if (orderError) {
        throw new Error(`Erro ao criar pedido: ${orderError.message}`)
      }

      // Criar os itens do pedido
      const orderItems: OrderItemInsert[] = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_sku: item.sku || '',
        product_name: item.name,
        product_image: item.image,
        variant_color: item.selectedColor || null,
        variant_size: item.selectedSize || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        // Se falhar ao criar itens, deletar o pedido criado
        await supabase.from('orders').delete().eq('id', order.id)
        throw new Error(`Erro ao criar itens do pedido: ${itemsError.message}`)
      }

      // Atualizar estoque dos produtos
      for (const item of orderData.items) {
        if (item.trackQuantity) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              quantity: Math.max(0, (item.currentStock || 0) - item.quantity)
            })
            .eq('id', item.id)

          if (stockError) {
            console.error(`Erro ao atualizar estoque do produto ${item.id}:`, stockError)
            // Não falhar o pedido por erro de estoque, apenas logar
          }
        }
      }

      return order
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao criar pedido:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getOrder = async (orderId: string): Promise<Order | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) {
        throw new Error(`Erro ao buscar pedido: ${error.message}`)
      }

      return order
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data: items, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (error) {
        throw new Error(`Erro ao buscar itens do pedido: ${error.message}`)
      }

      return items || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (
    orderId: string, 
    status: Order['status']
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) {
        throw new Error(`Erro ao atualizar status do pedido: ${error.message}`)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    getOrder,
    getOrderItems,
    updateOrderStatus,
    updatePaymentStatus,
    refetch,
  }
}