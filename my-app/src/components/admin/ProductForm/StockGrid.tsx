'use client'

import React, { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { StockItem, isLowStock } from '@/lib/utils/stock'
import { cn } from '@/lib/utils'

interface StockGridProps {
  items: StockItem[]
  onChange: (items: StockItem[]) => void
  showMinStock?: boolean
  className?: string
}

export function StockGrid({ 
  items, 
  onChange, 
  showMinStock = false, 
  className 
}: StockGridProps) {
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Função para atualizar um item específico
  const updateItem = (index: number, field: 'quantity' | 'minStock', value: number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: Math.max(0, value) // Garantir que não seja negativo
    }
    onChange(newItems)
  }

  // Função para incrementar/decrementar
  const adjustQuantity = (index: number, field: 'quantity' | 'minStock', delta: number) => {
    const currentValue = items[index][field] || 0
    updateItem(index, field, currentValue + delta)
  }

  // Manipular teclas de atalho
  const handleKeyDown = (e: React.KeyboardEvent, index: number, field: 'quantity' | 'minStock') => {
    const item = items[index]
    const currentValue = item[field] || 0

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        adjustQuantity(index, field, 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        adjustQuantity(index, field, -1)
        break
      case 'Tab':
        // Permitir navegação natural com Tab
        break
      case 'Enter':
        e.preventDefault()
        // Mover para o próximo campo
        const nextIndex = showMinStock ? 
          (field === 'quantity' ? index : index + 1) :
          index + 1
        const nextField = showMinStock && field === 'quantity' ? 'minStock' : 'quantity'
        
        if (nextIndex < items.length) {
          const nextRef = inputRefs.current[`${nextIndex}-${nextField}`]
          nextRef?.focus()
        }
        break
    }
  }

  // Focar no primeiro input quando o componente é montado
  useEffect(() => {
    const firstRef = inputRefs.current['0-quantity']
    if (firstRef) {
      firstRef.focus()
    }
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid de estoque */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => {
          const lowStock = isLowStock(item)
          
          return (
            <div 
              key={item.size} 
              className={cn(
                'p-4 border rounded-lg space-y-3 transition-colors',
                lowStock && 'border-red-300 bg-red-50',
                !lowStock && 'border-gray-200 hover:border-gray-300'
              )}
            >
              {/* Tamanho */}
              <div className="text-center">
                <Label className="text-sm font-medium">{item.size}</Label>
                {lowStock && (
                  <div className="text-xs text-red-600 mt-1">
                    Estoque baixo
                  </div>
                )}
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Quantidade</Label>
                <div className="flex items-center space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => adjustQuantity(index, 'quantity', -1)}
                    disabled={item.quantity <= 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <Input
                    ref={(el) => {
                      inputRefs.current[`${index}-quantity`] = el
                    }}
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      updateItem(index, 'quantity', value)
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
                    className="h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => adjustQuantity(index, 'quantity', 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Estoque mínimo (opcional) */}
              {showMinStock && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Mín.</Label>
                  <div className="flex items-center space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustQuantity(index, 'minStock', -1)}
                      disabled={(item.minStock || 0) <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <Input
                      ref={(el) => {
                        inputRefs.current[`${index}-minStock`] = el
                      }}
                      type="number"
                      min="0"
                      value={item.minStock || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        updateItem(index, 'minStock', value)
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, 'minStock')}
                      className="h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustQuantity(index, 'minStock', 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Instruções de atalhos */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="font-medium mb-1">Atalhos de teclado:</div>
        <div className="space-y-1">
          <div>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">↑↓</kbd> Incrementar/decrementar</div>
          <div>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Tab</kbd> Próximo campo</div>
          <div>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd> Próximo tamanho</div>
        </div>
      </div>
    </div>
  )
}