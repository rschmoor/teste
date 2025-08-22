'use client'

import { Suspense, useEffect, useState } from 'react'
import { Search, Filter, SortAsc } from 'lucide-react'
import ProductCard from '@/components/store/ProductCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/ui/ProductCardSkeleton'
import { EmptySearchResults } from '@/components/ui/EmptyStates'
import { StaggerContainer, StaggerItem } from '@/components/ui/Animations'
import { useProductSearch } from '@/hooks/useProductSearch'

interface SearchPageContentProps {
  searchParams: URLSearchParams
}

function SearchPageContent({ searchParams }: SearchPageContentProps) {
  const query = searchParams.get('q') || ''
  const [sortBy, setSortBy] = useState('relevance')
  const [filterCategory, setFilterCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  
  const { results, loading, search } = useProductSearch()

  // Buscar produtos baseado na query
  useEffect(() => {
    if (query) {
      const filters = {
        category: filterCategory !== 'all' ? filterCategory : undefined,
        priceRange: priceRange !== 'all' ? 
          priceRange === '0-50' ? [0, 50] as [number, number] :
          priceRange === '50-100' ? [50, 100] as [number, number] :
          priceRange === '100-200' ? [100, 200] as [number, number] :
          priceRange === '200+' ? [200, 9999] as [number, number] :
          undefined : undefined,
      }
      
      const sort = sortBy === 'price_asc' ? 'price_asc' : 
                   sortBy === 'price_desc' ? 'price_desc' : 
                   sortBy === 'name' ? 'name' : 'relevance'
      
      search({ query, filters, sortBy: sort })
    }
  }, [query, filterCategory, priceRange, sortBy, search])

  const categories = ['Vestidos', 'Blusas', 'Saias', 'Calças', 'Acessórios']
  const suggestions = ['vestido floral', 'blusa seda', 'saia midi', 'calça wide leg', 'acessórios dourados']

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Search className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Buscar Produtos</h1>
          <p className="text-muted-foreground mb-8">
            Digite o que você está procurando na barra de busca acima
          </p>
          
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Sugestões populares:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => window.location.href = `/busca?q=${encodeURIComponent(suggestion)}`}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho da busca */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Resultados para: &quot;{query}&quot;
        </h1>
        {!loading && (
          <p className="text-muted-foreground">
            {results.length} {results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        )}
      </div>

      {/* Filtros e ordenação */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Preço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os preços</SelectItem>
            <SelectItem value="under-100">Até R$ 100</SelectItem>
            <SelectItem value="100-200">R$ 100 - R$ 200</SelectItem>
            <SelectItem value="over-200">Acima de R$ 200</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <SortAsc className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="price-asc">Menor preço</SelectItem>
              <SelectItem value="price-desc">Maior preço</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="newest">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : results.length > 0 ? (
        <StaggerContainer>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((result) => (
              <StaggerItem key={result.id}>
                  <ProductCard product={result} />
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>
      ) : (
        <EmptySearchResults query={query} />
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchPageContent searchParams={new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')} />
    </Suspense>
  )
}