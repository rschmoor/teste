export interface ProductImage {
  id: string
  image_url: string
  alt_text?: string
  display_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  color: string
  size: string
  stock_quantity: number
  price_adjustment: number
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  sale_price?: number
  sku: string
  brand?: string
  category?: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  average_rating?: number
  review_count?: number
  sales_count?: number
  tags?: string[]
  created_at: string
  updated_at: string
  product_images?: ProductImage[]
  product_variants?: ProductVariant[]
  // Campos computados para compatibilidade
  image?: string
  images?: string[]
  primaryImage?: string
  variants?: ProductVariant[]
  stockQuantity?: number
  isActive?: boolean
  isFeatured?: boolean
  averageRating?: number
  reviewCount?: number
  salesCount?: number
  createdAt?: string
  updatedAt?: string
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