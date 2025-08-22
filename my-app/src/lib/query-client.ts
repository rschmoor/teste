'use client'

import { QueryClient, DefaultOptions, MutationCache, QueryCache } from '@tanstack/react-query'
import { toast } from 'sonner'
// import { useState, useEffect } from 'react'

// Interfaces para tipagem
interface CartItem {
  productId: string
  quantity: number
}

interface CartData {
  items: CartItem[]
}

interface OrderData {
  id: string
  status: string
  data?: OrderData[]
}

// Configurações padrão para queries
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Tempo que os dados ficam "frescos" (não refetch automático)
    staleTime: 5 * 60 * 1000, // 5 minutos
    
    // Tempo que os dados ficam em cache
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
    
    // Retry automático em caso de erro
    retry: (failureCount, error: unknown) => {
      // Não retry para erros 4xx (client errors)
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      // Máximo 3 tentativas para outros erros
      return failureCount < 3
    },
    
    // Delay entre retries (exponential backoff)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch quando a janela ganha foco
    refetchOnWindowFocus: false,
    
    // Refetch quando reconecta à internet
    refetchOnReconnect: true,
    
    // Refetch quando o componente monta
    refetchOnMount: true,
  },
  mutations: {
    // Retry para mutations apenas em caso de erro de rede
    retry: (failureCount, error: unknown) => {
      if (error?.name === 'NetworkError' && failureCount < 2) {
        return true
      }
      return false
    },
  },
}

// Cache para queries com tratamento de erros
const queryCache = new QueryCache({
  onError: (error: unknown, query) => {
    // Log do erro
    console.error('Query Error:', {
      queryKey: query.queryKey,
      error: error.message,
      stack: error.stack,
    })
    
    // Mostrar toast apenas para erros não esperados
    if (error?.status >= 500 || error?.name === 'NetworkError') {
      toast.error('Erro ao carregar dados. Tente novamente.')
    }
  },
  onSuccess: (data, query) => {
    // Log de sucesso em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Query Success:', {
        queryKey: query.queryKey,
        dataSize: JSON.stringify(data).length,
      })
    }
  },
})

// Cache para mutations com tratamento de erros
const mutationCache = new MutationCache({
  onError: (error: unknown, variables, context, mutation) => {
    console.error('Mutation Error:', {
      mutationKey: mutation.options.mutationKey,
      error: error.message,
      variables,
    })
    
    // Toast de erro para mutations
    const errorMessage = error?.message || 'Erro ao processar solicitação'
    toast.error(errorMessage)
  },
  onSuccess: (data, variables, context, mutation) => {
    // Log de sucesso para mutations
    if (process.env.NODE_ENV === 'development') {
      console.log('Mutation Success:', {
        mutationKey: mutation.options.mutationKey,
        variables,
      })
    }
  },
})

// Criar instância do QueryClient
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
  queryCache,
  mutationCache,
})

// Configurações específicas por tipo de dados
export const queryConfigs = {
  // Produtos - dados que mudam com frequência
  products: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  },
  
  // Categorias - dados mais estáveis
  categories: {
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  },
  
  // Usuário - dados críticos
  user: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  },
  
  // Carrinho - dados em tempo real
  cart: {
    staleTime: 0, // Sempre refetch
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
  },
  
  // Pedidos - dados históricos
  orders: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },
  
  // Busca - dados temporários
  search: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  },
}

// Query Keys padronizadas
export const queryKeys = {
  // Produtos
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
    related: (id: string) => [...queryKeys.products.all, 'related', id] as const,
  },
  
  // Categorias
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.categories.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.categories.all, 'detail', id] as const,
  },
  
  // Usuário
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
    addresses: () => [...queryKeys.user.all, 'addresses'] as const,
    orders: () => [...queryKeys.user.all, 'orders'] as const,
    wishlist: () => [...queryKeys.user.all, 'wishlist'] as const,
  },
  
  // Carrinho
  cart: {
    all: ['cart'] as const,
    items: () => [...queryKeys.cart.all, 'items'] as const,
    total: () => [...queryKeys.cart.all, 'total'] as const,
  },
  
  // Pedidos
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  
  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: () => [...queryKeys.chat.all, 'conversations'] as const,
    conversation: (id: string) => [...queryKeys.chat.all, 'conversation', id] as const,
    messages: (conversationId: string) => [...queryKeys.chat.all, 'messages', conversationId] as const,
  },
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    metrics: () => [...queryKeys.analytics.all, 'metrics'] as const,
    sales: (period: string) => [...queryKeys.analytics.all, 'sales', period] as const,
  },
  // Usuário
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
}

// Funções de prefetch para otimização
export const prefetchQueries = {
  // Prefetch produtos relacionados
  async relatedProducts(productId: string, categoryId: string) {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.list({ category: categoryId, exclude: productId }),
      queryFn: async () => {
        // Implementar busca de produtos relacionados
        const response = await fetch(`/api/products?category=${categoryId}&exclude=${productId}&limit=4`)
        return response.json()
      },
      staleTime: 10 * 60 * 1000, // 10 minutos
    })
  },

  // Prefetch próxima página de produtos
  async nextProductPage(currentPage: number, filters: Record<string, unknown>) {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.list({ ...filters, page: currentPage + 1 }),
      queryFn: async () => {
        const params = new URLSearchParams({ ...filters, page: String(currentPage + 1) })
        const response = await fetch(`/api/products?${params}`)
        return response.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  },

  // Prefetch detalhes do produto ao hover
  async productDetails(productId: string) {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: async () => {
        const response = await fetch(`/api/products/${productId}`)
        return response.json()
      },
      staleTime: 15 * 60 * 1000, // 15 minutos
    })
  },
}

// Funções de invalidação para atualizações
export const invalidateQueries = {
  // Invalidar todos os produtos
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  
  // Invalidar produto específico
  product: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
  
  // Invalidar pedidos
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  
  // Invalidar chat
  chat: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat.all }),
  
  // Invalidar analytics
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
}

// Optimistic updates helpers
export const optimisticUpdates = {
  // Adicionar produto ao carrinho otimisticamente
  addToCart: (productId: string, quantity: number) => {
    queryClient.setQueryData(['cart'], (oldData: unknown) => {
      if (!oldData) return { items: [{ productId, quantity }] }
      
      const data = oldData as CartData
      const existingItem = data.items.find((item: CartItem) => item.productId === productId)
      if (existingItem) {
        return {
          ...data,
          items: data.items.map((item: CartItem) => 
            item.productId === productId 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
      }
      
      return {
        ...data,
        items: [...data.items, { productId, quantity }]
      }
    })
  },

  // Atualizar status do pedido
  updateOrderStatus: (orderId: string, status: string) => {
    queryClient.setQueryData(queryKeys.orders.detail(orderId), (oldData: unknown) => {
      if (!oldData) return oldData
      return { ...oldData as OrderData, status }
    })
    
    // Também atualizar na lista de pedidos
    queryClient.setQueryData(queryKeys.orders.lists(), (oldData: unknown) => {
      if (!oldData) return oldData
      const data = oldData as { data: OrderData[] }
      return {
        ...data,
        data: data.data.map((order: OrderData) => 
          order.id === orderId ? { ...order, status } : order
        )
      }
    })
  },
}

// Configuração de persistência (opcional)
export const persistOptions = {
  persister: {
    persistClient: async (client: unknown) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('react-query-cache', JSON.stringify(client))
      }
    },
    restoreClient: async () => {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('react-query-cache')
        return cached ? JSON.parse(cached) : undefined
      }
      return undefined
    },
    removeClient: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('react-query-cache')
      }
    },
  },
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
}