"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
}

interface Metrics {
  dailySales: number
  monthlySales: number
  pendingOrders: number
  activeProducts: number
  topProducts: TopProduct[]
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Data atual e início do mês
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      // Buscar vendas do dia
      const { data: dailyOrders, error: dailyError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfDay.toISOString())
        .neq('status', 'cancelled')

      if (dailyError) throw dailyError

      const dailySales = dailyOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      // Buscar vendas do mês
      const { data: monthlyOrders, error: monthlyError } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfMonth.toISOString())
        .neq('status', 'cancelled')

      if (monthlyError) throw monthlyError

      const monthlySales = monthlyOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      // Buscar pedidos pendentes
      const { data: pendingOrdersData, error: pendingError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      const pendingOrders = pendingOrdersData?.length || 0

      // Buscar produtos ativos
      const { data: activeProductsData, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('is_inactive', false)

      if (productsError) throw productsError

      const activeProducts = activeProductsData?.length || 0

      // Buscar produtos mais vendidos do mês
      const { data: topProductsData, error: topProductsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          products(id, name),
          orders!inner(created_at, status)
        `)
        .gte('orders.created_at', startOfMonth.toISOString())
        .neq('orders.status', 'cancelled')

      if (topProductsError) throw topProductsError

      // Processar produtos mais vendidos
      const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {}

      topProductsData?.forEach(item => {
        const productId = item.product_id
        const productName = item.products?.name || 'Produto sem nome'
        const quantity = item.quantity || 0
        const revenue = (item.quantity || 0) * (item.unit_price || 0)

        if (productSales[productId]) {
          productSales[productId].sales += quantity
          productSales[productId].revenue += revenue
        } else {
          productSales[productId] = {
            name: productName,
            sales: quantity,
            revenue: revenue
          }
        }
      })

      // Converter para array e ordenar por vendas
      const topProducts: TopProduct[] = Object.entries(productSales)
        .map(([id, data]) => ({
          id,
          name: data.name,
          sales: data.sales,
          revenue: data.revenue
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      setMetrics({
        dailySales,
        monthlySales,
        pendingOrders,
        activeProducts,
        topProducts
      })
    } catch (err) {
      console.error('Erro ao buscar métricas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchMetrics()
  }

  return {
    metrics,
    loading,
    error,
    refetch
  }
}