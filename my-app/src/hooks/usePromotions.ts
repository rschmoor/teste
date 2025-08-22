'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { toast } from 'sonner'

type Promotion = Tables<'promotions'>
type PromotionInsert = Omit<Tables<'promotions'>, 'id' | 'created_at' | 'updated_at'>
type PromotionUpdate = Partial<Omit<Tables<'promotions'>, 'id' | 'created_at'>>

interface PromotionWithDetails extends Promotion {
  promotion_products?: { product_id: string }[]
  promotion_categories?: { category_id: string }[]
}

// Garantir que o tipo tem todas as propriedades necessárias
export type PromotionWithDetailsComplete = PromotionWithDetails & {
  id: string
  name: string
  description?: string | null
  type: string
  value: number
  code?: string | null
  min_order_value?: number | null
  max_discount_amount?: number | null
  usage_limit?: number | null
  used_count?: number | null
  is_active: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<PromotionWithDetailsComplete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todas as promoções
  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          promotion_products(product_id),
          promotion_categories(category_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPromotions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar promoções')
      toast.error('Erro ao carregar promoções')
    } finally {
      setLoading(false)
    }
  }

  // Buscar promoções ativas
  const fetchActivePromotions = async () => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('promotions')
        .select(`
          *,
          promotion_products(product_id),
          promotion_categories(category_id)
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as PromotionWithDetailsComplete[]
    } catch (err) {
      console.error('Erro ao buscar promoções ativas:', err)
      return []
    }
  }

  // Criar nova promoção
  const createPromotion = async (
    promotionData: PromotionInsert,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): Promise<PromotionWithDetailsComplete | null> => {
    try {
      // Inserir promoção
      const { data: promotion, error: promotionError } = await supabase
        .from('promotions')
        .insert([promotionData])
        .select()
        .single()

      if (promotionError) throw promotionError

      // Inserir produtos relacionados
      if (productIds.length > 0) {
        const productPromotions = productIds.map(productId => ({
          promotion_id: promotion.id,
          product_id: productId
        }))

        const { error: productError } = await supabase
          .from('promotion_products')
          .insert(productPromotions)

        if (productError) throw productError
      }

      // Inserir categorias relacionadas
      if (categoryIds.length > 0) {
        const categoryPromotions = categoryIds.map(categoryId => ({
          promotion_id: promotion.id,
          category_id: categoryId
        }))

        const { error: categoryError } = await supabase
          .from('promotion_categories')
          .insert(categoryPromotions)

        if (categoryError) throw categoryError
      }

      toast.success('Promoção criada com sucesso!')
      await fetchPromotions()
      return promotion
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar promoção'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Atualizar promoção
  const updatePromotion = async (
    id: string,
    promotionData: PromotionUpdate,
    productIds: string[] = [],
    categoryIds: string[] = []
  ): Promise<PromotionWithDetailsComplete | null> => {
    try {
      // Atualizar promoção
      const { data: promotion, error: promotionError } = await supabase
        .from('promotions')
        .update(promotionData)
        .eq('id', id)
        .select()
        .single()

      if (promotionError) throw promotionError

      // Remover produtos antigos
      await supabase
        .from('promotion_products')
        .delete()
        .eq('promotion_id', id)

      // Inserir novos produtos
      if (productIds.length > 0) {
        const productPromotions = productIds.map(productId => ({
          promotion_id: id,
          product_id: productId
        }))

        const { error: productError } = await supabase
          .from('promotion_products')
          .insert(productPromotions)

        if (productError) throw productError
      }

      // Remover categorias antigas
      await supabase
        .from('promotion_categories')
        .delete()
        .eq('promotion_id', id)

      // Inserir novas categorias
      if (categoryIds.length > 0) {
        const categoryPromotions = categoryIds.map(categoryId => ({
          promotion_id: id,
          category_id: categoryId
        }))

        const { error: categoryError } = await supabase
          .from('promotion_categories')
          .insert(categoryPromotions)

        if (categoryError) throw categoryError
      }

      toast.success('Promoção atualizada com sucesso!')
      await fetchPromotions()
      return promotion
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar promoção'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Deletar promoção
  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Promoção deletada com sucesso!')
      await fetchPromotions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar promoção'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Ativar/desativar promoção
  const togglePromotionStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) throw error

      toast.success(`Promoção ${isActive ? 'ativada' : 'desativada'} com sucesso!`)
      await fetchPromotions()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status da promoção'
      setError(message)
      toast.error(message)
      throw err
    }
  }

  // Verificar se cupom é válido
  const validateCoupon = async (code: string, userId?: string) => {
    try {
      const now = new Date().toISOString()
      
      const { data: promotion, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single()

      if (error || !promotion) {
        return { valid: false, message: 'Cupom inválido ou expirado' }
      }

      // Verificar limite de uso
      if (promotion.usage_limit && promotion.used_count >= promotion.usage_limit) {
        return { valid: false, message: 'Cupom esgotado' }
      }

      // Verificar se usuário já usou (se aplicável)
      if (userId) {
        const { data: usage } = await supabase
          .from('coupon_usage')
          .select('id')
          .eq('promotion_id', promotion.id)
          .eq('user_id', userId)
          .single()

        if (usage) {
          return { valid: false, message: 'Cupom já utilizado' }
        }
      }

      return { valid: true, promotion }
    } catch {
      return { valid: false, message: 'Erro ao validar cupom' }
    }
  }

  // Aplicar cupom
  const applyCoupon = async (
    promotionId: string,
    userId: string,
    discountAmount: number,
    orderId?: string
  ) => {
    try {
      const { error } = await supabase
        .from('coupon_usage')
        .insert({
          promotion_id: promotionId,
          user_id: userId,
          discount_amount: discountAmount,
          order_id: orderId
        })

      if (error) throw error

      // Incrementar contador de uso
      await supabase
        .from('promotions')
        .update({ used_count: supabase.sql`used_count + 1` })
        .eq('id', promotionId)

      return true
    } catch (err) {
      console.error('Erro ao aplicar cupom:', err)
      return false
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [])

  return {
    promotions,
    loading,
    error,
    fetchPromotions,
    fetchActivePromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus,
    validateCoupon,
    applyCoupon
  }
}

export type { Promotion, PromotionInsert, PromotionUpdate, PromotionWithDetails }