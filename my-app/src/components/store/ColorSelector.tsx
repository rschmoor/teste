'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export interface ColorOption {
  name: string
  value: string // hex color or image URL
  available: boolean
  stock?: number
  isPattern?: boolean // true if value is an image URL for patterns
  displayName?: string // alternative display name
}

interface ColorSelectorProps {
  colors: ColorOption[]
  selectedColor?: string
  onColorChange: (colorName: string) => void
  showStock?: boolean
  showNames?: boolean
  className?: string
  variant?: 'default' | 'large' | 'compact' | 'square'
  disabled?: boolean
  allowMultiple?: boolean
  selectedColors?: string[]
  onMultipleColorChange?: (colors: string[]) => void
}

export default function ColorSelector({
  colors,
  selectedColor,
  onColorChange,
  showStock = true,
  showNames = true,
  className = '',
  variant = 'default',
  disabled = false,
  allowMultiple = false,
  selectedColors = [],
  onMultipleColorChange
}: ColorSelectorProps) {
  const handleColorSelect = (colorName: string, available: boolean) => {
    if (!available || disabled) return
    
    if (allowMultiple && onMultipleColorChange) {
      const newSelection = selectedColors.includes(colorName)
        ? selectedColors.filter(c => c !== colorName)
        : [...selectedColors, colorName]
      onMultipleColorChange(newSelection)
    } else {
      onColorChange(colorName)
    }
  }

  const isSelected = (colorName: string) => {
    if (allowMultiple) {
      return selectedColors.includes(colorName)
    }
    return selectedColor === colorName
  }

  const getStockStatus = (stock?: number) => {
    if (!stock || stock === 0) return 'out-of-stock'
    if (stock <= 3) return 'low-stock'
    return 'in-stock'
  }

  const getStockMessage = (stock?: number) => {
    if (!stock || stock === 0) return 'Esgotado'
    if (stock <= 3) return `Últimas ${stock} unidades`
    return `${stock} disponíveis`
  }

  const getColorSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-6 h-6'
      case 'large':
        return 'w-12 h-12'
      case 'square':
        return 'w-8 h-8'
      default:
        return 'w-8 h-8'
    }
  }

  const ColorButton = ({ colorOption }: { colorOption: ColorOption }) => {
    const { name, value, available, stock, isPattern, displayName } = colorOption
    const selected = isSelected(name)
    const stockStatus = getStockStatus(stock)

    const colorSize = getColorSize()
    const borderSize = variant === 'large' ? 'border-2' : 'border'
    
    let borderColor = 'border-gray-300'
    if (!available) {
      borderColor = 'border-gray-200'
    } else if (selected) {
      borderColor = 'border-gray-900'
    }

    const imageSizeForVariant = variant === 'large' ? '48px' : variant === 'compact' ? '24px' : '32px'

    const colorElement = (
      <div className="relative group">
        <button
          className={cn(
            `${colorSize} rounded-full ${borderSize} ${borderColor} transition-all duration-200 overflow-hidden relative`,
            'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
            !available && 'opacity-50 cursor-not-allowed',
            disabled && 'cursor-not-allowed',
            selected && 'ring-2 ring-gray-900 ring-offset-2'
          )}
          onClick={() => handleColorSelect(name, available)}
          disabled={!available || disabled}
          aria-label={`Selecionar cor ${displayName || name}`}
        >
          {isPattern ? (
            <Image
              src={value}
              alt={displayName || name}
              fill
              sizes={imageSizeForVariant}
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: value }}
            />
          )}
          
          {/* Selected indicator */}
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-full p-0.5">
                <Check className="h-3 w-3 text-gray-900" />
              </div>
            </div>
          )}
          
          {/* Unavailable overlay */}
          {!available && (
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
            </div>
          )}
        </button>
        
        {/* Stock indicator */}
        {available && showStock && stock !== undefined && stockStatus === 'low-stock' && (
          <div className="absolute -top-1 -right-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
          </div>
        )}
      </div>
    )

    if (showStock && stock !== undefined) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {colorElement}
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium text-xs">{displayName || name}</p>
                <p className="text-xs text-gray-600">{getStockMessage(stock)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (!showNames) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {colorElement}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{displayName || name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return colorElement
  }

  const getSelectedColorNames = () => {
    if (allowMultiple) {
      if (selectedColors.length === 0) return 'Selecione'
      if (selectedColors.length === 1) {
        const color = colors.find(c => c.name === selectedColors[0])
        return color?.displayName || color?.name || selectedColors[0]
      }
      return `${selectedColors.length} cores selecionadas`
    }
    
    if (!selectedColor) return 'Selecione'
    const color = colors.find(c => c.name === selectedColor)
    return color?.displayName || color?.name || selectedColor
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            Cor: {getSelectedColorNames()}
          </label>
          {(() => {
            if (!((selectedColor && !allowMultiple) || (allowMultiple && selectedColors.length > 0)) || !showStock) {
              return null
            }
            
            const relevantColors = allowMultiple 
              ? colors.filter(c => selectedColors.includes(c.name))
              : colors.filter(c => c.name === selectedColor)
            
            const hasLowStock = relevantColors.some(c => {
              const stockStatus = getStockStatus(c.stock)
              return stockStatus === 'low-stock'
            })
            
            if (hasLowStock) {
              return (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                  Últimas unidades
                </Badge>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Color Options */}
      <div className={`flex flex-wrap gap-3 ${
        variant === 'compact' ? 'gap-2' : 'gap-3'
      }`}>
        {colors.map((colorOption) => (
          <div key={colorOption.name} className="flex flex-col items-center gap-1">
            <ColorButton colorOption={colorOption} />
            {showNames && (
              <span className={cn(
                "text-xs text-center leading-tight",
                !colorOption.available && "text-gray-400",
                isSelected(colorOption.name) && "font-medium"
              )}>
                {colorOption.displayName || colorOption.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Selected Color Info */}
      {((selectedColor && !allowMultiple) || (allowMultiple && selectedColors.length > 0)) && (
        <div className="text-xs text-gray-600">
          {(() => {
            const relevantColors = allowMultiple 
              ? colors.filter(c => selectedColors.includes(c.name))
              : colors.filter(c => c.name === selectedColor)
            
            if (relevantColors.length === 0) return null
            
            const stockInfo = relevantColors.map(color => {
              if (!showStock || color.stock === undefined) return null
              return `${color.displayName || color.name}: ${getStockMessage(color.stock)}`
            }).filter(Boolean)
            
            return stockInfo.length > 0 ? stockInfo.join(' • ') : null
          })()}
        </div>
      )}

      {/* Help Text */}
      {!selectedColor && !allowMultiple && (
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>Selecione uma cor para continuar.</span>
        </div>
      )}

      {allowMultiple && selectedColors.length === 0 && (
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>Selecione uma ou mais cores.</span>
        </div>
      )}

      {/* Out of Stock Message */}
      {colors.every(c => !c.available) && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <strong>Cores esgotadas</strong>
          <br />
          <span className="text-xs">Este produto está temporariamente indisponível em todas as cores.</span>
        </div>
      )}
    </div>
  )
}

// Skeleton component for loading state
export function ColorSelectorSkeleton({ 
  variant = 'default',
  count = 4 
}: { 
  variant?: 'default' | 'large' | 'compact' | 'square'
  count?: number 
}) {
  const getSkeletonSize = () => {
    switch (variant) {
      case 'compact':
        return 'w-6 h-6'
      case 'large':
        return 'w-12 h-12'
      case 'square':
        return 'w-8 h-8'
      default:
        return 'w-8 h-8'
    }
  }

  const skeletonSize = getSkeletonSize()
  
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      <div className={`flex flex-wrap gap-3 ${
        variant === 'compact' ? 'gap-2' : 'gap-3'
      }`}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className={`${skeletonSize} bg-gray-200 rounded-full`} />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}