'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SearchResult, SearchHistory } from '@/types/wishlist'

export interface SearchFilters {
  category?: string
  priceRange?: [number, number]
  brand?: string
  inStock?: boolean
  onSale?: boolean
}

export interface SearchOptions {
  query: string
  filters?: SearchFilters
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest'
  limit?: number
}

export interface UseProductSearchReturn {
  results: SearchResult[]
  loading: boolean
  error: string | null
  searchHistory: SearchHistory[]
  suggestions: string[]
  search: (options: SearchOptions) => Promise<void>
  clearHistory: () => void
  addToHistory: (query: string) => void
  getSuggestions: (query: string) => Promise<string[]>
}

// Tipo mínimo para mapear os campos utilizados do produto retornado pelo Supabase
type RawProductSearch = {
  id: string
  name: string
  meta_description?: string | null
  sale_price?: number | null
  original_price?: number | null
  brand_id?: string | null
  sku: string
  stock_quantity?: number | null
}

const SEARCH_HISTORY_KEY = 'boutique_search_history'
const MAX_HISTORY_ITEMS = 10
const MAX_SUGGESTIONS = 5

// Mock data para fallback
const mockSuggestions = [
  'vestido', 'blusa', 'calça', 'sapato', 'bolsa',
  'jeans', 'tênis', 'camisa', 'saia', 'casaco'
]

export function useProductSearch(): UseProductSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const supabase = createClient()

  // Salvar histórico no localStorage
  const saveHistory = useCallback((history: SearchHistory[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    }
  }, [])

  // Adicionar ao histórico
  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return

    const newHistory = [
      {
        id: Date.now().toString(),
        query: query.trim(),
        timestamp: new Date().toISOString()
      },
      ...searchHistory.filter(item => item.query !== query.trim())
    ].slice(0, MAX_HISTORY_ITEMS)

    setSearchHistory(newHistory)
    saveHistory(newHistory)
  }, [searchHistory, saveHistory])

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setSearchHistory([])
    saveHistory([])
  }, [saveHistory])

  // Buscar produtos
  const search = useCallback(async (options: SearchOptions) => {
    const { query, filters = {}, sortBy = 'relevance', limit = 20 } = options

    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Adicionar ao histórico
      addToHistory(query)

      let supabaseQuery = supabase
        .from('products')
        .select('*')
        .eq('is_inactive', false)

      // Busca por texto (nome, SKU, descrição)
      supabaseQuery = supabaseQuery.or(
        `name.ilike.%${query}%,sku.ilike.%${query}%,meta_description.ilike.%${query}%`
      )

      // Aplicar filtros
      if (filters.category) {
        supabaseQuery = supabaseQuery.eq('category_id', filters.category)
      }

      if (filters.brand) {
        supabaseQuery = supabaseQuery.eq('brand_id', filters.brand)
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange
        supabaseQuery = supabaseQuery.gte('sale_price', min).lte('sale_price', max)
      }

      if (filters.inStock) {
        supabaseQuery = supabaseQuery.gt('stock_quantity', 0)
      }

      if (filters.onSale) {
        supabaseQuery = supabaseQuery.eq('is_promotion', true)
      }

      // Aplicar ordenação
      switch (sortBy) {
        case 'price_asc':
          supabaseQuery = supabaseQuery.order('sale_price', { ascending: true })
          break
        case 'price_desc':
          supabaseQuery = supabaseQuery.order('sale_price', { ascending: false })
          break
        case 'name':
          supabaseQuery = supabaseQuery.order('name', { ascending: true })
          break
        case 'newest':
          supabaseQuery = supabaseQuery.order('created_at', { ascending: false })
          break
        default: // relevance
          // Para relevância, ordenamos por uma combinação de fatores
          supabaseQuery = supabaseQuery.order('view_count', { ascending: false })
          break
      }

      supabaseQuery = supabaseQuery.limit(limit)

      const { data, error: queryError } = await supabaseQuery

      if (queryError) {
        throw new Error(queryError.message)
      }

      // Transformar dados para SearchResult
      const searchResults: SearchResult[] = (data || []).map((rawProduct: RawProductSearch) => ({
        id: rawProduct.id,
        name: rawProduct.name,
        description: rawProduct.meta_description || '',
        price: rawProduct.sale_price || 0,
        originalPrice: rawProduct.original_price,
        image: '/placeholder-product.svg',
        category: 'Categoria',
        brand: rawProduct.brand_id || '',
        sku: rawProduct.sku,
        inStock: (rawProduct.stock_quantity || 0) > 0,
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 1
      }))

      setResults(searchResults)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produtos'
      setError(errorMessage)
      console.error('Erro na busca:', err)

      // Fallback para dados mock
      const mockResults: SearchResult[] = [
        {
          id: '1',
          name: `Produto relacionado a "${query}"`,
          description: 'Produto de exemplo encontrado na busca',
          price: 99.90,
          originalPrice: 149.90,
          image: '/placeholder-product.svg',
          category: 'Categoria',
          brand: 'Marca',
          sku: 'MOCK001',
          inStock: true,
          rating: 4.5,
          reviewCount: 25
        }
      ]
      setResults(mockResults)
    } finally {
      setLoading(false)
    }
  }, [supabase, addToHistory])

  // Obter sugestões
  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 2) {
      return []
    }

    try {
      // Buscar produtos similares para gerar sugestões
      const { data } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('is_inactive', false)
        .limit(MAX_SUGGESTIONS)

      if (data && data.length > 0) {
        return data.map(item => item.name)
      }

      // Fallback para sugestões mock
      return mockSuggestions
        .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)

    } catch (err) {
      console.error('Erro ao obter sugestões:', err)
      return mockSuggestions
        .filter(suggestion => suggestion.toLowerCase().includes(query.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)
    }
  }, [supabase])

  // Sugestões memoizadas baseadas no histórico
  const suggestions = useMemo(() => {
    return searchHistory.slice(0, 5).map(item => item.query)
  }, [searchHistory])

  return {
    results,
    loading,
    error,
    searchHistory,
    suggestions,
    search,
    clearHistory,
    addToHistory,
    getSuggestions
  }
}

// Hook para busca rápida (autocomplete)
export function useQuickSearch() {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      setLoading(true)

      const { data } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('is_inactive', false)
        .limit(5)

      if (data) {
        setSuggestions(data.map(item => item.name))
      } else {
        // Fallback
        setSuggestions(
          mockSuggestions
            .filter(s => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
        )
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err)
      setSuggestions(
        mockSuggestions
          .filter(s => s.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
      )
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    suggestions,
    loading,
    searchSuggestions
  }
}