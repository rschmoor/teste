'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { type PromotionWithDetailsComplete } from '@/hooks/usePromotions'

type Promotion = Tables<'promotions'>
type Product = Tables<'products'>

interface PromotionWithDetails extends Promotion {
  promotion_products?: { product_id: string }[]
  promotion_categories?: { category_id: string }[]
}

interface DiscountResult {
  originalPrice: number
  discountedPrice: number
  discountAmount: number
  discountPercentage: number
  appliedPromotion?: PromotionWithDetailsComplete
}

interface CartItem {
  product: Product
  quantity: number
}

interface CartDiscount {
  subtotal: number
  totalDiscount: number
  finalTotal: number
  appliedPromotions: PromotionWithDetails[]
  itemDiscounts: { [productId: string]: DiscountResult }
}

export function usePromotionCalculator() {
  const [activePromotions, setActivePromotions] = useState<PromotionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar promoções ativas
  const fetchActivePromotions = async () => {
    try {
      setLoading(true)
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
        .order('value', { ascending: false }) // Priorizar maiores descontos

      if (error) throw error
      setActivePromotions(data || [])
    } catch (error) {
      console.error('Erro ao buscar promoções ativas:', error)
      setActivePromotions([])
    } finally {
      setLoading(false)
    }
  }

  // Calcular desconto para um produto específico
  const calculateProductDiscount = (product: Product): DiscountResult => {
    const originalPrice = product.price
    let bestDiscount: DiscountResult = {
      originalPrice,
      discountedPrice: originalPrice,
      discountAmount: 0,
      discountPercentage: 0
    }

    // Verificar cada promoção ativa
    for (const promotion of activePromotions) {
      let isApplicable = false

      // Verificar se a promoção se aplica ao produto
      if (promotion.promotion_products && promotion.promotion_products.length > 0) {
        // Promoção específica para produtos
        isApplicable = promotion.promotion_products.some(pp => pp.product_id === product.id)
      } else if (promotion.promotion_categories && promotion.promotion_categories.length > 0) {
        // Promoção específica para categorias
        isApplicable = promotion.promotion_categories.some(pc => pc.category_id === product.category_id)
      } else {
        // Promoção geral (aplicável a todos os produtos)
        isApplicable = true
      }

      if (!isApplicable) continue

      // Calcular desconto
      let discountAmount = 0
      if (promotion.type === 'percentage') {
        discountAmount = (originalPrice * promotion.value) / 100
      } else if (promotion.type === 'fixed_amount') {
        discountAmount = Math.min(promotion.value, originalPrice)
      }

      const discountedPrice = originalPrice - discountAmount
      const discountPercentage = (discountAmount / originalPrice) * 100

      // Manter o melhor desconto
      if (discountAmount > bestDiscount.discountAmount) {
        bestDiscount = {
          originalPrice,
          discountedPrice,
          discountAmount,
          discountPercentage,
          appliedPromotion: promotion
        }
      }
    }

    return bestDiscount
  }

  // Calcular desconto para o carrinho completo
  const calculateCartDiscount = (items: CartItem[], couponCode?: string): CartDiscount => {
    let subtotal = 0
    let totalDiscount = 0
    const appliedPromotions: PromotionWithDetails[] = []
    const itemDiscounts: { [productId: string]: DiscountResult } = {}

    // Calcular desconto por item
    items.forEach(item => {
      const discount = calculateProductDiscount(item.product)
      const itemSubtotal = item.product.price * item.quantity
      const itemDiscountAmount = discount.discountAmount * item.quantity

      subtotal += itemSubtotal
      totalDiscount += itemDiscountAmount
      itemDiscounts[item.product.id] = discount

      if (discount.appliedPromotion && !appliedPromotions.find(p => p.id === discount.appliedPromotion!.id)) {
        appliedPromotions.push(discount.appliedPromotion)
      }
    })

    let finalTotal = subtotal - totalDiscount

    // Aplicar cupom se fornecido
    if (couponCode) {
      const couponPromotion = activePromotions.find(p => 
        p.code === couponCode && p.type === 'coupon'
      )

      if (couponPromotion) {
        // Verificar valor mínimo do pedido
        if (!couponPromotion.min_order_value || subtotal >= couponPromotion.min_order_value) {
          let couponDiscount = 0
          
          if (couponPromotion.type === 'percentage') {
            couponDiscount = (subtotal * couponPromotion.value) / 100
          } else if (couponPromotion.type === 'fixed_amount') {
            couponDiscount = Math.min(couponPromotion.value, subtotal)
          }

          totalDiscount += couponDiscount
          finalTotal -= couponDiscount

          if (!appliedPromotions.find(p => p.id === couponPromotion.id)) {
            appliedPromotions.push(couponPromotion)
          }
        }
      }
    }

    return {
      subtotal,
      totalDiscount,
      finalTotal: Math.max(0, finalTotal), // Garantir que não seja negativo
      appliedPromotions,
      itemDiscounts
    }
  }

  // Validar cupom
  const validateCoupon = async (code: string, userId?: string) => {
    try {
      const now = new Date().toISOString()
      
      const { data: promotion, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .eq('discount_type', 'coupon')
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

      return { valid: true, promotion, message: 'Cupom válido' }
    } catch {
      return { valid: false, message: 'Erro ao validar cupom' }
    }
  }

  // Aplicar cupom após compra
  const applyCouponUsage = async (
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

  // Obter promoções aplicáveis a um produto
  const getApplicablePromotions = (product: Product): PromotionWithDetails[] => {
    return activePromotions.filter(promotion => {
      // Verificar se a promoção se aplica ao produto
      if (promotion.promotion_products && promotion.promotion_products.length > 0) {
        return promotion.promotion_products.some(pp => pp.product_id === product.id)
      }
      
      if (promotion.promotion_categories && promotion.promotion_categories.length > 0) {
        return promotion.promotion_categories.some(pc => pc.category_id === product.category_id)
      }
      
      // Promoção geral
      return true
    })
  }

  useEffect(() => {
    fetchActivePromotions()
  }, [])

  return {
    activePromotions,
    loading,
    fetchActivePromotions,
    calculateProductDiscount,
    calculateCartDiscount,
    validateCoupon,
    applyCouponUsage,
    getApplicablePromotions
  }
}

export type { DiscountResult, CartDiscount, CartItem }