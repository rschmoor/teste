'use client'

import React, { useState, useRef, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { CreateProduct } from '@/lib/validations/product'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Download, 
  Copy, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle,
  Package
} from 'lucide-react'
import { StockGrid } from './StockGrid'
import {
  ProductType,
  StockData,
  StockItem,
  createDefaultStock,
  calculateTotal,
  validateStock,
  parseCSVStock,
  exportStockToCSV,
  applyQuantityToAll,
  applyMinStockToAll,
  CLOTHING_SIZES,
  SHOE_SIZES,
  COMBINED_SHOE_SIZES
} from '@/lib/utils/stock'

interface StockTabProps {
  form: UseFormReturn<CreateProduct>
}

export function StockTab({ form }: StockTabProps) {
  const stockData = form.watch('stock') || {
    productType: 'clothing',
    items: [],
    totalQuantity: 0
  }
  const [showMinStock, setShowMinStock] = useState(false)
  const [bulkQuantity, setBulkQuantity] = useState('')
  const [bulkMinStock, setBulkMinStock] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [useCombinedSizes, setUseCombinedSizes] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calcular total automaticamente
  const totalQuantity = calculateTotal(stockData.items)
  
  // Validar estoque
  const validation = validateStock(stockData)

  // Atualizar tipo de produto
  const handleProductTypeChange = (newType: ProductType) => {
    const newStockData = createDefaultStock(newType)
    form.setValue('stock', {
      ...newStockData,
      productType: newType
    })
  }

  // Atualizar itens de estoque
  const handleItemsChange = (newItems: StockItem[]) => {
    form.setValue('stock', {
      ...stockData,
      items: newItems,
      totalQuantity: calculateTotal(newItems)
    })
  }

  // Aplicar quantidade em massa
  const handleBulkQuantity = () => {
    const quantity = parseInt(bulkQuantity) || 0
    const newItems = applyQuantityToAll(stockData.items, quantity)
    handleItemsChange(newItems)
    setBulkQuantity('')
  }

  // Aplicar estoque mínimo em massa
  const handleBulkMinStock = () => {
    const minStock = parseInt(bulkMinStock) || 0
    const newItems = applyMinStockToAll(stockData.items, minStock)
    handleItemsChange(newItems)
    setBulkMinStock('')
  }

  // Importar CSV
  const handleCsvImport = () => {
    const result = parseCSVStock(csvContent, stockData.productType)
    
    if (result.success && result.data) {
      handleItemsChange(result.data)
      setCsvContent('')
      setShowCsvImport(false)
    } else {
      alert(`Erro ao importar CSV: ${result.error}`)
    }
  }

  // Exportar CSV
  const handleCsvExport = () => {
    const csvData = exportStockToCSV(stockData.items)
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estoque-${stockData.productType}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Importar arquivo CSV
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvContent(content)
        setShowCsvImport(true)
      }
      reader.readAsText(file)
    }
  }

  // Resetar estoque
  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar todo o estoque?')) {
      const newStockData = createDefaultStock(stockData.productType)
      form.setValue('stock', newStockData)
    }
  }

  // Alternar entre tamanhos normais e combinados para calçados
  const handleToggleCombinedSizes = () => {
    if (stockData.productType === 'shoes') {
      const newUseCombined = !useCombinedSizes
      setUseCombinedSizes(newUseCombined)
      
      const sizes = newUseCombined ? COMBINED_SHOE_SIZES : SHOE_SIZES
      const newItems: StockItem[] = sizes.map(size => ({
        size,
        quantity: 0,
        minStock: 0
      }))
      
      handleItemsChange(newItems)
    }
  }

  // Efeito para atualizar tamanhos quando o tipo muda
  useEffect(() => {
    if (stockData.productType === 'shoes' && useCombinedSizes) {
      const sizes = COMBINED_SHOE_SIZES
      const newItems: StockItem[] = sizes.map(size => ({
        size,
        quantity: 0,
        minStock: 0
      }))
      handleItemsChange(newItems)
    }
  }, [stockData.productType])

  return (
    <div className="space-y-6">
      {/* Cabeçalho com configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Configuração de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de produto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Produto</Label>
              <Select 
                value={stockData.productType} 
                onValueChange={(value: ProductType) => handleProductTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Roupas</SelectItem>
                  <SelectItem value="shoes">Calçados</SelectItem>
                  <SelectItem value="single">Tamanho Único</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opção para tamanhos combinados (apenas calçados) */}
            {stockData.productType === 'shoes' && (
              <div className="space-y-2">
                <Label>Tipo de Numeração</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!useCombinedSizes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => !useCombinedSizes || handleToggleCombinedSizes()}
                  >
                    Individual
                  </Button>
                  <Button
                    type="button"
                    variant={useCombinedSizes ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => useCombinedSizes || handleToggleCombinedSizes()}
                  >
                    Combinada
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Total e controles */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-gray-600">Total em Estoque</div>
                <div className="text-2xl font-bold text-blue-600">{totalQuantity}</div>
              </div>
              
              {validation.warnings.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validation.warnings.length} avisos
                </Badge>
              )}
              
              {validation.isValid && validation.warnings.length === 0 && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Estoque OK
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMinStock(!showMinStock)}
              >
                {showMinStock ? 'Ocultar' : 'Mostrar'} Estoque Mín.
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCsvExport}
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Resetar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em massa */}
      <Card>
        <CardHeader>
          <CardTitle>Ações em Massa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Quantidade para todos"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleBulkQuantity}
                disabled={!bulkQuantity}
              >
                <Copy className="h-4 w-4 mr-1" />
                Aplicar
              </Button>
            </div>
            
            {showMinStock && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Estoque mín. para todos"
                  value={bulkMinStock}
                  onChange={(e) => setBulkMinStock(e.target.value)}
                  min="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBulkMinStock}
                  disabled={!bulkMinStock}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Importação de CSV */}
      {showCsvImport && (
        <Card>
          <CardHeader>
            <CardTitle>Importar CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Conteúdo CSV (formato: tamanho,quantidade,estoque_minimo)</Label>
              <Textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="PP,10,2\nP,15,3\nM,20,5"
                rows={6}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCsvImport}>
                Importar Dados
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCsvImport(false)
                  setCsvContent('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avisos de validação */}
      {validation.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Erros de validação */}
      {validation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Grid de estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque por Tamanho</CardTitle>
        </CardHeader>
        <CardContent>
          <StockGrid
            items={stockData.items}
            onChange={handleItemsChange}
            showMinStock={showMinStock}
          />
        </CardContent>
      </Card>
    </div>
  )
}