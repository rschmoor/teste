'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Plus,
  X,
  Package,
  Settings,
  Users,
  ArrowUpDown
} from 'lucide-react'
import { useProductGroups } from '@/hooks/useProductGroups'
import { useProducts } from '@/hooks/useProducts'
import { formatPrice } from '@/lib/utils'
import type { ProductGroupWithItems } from '@/hooks/useProductGroups'
import Image from 'next/image'

interface ProductGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: ProductGroupWithItems | null
}

const groupTypes = [
  { value: 'category', label: 'Categoria' },
  { value: 'brand', label: 'Marca' },
  { value: 'price_range', label: 'Faixa de Preço' },
  { value: 'style', label: 'Estilo' },
  { value: 'collection', label: 'Coleção' },
  { value: 'seasonal', label: 'Sazonal' },
  { value: 'custom', label: 'Personalizado' }
]

export function ProductGroupModal({ open, onOpenChange, group }: ProductGroupModalProps) {
  const { createGroup, updateGroup, addProductToGroup, removeProductFromGroup } = useProductGroups()
  const { products } = useProducts()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    group_type: 'category' | 'brand' | 'price_range' | 'style' | 'collection' | 'seasonal' | 'custom'
    is_active: boolean
    display_order: number
    criteria: Record<string, unknown>
  }>({
    name: '',
    description: '',
    group_type: 'custom',
    is_active: true,
    display_order: 0,
    criteria: {} as Record<string, unknown>
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        group_type: group.group_type,
        is_active: group.is_active,
        display_order: group.display_order,
        criteria: (group.criteria ?? {}) as Record<string, unknown>
      })
      setSelectedProducts(group.product_group_items?.map(item => item.product_id) || [])
    } else {
      setFormData({
        name: '',
        description: '',
        group_type: 'custom',
        is_active: true,
        display_order: 0,
        criteria: {} as Record<string, unknown>
      })
      setSelectedProducts([])
    }
  }, [group, open])

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let groupId: string
      
      if (group) {
        // Atualizar grupo existente
        const updatedGroup = await updateGroup(group.id, formData)
        groupId = updatedGroup.id
        
        // Gerenciar produtos do grupo
        const currentProductIds = group.product_group_items?.map(item => item.product_id) || []
        const toAdd = selectedProducts.filter(id => !currentProductIds.includes(id))
        const toRemove = currentProductIds.filter(id => !selectedProducts.includes(id))
        
        // Adicionar novos produtos
        for (const productId of toAdd) {
          await addProductToGroup(productId, groupId)
        }
        
        // Remover produtos
        for (const productId of toRemove) {
          await removeProductFromGroup(productId, groupId)
        }
      } else {
        // Criar novo grupo
        const newGroup = await createGroup(formData)
        groupId = newGroup.id
        
        // Adicionar produtos selecionados
        for (const productId of selectedProducts) {
          await addProductToGroup(productId, groupId)
        }
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar grupo:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleCriteriaChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        [key]: value
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {group ? 'Editar Grupo' : 'Novo Grupo'}
          </DialogTitle>
          <DialogDescription>
            {group ? 'Edite as informações do grupo de produtos.' : 'Crie um novo grupo para organizar seus produtos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="criteria">Critérios</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Grupo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Produtos em Destaque"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group_type">Tipo do Grupo *</Label>
                  <select
                    id="group_type"
                    value={formData.group_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, group_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {groupTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito deste grupo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Grupo Ativo</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Produtos do Grupo</h3>
                  <Badge variant="outline">
                    {selectedProducts.length} selecionados
                  </Badge>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <div className="grid gap-2 p-4">
                    {filteredProducts.map((product) => {
                      const isSelected = product.id ? selectedProducts.includes(product.id) : false
                      return (
                        <Card 
                          key={product.id} 
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => product.id && handleProductToggle(product.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  {product.images?.[0] ? (
                                    <Image 
                                      src={product.images[0].url} 
                                      alt={product.name}
                                      width={48}
                                      height={48}
                                      className="object-cover rounded-lg"
                                      unoptimized
                                    />
                                  ) : (
                                    <Package className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">{product.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {formatPrice(product.salePrice)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!product.isInactive ? (
                                  <Badge variant="default">Ativo</Badge>
                                ) : (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => product.id && handleProductToggle(product.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Critérios de Agrupamento</h3>
                <p className="text-sm text-gray-600">
                  Configure critérios específicos para este tipo de grupo.
                </p>

                {formData.group_type === 'price_range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preço Mínimo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.criteria.min_price || ''}
                        onChange={(e) => handleCriteriaChange('min_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Máximo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.criteria.max_price || ''}
                        onChange={(e) => handleCriteriaChange('max_price', parseFloat(e.target.value) || 0)}
                        placeholder="999.99"
                      />
                    </div>
                  </div>
                )}

                {formData.group_type === 'seasonal' && (
                  <div className="space-y-2">
                    <Label>Temporada</Label>
                    <select
                      value={formData.criteria.season || ''}
                      onChange={(e) => handleCriteriaChange('season', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma temporada</option>
                      <option value="spring">Primavera</option>
                      <option value="summer">Verão</option>
                      <option value="autumn">Outono</option>
                      <option value="winter">Inverno</option>
                      <option value="holiday">Feriados</option>
                    </select>
                  </div>
                )}

                {formData.group_type === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.criteria.manual || false}
                        onCheckedChange={(checked) => handleCriteriaChange('manual', checked)}
                      />
                      <Label>Agrupamento Manual</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tags (separadas por vírgula)</Label>
                      <Input
                        value={formData.criteria.tags || ''}
                        onChange={(e) => handleCriteriaChange('tags', e.target.value)}
                        placeholder="destaque, promoção, novo"
                      />
                    </div>
                  </div>
                )}

                {Object.keys(formData.criteria).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum critério específico para este tipo de grupo</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (group ? 'Atualizar' : 'Criar Grupo')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}