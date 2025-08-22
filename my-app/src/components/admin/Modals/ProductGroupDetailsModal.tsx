'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package,
  Search,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  TrendingUp,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useProductGroups } from '@/hooks/useProductGroups'
import { formatPrice } from '@/lib/utils'
import type { ProductGroupWithItems } from '@/hooks/useProductGroups'
import Image from 'next/image'

interface ProductGroupDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string | null
  onEdit?: (group: ProductGroupWithItems) => void
}

export function ProductGroupDetailsModal({ 
  open, 
  onOpenChange, 
  groupId, 
  onEdit 
}: ProductGroupDetailsModalProps) {
  const { 
    groups,
    removeProductFromGroup, 
    reorderProductsInGroup,
    getGroupingStats 
  } = useProductGroups()
  
  const [group, setGroup] = useState<ProductGroupWithItems | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'order'>('order')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (groupId && open) {
      loadGroupDetails()
    }
  }, [groupId, open])

  const loadGroupDetails = async () => {
    if (!groupId) return
    
    setLoading(true)
    try {
      // Encontrar o grupo no array de grupos
      const groupData = groups.find(g => g.id === groupId)
      
      if (groupData) {
        setGroup(groupData)
        
        // Buscar estatísticas gerais
        const statsData = await getGroupingStats()
        setStatistics(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do grupo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveProduct = async (productId: string) => {
    if (!group) return
    
    try {
      await removeProductFromGroup(productId, group.id)
      await loadGroupDetails() // Recarregar dados
    } catch (error) {
      console.error('Erro ao remover produto:', error)
    }
  }

  const handleReorderProducts = async (productIds: string[]) => {
    if (!group) return
    
    try {
      // Converter array de IDs em objetos com productId e position
      const productOrders = productIds.map((productId, index) => ({
        productId,
        position: index
      }))
      
      await reorderProductsInGroup(group.id, productOrders)
      await loadGroupDetails() // Recarregar dados
    } catch (error) {
      console.error('Erro ao reordenar produtos:', error)
    }
  }

  const filteredProducts = group?.product_group_items?.filter(item => 
    item.products?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortBy) {
      case 'name':
        aValue = a.products?.name || ''
        bValue = b.products?.name || ''
        break
      case 'price':
        aValue = a.products?.price || 0
        bValue = b.products?.price || 0
        break
      case 'order':
        aValue = a.position
        bValue = b.position
        break
      default:
        return 0
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSort = (field: 'name' | 'price' | 'order') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!group) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Grupo não encontrado</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{group.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {group.description || 'Sem descrição'}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={group.is_active ? 'default' : 'secondary'}>
                {group.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="outline">
                {group.group_type}
              </Badge>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(group)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Produtos ({group.product_group_items?.length || 0})</TabsTrigger>
            <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
            <TabsTrigger value="criteria">Critérios</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('name')}
                >
                  Nome
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('price')}
                >
                  Preço
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort('order')}
                >
                  Ordem
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {sortedProducts.map((item) => {
                const product = item.products
                if (!product) return null
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            {product.image_url ? (
                              <Image 
                                src={product.image_url} 
                                alt={product.name}
                                width={64}
                                height={64}
                                className="object-cover rounded-lg"
                                unoptimized
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{product.name}</h4>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="font-bold text-green-600">
                                {formatPrice(product.price)}
                              </span>
                              <Badge variant="outline">
                                Posição: {item.position}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/admin/produtos/${product.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {sortedProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto no grupo'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca'
                    : 'Adicione produtos a este grupo para começar'
                  }
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            {statistics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.total_products || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPrice(statistics.total_value || 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatPrice(statistics.average_price || 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{statistics.active_products || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.total_products > 0 
                        ? `${Math.round((statistics.active_products / statistics.total_products) * 100)}% do total`
                        : '0% do total'
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Carregando estatísticas...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Critérios de Agrupamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Tipo do Grupo</Label>
                      <p className="text-lg font-semibold capitalize">{group.group_type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Ordem de Exibição</Label>
                      <p className="text-lg font-semibold">{group.display_order}</p>
                    </div>
                  </div>
                  
                  {group.criteria && Object.keys(group.criteria).length > 0 ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Critérios Específicos</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <pre className="text-sm">
                          {JSON.stringify(group.criteria, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">Nenhum critério específico definido</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}