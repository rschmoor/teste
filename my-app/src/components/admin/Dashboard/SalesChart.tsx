"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SalesData {
  date: string
  sales: number
  orders: number
}

interface SalesChartProps {
  data: SalesData[]
}

export function SalesChart({ data }: SalesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'dd/MM', { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {`Data: ${formatDate(label)}`}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'sales' 
                ? `Vendas: ${formatCurrency(entry.value)}`
                : `Pedidos: ${entry.value}`
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum dado de vendas disponível
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          className="text-xs"
        />
        <YAxis 
          yAxisId="sales"
          orientation="left"
          tickFormatter={(value) => formatCurrency(value)}
          className="text-xs"
        />
        <YAxis 
          yAxisId="orders"
          orientation="right"
          className="text-xs"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="sales"
          type="monotone"
          dataKey="sales"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Vendas (R$)"
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="orders"
          stroke="hsl(var(--secondary))"
          strokeWidth={2}
          dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Pedidos"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}