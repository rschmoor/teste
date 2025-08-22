'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Brand, 
  CreateBrand,
  createBrandSchema 
} from '@/lib/validations/product'
import { toast } from 'sonner'

interface UseBrandsReturn {
  brands: Brand[]
  loading: boolean
  error: string | null
  createBrand: (data: CreateBrand) => Promise<Brand | null>
  updateBrand: (id: string, data: Partial<CreateBrand>) => Promise<Brand | null>
  deleteBrand: (id: string) => Promise<boolean>
  getBrand: (id: string) => Promise<Brand | null>
  refreshBrands: () => Promise<void>
}

export function useBrands(): UseBrandsReturn {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todas as marcas
  const fetchBrands = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setBrands(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar marcas'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Criar marca
  const createBrand = async (data: CreateBrand): Promise<Brand | null> => {
    try {
      // Validar dados
      const validatedData = createBrandSchema.parse(data)

      // Verificar se nome já existe
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('name', validatedData.name)
        .single()

      if (existingBrand) {
        toast.error('Marca já existe. Escolha um nome único.')
        return null
      }

      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert([{
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select('*')
        .single()

      if (error) throw error

      setBrands(prev => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Marca criada com sucesso!')
      return newBrand
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar marca'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar marca
  const updateBrand = async (id: string, data: Partial<CreateBrand>): Promise<Brand | null> => {
    try {
      // Se nome foi alterado, verificar se já existe
      if (data.name) {
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .eq('name', data.name)
          .neq('id', id)
          .single()

        if (existingBrand) {
          toast.error('Marca já existe. Escolha um nome único.')
          return null
        }
      }

      const { data: updatedBrand, error } = await supabase
        .from('brands')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error

      setBrands(prev => 
        prev.map(brand => 
          brand.id === id ? updatedBrand : brand
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success('Marca atualizada com sucesso!')
      return updatedBrand
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar marca'
      toast.error(errorMessage)
      return null
    }
  }

  // Deletar marca
  const deleteBrand = async (id: string): Promise<boolean> => {
    try {
      // Verificar se marca está sendo usada em produtos
      const { data: productsUsingBrand } = await supabase
        .from('products')
        .select('id')
        .eq('brand_id', id)
        .limit(1)

      if (productsUsingBrand && productsUsingBrand.length > 0) {
        toast.error('Não é possível excluir marca que está sendo usada em produtos.')
        return false
      }

      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBrands(prev => prev.filter(brand => brand.id !== id))
      toast.success('Marca excluída com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir marca'
      toast.error(errorMessage)
      return false
    }
  }

  // Buscar marca por ID
  const getBrand = async (id: string): Promise<Brand | null> => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar marca'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar lista de marcas
  const refreshBrands = async () => {
    await fetchBrands()
  }

  // Carregar marcas na inicialização
  useEffect(() => {
    fetchBrands()
  }, [])

  return {
    brands,
    loading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    getBrand,
    refreshBrands,
  }
}