'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { 
  Category, 
  CreateCategory,
  createCategorySchema 
} from '@/lib/validations/product'
import { toast } from 'sonner'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  createCategory: (data: CreateCategory) => Promise<Category | null>
  updateCategory: (id: string, data: Partial<CreateCategory>) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<boolean>
  getCategory: (id: string) => Promise<Category | null>
  refreshCategories: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar todas as categorias
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id(id, name)
        `)
        .order('name', { ascending: true })

      if (error) throw error

      setCategories(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Criar categoria
  const createCategory = async (data: CreateCategory): Promise<Category | null> => {
    try {
      // Validar dados
      const validatedData = createCategorySchema.parse(data)

      // Verificar se nome já existe
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', validatedData.name)
        .single()

      if (existingCategory) {
        toast.error('Categoria já existe. Escolha um nome único.')
        return null
      }

      // Se tem parent_id, verificar se existe
      if (validatedData.parentId) {
        const { data: parentCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('id', validatedData.parentId)
          .single()

        if (!parentCategory) {
          toast.error('Categoria pai não encontrada.')
          return null
        }
      }

      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert([{
          ...validatedData,
          parent_id: validatedData.parentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          parent:parent_id(id, name)
        `)
        .single()

      if (error) throw error

      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Categoria criada com sucesso!')
      return newCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar categoria
  const updateCategory = async (id: string, data: Partial<CreateCategory>): Promise<Category | null> => {
    try {
      // Se nome foi alterado, verificar se já existe
      if (data.name) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', data.name)
          .neq('id', id)
          .single()

        if (existingCategory) {
          toast.error('Categoria já existe. Escolha um nome único.')
          return null
        }
      }

      // Se parent_id foi alterado, verificar se existe e não é circular
      if (data.parentId) {
        if (data.parentId === id) {
          toast.error('Uma categoria não pode ser pai de si mesma.')
          return null
        }

        const { data: parentCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('id', data.parentId)
          .single()

        if (!parentCategory) {
          toast.error('Categoria pai não encontrada.')
          return null
        }
      }

      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update({
          ...data,
          parent_id: data.parentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          parent:parent_id(id, name)
        `)
        .single()

      if (error) throw error

      setCategories(prev => 
        prev.map(category => 
          category.id === id ? updatedCategory : category
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success('Categoria atualizada com sucesso!')
      return updatedCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria'
      toast.error(errorMessage)
      return null
    }
  }

  // Deletar categoria
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Verificar se categoria está sendo usada em produtos
      const { data: productsUsingCategory } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id)
        .limit(1)

      if (productsUsingCategory && productsUsingCategory.length > 0) {
        toast.error('Não é possível excluir categoria que está sendo usada em produtos.')
        return false
      }

      // Verificar se categoria tem subcategorias
      const { data: subcategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id)
        .limit(1)

      if (subcategories && subcategories.length > 0) {
        toast.error('Não é possível excluir categoria que possui subcategorias.')
        return false
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCategories(prev => prev.filter(category => category.id !== id))
      toast.success('Categoria excluída com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria'
      toast.error(errorMessage)
      return false
    }
  }

  // Buscar categoria por ID
  const getCategory = async (id: string): Promise<Category | null> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar categoria'
      toast.error(errorMessage)
      return null
    }
  }

  // Atualizar lista de categorias
  const refreshCategories = async () => {
    await fetchCategories()
  }

  // Carregar categorias na inicialização
  useEffect(() => {
    fetchCategories()
  }, [])

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    refreshCategories,
  }
}