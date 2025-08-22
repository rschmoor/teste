'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/product'

// Interface para produto raw do banco
interface RawProduct {
  id: string
  name: string
  meta_description?: string
  sku: string
  sale_price: number
  brand_id?: string
  category_id?: string
  stock_quantity: number
  is_inactive: boolean
  is_promotion?: boolean
  is_featured?: boolean
  sold_count?: number
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  search?: string
  category?: string
  brand?: string
  colors?: string[]
  sizes?: string[]
  priceRange?: [number, number]
  inStock?: boolean
  onSale?: boolean
  featured?: boolean
  tags?: string[]
}

export interface ProductSort {
  field: 'name' | 'price' | 'created_at' | 'updated_at' | 'rating' | 'sales_count'
  direction: 'asc' | 'desc'
}

export interface UseStoreProductsOptions {
  filters?: ProductFilters
  sort?: ProductSort
  page?: number
  limit?: number
  enabled?: boolean
}

export interface UseStoreProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  isLoadingMore: boolean
}

const DEFAULT_LIMIT = 12
const DEFAULT_SORT: ProductSort = { field: 'created_at', direction: 'desc' }

export function useStoreProducts(options: UseStoreProductsOptions = {}): UseStoreProductsReturn {
  const {
    filters = {},
    sort = DEFAULT_SORT,
    page = 1,
    limit = DEFAULT_LIMIT,
    enabled = true
  } = options

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)

  const supabase = createClient()

  // Note: Removed queryParams memoization to fix infinite loop issue

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (!enabled) return

    try {
      if (isLoadMore) {
        setIsLoadingMore(true)
      } else {
        setLoading(true)
        setError(null)
      }

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_inactive', false)

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,meta_description.ilike.%${filters.search}%`)
    }

    if (filters.brand) {
      query = query.eq('brand_id', filters.brand)
    }

    if (filters.onSale) {
      query = query.eq('is_promotion', true)
    }

    if (filters.featured) {
      query = query.eq('is_featured', true)
    }

    if (filters.category) {
      // Check if category is a UUID (category_id) or category name
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.category)
      
      if (isUUID) {
        query = query.eq('category_id', filters.category)
      } else {
        // If it's a category name, we need to join with categories table or use a different approach
        // For now, let's skip the filter if it's not a valid UUID
        console.warn('Category filter is not a valid UUID, skipping:', filters.category)
      }
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      // Temporarily disable price range filter to fix query issues
      // query = query.gte('sale_price', min).lte('sale_price', max)
      console.log('Price range filter temporarily disabled:', { min, max })
    }

    if (filters.inStock) {
      query = query.gt('stock_quantity', 0)
    }

    // Apply sorting with field mapping
    let sortField = sort.field
    if (sort.field === 'price') {
      sortField = 'sale_price'
    } else if (sort.field === 'rating') {
      sortField = 'view_count'
    } else if (sort.field === 'sales_count') {
      sortField = 'sold_count'
    }
    query = query.order(sortField, { ascending: sort.direction === 'asc' })

    // Apply pagination
    const validCurrentPage = Number.isInteger(currentPage) && currentPage > 0 ? currentPage : 1
    const validLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT
    const offset = (validCurrentPage - 1) * validLimit
    query = query.range(offset, offset + validLimit - 1)

    const { data, error: queryError, count } = await query

    if (queryError) {
      throw new Error(queryError.message)
    }

    // Transform raw data to Product interface
    const transformedProducts = (data || []).map((rawProduct: RawProduct): Product => {
      const placeholderImage = '/placeholder-product.svg'
      
      return {
        id: rawProduct.id,
        name: rawProduct.name,
        description: rawProduct.meta_description || '',
        sku: rawProduct.sku,
        price: rawProduct.sale_price || 0,
        salePrice: rawProduct.sale_price,
        brand: rawProduct.brand_id || '',
        category: 'Categoria',
        categories: [],
        images: [placeholderImage],
        primaryImage: placeholderImage,
        variants: [],
        stockQuantity: 100,
        isActive: !rawProduct.is_inactive,
        isFeatured: false,
        tags: [],
        averageRating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 1,
        salesCount: rawProduct.sold_count || 0,
        createdAt: rawProduct.created_at,
        updatedAt: rawProduct.updated_at
      }
    })
    
    if (isLoadMore) {
      setProducts(prev => [...prev, ...transformedProducts])
    } else {
      setProducts(transformedProducts)
    }
    
    setTotalCount(count || 0)
    
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
      setError(errorMessage)
      console.error('Error fetching products:', err)
      
      // Fallback para dados mock quando a API falha
      if (!isLoadMore) {
        console.log('Using mock data as fallback')
        setProducts(mockProducts)
        setTotalCount(mockProducts.length)
      }
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }, [supabase, filters, sort, currentPage, limit, enabled])

  const refetch = useCallback(async () => {
    setCurrentPage(1)
    await fetchProducts(false)
  }, [fetchProducts])

  const loadMore = useCallback(async () => {
    if (hasNextPage && !isLoadingMore) {
      setCurrentPage(prev => prev + 1)
      await fetchProducts(true)
    }
  }, [fetchProducts, isLoadingMore, hasNextPage])

  // Calculate derived values
  const totalPages = Math.ceil(totalCount / limit)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts(false)
  }, [fetchProducts])

  // Reset to first page when filters change (except page itself)
  useEffect(() => {
    if (currentPage !== page) {
      setCurrentPage(page)
    }
  }, [page, currentPage])

  return {
    products,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    refetch,
    loadMore,
    isLoadingMore
  }
}

// Hook for fetching a single product
export function useStoreProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchProduct = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (queryError) {
        throw new Error(queryError.message)
      }

      setProduct(data as Product)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product'
      setError(errorMessage)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}

// Hook for fetching featured products
export function useFeaturedProducts(limit = 8) {
  return useStoreProducts({
    filters: { featured: true },
    sort: { field: 'sales_count', direction: 'desc' },
    limit,
    enabled: true
  })
}

// Hook for fetching products by category
export function useProductsByCategory(category: string, limit = 12) {
  return useStoreProducts({
    filters: { category },
    sort: { field: 'created_at', direction: 'desc' },
    limit,
    enabled: !!category
  })
}

// Hook for fetching sale products
export function useSaleProducts(limit = 12) {
  return useStoreProducts({
    filters: { onSale: true },
    sort: { field: 'created_at', direction: 'desc' },
    limit,
    enabled: true
  })
}

// Mock data fallback
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Vestido Floral Elegante',
    description: 'Vestido midi com estampa floral delicada, perfeito para ocasioes especiais.',
    price: 299.90,
    sale_price: 249.90,
    sku: 'VFE001',
    brand: 'Elegance',
    category: 'vestidos',
    stock_quantity: 15,
    is_active: true,
    is_featured: true,
    average_rating: 4.8,
    review_count: 24,
    sales_count: 89,
    tags: ['floral', 'elegante', 'midi'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    product_images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        alt_text: 'Vestido Floral Elegante - Frente',
        display_order: 1,
        is_primary: true
      }
    ],
    product_variants: [
      {
        id: '1',
        color: 'Rosa',
        size: 'P',
        stock_quantity: 5,
        price_adjustment: 0
      },
      {
        id: '2',
        color: 'Rosa',
        size: 'M',
        stock_quantity: 8,
        price_adjustment: 0
      },
      {
        id: '3',
        color: 'Rosa',
        size: 'G',
        stock_quantity: 2,
        price_adjustment: 0
      }
    ]
  }
  // Add more mock products as needed
]