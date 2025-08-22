'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Settings,
  BarChart3,
  Shuffle,
  Eye,
  Package,
  Filter,
  ArrowUpDown,
  Play,
  Target
} from 'lucide-react'
import { useProductGroups } from '@/hooks/useProductGroups'
import { ProductGroupModal } from '@/components/admin/Modals/ProductGroupModal'
import { GroupingRuleModal } from '@/components/admin/Modals/GroupingRuleModal'
import { ProductGroupDetailsModal } from '@/components/admin/Modals/ProductGroupDetailsModal'
import { formatPrice } from '@/lib/utils'
import type { ProductGroup, ProductGroupWithItems, GroupingRule } from '@/hooks/useProductGroups'

const groupTypeLabels = {
  category: 'Categoria',
  brand: 'Marca',
  price_range: 'Faixa de Preço',
  style: 'Estilo',
  collection: 'Coleção',
  seasonal: 'Sazonal',
  custom: 'Personalizado'
}

const groupTypeColors = {
  category: 'bg-blue-100 text-blue-800',
  brand: 'bg-purple-100 text-purple-800',
  price_range: 'bg-green-100 text-green-800',
  style: 'bg-orange-100 text-orange-800',
  collection: 'bg-pink-100 text-pink-800',
  seasonal: 'bg-yellow-100 text-yellow-800',
  custom: 'bg-gray-100 text-gray-800'
}

const ruleTypeLabels = {
  category_match: 'Correspondência de Categoria',
  price_range: 'Faixa de Preço',
  brand_match: 'Correspondência de Marca',
  tag_similarity: 'Similaridade de Tags',
  attribute_match: 'Correspondência de Atributos'
}

export default function ProductGroupsPage() {
  const {
    groups,
    rules,
    loading,
    error,
    deleteGroup,
    createRule,
    applyGroupingRules,
    getGroupingStats,
    getUngroupedProducts
  } = useProductGroups()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupWithItems | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedRule, setSelectedRule] = useState<GroupingRule | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [applyingRules, setApplyingRules] = useState(false)

  // Filtrar grupos
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || group.group_type === selectedType
    return matchesSearch && matchesType
  })

  const handleEditGroup = (group: ProductGroupWithItems) => {
    setSelectedGroup(group)
    setGroupModalOpen(true)
  }

  const handleNewGroup = () => {
    setSelectedGroup(null)
    setGroupModalOpen(true)
  }

  const handleViewDetails = (group: ProductGroupWithItems) => {
    setSelectedGroupId(group.id)
    setDetailsModalOpen(true)
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.')) {
      try {
        await deleteGroup(groupId)
      } catch (error) {
        console.error('Erro ao excluir grupo:', error)
      }
    }
  }

  const handleNewRule = () => {
    setSelectedRule(null)
    setRuleModalOpen(true)
  }

  const handleEditRule = (rule: GroupingRule) => {
    setSelectedRule(rule)
    setRuleModalOpen(true)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra? Esta ação não pode ser desfeita.')) {
      try {
        // Implementar deleteRule quando disponível
        console.log('Deletar regra:', ruleId)
      } catch (error) {
        console.error('Erro ao excluir regra:', error)
      }
    }
  }

  const handleApplyAllRules = async () => {
    setApplyingRules(true)
    try {
      await applyGroupingRules()
    } catch (error) {
      console.error('Erro ao aplicar regras:', error)
    } finally {
      setApplyingRules(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getGroupingStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleApplyRules = async () => {
    setApplyingRules(true)
    try {
      await applyGroupingRules()
    } catch (error) {
      console.error('Erro ao aplicar regras:', error)
    } finally {
      setApplyingRules(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando grupos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar grupos: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grupos de Produtos</h1>
          <p className="text-gray-600">Gerencie agrupamentos e similaridades de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </Button>
          <Button onClick={handleApplyRules} disabled={applyingRules} variant="outline">
            <Play className="h-4 w-4 mr-2" />
            {applyingRules ? 'Aplicando...' : 'Aplicar Regras'}
          </Button>
          <Button onClick={handleNewGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Grupo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Grupos</p>
                  <p className="text-2xl font-bold">{stats.totalGroups}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Grupos Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeGroups}</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Produtos</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Não Agrupados</p>
                  <p className="text-2xl font-bold">{stats.ungroupedProducts}</p>
                </div>
                <Shuffle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tamanho Médio</p>
                  <p className="text-2xl font-bold">{stats.averageGroupSize}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="rules">Regras de Agrupamento</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os tipos</option>
              {Object.entries(groupTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Lista de Grupos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {group.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        className={groupTypeColors[group.group_type]}
                        variant="secondary"
                      >
                        {groupTypeLabels[group.group_type]}
                      </Badge>
                      {!group.is_active && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Produtos:</span>
                      <span className="font-medium">{group._count?.products || 0}</span>
                    </div>
                    
                    {group.product_group_items && group.product_group_items.length > 0 && (
                      <div className="flex -space-x-2">
                        {group.product_group_items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                            title={item.products?.name}
                          >
                            {item.products?.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {group.product_group_items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                            +{group.product_group_items.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(group)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum grupo encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedType !== 'all' 
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie seu primeiro grupo de produtos.'}
                </p>
                <Button onClick={handleNewGroup}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Grupo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Regras de Agrupamento</h2>
            <Button onClick={handleNewRule}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {rule.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {ruleTypeLabels[rule.rule_type]}
                        </Badge>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Prioridade: {rule.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rules.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h3>
                <p className="text-gray-600 mb-4">
                  Crie regras para agrupar produtos automaticamente.
                </p>
                <Button onClick={handleNewRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Regra
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <ProductGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        group={selectedGroup}
      />
      
      <GroupingRuleModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        rule={selectedRule}
      />
      
      <ProductGroupDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        groupId={selectedGroupId}
        onEdit={handleEditGroup}
      />
    </div>
  )
}