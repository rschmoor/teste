'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Database } from '@/lib/supabase/types'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Address = Database['public']['Tables']['addresses']['Row']
type Wishlist = Database['public']['Tables']['wishlist']['Row']
type ProductReview = Database['public']['Tables']['product_reviews']['Row']

type OrderWithItems = Order & {
  order_items: (OrderItem & {
    product: {
      id: string
      name: string
      image_url: string
      sku: string
    }
  })[]
}

type WishlistWithProduct = Wishlist & {
  product: {
    id: string
    name: string
    price: number
    image_url: string
    sku: string
    is_active: boolean
  }
}

export function useCustomerArea() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [wishlist, setWishlist] = useState<WishlistWithProduct[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar pedidos do usuário
  const fetchOrders = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              image_url,
              sku
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pedidos')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar endereços do usuário
  const fetchAddresses = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar endereços')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar lista de desejos
  const fetchWishlist = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            image_url,
            sku,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false })

      if (error) throw error
      setWishlist(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar lista de desejos')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Buscar avaliações do usuário
  const fetchReviews = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar avaliações')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Criar endereço
  const createAddress = async (addressData: Database['public']['Tables']['addresses']['Insert']) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      
      // Se for endereço padrão, remover padrão dos outros
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...addressData, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      
      await fetchAddresses()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar endereço')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Atualizar endereço
  const updateAddress = async (id: string, addressData: Database['public']['Tables']['addresses']['Update']) => {
    try {
      setLoading(true)
      
      // Se for endereço padrão, remover padrão dos outros
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id)
          .neq('id', id)
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      await fetchAddresses()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar endereço')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Deletar endereço
  const deleteAddress = async (id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('addresses')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      
      await fetchAddresses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar endereço')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Adicionar à lista de desejos
  const addToWishlist = async (productId: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      if (existing) {
        throw new Error('Produto já está na lista de desejos')
      }

      const { data, error } = await supabase
        .from('wishlist')
        .insert({ user_id: user.id, product_id: productId })
        .select()
        .single()

      if (error) throw error
      
      await fetchWishlist()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar à lista de desejos')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Remover da lista de desejos
  const removeFromWishlist = async (productId: string) => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)

      if (error) throw error
      
      await fetchWishlist()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover da lista de desejos')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Verificar se produto está na lista de desejos
  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.product_id === productId)
  }

  // Criar avaliação
  const createReview = async (reviewData: Database['public']['Tables']['product_reviews']['Insert']) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({ ...reviewData, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      
      await fetchReviews()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar avaliação')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Atualizar avaliação
  const updateReview = async (id: string, reviewData: Database['public']['Tables']['product_reviews']['Update']) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('product_reviews')
        .update(reviewData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      await fetchReviews()
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar avaliação')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Buscar pedido específico
  const getOrder = async (orderId: string) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name,
              image_url,
              sku
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar pedido')
      return null
    }
  }

  // Cancelar pedido
  const cancelOrder = async (orderId: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user?.id)

      if (error) throw error
      
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar pedido')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      fetchOrders()
      fetchAddresses()
      fetchWishlist()
      fetchReviews()
    }
  }, [user, fetchOrders, fetchAddresses, fetchWishlist, fetchReviews])

  return {
    // Estados
    orders,
    addresses,
    wishlist,
    reviews,
    loading,
    error,
    
    // Funções de pedidos
    fetchOrders,
    getOrder,
    cancelOrder,
    
    // Funções de endereços
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    
    // Funções de lista de desejos
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    
    // Funções de avaliações
    fetchReviews,
    createReview,
    updateReview,
    
    // Utilitários
    setError
  }
}

export type { OrderWithItems, WishlistWithProduct }