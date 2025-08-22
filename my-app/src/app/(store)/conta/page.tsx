'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Star,
  CreditCard,
  Truck,
  CheckCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { useCustomerArea } from '@/hooks/useCustomerArea'
import { AddressModal } from '@/components/customer/AddressModal'
import { OrderDetailsModal } from '@/components/customer/OrderDetailsModal'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Database } from '@/lib/supabase/types'
import Image from 'next/image'

type Address = Database['public']['Tables']['addresses']['Row']

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
}

export default function AccountPage() {
  const { user } = useAuth()
  const {
    orders,
    addresses,
    wishlist,
    reviews,
    loading,
    error,
    cancelOrder,
    removeFromWishlist,
    isInWishlist,
    deleteAddress
  } = useCustomerArea()
  
  const [activeTab, setActiveTab] = useState('orders')
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const handleEditAddress = (address: Address) => {
    setSelectedAddress(address)
    setAddressModalOpen(true)
  }

  const handleNewAddress = () => {
    setSelectedAddress(null)
    setAddressModalOpen(true)
  }

  const handleViewOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId)
    setOrderDetailsModalOpen(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      try {
        await deleteAddress(addressId)
      } catch (error) {
        console.error('Erro ao excluir endereço:', error)
      }
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-gray-600 mb-4">Você precisa estar logado para acessar sua conta.</p>
              <Button>Fazer Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Minha Conta</h1>
        <p className="text-gray-600">Gerencie seus pedidos, endereços e preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereços
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Lista de Desejos
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
        </TabsList>

        {/* Pedidos */}
        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Meus Pedidos</h2>
            <Badge variant="outline">{orders.length} pedidos</Badge>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                  <p className="text-gray-600 mb-4">Você ainda não fez nenhum pedido.</p>
                  <Button>Continuar Comprando</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Pedido #{order.order_number}</CardTitle>
                        <CardDescription>
                          {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                        <p className="text-lg font-semibold mt-1">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <Image
                            src={item.product.image_url || '/placeholder.jpg'}
                            alt={item.product.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                            unoptimized
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantidade: {item.quantity} • {formatPrice(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CreditCard className="h-4 w-4" />
                          {order.payment_method || 'Não informado'}
                        </div>
                        {order.status === 'shipped' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="h-4 w-4" />
                            Em trânsito
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrderDetails(order.id)}
                        >
                          Ver Detalhes
                        </Button>
                        {order.status === 'pending' && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => cancelOrder(order.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Endereços */}
        <TabsContent value="addresses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Meus Endereços</h2>
            <Button onClick={handleNewAddress}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Endereço
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando endereços...</p>
            </div>
          ) : addresses.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
                  <p className="text-gray-600 mb-4">Adicione um endereço para facilitar suas compras.</p>
                  <Button onClick={handleNewAddress}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Endereço
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <Card key={address.id} className={address.is_default ? 'ring-2 ring-blue-500' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {address.label || `${address.type === 'shipping' ? 'Entrega' : address.type === 'billing' ? 'Cobrança' : 'Geral'}`}
                        </CardTitle>
                        {address.is_default && (
                          <Badge variant="secondary" className="mt-1">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditAddress(address)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(address.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{address.recipient_name}</p>
                      <p>{address.street}, {address.number}</p>
                      {address.complement && <p>{address.complement}</p>}
                      <p>{address.neighborhood}</p>
                      <p>{address.city} - {address.state}</p>
                      <p>CEP: {address.postal_code}</p>
                      {address.phone && <p>Tel: {address.phone}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Lista de Desejos */}
        <TabsContent value="wishlist" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Lista de Desejos</h2>
            <Badge variant="outline">{wishlist.length} itens</Badge>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando lista de desejos...</p>
            </div>
          ) : wishlist.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Lista de desejos vazia</h3>
                  <p className="text-gray-600 mb-4">Adicione produtos que você gostaria de comprar mais tarde.</p>
                  <Button>Explorar Produtos</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3">
                      <img
                        src={item.product.image_url || '/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                      {!item.product.is_active && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                          <Badge variant="destructive">Indisponível</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-2">{item.product.name}</h3>
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(item.product.price)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Adicionado em {format(new Date(item.added_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        className="flex-1" 
                        disabled={!item.product.is_active}
                      >
                        Adicionar ao Carrinho
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeFromWishlist(item.product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Avaliações */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Minhas Avaliações</h2>
            <Badge variant="outline">{reviews.length} avaliações</Badge>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando avaliações...</p>
            </div>
          ) : reviews.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação</h3>
                  <p className="text-gray-600 mb-4">Você ainda não avaliou nenhum produto.</p>
                  <Button>Ver Produtos Comprados</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{review.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {format(new Date(review.created_at), "dd/MM/yyyy")}
                          </span>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Compra verificada
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {review.comment && (
                    <CardContent>
                      <p className="text-gray-700">{review.comment}</p>
                      {review.helpful_count > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                          {review.helpful_count} pessoa(s) acharam útil
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <AddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        address={selectedAddress}
      />
      
      <OrderDetailsModal
        isOpen={orderDetailsModalOpen}
        onClose={() => setOrderDetailsModalOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  )
}