'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types/product'

// Tipos locais para o retorno cru do Supabase, evitando uso de any
type RawCategory = { id: string; name: string; slug?: string }
type RawProductImage = { id: string; url: string; alt_text?: string; display_order: number; is_primary: boolean }
type RawProductVariant = { id: string; color: string; size: string; stock_quantity: number; price_adjustment?: number }

type RawProduct = {
  id: string
  name: string
  description?: string
  sku: string
  price: number
  sale_price?: number
  brand?: string
  category?: RawCategory | null
  product_images?: RawProductImage[]
  product_variants?: RawProductVariant[]
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  tags?: string[]
  average_rating?: number
  review_count?: number
  sales_count?: number
  created_at: string
  updated_at: string
  long_description?: string
  specifications?: Record<string, unknown>
  care_instructions?: string
  materials?: string
  weight?: number
  dimensions?: string
  seo_title?: string
  seo_description?: string
}

export interface UseProductOptions {
  sku?: string
  id?: string
  enabled?: boolean
}

export interface UseProductReturn {
  product: Product | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  relatedProducts: Product[]
  loadingRelated: boolean
}

export function useProduct(options: UseProductOptions): UseProductReturn {
  const { sku, id, enabled = true } = options
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)

  const supabase = createClient()

  const transformProduct = useCallback((rawProduct: RawProduct): Product => {
    const primaryImage = rawProduct.product_images?.find((img: RawProductImage) => img.is_primary) || rawProduct.product_images?.[0]
    const category = rawProduct.category || null
    const categories = category ? [category] : []
    
    return {
      id: rawProduct.id,
      name: rawProduct.name,
      description: rawProduct.description,
      sku: rawProduct.sku,
      price: rawProduct.price,
      salePrice: rawProduct.sale_price,
      brand: rawProduct.brand,
      category: category?.name || '',
      categories,
      images: rawProduct.product_images?.sort((a: RawProductImage, b: RawProductImage) => a.display_order - b.display_order) || [],
      primaryImage: primaryImage?.url || '/placeholder-product.svg',
      variants: rawProduct.product_variants || [],
      stockQuantity: rawProduct.stock_quantity,
      isActive: rawProduct.is_active,
      isFeatured: rawProduct.is_featured,
      tags: rawProduct.tags || [],
      averageRating: rawProduct.average_rating || 0,
      reviewCount: rawProduct.review_count || 0,
      salesCount: rawProduct.sales_count || 0,
      createdAt: rawProduct.created_at,
      updatedAt: rawProduct.updated_at,
      // Additional fields for product detail page
      longDescription: rawProduct.long_description,
      specifications: rawProduct.specifications || {},
      careInstructions: rawProduct.care_instructions,
      materials: rawProduct.materials,
      weight: rawProduct.weight,
      dimensions: rawProduct.dimensions,
      seoTitle: rawProduct.seo_title,
      seoDescription: rawProduct.seo_description
    } as unknown as Product
  }, [])

  const fetchProduct = useCallback(async () => {
    if (!enabled || (!sku && !id)) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(
            id,
            name,
            slug
          ),
          product_images(
            id,
            url,
            alt_text,
            display_order,
            is_primary
          ),
          product_variants(
            id,
            color,
            size,
            stock_quantity,
            price_adjustment
          )
        `)
        .eq('is_active', true)
        .single()

      if (sku) {
        query = query.eq('sku', sku)
      } else if (id) {
        query = query.eq('id', id)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          throw new Error('Produto não encontrado')
        }
        throw new Error(queryError.message)
      }

      const transformedProduct = transformProduct(data)
      setProduct(transformedProduct)

      // Fetch related products after main product is loaded
      fetchRelatedProducts(transformedProduct)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produto'
      setError(errorMessage)
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }, [enabled, sku, id, supabase, transformProduct, fetchRelatedProducts])

  const fetchRelatedProducts = useCallback(async (currentProduct: Product) => {
    try {
      setLoadingRelated(true)

      // Get related products based on category and tags
      const categoryIds = currentProduct.categories.map(cat => cat.id)

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(
            id,
            name,
            slug
          ),
          product_images(
            id,
            url,
            alt_text,
            display_order,
            is_primary
          ),
          product_variants(
            id,
            color,
            size,
            stock_quantity,
            price_adjustment
          )
        `)
        .eq('is_active', true)
        .neq('id', currentProduct.id)
        .limit(8)

      // Prioritize products from same category
      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        console.error('Error fetching related products:', queryError)
        return
      }

      const transformedRelated = (data || []).map(transformProduct)
      
      // If we don't have enough related products from same category, get more from other categories
      if (transformedRelated.length < 4) {
        const additionalQuery = supabase
          .from('products')
          .select(`
            *,
            category:categories(
              id,
              name,
              slug
            ),
            product_images(
              id,
              url,
              alt_text,
              display_order,
              is_primary
            ),
            product_variants(
              id,
              color,
              size,
              stock_quantity,
              price_adjustment
            )
          `)
          .eq('is_active', true)
          .neq('id', currentProduct.id)
          .not('id', 'in', `(${transformedRelated.map(p => p.id).join(',')})`)
          .limit(8 - transformedRelated.length)

        const { data: additionalData } = await additionalQuery
        const additionalProducts = (additionalData || []).map(transformProduct)
        
        setRelatedProducts([...transformedRelated, ...additionalProducts])
      } else {
        setRelatedProducts(transformedRelated)
      }
    } catch (err) {
      console.error('Error fetching related products:', err)
    } finally {
      setLoadingRelated(false)
    }
  }, [supabase, transformProduct])

  const refetch = useCallback(async () => {
    await fetchProduct()
  }, [fetchProduct])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return {
    product,
    loading,
    error,
    refetch,
    relatedProducts,
    loadingRelated
  }
}

// Hook for getting product by SKU (most common use case)
export function useProductBySku(sku: string, enabled = true) {
  return useProduct({ sku, enabled })
}

// Hook for getting product by ID
export function useProductById(id: string, enabled = true) {
  return useProduct({ id, enabled })
}

// Hook for product availability check
export function useProductAvailability(productId: string, selectedVariant?: { color?: string; size?: string }) {
  const [availability, setAvailability] = useState<{
    inStock: boolean
    stockQuantity: number
    loading: boolean
  }>({ inStock: false, stockQuantity: 0, loading: false })

  const supabase = createClient()

  const checkAvailability = useCallback(async () => {
    if (!productId) return

    try {
      setAvailability(prev => ({ ...prev, loading: true }))

      if (selectedVariant?.color || selectedVariant?.size) {
        // Check variant stock
        let query = supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('product_id', productId)

        if (selectedVariant.color) {
          query = query.eq('color', selectedVariant.color)
        }
        if (selectedVariant.size) {
          query = query.eq('size', selectedVariant.size)
        }

        const { data, error } = await query.single()

        if (error) {
          console.error('Error checking variant availability:', error)
          setAvailability({ inStock: false, stockQuantity: 0, loading: false })
          return
        }

        const stockQuantity = data?.stock_quantity || 0
        setAvailability({
          inStock: stockQuantity > 0,
          stockQuantity,
          loading: false
        })
      } else {
        // Check main product stock
        const { data, error } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single()

        if (error) {
          console.error('Error checking product availability:', error)
          setAvailability({ inStock: false, stockQuantity: 0, loading: false })
          return
        }

        const stockQuantity = data?.stock_quantity || 0
        setAvailability({
          inStock: stockQuantity > 0,
          stockQuantity,
          loading: false
        })
      }
    } catch (err) {
      console.error('Error checking availability:', err)
      setAvailability({ inStock: false, stockQuantity: 0, loading: false })
    }
  }, [productId, selectedVariant, supabase])

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  return availability
}