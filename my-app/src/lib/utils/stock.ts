export type ProductType = 'clothing' | 'shoes' | 'single'

export type ClothingSize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG' | 'XGG' | 'U'
export type ShoeSize = '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40' | '33/34' | '35/36' | '37/38' | '39/40'

export interface StockItem {
  size: string
  quantity: number
  minStock?: number
}

export interface StockData {
  productType: ProductType
  items: StockItem[]
  totalQuantity: number
}

// Tamanhos padrão para roupas
export const CLOTHING_SIZES: ClothingSize[] = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'U']

// Tamanhos padrão para calçados
export const SHOE_SIZES: ShoeSize[] = ['33', '34', '35', '36', '37', '38', '39', '40']

// Tamanhos combinados para calçados
export const COMBINED_SHOE_SIZES: ShoeSize[] = ['33/34', '35/36', '37/38', '39/40']

/**
 * Calcula o total de estoque
 */
export function calculateTotal(items: StockItem[]): number {
  return items.reduce((total, item) => total + (item.quantity || 0), 0)
}

/**
 * Valida os dados de estoque
 */
export function validateStock(stockData: StockData): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validar se há pelo menos um item
  if (!stockData.items || stockData.items.length === 0) {
    errors.push('É necessário definir pelo menos um tamanho')
  }

  // Validar cada item
  stockData.items.forEach((item) => {
    // Validar quantidade
    if (item.quantity < 0) {
      errors.push(`Quantidade não pode ser negativa para o tamanho ${item.size}`)
    }

    // Validar estoque mínimo
    if (item.minStock !== undefined && item.minStock < 0) {
      errors.push(`Estoque mínimo não pode ser negativo para o tamanho ${item.size}`)
    }

    // Avisar sobre estoque baixo
    if (item.minStock !== undefined && item.quantity <= item.minStock) {
      warnings.push(`Estoque baixo para o tamanho ${item.size} (${item.quantity}/${item.minStock})`)
    }

    // Avisar sobre estoque zero
    if (item.quantity === 0) {
      warnings.push(`Estoque zerado para o tamanho ${item.size}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Importa dados de estoque de um CSV
 * Formato esperado: tamanho,quantidade,estoque_minimo
 */
export function parseCSVStock(csvContent: string, productType: ProductType): {
  success: boolean
  data?: StockItem[]
  error?: string
} {
  try {
    const lines = csvContent.trim().split('\n')
    
    if (lines.length === 0) {
      return { success: false, error: 'Arquivo CSV vazio' }
    }

    const items: StockItem[] = []
    const validSizes = getValidSizes(productType)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(',')
      
      if (columns.length < 2) {
        return { 
          success: false, 
          error: `Linha ${i + 1}: Formato inválido. Esperado: tamanho,quantidade[,estoque_minimo]` 
        }
      }

      const size = columns[0].trim().toUpperCase()
      const quantity = parseInt(columns[1].trim())
      const minStock = columns[2] ? parseInt(columns[2].trim()) : undefined

      // Validar tamanho
      if (!validSizes.includes(size)) {
        return { 
          success: false, 
          error: `Linha ${i + 1}: Tamanho "${size}" não é válido para ${productType}` 
        }
      }

      // Validar quantidade
      if (isNaN(quantity) || quantity < 0) {
        return { 
          success: false, 
          error: `Linha ${i + 1}: Quantidade deve ser um número não negativo` 
        }
      }

      // Validar estoque mínimo
      if (minStock !== undefined && (isNaN(minStock) || minStock < 0)) {
        return { 
          success: false, 
          error: `Linha ${i + 1}: Estoque mínimo deve ser um número não negativo` 
        }
      }

      items.push({ size, quantity, minStock })
    }

    return { success: true, data: items }
  } catch (error) {
    return { 
      success: false, 
      error: `Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    }
  }
}

/**
 * Retorna os tamanhos válidos para um tipo de produto
 */
export function getValidSizes(productType: ProductType): string[] {
  switch (productType) {
    case 'clothing':
      return CLOTHING_SIZES
    case 'shoes':
      return [...SHOE_SIZES, ...COMBINED_SHOE_SIZES]
    case 'single':
      return ['U'] // Tamanho único
    default:
      return []
  }
}

/**
 * Cria dados de estoque padrão para um tipo de produto
 */
export function createDefaultStock(productType: ProductType): StockData {
  const validSizes = getValidSizes(productType)
  const items: StockItem[] = validSizes.map(size => ({
    size,
    quantity: 0,
    minStock: 0
  }))

  return {
    productType,
    items,
    totalQuantity: 0
  }
}

/**
 * Converte dados de estoque para CSV
 */
export function exportStockToCSV(items: StockItem[]): string {
  const header = 'tamanho,quantidade,estoque_minimo\n'
  const rows = items.map(item => 
    `${item.size},${item.quantity},${item.minStock || 0}`
  ).join('\n')
  
  return header + rows
}

/**
 * Verifica se um tamanho está com estoque baixo
 */
export function isLowStock(item: StockItem): boolean {
  if (item.minStock === undefined) return false
  return item.quantity <= item.minStock
}

/**
 * Aplica uma quantidade para todos os tamanhos
 */
export function applyQuantityToAll(items: StockItem[], quantity: number): StockItem[] {
  return items.map(item => ({
    ...item,
    quantity
  }))
}

/**
 * Aplica estoque mínimo para todos os tamanhos
 */
export function applyMinStockToAll(items: StockItem[], minStock: number): StockItem[] {
  return items.map(item => ({
    ...item,
    minStock
  }))
}