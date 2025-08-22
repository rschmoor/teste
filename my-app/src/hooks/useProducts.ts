'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Product, CreateProduct, UpdateProduct, createProductSchema, updateProductSchema } from '@/lib/validations/product'
import { uploadProductImages } from '@/lib/utils/image-upload'
import { convertFormImagesToUploadData, clearTempImageFiles } from '@/lib/utils/product-images'
import { toast } from 'sonner'

interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: string | null
  createProduct: (data: CreateProduct) => Promise<Product | null>
  updateProduct: (data: UpdateProduct) => Promise<Product | null>
  deleteProduct: (id: string) => Promise<boolean>
  getProduct: (id: string) => Promise<Product | null>
  duplicateProduct: (id: string) => Promise<Product | null>
  refreshProducts: () => Promise<void>
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todos os produtos
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(id, name),
          category:categories(id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Criar produto
  const createProduct = async (data: CreateProduct): Promise<Product | null> => {
    try {
      // Validar dados
      const validatedData = createProductSchema.parse(data)

      // Verificar se SKU já existe
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku', validatedData.sku)
        .single()

      if (existingProduct) {
        toast.error('SKU já existe. Escolha um código único.')
        return null
      }

      // Processar imagens se existirem
      let imageUrls: string[] = []
      if (validatedData.images && validatedData.images.length > 0) {
        // Gerar ID temporário para o produto
        const tempProductId = crypto.randomUUID()
        
        try {
          // Converter imagens do formulário para dados de upload
          const imageUploadData = convertFormImagesToUploadData(validatedData.images)
          
          // Fazer upload das imagens
          const uploadedImages = await uploadProductImages(imageUploadData, tempProductId)
          imageUrls = uploadedImages.map(img => img.url)
          
          // Limpar arquivos temporários após upload bem-sucedido
          clearTempImageFiles()
        } catch (error) {
          console.error('Erro no upload das imagens:', error)
          toast.error('Erro ao fazer upload das imagens')
          return null
        }
      }

      // Preparar dados para inserção (sem o campo images complexo)
      const { images: _formImages, ...productData } = validatedData
      void _formImages
      
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          images: imageUrls, // Salvar apenas as URLs
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          brand:brands(id, name),
          category:categories(id, name)
        `)
        .single()

      if (error) throw error

      setProducts(prev => [newProduct, ...prev])
      toast.success('Produto criado com sucesso!')
      return newProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar produto'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar produto
  const updateProduct = async (data: UpdateProduct): Promise<Product | null> => {
    try {
      const validatedData = updateProductSchema.parse(data)

      // Se SKU foi alterado, verificar se já existe
      if (validatedData.sku) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku', validatedData.sku)
          .neq('id', validatedData.id)
          .single()

        if (existingProduct) {
          toast.error('SKU já existe. Escolha um código único.')
          return null
        }
      }

      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validatedData.id)
        .select(`
          *,
          brand:brands(id, name),
          category:categories(id, name)
        `)
        .single()

      if (error) throw error

      setProducts(prev => 
        prev.map(product => 
          product.id === validatedData.id ? updatedProduct : product
        )
      )
      toast.success('Produto atualizado com sucesso!')
      return updatedProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto'
      toast.error(errorMessage)
      return null
    }
  }

  // Deletar produto
  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProducts(prev => prev.filter(product => product.id !== id))
      toast.success('Produto excluído com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir produto'
      toast.error(errorMessage)
      return false
    }
  }

  // Buscar produto por ID
  const getProduct = async (id: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(id, name),
          category:categories(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar produto'
      toast.error(errorMessage)
      return null
    }
  }

  // Duplicar produto
  const duplicateProduct = async (id: string): Promise<Product | null> => {
    try {
      const originalProduct = await getProduct(id)
      if (!originalProduct) return null

      // Criar novo SKU baseado no original
      const newSku = `${originalProduct.sku}-COPY-${Date.now()}`
      
      const duplicateData: CreateProduct = {
        ...originalProduct,
        sku: newSku,
        name: `${originalProduct.name} (Cópia)`,
      }

      return await createProduct(duplicateData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao duplicar produto'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar lista de produtos
  const refreshProducts = async () => {
    await fetchProducts()
  }

  // Carregar produtos na inicialização
  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    duplicateProduct,
    refreshProducts,
  }
}