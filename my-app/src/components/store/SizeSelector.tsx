'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Info, Ruler } from 'lucide-react'

export interface SizeOption {
  size: string
  available: boolean
  stock?: number
  measurements?: {
    [key: string]: string // e.g., { bust: '84-88cm', waist: '64-68cm' }
  }
}

interface SizeSelectorProps {
  sizes: SizeOption[]
  selectedSize?: string
  onSizeChange: (size: string) => void
  showStock?: boolean
  showMeasurements?: boolean
  measurementsTable?: { [size: string]: { [measurement: string]: string } }
  className?: string
  variant?: 'default' | 'compact' | 'pills'
  disabled?: boolean
}

const defaultMeasurements = {
  PP: { bust: '80-84cm', waist: '60-64cm', hip: '86-90cm' },
  P: { bust: '84-88cm', waist: '64-68cm', hip: '90-94cm' },
  M: { bust: '88-92cm', waist: '68-72cm', hip: '94-98cm' },
  G: { bust: '92-96cm', waist: '72-76cm', hip: '98-102cm' },
  GG: { bust: '96-100cm', waist: '76-80cm', hip: '102-106cm' },
  XG: { bust: '100-104cm', waist: '80-84cm', hip: '106-110cm' }
}

export default function SizeSelector({
  sizes,
  selectedSize,
  onSizeChange,
  showStock = true,
  showMeasurements = true,
  measurementsTable = defaultMeasurements,
  className = '',
  variant = 'default',
  disabled = false
}: SizeSelectorProps) {
  const [showSizeGuide, setShowSizeGuide] = useState(false)

  const handleSizeSelect = (size: string, available: boolean) => {
    if (!available || disabled) return
    onSizeChange(size)
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

  const SizeButton = ({ sizeOption }: { sizeOption: SizeOption }) => {
    const { size, available, stock } = sizeOption
    const isSelected = selectedSize === size
    const stockStatus = getStockStatus(stock)

    const baseClasses = "transition-all duration-200 font-medium"
    
    let sizeClasses = baseClasses
    const containerClasses = ""

    switch (variant) {
      case 'compact':
        sizeClasses += " h-8 w-8 text-xs p-0"
        break
      case 'pills':
        sizeClasses += " h-10 px-4 rounded-full"
        break
      default:
        sizeClasses += " h-12 w-12 text-sm p-0"
    }

    if (!available || disabled) {
      sizeClasses += " border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
      if (variant === 'pills') {
        sizeClasses += " line-through"
      }
    } else if (isSelected) {
      sizeClasses += " border-gray-900 bg-gray-900 text-white shadow-md"
    } else {
      sizeClasses += " border-gray-300 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50"
    }

    const button = (
      <div className={`relative ${containerClasses}`}>
        <Button
          variant="outline"
          className={sizeClasses}
          onClick={() => handleSizeSelect(size, available)}
          disabled={!available || disabled}
        >
          {size}
          {variant === 'default' && !available && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-0.5 bg-gray-400 rotate-45 absolute" />
            </div>
          )}
        </Button>
        
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
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{getStockMessage(stock)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  const SizeGuideTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium">Tamanho</th>
            <th className="text-left py-2 font-medium">Busto</th>
            <th className="text-left py-2 font-medium">Cintura</th>
            <th className="text-left py-2 font-medium">Quadril</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(measurementsTable).map(([size, measurements]) => (
            <tr key={size} className="border-b last:border-b-0">
              <td className="py-2 font-medium">{size}</td>
              <td className="py-2">{measurements.bust || '-'}</td>
              <td className="py-2">{measurements.waist || '-'}</td>
              <td className="py-2">{measurements.hip || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-xs text-gray-600">
        <p className="mb-2"><strong>Como medir:</strong></p>
        <ul className="space-y-1">
          <li>• <strong>Busto:</strong> Meça na parte mais larga do busto</li>
          <li>• <strong>Cintura:</strong> Meça na parte mais estreita da cintura</li>
          <li>• <strong>Quadril:</strong> Meça na parte mais larga do quadril</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            Tamanho: {selectedSize || 'Selecione'}
          </label>
          {(() => {
            if (!selectedSize || !showStock) return null
            
            const selectedSizeOption = sizes.find(s => s.size === selectedSize)
            const stock = selectedSizeOption?.stock
            const stockStatus = getStockStatus(stock)
            
            if (stockStatus === 'low-stock') {
              return (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                  Últimas unidades
                </Badge>
              )
            }
            return null
          })()}
        </div>
        
        {showMeasurements && (
          <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
                <Ruler className="h-3 w-3 mr-1" />
                Guia de Tamanhos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Guia de Tamanhos
                </DialogTitle>
              </DialogHeader>
              <SizeGuideTable />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Size Options */}
      <div className={`flex flex-wrap gap-2 ${
        variant === 'compact' ? 'gap-1' : 'gap-2'
      }`}>
        {sizes.map((sizeOption) => (
          <SizeButton key={sizeOption.size} sizeOption={sizeOption} />
        ))}
      </div>

      {/* Selected Size Info */}
      {selectedSize && (
        <div className="text-xs text-gray-600">
          {(() => {
            const selectedSizeOption = sizes.find(s => s.size === selectedSize)
            if (!selectedSizeOption) return null
            
            const { stock, measurements } = selectedSizeOption
            const parts = []
            
            if (showStock && stock !== undefined) {
              parts.push(getStockMessage(stock))
            }
            
            if (measurements && Object.keys(measurements).length > 0) {
              const measurementText = Object.entries(measurements)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
              parts.push(measurementText)
            }
            
            return parts.length > 0 ? parts.join(' • ') : null
          })()}
        </div>
      )}

      {/* Help Text */}
      {!selectedSize && (
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Selecione um tamanho para continuar. 
            {showMeasurements && 'Consulte o guia de tamanhos para encontrar o tamanho ideal.'}
          </span>
        </div>
      )}

      {/* Out of Stock Message */}
      {sizes.every(s => !s.available) && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <strong>Produto esgotado</strong>
          <br />
          <span className="text-xs">Este produto está temporariamente indisponível em todos os tamanhos.</span>
        </div>
      )}
    </div>
  )
}

// Skeleton component for loading state
export function SizeSelectorSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'pills' }) {
  const skeletonSizes = ['P', 'M', 'G', 'GG']
  
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-6 bg-gray-200 rounded w-20" />
      </div>
      <div className={`flex flex-wrap gap-2 ${
        variant === 'compact' ? 'gap-1' : 'gap-2'
      }`}>
        {skeletonSizes.map((size) => (
          <div
            key={size}
            className={`bg-gray-200 rounded ${
              variant === 'compact' ? 'h-8 w-8' :
              variant === 'pills' ? 'h-10 w-16' : 'h-12 w-12'
            }`}
          />
        ))}
      </div>
    </div>
  )
}