import { z } from 'zod'
// import { ProductType } from '@/lib/utils/stock'

// Schema para validação de produtos
export const productSchema = z.object({
  // Campos obrigatórios
  sku: z.string()
    .min(1, 'Código do produto (SKU) é obrigatório')
    .max(50, 'SKU deve ter no máximo 50 caracteres')
    .regex(/^[A-Za-z0-9-_]+$/, 'SKU deve conter apenas letras, números, hífens e underscores'),
  
  name: z.string()
    .min(1, 'Nome do produto é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  
  salePrice: z.number()
    .min(0.01, 'Preço de venda deve ser maior que zero')
    .max(999999.99, 'Preço de venda muito alto'),
  
  // Campos opcionais
  manufacturerCode: z.string()
    .max(50, 'Código do fabricante deve ter no máximo 50 caracteres')
    .optional(),
  
  brandId: z.string()
    .uuid('ID da marca deve ser um UUID válido')
    .optional(),
  
  categoryId: z.string()
    .uuid('ID da categoria deve ser um UUID válido')
    .optional(),
  
  baseColor: z.string()
    .max(50, 'Cor base deve ter no máximo 50 caracteres')
    .optional(),
  
  costPrice: z.number()
    .min(0, 'Preço de custo não pode ser negativo')
    .max(999999.99, 'Preço de custo muito alto')
    .optional(),
  
  // Checkboxes
  isOnPromotion: z.boolean(),
  isInactive: z.boolean(),
  
  // Dados de estoque
  stock: z.object({
    productType: z.enum(['clothing', 'shoes', 'single'] as const),
    items: z.array(z.object({
      size: z.string().min(1, 'Tamanho é obrigatório'),
      quantity: z.number().min(0, 'Quantidade não pode ser negativa'),
      minStock: z.number().min(0, 'Estoque mínimo não pode ser negativo').optional(),
    })),
    totalQuantity: z.number().min(0, 'Total não pode ser negativo'),
  }).optional(),
  
  // Dados de imagens
  images: z.array(z.object({
    url: z.string().url('URL da imagem deve ser válida'),
    isPrimary: z.boolean().optional(),
    description: z.object({
      tipo_peca: z.string().optional(),
      cores_identificadas: z.array(z.string()).optional(),
      material_aparente: z.string().optional(),
      estilo: z.string().optional(),
      detalhes_especiais: z.string().optional(),
      publico_alvo: z.string().optional(),
      descricao_completa: z.string().optional(),
    }).optional(),
  })).max(5, 'Máximo de 5 imagens permitidas').optional(),
  
  // Campos de controle (serão preenchidos automaticamente)
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Schema para criação de produto (sem campos de controle)
export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Schema para atualização de produto (todos os campos opcionais exceto ID)
export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid('ID do produto é obrigatório'),
})

// Schema para marca
export const brandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Nome da marca é obrigatório')
    .max(100, 'Nome da marca deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Schema para criação de marca
export const createBrandSchema = brandSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Schema para categoria
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string()
    .min(1, 'Nome da categoria é obrigatório')
    .max(100, 'Nome da categoria deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  parentId: z.string().uuid().optional(), // Para categorias hierárquicas
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Schema para criação de categoria
export const createCategorySchema = categorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Tipos TypeScript derivados dos schemas
export type Product = z.infer<typeof productSchema> & {
  brand?: { id: string; name: string } | null
  category?: { id: string; name: string } | null
}
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
export type Brand = z.infer<typeof brandSchema>
export type CreateBrand = z.infer<typeof createBrandSchema>
export type Category = z.infer<typeof categorySchema>
export type CreateCategory = z.infer<typeof createCategorySchema>

// Constantes para validação
export const PRODUCT_CONSTANTS = {
  SKU_MAX_LENGTH: 50,
  NAME_MAX_LENGTH: 200,
  MANUFACTURER_CODE_MAX_LENGTH: 50,
  BASE_COLOR_MAX_LENGTH: 50,
  MAX_PRICE: 999999.99,
  BRAND_NAME_MAX_LENGTH: 100,
  CATEGORY_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
} as const