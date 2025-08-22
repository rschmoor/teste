'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductFilters, ProductSort } from './useStoreProducts'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterState {
  search: string
  category: string
  brand: string
  colors: string[]
  sizes: string[]
  priceRange: [number, number]
  inStock: boolean
  onSale: boolean
  featured: boolean
  tags: string[]
}

export interface SortState {
  field: ProductSort['field']
  direction: ProductSort['direction']
}

export interface UseFiltersOptions {
  defaultFilters?: Partial<FilterState>
  defaultSort?: SortState
  syncWithUrl?: boolean
  priceRange?: [number, number]
}

export interface UseFiltersReturn {
  filters: FilterState
  sort: SortState
  activeFiltersCount: number
  hasActiveFilters: boolean
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  updateSort: (field: SortState['field'], direction?: SortState['direction']) => void
  clearFilters: () => void
  clearFilter: (key: keyof FilterState) => void
  toggleFilter: (key: 'inStock' | 'onSale' | 'featured') => void
  addToArrayFilter: (key: 'colors' | 'sizes' | 'tags', value: string) => void
  removeFromArrayFilter: (key: 'colors' | 'sizes' | 'tags', value: string) => void
  getProductFilters: () => ProductFilters
  getProductSort: () => ProductSort
  resetToDefaults: () => void
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: '',
  brand: '',
  colors: [],
  sizes: [],
  priceRange: [0, 1000],
  inStock: false,
  onSale: false,
  featured: false,
  tags: []
}

const DEFAULT_SORT: SortState = {
  field: 'created_at',
  direction: 'desc'
}

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Mais Recentes', field: 'created_at' as const, direction: 'desc' as const },
  { value: 'created_at:asc', label: 'Mais Antigos', field: 'created_at' as const, direction: 'asc' as const },
  { value: 'name:asc', label: 'Nome A-Z', field: 'name' as const, direction: 'asc' as const },
  { value: 'name:desc', label: 'Nome Z-A', field: 'name' as const, direction: 'desc' as const },
  { value: 'price:asc', label: 'Menor Preco', field: 'price' as const, direction: 'asc' as const },
  { value: 'price:desc', label: 'Maior Preco', field: 'price' as const, direction: 'desc' as const },
  { value: 'rating:desc', label: 'Melhor Avaliacao', field: 'rating' as const, direction: 'desc' as const },
  { value: 'sales_count:desc', label: 'Mais Vendidos', field: 'sales_count' as const, direction: 'desc' as const }
]

export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    defaultFilters = {},
    defaultSort = DEFAULT_SORT,
    syncWithUrl = false,
    priceRange = [0, 1000]
  } = options

  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL params or defaults
  const getInitialFilters = useCallback((): FilterState => {
    if (syncWithUrl && searchParams) {
      return {
        search: searchParams.get('search') || defaultFilters.search || DEFAULT_FILTERS.search,
        category: searchParams.get('category') || defaultFilters.category || DEFAULT_FILTERS.category,
        brand: searchParams.get('brand') || defaultFilters.brand || DEFAULT_FILTERS.brand,
        colors: searchParams.get('colors')?.split(',').filter(Boolean) || defaultFilters.colors || DEFAULT_FILTERS.colors,
        sizes: searchParams.get('sizes')?.split(',').filter(Boolean) || defaultFilters.sizes || DEFAULT_FILTERS.sizes,
        priceRange: [
          parseInt(searchParams.get('minPrice') || '') || defaultFilters.priceRange?.[0] || priceRange[0],
          parseInt(searchParams.get('maxPrice') || '') || defaultFilters.priceRange?.[1] || priceRange[1]
        ],
        inStock: searchParams.get('inStock') === 'true' || defaultFilters.inStock || DEFAULT_FILTERS.inStock,
        onSale: searchParams.get('onSale') === 'true' || defaultFilters.onSale || DEFAULT_FILTERS.onSale,
        featured: searchParams.get('featured') === 'true' || defaultFilters.featured || DEFAULT_FILTERS.featured,
        tags: searchParams.get('tags')?.split(',').filter(Boolean) || defaultFilters.tags || DEFAULT_FILTERS.tags
      }
    }
    
    return {
      ...DEFAULT_FILTERS,
      priceRange,
      ...defaultFilters
    }
  }, [syncWithUrl, searchParams, defaultFilters, priceRange])

  const getInitialSort = useCallback((): SortState => {
    if (syncWithUrl && searchParams) {
      const sortParam = searchParams.get('sort')
      if (sortParam) {
        const [field, direction] = sortParam.split(':')
        return {
          field: field as SortState['field'],
          direction: (direction as SortState['direction']) || 'desc'
        }
      }
    }
    return defaultSort
  }, [syncWithUrl, searchParams, defaultSort])

  const [filters, setFilters] = useState<FilterState>(getInitialFilters)
  const [sort, setSort] = useState<SortState>(getInitialSort)

  // Update URL when filters change (if syncWithUrl is enabled)
  const updateUrl = useCallback((newFilters: FilterState, newSort: SortState) => {
    if (!syncWithUrl) return

    const params = new URLSearchParams()

    // Add filter params
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.brand) params.set('brand', newFilters.brand)
    if (newFilters.colors.length > 0) params.set('colors', newFilters.colors.join(','))
    if (newFilters.sizes.length > 0) params.set('sizes', newFilters.sizes.join(','))
    if (newFilters.priceRange[0] !== priceRange[0]) params.set('minPrice', newFilters.priceRange[0].toString())
    if (newFilters.priceRange[1] !== priceRange[1]) params.set('maxPrice', newFilters.priceRange[1].toString())
    if (newFilters.inStock) params.set('inStock', 'true')
    if (newFilters.onSale) params.set('onSale', 'true')
    if (newFilters.featured) params.set('featured', 'true')
    if (newFilters.tags.length > 0) params.set('tags', newFilters.tags.join(','))

    // Add sort param
    if (newSort.field !== DEFAULT_SORT.field || newSort.direction !== DEFAULT_SORT.direction) {
      params.set('sort', `${newSort.field}:${newSort.direction}`)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : window.location.pathname
    
    router.push(newUrl, { scroll: false })
  }, [syncWithUrl, router, priceRange])

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.category) count++
    if (filters.brand) count++
    if (filters.colors.length > 0) count++
    if (filters.sizes.length > 0) count++
    if (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) count++
    if (filters.inStock) count++
    if (filters.onSale) count++
    if (filters.featured) count++
    if (filters.tags.length > 0) count++
    return count
  }, [filters, priceRange])

  const hasActiveFilters = activeFiltersCount > 0

  // Update filter function
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateUrl(newFilters, sort)
  }, [filters, sort, updateUrl])

  // Update sort function
  const updateSort = useCallback((field: SortState['field'], direction?: SortState['direction']) => {
    const newDirection = direction || (sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc')
    const newSort = { field, direction: newDirection }
    setSort(newSort)
    updateUrl(filters, newSort)
  }, [filters, sort, updateUrl])

  // Clear all filters
  const clearFilters = useCallback(() => {
    const newFilters = {
      ...DEFAULT_FILTERS,
      priceRange
    }
    setFilters(newFilters)
    updateUrl(newFilters, sort)
  }, [sort, updateUrl, priceRange])

  // Clear specific filter
  const clearFilter = useCallback(<K extends keyof FilterState>(key: K) => {
    const defaultValue = (key === 'priceRange'
      ? (priceRange as FilterState[K])
      : (DEFAULT_FILTERS[key] as FilterState[K]))
    updateFilter(key, defaultValue)
  }, [updateFilter, priceRange])

  // Toggle boolean filters
  const toggleFilter = useCallback((key: 'inStock' | 'onSale' | 'featured') => {
    updateFilter(key, !filters[key])
  }, [filters, updateFilter])

  // Add to array filters
  const addToArrayFilter = useCallback(<K extends 'colors' | 'sizes' | 'tags'>(key: K, value: string) => {
    const currentArray = filters[key] as FilterState[K] & string[]
    if (!currentArray.includes(value)) {
      const next = [...currentArray, value] as FilterState[K]
      updateFilter(key, next)
    }
  }, [filters, updateFilter])

  // Remove from array filters
  const removeFromArrayFilter = useCallback(<K extends 'colors' | 'sizes' | 'tags'>(key: K, value: string) => {
    const currentArray = filters[key] as FilterState[K] & string[]
    const next = (currentArray.filter(item => item !== value) as unknown) as FilterState[K]
    updateFilter(key, next)
  }, [filters, updateFilter])

  // Get filters in ProductFilters format
  const getProductFilters = useCallback((): ProductFilters => {
    const productFilters: ProductFilters = {}
    
    if (filters.search) productFilters.search = filters.search
    if (filters.category) productFilters.category = filters.category
    if (filters.brand) productFilters.brand = filters.brand
    if (filters.colors.length > 0) productFilters.colors = filters.colors
    if (filters.sizes.length > 0) productFilters.sizes = filters.sizes
    if (filters.priceRange[0] !== priceRange[0] || filters.priceRange[1] !== priceRange[1]) {
      productFilters.priceRange = filters.priceRange
    }
    if (filters.inStock) productFilters.inStock = filters.inStock
    if (filters.onSale) productFilters.onSale = filters.onSale
    if (filters.featured) productFilters.featured = filters.featured
    if (filters.tags.length > 0) productFilters.tags = filters.tags
    
    return productFilters
  }, [filters, priceRange])

  // Get sort in ProductSort format
  const getProductSort = useCallback((): ProductSort => {
    return {
      field: sort.field,
      direction: sort.direction
    }
  }, [sort])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const newFilters = {
      ...DEFAULT_FILTERS,
      priceRange,
      ...defaultFilters
    }
    setFilters(newFilters)
    setSort(defaultSort)
    updateUrl(newFilters, defaultSort)
  }, [defaultFilters, defaultSort, updateUrl, priceRange])

  // Sync with URL params on mount and when searchParams change
  useEffect(() => {
    if (syncWithUrl) {
      setFilters(getInitialFilters())
      setSort(getInitialSort())
    }
  }, [syncWithUrl, searchParams, getInitialFilters, getInitialSort])

  return {
    filters,
    sort,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    updateSort,
    clearFilters,
    clearFilter,
    toggleFilter,
    addToArrayFilter,
    removeFromArrayFilter,
    getProductFilters,
    getProductSort,
    resetToDefaults
  }
}

// Export sort options for use in components
export { SORT_OPTIONS }

// Helper hook for getting available filter options from products
type MinimalProduct = {
  category?: string
  brand?: string
  variants?: Array<{ color?: string; size?: string }>
  tags?: string[]
  price: number
  salePrice?: number
  sale_price?: number
}

export function useFilterOptions(products: MinimalProduct[]) {
  return useMemo(() => {
    const categories = new Set<string>()
    const brands = new Set<string>()
    const colors = new Set<string>()
    const sizes = new Set<string>()
    const tags = new Set<string>()
    let minPrice = Infinity
    let maxPrice = 0

    products.forEach(product => {
      // Categories
      if (product.category) categories.add(product.category)
      
      // Brands
      if (product.brand) brands.add(product.brand)
      
      // Colors and sizes from variants
      product.variants?.forEach((variant) => {
        if (variant.color) colors.add(variant.color)
        if (variant.size) sizes.add(variant.size)
      })
      
      // Tags
      product.tags?.forEach((tag: string) => tags.add(tag))
      
      // Price range
      const price = (product.salePrice ?? product.sale_price ?? product.price)
      if (price < minPrice) minPrice = price
      if (price > maxPrice) maxPrice = price
    })

    return {
      categories: Array.from(categories).sort().map(cat => ({ value: cat, label: cat })),
      brands: Array.from(brands).sort().map(brand => ({ value: brand, label: brand })),
      colors: Array.from(colors).sort().map(color => ({ value: color, label: color })),
      sizes: Array.from(sizes).sort().map(size => ({ value: size, label: size })),
      tags: Array.from(tags).sort().map(tag => ({ value: tag, label: tag })),
      priceRange: [minPrice === Infinity ? 0 : minPrice, maxPrice] as [number, number]
    }
  }, [products])
}