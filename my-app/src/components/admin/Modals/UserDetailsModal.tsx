'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserWithAuth } from '@/hooks/useUsers'
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  Activity,
  Package,
  ShoppingCart,
  Tag,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserWithAuth | null
}

const permissionLabels = {
  can_manage_products: { label: 'Gerenciar Produtos', icon: Package },
  can_manage_orders: { label: 'Gerenciar Pedidos', icon: ShoppingCart },
  can_manage_users: { label: 'Gerenciar Usuários', icon: User },
  can_manage_promotions: { label: 'Gerenciar Promoções', icon: Tag },
  can_view_reports: { label: 'Visualizar Relatórios', icon: BarChart3 },
  can_manage_settings: { label: 'Gerenciar Configurações', icon: Settings }
}

export function UserDetailsModal({ isOpen, onClose, user }: UserDetailsModalProps) {
  if (!user) return null

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR
      })
    } catch {
      return 'Data inválida'
    }
  }

  const getPermissions = () => {
    if (user.role === 'admin') {
      return Object.entries(permissionLabels).map(([key, config]) => ({
        key,
        ...config,
        hasPermission: true
      }))
    }

    if (!user.permissions) {
      return Object.entries(permissionLabels).map(([key, config]) => ({
        key,
        ...config,
        hasPermission: false
      }))
    }

    return Object.entries(permissionLabels).map(([key, config]) => ({
      key,
      ...config,
      hasPermission: user.permissions?.[key as keyof typeof user.permissions] || false
    }))
  }

  const permissions = getPermissions()
  const activePermissions = permissions.filter(p => p.hasPermission)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                  <p className="text-sm">{user.full_name || 'Não informado'}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <p className="text-sm">{user.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">ID do Usuário</label>
                  <p className="text-xs font-mono bg-muted p-2 rounded">{user.id}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de autenticação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informações de Autenticação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data de Criação
                  </label>
                  <p className="text-sm">{formatDate(user.created_at)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Último Login
                  </label>
                  <p className="text-sm">{formatDate(user.last_sign_in_at)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Perfil Atualizado
                  </label>
                  <p className="text-sm">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissões ({activePermissions.length}/{permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.role === 'admin' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <strong>Administrador:</strong> Este usuário tem acesso total a todas as funcionalidades do sistema.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map((permission) => {
                    const Icon = permission.icon
                    return (
                      <div 
                        key={permission.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          permission.hasPermission 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${
                          permission.hasPermission ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm ${
                          permission.hasPermission ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {permission.label}
                        </span>
                        {permission.hasPermission ? (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 ml-auto" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações adicionais */}
          {user.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biografia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadados */}
          {user.metadata && Object.keys(user.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadados</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(user.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Botão de fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}