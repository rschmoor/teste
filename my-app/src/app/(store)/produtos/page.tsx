'use client'

import { useState, Suspense } from 'react'
import { FilterSidebar } from '@/components/store/filters'
import { ProductGrid } from '@/components/store/product/ProductGrid'
import { ProductSort } from '@/components/store/product/ProductSort'
import { ProductSearch } from '@/components/store/product/ProductSearch'
import { useFilters, useFilterOptions } from '@/hooks/useFilters'
import { useStoreProducts } from '@/hooks/useStoreProducts'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { CategorySEO } from '@/components/seo/ProductSEO'
import { MetaTags } from '@/components/seo/MetaTags'
import { ComponentErrorBoundary, SearchErrorFallback } from '@/providers/ErrorBoundaryProvider'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Use the filters hook
  const {
    filters,
    sort,
    updateFilter,
    updateSort,
    hasActiveFilters,
    activeFiltersCount
  } = useFilters({
    syncWithUrl: true,
    defaultSort: { field: 'created_at', direction: 'desc' }
  })
  
  // Get products with current filters
  const {
    products,
    loading,
    error,
    totalCount,
    hasNextPage,
    loadMore,
    isLoadingMore
  } = useStoreProducts({
    filters,
    sort,
    limit: 12
  })
  
  // Get filter options from products
  const filterOptions = useFilterOptions(products)
  
  const handleSearchChange = (search: string) => {
    updateFilter('search', search)
  }
  
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    updateSort(field as any, direction)
  }

  return (
    <>
      <MetaTags
        title="Produtos - Moda Feminina"
        description="Explore nossa coleção completa de moda feminina. Roupas, acessórios e calçados de qualidade com entrega rápida e parcelamento sem juros."
        keywords={['produtos', 'moda feminina', 'roupas', 'acessórios', 'calçados', 'boutique', 'coleção']}
        type="website"
      />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                <p className="text-gray-600 mt-1">Descubra nossa colecao completa</p>
              </div>
              
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="w-full max-w-md">
              <ComponentErrorBoundary>
                <ProductSearch
                  value={filters.search || ''}
                  onChange={handleSearchChange}
                />
              </ComponentErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar - Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <ComponentErrorBoundary>
              <FilterSidebar
                categories={filterOptions.categories}
                brands={filterOptions.brands}
                sizes={filterOptions.sizes}
                colors={filterOptions.colors}
                isLoading={loading}
              />
            </ComponentErrorBoundary>
          </aside>
          
          {/* Mobile Filters Sheet */}
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                  {hasActiveFilters && (
                    <span className="text-sm text-gray-500">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                    </span>
                  )}
                </div>
                
                <ComponentErrorBoundary>
                  <FilterSidebar
                    categories={filterOptions.categories}
                    brands={filterOptions.brands}
                    sizes={filterOptions.sizes}
                    colors={filterOptions.colors}
                    isLoading={loading}
                    isMobile
                    onClose={() => setShowMobileFilters(false)}
                  />
                </ComponentErrorBoundary>
              </div>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border">
              {/* Sort and Results Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-gray-600">
                    {loading ? (
                      <span>Carregando produtos...</span>
                    ) : (
                      <span>
                        {totalCount || 0} produto{(totalCount || 0) !== 1 ? 's' : ''} encontrado{(totalCount || 0) !== 1 ? 's' : ''}
                        {hasActiveFilters && (
                          <span className="ml-2 text-blue-600">
                            ({activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <ComponentErrorBoundary>
                    <ProductSort
                      sort={sort}
                      onChange={(newSort) => handleSortChange(newSort.field, newSort.direction)}
                    />
                  </ComponentErrorBoundary>
                </div>
              </div>
              
              {/* Products Grid */}
              <div className="p-6">
                <ComponentErrorBoundary>
                  <ProductGrid
                    products={products}
                    isLoading={loading}
                    error={error}
                    hasNextPage={hasNextPage}
                    onLoadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                  />
                </ComponentErrorBoundary>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
    </>
  )
}