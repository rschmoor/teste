'use client'

import { Badge } from '@/components/ui/badge'
import { Tag, Percent, DollarSign } from 'lucide-react'
import { usePromotionCalculator, DiscountResult } from '@/hooks/usePromotionCalculator'
import { Tables } from '@/lib/supabase/types'
import { type PromotionWithDetailsComplete } from '@/hooks/usePromotions'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Product = Tables<'products'>

interface PromotionBadgeProps {
  product: Product
  className?: string
  showDetails?: boolean
}

export function PromotionBadge({ product, className, showDetails = false }: PromotionBadgeProps) {
  const { calculateProductDiscount } = usePromotionCalculator()
  const discount = calculateProductDiscount(product)

  if (!discount.appliedPromotion || discount.discountAmount === 0) {
    return null
  }

  const getPromotionIcon = () => {
    switch (discount.appliedPromotion?.type) {
      case 'percentage':
        return <Percent className="h-3 w-3" />
      case 'fixed_amount':
        return <DollarSign className="h-3 w-3" />
      case 'coupon':
        return <Tag className="h-3 w-3" />
      default:
        return <Tag className="h-3 w-3" />
    }
  }

  const getDiscountText = () => {
    if (discount.appliedPromotion?.type === 'percentage') {
      return `-${Math.round(discount.discountPercentage)}%`
    }
    return `-${formatPrice(discount.discountAmount)}`
  }

  const getBadgeVariant = () => {
    if (discount.discountPercentage >= 50) return 'destructive'
    if (discount.discountPercentage >= 25) return 'default'
    return 'secondary'
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Badge 
        variant={getBadgeVariant()}
        className="flex items-center gap-1 text-xs font-semibold"
      >
        {getPromotionIcon()}
        {getDiscountText()}
      </Badge>
      
      {showDetails && discount.appliedPromotion && (
        <div className="text-xs text-muted-foreground">
          <div className="font-medium">{discount.appliedPromotion.name}</div>
          {discount.appliedPromotion.description && (
            <div className="text-xs opacity-75">
              {discount.appliedPromotion.description}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface PriceWithDiscountProps {
  product: Product
  className?: string
  showOriginalPrice?: boolean
}

export function PriceWithDiscount({ 
  product, 
  className, 
  showOriginalPrice = true 
}: PriceWithDiscountProps) {
  const { calculateProductDiscount } = usePromotionCalculator()
  const discount = calculateProductDiscount(product)

  const hasDiscount = discount.appliedPromotion && discount.discountAmount > 0

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-lg font-bold text-primary">
        {formatPrice(discount.discountedPrice)}
      </span>
      
      {hasDiscount && showOriginalPrice && (
        <span className="text-sm text-muted-foreground line-through">
          {formatPrice(discount.originalPrice)}
        </span>
      )}
    </div>
  )
}

interface PromotionSummaryProps {
  discountResult: DiscountResult
  className?: string
}

export function PromotionSummary({ discountResult, className }: PromotionSummaryProps) {
  if (!discountResult.appliedPromotion || discountResult.discountAmount === 0) {
    return null
  }

  return (
    <div className={cn('p-3 bg-green-50 border border-green-200 rounded-lg', className)}>
      <div className="flex items-center gap-2 text-green-800">
        <Tag className="h-4 w-4" />
        <span className="font-medium">{discountResult.appliedPromotion.name}</span>
      </div>
      
      {discountResult.appliedPromotion.description && (
        <p className="text-sm text-green-700 mt-1">
          {discountResult.appliedPromotion.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-2 text-sm">
        <span className="text-green-700">Desconto aplicado:</span>
        <span className="font-bold text-green-800">
          -{formatPrice(discountResult.discountAmount)} 
          ({Math.round(discountResult.discountPercentage)}%)
        </span>
      </div>
    </div>
  )
}

interface PromotionTimerProps {
  promotion: any
  className?: string
}

export function PromotionTimer({ promotion, className }: PromotionTimerProps) {
  const endDate = new Date(promotion.end_date)
  const now = new Date()
  const timeLeft = endDate.getTime() - now.getTime()

  if (timeLeft <= 0) {
    return null
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

  const getTimeText = () => {
    if (days > 0) {
      return `${days}d ${hours}h restantes`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m restantes`
    }
    return `${minutes}m restantes`
  }

  const getUrgencyColor = () => {
    if (days === 0 && hours < 2) return 'text-red-600'
    if (days === 0 && hours < 12) return 'text-orange-600'
    return 'text-yellow-600'
  }

  return (
    <div className={cn('text-xs font-medium', getUrgencyColor(), className)}>
      ⏰ {getTimeText()}
    </div>
  )
}