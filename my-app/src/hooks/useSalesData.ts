"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { format, subDays, startOfDay, endOfDay } from "date-fns"

interface SalesData {
  date: string
  sales: number
  orders: number
}

export function useSalesData(days: number = 30) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Gerar array de datas dos últimos N dias
      const dates: string[] = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        dates.push(format(date, 'yyyy-MM-dd'))
      }

      // Buscar pedidos dos últimos N dias
      const startDate = subDays(new Date(), days - 1)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(new Date()).toISOString())
        .neq('status', 'cancelled')

      if (ordersError) throw ordersError

      // Agrupar vendas por data
      const salesByDate: { [key: string]: { sales: number; orders: number } } = {}

      // Inicializar todas as datas com 0
      dates.forEach(date => {
        salesByDate[date] = { sales: 0, orders: 0 }
      })

      // Processar pedidos
      orders?.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
        if (salesByDate[orderDate]) {
          salesByDate[orderDate].sales += order.total_amount || 0
          salesByDate[orderDate].orders += 1
        }
      })

      // Converter para array ordenado
      const formattedData: SalesData[] = dates.map(date => ({
        date,
        sales: salesByDate[date].sales,
        orders: salesByDate[date].orders
      }))

      setSalesData(formattedData)
    } catch (err) {
      console.error('Erro ao buscar dados de vendas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  const refetch = useCallback(() => {
    fetchSalesData()
  }, [fetchSalesData])

  return {
    salesData,
    loading,
    error,
    refetch
  }
}