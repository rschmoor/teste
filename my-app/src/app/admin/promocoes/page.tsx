'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { usePromotions, type PromotionWithDetailsComplete } from '@/hooks/usePromotions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PromotionModal } from '@/components/admin/Modals/PromotionModal'
import { formatPrice } from '@/lib/utils'

export default function PromotionsPage() {
  const {
    promotions,
    loading,
    deletePromotion,
    togglePromotionStatus
  } = usePromotions()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<any>(null)

  // Filtrar promoções
  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (promotion.code && promotion.code.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && promotion.is_active) ||
                         (filterStatus === 'inactive' && !promotion.is_active)
    
    return matchesSearch && matchesStatus
  })

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta promoção?')) {
      await deletePromotion(id)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await togglePromotionStatus(id, !currentStatus)
  }

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Porcentagem'
      case 'fixed_amount':
        return 'Valor Fixo'
      case 'coupon':
        return 'Cupom'
      default:
        return type
    }
  }

  const getDiscountDisplay = (promotion: any) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`
    }
    return formatPrice(promotion.discount_value)
  }

  const isPromotionActive = (promotion: any) => {
    if (!promotion.is_active) return false
    
    const now = new Date()
    const startDate = new Date(promotion.start_date)
    const endDate = new Date(promotion.end_date)
    
    return now >= startDate && now <= endDate
  }

  const getStatusBadge = (promotion: any) => {
    if (!promotion.is_active) {
      return <Badge variant="secondary">Inativa</Badge>
    }
    
    if (isPromotionActive(promotion)) {
      return <Badge variant="default" className="bg-green-500">Ativa</Badge>
    }
    
    const now = new Date()
    const startDate = new Date(promotion.start_date)
    
    if (now < startDate) {
      return <Badge variant="outline">Agendada</Badge>
    }
    
    return <Badge variant="destructive">Expirada</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promoções</h1>
          <p className="text-muted-foreground">
            Gerencie promoções, descontos e cupons da loja
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Promoção
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar promoções específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {filterStatus === 'all' ? 'Todos' : filterStatus === 'active' ? 'Ativas' : 'Inativas'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                  Ativas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                  Inativas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Promoções</CardTitle>
          <CardDescription>
            {filteredPromotions.length} promoção(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium">
                    {promotion.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getPromotionTypeLabel(promotion.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getDiscountDisplay(promotion)}
                  </TableCell>
                  <TableCell>
                    {promotion.code ? (
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {promotion.code}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(promotion.start_date).toLocaleDateString('pt-BR')}</div>
                      <div className="text-muted-foreground">
                        até {new Date(promotion.end_date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {promotion.used_count || 0}
                      {promotion.usage_limit && (
                        <span className="text-muted-foreground">/{promotion.usage_limit}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(promotion)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(promotion.id, promotion.is_active)}
                      >
                        {promotion.is_active ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPromotions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || filterStatus !== 'all'
                        ? 'Nenhuma promoção encontrada com os filtros aplicados'
                        : 'Nenhuma promoção cadastrada ainda'}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PromotionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPromotion(null)
        }}
        promotion={editingPromotion}
      />
    </div>
  )
}