export interface WishlistItem {
  id: string
  sku: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  category: string
  addedAt: Date
}

export interface WishlistContextType {
  items: WishlistItem[]
  itemCount: number
  addItem: (item: Omit<WishlistItem, 'addedAt'>) => void
  removeItem: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
  toggleItem: (item: Omit<WishlistItem, 'addedAt'>) => void
}

export interface SearchResult {
  id: string
  sku: string
  name: string
  brand?: string
  price: number
  originalPrice?: number
  image: string
  category?: string
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface SearchHistory {
  id: string
  query: string
  timestamp: Date
}

export interface SearchContextType {
  searchHistory: SearchHistory[]
  addToHistory: (query: string) => void
  clearHistory: () => void
  removeFromHistory: (id: string) => void
}