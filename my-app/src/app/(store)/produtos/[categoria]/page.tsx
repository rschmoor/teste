'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Grid, List, Filter, SlidersHorizontal } from 'lucide-react'
import { useProductsByCategory } from '@/hooks/useStoreProducts'
import ProductCard, { ProductCardSkeleton } from '@/components/store/ProductCard'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'
import { StaggerContainer, StaggerItem } from '@/components/ui/Animations'
import ProductFilters from '@/components/store/ProductFilters'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
// Removed useFilters import - using local state instead
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination'

type ViewMode = 'grid' | 'list'
type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name' | 'rating'

const sortOptions = [
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'oldest', label: 'Mais Antigos' },
  { value: 'price-low', label: 'Menor Preco' },
  { value: 'price-high', label: 'Maior Preco' },
  { value: 'name', label: 'Nome A-Z' },
  { value: 'rating', label: 'Melhor Avaliacao' }
]

const categoryNames: Record<string, string> = {
  'vestidos': 'Vestidos',
  'blusas': 'Blusas',
  'saias': 'Saias',
  'calcas': 'Calcas',
  'shorts': 'Shorts',
  'conjuntos': 'Conjuntos',
  'acessorios': 'Acessorios',
  'calcados': 'Calcados',
  'bolsas': 'Bolsas'
}

export default function CategoryPage() {
  const params = useParams()
  const categoria = params.categoria as string
  const categoryName = categoryNames[categoria] || categoria
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const productsPerPage = 12
  
  // Local filters state
  const [filters, setFilters] = useState({
    category: categoria,
    search: '',
    categories: [] as string[],
    brands: [] as string[],
    brand: '',
    colors: [] as string[],
    sizes: [] as string[],
    priceRange: [0, 1000] as [number, number],
    inStock: false,
    onSale: false,
    featured: false
  })

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      category: categoria,
      search: '',
      categories: [],
      brands: [],
      brand: '',
      colors: [],
      sizes: [],
      priceRange: [0, 1000],
      inStock: false,
      onSale: false,
      featured: false
    })
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    if (key === 'category') return false // Category is always set
    const value = filters[key as keyof typeof filters]
    if (Array.isArray(value)) return value.length > 0
    if (key === 'priceRange') return Array.isArray(value) && (value[0] !== 0 || value[1] !== 1000)
    return value !== undefined && value !== '' && value !== false
  })
  
  // Convert sort option to API format
  const sortConfig = useMemo(() => {
    switch (sortBy) {
      case 'newest':
        return { field: 'created_at' as const, direction: 'desc' as const }
      case 'oldest':
        return { field: 'created_at' as const, direction: 'asc' as const }
      case 'price-low':
        return { field: 'price' as const, direction: 'asc' as const }
      case 'price-high':
        return { field: 'price' as const, direction: 'desc' as const }
      case 'name':
        return { field: 'name' as const, direction: 'asc' as const }
      case 'rating':
        return { field: 'rating' as const, direction: 'desc' as const }
      default:
        return { field: 'created_at' as const, direction: 'desc' as const }
    }
  }, [sortBy])
  
  const {
    products,
    loading,
    error,
    totalCount
  } = useProductsByCategory(categoria, productsPerPage)
  
  const totalPages = Math.ceil((totalCount || 0) / productsPerPage)
  const currentProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryName}</h1>
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${totalCount || 0} produtos encontrados`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <ProductFilters
                          filters={filters}
                          onFiltersChange={handleFilterChange}
                          className="bg-white rounded-lg shadow-sm"
                        />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile Filters */}
                  <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden">
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                        {hasActiveFilters && (
                          <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                            !
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filtros</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <ProductFilters
                          filters={filters}
                          onFiltersChange={handleFilterChange}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Sort */}
                  <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                    <SelectTrigger className="w-48">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="flex border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              viewMode === 'grid' ? (
                <ProductGridSkeleton count={8} />
              ) : (
                <div className="grid gap-6 grid-cols-1">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <ProductCardSkeleton key={index} viewMode={viewMode} />
                  ))}
                </div>
              )
            ) : currentProducts.length > 0 ? (
              <>
                <StaggerContainer>
                  <div className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}>
                    {currentProducts.map((product, index) => (
                      <StaggerItem key={product.id}>
                        <ProductCard
                          product={product}
                          viewMode={viewMode}
                        />
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerContainer>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href={currentPage > 1 ? `?page=${currentPage - 1}` : '#'}
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage > 1) setCurrentPage(currentPage - 1)
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                            size="default"
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href={`?page=${pageNum}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  setCurrentPage(pageNum)
                                }}
                                isActive={currentPage === pageNum}
                                size="default"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}
                        
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            href={currentPage < totalPages ? `?page=${currentPage + 1}` : '#'}
                            onClick={(e) => {
                              e.preventDefault()
                              if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                            size="default"
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Nao encontramos produtos que correspondam aos seus criterios de busca.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Limpar Filtros
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}