'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { ReactNode, useState } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Criar uma instância única do QueryClient no cliente
  const [client] = useState(() => queryClient)

  return (
    <QueryClientProvider client={client}>
      {children}
      {/* DevTools apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

// Hook personalizado para usar o query client
export { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'

// Hooks customizados para casos específicos
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys, prefetchQueries, optimisticUpdates } from '@/lib/query-client'

// Hook para produtos com prefetch automático
export function useProductsWithPrefetch(filters: Record<string, any> = {}, page = 1) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: queryKeys.products.list({ ...filters, page }),
    queryFn: async () => {
      const params = new URLSearchParams({ ...filters, page: String(page) })
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar produtos')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Prefetch da próxima página automaticamente
  if (query.data && !query.isLoading && query.data.hasNextPage) {
    prefetchQueries.nextProductPage(page, filters)
  }

  return query
}

// Hook para produto individual com prefetch de relacionados
export function useProductWithRelated(productId: string) {
  const queryClient = useQueryClient()
  
  const productQuery = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) throw new Error('Produto não encontrado')
      return response.json()
    },
    staleTime: 15 * 60 * 1000,
  })

  // Prefetch produtos relacionados quando o produto carrega
  if (productQuery.data && !productQuery.isLoading) {
    prefetchQueries.relatedProducts(productId, productQuery.data.categoryId)
  }

  return productQuery
}

// Hook para carrinho com optimistic updates
export function useCartMutations() {
  const queryClient = useQueryClient()

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      if (!response.ok) throw new Error('Erro ao adicionar ao carrinho')
      return response.json()
    },
    onMutate: async ({ productId, quantity }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      
      // Snapshot do estado anterior
      const previousCart = queryClient.getQueryData(['cart'])
      
      // Optimistic update
      optimisticUpdates.addToCart(productId, quantity)
      
      return { previousCart }
    },
    onError: (err, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    onSettled: () => {
      // Invalidar e refetch
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const removeFromCartMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (!response.ok) throw new Error('Erro ao remover do carrinho')
      return response.json()
    },
    onMutate: async ({ productId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previousCart = queryClient.getQueryData(['cart'])
      
      // Optimistic removal
      queryClient.setQueryData(['cart'], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          items: oldData.items.filter((item: any) => item.productId !== productId)
        }
      })
      
      return { previousCart }
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  return {
    addToCart: addToCartMutation,
    removeFromCart: removeFromCartMutation,
  }
}

// Hook para busca com debounce
import { useDebounce } from '@/hooks/useDebounce'

export function useProductSearch(searchTerm: string, delay = 300) {
  const debouncedSearchTerm = useDebounce(searchTerm, delay)
  
  return useQuery({
    queryKey: queryKeys.products.search(debouncedSearchTerm),
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return { data: [] }
      
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(debouncedSearchTerm)}`)
      if (!response.ok) throw new Error('Erro na busca')
      return response.json()
    },
    enabled: debouncedSearchTerm.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutos para buscas
  })
}

// Hook para infinite scroll
export function useInfiniteProducts(filters: Record<string, any> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ ...filters, page: String(pageParam) })
      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar produtos')
      return response.json()
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasNextPage ? pages.length + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
  })
}