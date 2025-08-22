'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { UserWithAuth, UserPermissions } from '@/hooks/useUsers'
import { Shield, User, Package, ShoppingCart, Tag, BarChart3, Settings } from 'lucide-react'

interface UserPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithAuth | null
  onUpdatePermissions: (userId: string, permissions: UserPermissions) => Promise<void>
}

const permissionConfig = [
  {
    key: 'can_manage_products' as keyof UserPermissions,
    label: 'Gerenciar Produtos',
    description: 'Criar, editar e excluir produtos',
    icon: Package,
    category: 'Produtos'
  },
  {
    key: 'can_manage_orders' as keyof UserPermissions,
    label: 'Gerenciar Pedidos',
    description: 'Visualizar e gerenciar pedidos de clientes',
    icon: ShoppingCart,
    category: 'Vendas'
  },
  {
    key: 'can_manage_users' as keyof UserPermissions,
    label: 'Gerenciar Usuários',
    description: 'Criar, editar e excluir usuários',
    icon: User,
    category: 'Usuários'
  },
  {
    key: 'can_manage_promotions' as keyof UserPermissions,
    label: 'Gerenciar Promoções',
    description: 'Criar e gerenciar promoções e cupons',
    icon: Tag,
    category: 'Marketing'
  },
  {
    key: 'can_view_reports' as keyof UserPermissions,
    label: 'Visualizar Relatórios',
    description: 'Acessar relatórios e analytics',
    icon: BarChart3,
    category: 'Relatórios'
  },
  {
    key: 'can_manage_settings' as keyof UserPermissions,
    label: 'Gerenciar Configurações',
    description: 'Alterar configurações do sistema',
    icon: Settings,
    category: 'Sistema'
  }
]

export function UserPermissionsModal({ 
  isOpen, 
  onClose, 
  user, 
  onUpdatePermissions 
}: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<UserPermissions>({
    can_manage_products: false,
    can_manage_orders: false,
    can_manage_users: false,
    can_manage_promotions: false,
    can_view_reports: false,
    can_manage_settings: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions as UserPermissions)
    } else {
      // Definir permissões padrão baseadas na role
      const defaultPermissions = {
        can_manage_products: user?.role === 'admin',
        can_manage_orders: user?.role === 'admin',
        can_manage_users: user?.role === 'admin',
        can_manage_promotions: user?.role === 'admin',
        can_view_reports: user?.role === 'admin',
        can_manage_settings: user?.role === 'admin'
      }
      setPermissions(defaultPermissions)
    }
  }, [user])

  const handlePermissionChange = (key: keyof UserPermissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked
    }))
  }

  const handleSelectAll = () => {
    const allSelected = Object.values(permissions).every(Boolean)
    const newPermissions = Object.keys(permissions).reduce((acc, key) => {
      acc[key as keyof UserPermissions] = !allSelected
      return acc
    }, {} as UserPermissions)
    setPermissions(newPermissions)
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      await onUpdatePermissions(user.id, permissions)
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedPermissions = permissionConfig.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof permissionConfig>)

  const selectedCount = Object.values(permissions).filter(Boolean).length
  const totalCount = Object.keys(permissions).length
  const allSelected = selectedCount === totalCount

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões do Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do usuário */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{user.full_name || 'Usuário sem nome'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                </Badge>
                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Controles gerais */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Permissões ({selectedCount}/{totalCount})</h4>
              <p className="text-sm text-muted-foreground">
                Selecione as permissões que este usuário deve ter
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </Button>
          </div>

          {/* Lista de permissões agrupadas */}
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category}>
                <h5 className="font-medium text-sm text-muted-foreground mb-3">
                  {category}
                </h5>
                <div className="space-y-3">
                  {categoryPermissions.map((permission) => {
                    const Icon = permission.icon
                    const isChecked = permissions[permission.key]
                    
                    return (
                      <div key={permission.key} className="flex items-start space-x-3">
                        <Checkbox
                          id={permission.key}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(permission.key, checked as boolean)
                          }
                          disabled={user.role === 'admin'} // Admins sempre têm todas as permissões
                        />
                        <div className="flex-1 space-y-1">
                          <Label 
                            htmlFor={permission.key}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Icon className="h-4 w-4" />
                            {permission.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {category !== 'Sistema' && <Separator className="mt-4" />}
              </div>
            ))}
          </div>

          {/* Aviso para administradores */}
          {user.role === 'admin' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Administradores têm todas as permissões por padrão e não podem ter suas permissões alteradas.
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || user.role === 'admin'}
            >
              {loading ? 'Salvando...' : 'Salvar Permissões'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}