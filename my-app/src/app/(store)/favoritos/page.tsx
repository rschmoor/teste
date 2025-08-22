'use client'

import { useState } from 'react'
import { Heart, ShoppingCart, Share2, Trash2, ArrowLeft } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import ProductCard from '@/components/store/ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { Product } from '@/types/product'
import { EmptyWishlist } from '@/components/ui/EmptyStates'
import { StaggerContainer, StaggerItem } from '@/components/ui/Animations'

export default function FavoritesPage() {
  const { items, clearWishlist, itemCount } = useWishlist()
  const { addItem } = useCart()
  const [isAddingAll, setIsAddingAll] = useState(false)

  // Converter WishlistItem para Product para usar no ProductCard
  const wishlistProducts: Product[] = items.map(item => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    brand: item.brand,
    price: item.price,
    sale_price: item.originalPrice,
    description: `${item.name} - ${item.brand}`,
    stock_quantity: 100, // Valor padrão
    is_active: true,
    is_featured: false,
    created_at: item.addedAt.toISOString(),
    updated_at: item.addedAt.toISOString(),
    // Campos computados para compatibilidade
    image: item.image,
    images: [item.image],
    primaryImage: item.image,
    variants: [],
    stockQuantity: 100,
    isActive: true,
    isFeatured: false,
    averageRating: 0,
    reviewCount: 0,
    salesCount: 0,
    createdAt: item.addedAt.toISOString(),
    updatedAt: item.addedAt.toISOString()
  }))

  const handleAddAllToCart = async () => {
    if (items.length === 0) return

    setIsAddingAll(true)
    
    try {
      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let addedCount = 0
      
      items.forEach(item => {
        try {
          // Converter WishlistItem para Product
          const product: Product = {
            id: item.id,
            sku: item.sku,
            name: item.name,
            brand: item.brand,
            price: item.price,
            images: [item.image],
            category: item.category,
            description: '',
            stock_quantity: 1,
            stockQuantity: 1,
            is_active: true,
            is_featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          addItem(product, 'M', 'Único', 1)
          addedCount++
        } catch (error) {
          console.error(`Erro ao adicionar ${item.name} ao carrinho:`, error)
        }
      })
      
      if (addedCount > 0) {
        toast.success(`${addedCount} ${addedCount === 1 ? 'produto adicionado' : 'produtos adicionados'} ao carrinho! 🛒`)
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos ao carrinho:', error)
      toast.error('Erro ao adicionar produtos ao carrinho')
    } finally {
      setIsAddingAll(false)
    }
  }

  const handleShareWishlist = async () => {
    try {
      const wishlistData = {
        items: items.map(item => ({
          name: item.name,
          brand: item.brand,
          price: item.price,
          sku: item.sku
        })),
        total: items.length,
        createdAt: new Date().toISOString()
      }
      
      const shareText = `Minha lista de favoritos da Boutique:\n\n${items.map(item => 
        `• ${item.name} - ${item.brand} - R$ ${item.price.toFixed(2)}`
      ).join('\n')}\n\nTotal: ${items.length} ${items.length === 1 ? 'produto' : 'produtos'}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Minha Lista de Favoritos - Boutique',
          text: shareText,
          url: window.location.origin + '/favoritos'
        })
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(shareText)
        toast.success('Lista copiada para a área de transferência! 📋')
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast.error('Erro ao compartilhar lista')
    }
  }

  if (items.length === 0) {
    return <EmptyWishlist />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Meus Favoritos
          </h1>
          <p className="text-muted-foreground mt-2">
            {itemCount} {itemCount === 1 ? 'produto salvo' : 'produtos salvos'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleShareWishlist}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar Lista
          </Button>
          
          <Button
            onClick={handleAddAllToCart}
            disabled={isAddingAll}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {isAddingAll ? 'Adicionando...' : 'Adicionar Todos ao Carrinho'}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar Lista de Favoritos</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover todos os produtos da sua lista de favoritos? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearWishlist}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Limpar Lista
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{itemCount}</div>
          <div className="text-sm text-muted-foreground">
            {itemCount === 1 ? 'Produto' : 'Produtos'}
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            R$ {items.reduce((total, item) => total + item.price, 0).toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Valor Total</div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {items.filter(item => item.originalPrice && item.originalPrice > item.price).length}
          </div>
          <div className="text-sm text-muted-foreground">Em Promoção</div>
        </div>
      </div>

      {/* Categorias dos favoritos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Categorias:</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(items.map(item => item.category))).map(category => {
            const count = items.filter(item => item.category === category).length
            return (
              <Badge key={category} variant="secondary">
                {category} ({count})
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Grid de produtos */}
      <StaggerContainer>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product, index) => (
            <StaggerItem key={product.id}>
              <ProductCard 
                product={product}
                showRemoveFromWishlist
              />
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Sugestões */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Continue Explorando</h2>
        <p className="text-muted-foreground mb-6">
          Descubra mais produtos incríveis em nossa coleção
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link href="/produtos">
              Ver Todos os Produtos
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/produtos?categoria=novidades">
              Ver Novidades
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/produtos?promocao=true">
              Ver Promoções
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}