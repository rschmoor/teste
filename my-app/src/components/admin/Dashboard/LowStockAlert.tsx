"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  category: string
}

export function LowStockAlert() {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true)
      
      // Buscar produtos com estoque baixo (menos de 10 unidades)
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          categories(name),
          stock(
            product_type,
            items
          )
        `)
        .eq('is_inactive', false)

      if (error) {
        console.error('Erro ao buscar produtos com estoque baixo:', error)
        return
      }

      // Processar dados para identificar produtos com estoque baixo
      const lowStock: LowStockProduct[] = []
      
      products?.forEach(product => {
        if (product.stock && Array.isArray(product.stock)) {
          product.stock.forEach((stockItem: any) => {
            if (stockItem.items && Array.isArray(stockItem.items)) {
              stockItem.items.forEach((item: any) => {
                const totalStock = item.quantity || 0
                if (totalStock <= 10 && totalStock > 0) {
                  lowStock.push({
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    stock: totalStock,
                    minStock: 10,
                    category: product.categories?.[0]?.name || 'Sem categoria'
                  })
                }
              })
            }
          })
        }
      })

      // Remover duplicatas e ordenar por estoque mais baixo
      const uniqueLowStock = lowStock
        .filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        )
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5) // Mostrar apenas os 5 primeiros

      setLowStockProducts(uniqueLowStock)
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockLevel = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', color: 'destructive' }
    if (stock <= 3) return { label: 'Crítico', color: 'destructive' }
    if (stock <= 10) return { label: 'Baixo', color: 'secondary' }
    return { label: 'Normal', color: 'default' }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (lowStockProducts.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Todos os produtos estão com estoque adequado!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {lowStockProducts.map((product) => {
        const stockLevel = getStockLevel(product.stock)
        
        return (
          <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  SKU: {product.sku} • {product.category}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {product.stock} unidades
                </p>
                <Badge 
                  variant={stockLevel.color as any}
                  className="text-xs"
                >
                  {stockLevel.label}
                </Badge>
              </div>
              <Link href={`/admin/produtos/${product.id}`}>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )
      })}
      
      {lowStockProducts.length > 0 && (
        <div className="pt-2">
          <Link href="/admin/produtos">
            <Button variant="outline" size="sm" className="w-full">
              Ver todos os produtos
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}