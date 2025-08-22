'use client'

import { ProductCard, Product } from './ProductCard'
import { Button } from '@/components/ui/button'

import { AlertCircle } from 'lucide-react'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'
import { StaggerContainer, StaggerItem } from '@/components/ui/Animations'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  error?: string | null
  hasNextPage?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  className?: string
}




export function ProductGrid({ 
  products, 
  isLoading, 
  error, 
  hasNextPage, 
  onLoadMore, 
  isLoadingMore,
  className 
}: ProductGridProps) {

  const handleQuickView = (product: Product) => {
    // TODO: Implementar modal de visualizacao rapida
    console.log('Quick view:', product)
  }

  const handleAddToCart = (product: Product) => {
    // TODO: Implementar adicao ao carrinho
    console.log('Add to cart:', product)
  }

  const handleToggleFavorite = (product: Product) => {
    // TODO: Implementar toggle de favoritos
    console.log('Toggle favorite:', product)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-900">Erro ao carregar produtos</p>
          <p className="text-sm text-gray-600 mt-1">
            {error || 'Erro desconhecido'}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  if (isLoading && products.length === 0) {
    return <ProductGridSkeleton count={12} />
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-900">Nenhum produto encontrado</p>
          <p className="text-sm text-gray-600 mt-1">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
        >
          Limpar Filtros
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Products Grid */}
      <StaggerContainer>
        <div 
          id="products-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
        >
          {products.map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard
                product={product}
                onQuickView={handleQuickView}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            </StaggerItem>
          ))}
        </div>
      </StaggerContainer>

      {/* Loading More Skeleton */}
      {isLoadingMore && (
        <ProductGridSkeleton count={4} />
      )}

      {/* Load More Button */}
      {hasNextPage && onLoadMore && (
        <div className="flex justify-center">
          <Button 
            onClick={onLoadMore} 
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
          >
            {isLoadingMore ? 'Carregando...' : 'Carregar Mais Produtos'}
          </Button>
        </div>
      )}
    </div>
  )
}