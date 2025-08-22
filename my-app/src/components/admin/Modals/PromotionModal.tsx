'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Percent, DollarSign, Tag } from 'lucide-react'
import { usePromotions } from '@/hooks/usePromotions'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface PromotionModalProps {
  isOpen: boolean
  onClose: () => void
  promotion?: any
}

export function PromotionModal({ isOpen, onClose, promotion }: PromotionModalProps) {
  const { createPromotion, updatePromotion } = usePromotions()
  const { products } = useProducts()
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'coupon',
    discount_value: 0,
    code: '',
    start_date: '',
    end_date: '',
    usage_limit: null as number | null,
    minimum_order_value: null as number | null,
    is_active: true
  })

  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [applyToAll, setApplyToAll] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (promotion) {
        // Edit mode
        setFormData({
          name: promotion.name || '',
          description: promotion.description || '',
          discount_type: promotion.discount_type || 'percentage',
          discount_value: promotion.discount_value || 0,
          code: promotion.code || '',
          start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().slice(0, 16) : '',
          end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().slice(0, 16) : '',
          usage_limit: promotion.usage_limit,
          minimum_order_value: promotion.minimum_order_value,
          is_active: promotion.is_active ?? true
        })
        setSelectedProducts(promotion.promotion_products?.map((p: any) => p.product_id) || [])
        setSelectedCategories(promotion.promotion_categories?.map((c: any) => c.category_id) || [])
      } else {
        // Create mode
        setFormData({
          name: '',
          description: '',
          discount_type: 'percentage',
          discount_value: 0,
          code: '',
          start_date: '',
          end_date: '',
          usage_limit: null,
          minimum_order_value: null,
          is_active: true
        })
        setSelectedProducts([])
        setSelectedCategories([])
        setApplyToAll(false)
      }
    }
  }, [isOpen, promotion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações
      if (!formData.name.trim()) {
        toast.error('Nome da promoção é obrigatório')
        return
      }

      if (!formData.start_date || !formData.end_date) {
        toast.error('Período da promoção é obrigatório')
        return
      }

      if (new Date(formData.start_date) >= new Date(formData.end_date)) {
        toast.error('Data de início deve ser anterior à data de fim')
        return
      }

      if (formData.discount_value <= 0) {
        toast.error('Valor do desconto deve ser maior que zero')
        return
      }

      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        toast.error('Desconto percentual não pode ser maior que 100%')
        return
      }

      // Preparar dados
      const promotionData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      }

      const productIds = applyToAll ? [] : selectedProducts
      const categoryIds = selectedCategories

      if (promotion) {
        // Update
        await updatePromotion(promotion.id, promotionData, productIds, categoryIds)
      } else {
        // Create
        await createPromotion(promotionData, productIds, categoryIds)
      }

      onClose()
    } catch (error) {
      console.error('Erro ao salvar promoção:', error)
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

  const generateCouponCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    setFormData(prev => ({ ...prev, code }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? 'Editar Promoção' : 'Nova Promoção'}
          </DialogTitle>
          <DialogDescription>
            {promotion 
              ? 'Edite os dados da promoção abaixo'
              : 'Preencha os dados para criar uma nova promoção'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Promoção *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Black Friday 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, discount_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          Porcentagem
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed_amount">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Valor Fixo
                        </div>
                      </SelectItem>
                      <SelectItem value="coupon">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Cupom
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Valor do Desconto * {formData.discount_type === 'percentage' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percentage' ? "100" : undefined}
                    step={formData.discount_type === 'percentage' ? "1" : "0.01"}
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="Ex: BLACKFRIDAY"
                    />
                    <Button type="button" variant="outline" onClick={generateCouponCode}>
                      Gerar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva os detalhes da promoção..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Fim *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-all"
                  checked={applyToAll}
                  onCheckedChange={(checked) => setApplyToAll(checked === true)}
                />
                <Label htmlFor="apply-all">
                  Aplicar a todos os produtos
                </Label>
              </div>

              {!applyToAll && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selecionar Produtos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={product.id ? selectedProducts.includes(product.id) : false}
                            onCheckedChange={() => product.id && handleProductToggle(product.id)}
                          />
                          <Label htmlFor={`product-${product.id}`} className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{product.name}</span>
                              <Badge variant="outline">
                                R$ {product.salePrice.toFixed(2)}
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedProducts.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          {selectedProducts.length} produto(s) selecionado(s)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Limite de Uso</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      usage_limit: e.target.value ? parseInt(e.target.value) : null 
                    }))}
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_order_value">Valor Mínimo do Pedido (R$)</Label>
                  <Input
                    id="minimum_order_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum_order_value || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      minimum_order_value: e.target.value ? parseFloat(e.target.value) : null 
                    }))}
                    placeholder="Deixe vazio para sem mínimo"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">
                  Promoção ativa
                </Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : promotion ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}