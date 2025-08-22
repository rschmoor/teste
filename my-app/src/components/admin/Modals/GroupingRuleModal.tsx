'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useProductGroups } from '@/hooks/useProductGroups'
import type { Tables } from '@/lib/supabase/types'

// Tipagem auxiliar para objetos de configuração
type JsonObject = Record<string, unknown>

type GroupingRule = Tables<'grouping_rules'>

interface GroupingRuleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: GroupingRule | null
}

const ruleTypes = [
  { value: 'category_match', label: 'Correspondência de Categoria' },
  { value: 'brand_match', label: 'Correspondência de Marca' },
  { value: 'price_range', label: 'Faixa de Preço' },
  { value: 'tag_similarity', label: 'Similaridade de Tags' },
  { value: 'attribute_match', label: 'Correspondência de Atributos' }
]

const operators = [
  { value: 'equals', label: 'Igual a' },
  { value: 'contains', label: 'Contém' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'greater_than', label: 'Maior que' },
  { value: 'less_than', label: 'Menor que' },
  { value: 'between', label: 'Entre' },
  { value: 'in', label: 'Em lista' },
  { value: 'not_in', label: 'Não em lista' }
]

export function GroupingRuleModal({ open, onOpenChange, rule }: GroupingRuleModalProps) {
  const { createRule, applyGroupingRules } = useProductGroups()
  
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    rule_type: GroupingRule['rule_type']
    conditions: JsonObject
    priority: number
    is_active: boolean
  }>({
    name: '',
    description: '',
    rule_type: 'category_match',
    conditions: {} as JsonObject,
    priority: 1,
    is_active: true
  })
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        conditions: (rule.conditions ?? {}) as JsonObject,
        priority: rule.priority,
        is_active: rule.is_active
      })
    } else {
      setFormData({
        name: '',
        description: '',
        rule_type: 'category_match',
        conditions: {} as JsonObject,
        priority: 1,
        is_active: true
      })
    }
    setTestResult(null)
  }, [rule, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!rule) {
        await createRule(formData)
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar regra:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyRule = async () => {
    setApplying(true)
    try {
      if (rule) {
        await applyGroupingRules()
        setTestResult({ success: true, message: 'Regra aplicada com sucesso!' })
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Erro ao aplicar regra' })
    } finally {
      setApplying(false)
    }
  }

  const handleConditionChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [key]: value
      }
    }))
  }



  const renderConditionFields = () => {
    switch (formData.rule_type) {
      case 'category_match':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={formData.conditions.category || ''}
                onChange={(e) => handleConditionChange('category', e.target.value)}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <select
                value={formData.conditions.operator || 'equals'}
                onChange={(e) => handleConditionChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'brand_match':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                value={formData.conditions.brand || ''}
                onChange={(e) => handleConditionChange('brand', e.target.value)}
                placeholder="Nome da marca"
              />
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <select
                value={formData.conditions.operator || 'equals'}
                onChange={(e) => handleConditionChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case 'price_range':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.conditions.min_price || ''}
                  onChange={(e) => handleConditionChange('min_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Máximo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.conditions.max_price || ''}
                  onChange={(e) => handleConditionChange('max_price', parseFloat(e.target.value) || 0)}
                  placeholder="999.99"
                />
              </div>
            </div>
          </div>
        )

      case 'tag_similarity':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                value={formData.conditions.tags || ''}
                onChange={(e) => handleConditionChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="space-y-2">
              <Label>Modo de Correspondência</Label>
              <select
                value={formData.conditions.match_mode || 'any'}
                onChange={(e) => handleConditionChange('match_mode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="any">Qualquer tag</option>
                <option value="all">Todas as tags</option>
              </select>
            </div>
          </div>
        )

      case 'attribute_match':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Atributo</Label>
              <Input
                value={formData.conditions.attribute || ''}
                onChange={(e) => handleConditionChange('attribute', e.target.value)}
                placeholder="Nome do atributo"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                value={formData.conditions.value || ''}
                onChange={(e) => handleConditionChange('value', e.target.value)}
                placeholder="Valor do atributo"
              />
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <select
                value={formData.conditions.operator || 'equals'}
                onChange={(e) => handleConditionChange('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      default:
        return null
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Editar Regra' : 'Nova Regra de Agrupamento'}
          </DialogTitle>
          <DialogDescription>
            {rule ? 'Edite a regra de agrupamento automático.' : 'Crie uma nova regra para agrupar produtos automaticamente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="conditions">Condições</TabsTrigger>
              <TabsTrigger value="test">Teste</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Regra *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Agrupar por Categoria"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Tipo da Regra *</Label>
                  <select
                    id="rule_type"
                    value={formData.rule_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {ruleTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o que esta regra faz..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Regra Ativa</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Condições da Regra</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderConditionFields()}
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="test" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Testar Regra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rule && (
                    <div className="space-y-4">
                      <Button
                        type="button"
                        onClick={handleApplyRule}
                        disabled={applying}
                        className="w-full"
                      >
                        {applying ? 'Aplicando...' : 'Aplicar Regra'}
                      </Button>
                      
                      {testResult && (
                        <div className={`p-3 rounded-md border ${
                          testResult.success 
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {testResult.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">{testResult.message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!rule && (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Salve a regra primeiro para testá-la</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (rule ? 'Atualizar' : 'Criar Regra')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}