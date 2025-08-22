"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/admin/Dashboard/MetricCard"
import { SalesChart } from "@/components/admin/Dashboard/SalesChart"
import { LowStockAlert } from "@/components/admin/Dashboard/LowStockAlert"
import { RecentOrders } from "@/components/admin/Dashboard/RecentOrders"
import { useMetrics } from "@/hooks/useMetrics"
import { useSalesData } from "@/hooks/useSalesData"
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, Users } from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default function DashboardPage() {
  const { metrics, loading: metricsLoading } = useMetrics()
  const { salesData, loading: salesLoading } = useSalesData()

  if (metricsLoading || salesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Vendas do Dia"
          value={formatPrice(metrics?.dailySales || 0)}
          description="+20.1% em relação a ontem"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Vendas do Mês"
          value={formatPrice(metrics?.monthlySales || 0)}
          description="+15.3% em relação ao mês passado"
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={metrics?.pendingOrders?.toString() || "0"}
          description="Aguardando processamento"
          icon={ShoppingCart}
          trend="neutral"
        />
        <MetricCard
          title="Produtos Ativos"
          value={metrics?.activeProducts?.toString() || "0"}
          description="Em estoque"
          icon={Package}
          trend="neutral"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de vendas */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Vendas dos Últimos 30 Dias</CardTitle>
            <CardDescription>
              Evolução das vendas diárias
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={salesData} />
          </CardContent>
        </Card>

        {/* Alertas de estoque baixo */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Estoque Baixo
            </CardTitle>
            <CardDescription>
              Produtos que precisam de reposição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LowStockAlert />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Pedidos recentes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>
              Últimos pedidos realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrders />
          </CardContent>
        </Card>

        {/* Produtos mais vendidos */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>
              Top 5 produtos do mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.topProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} vendas
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatPrice(product.revenue)}
                  </div>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}