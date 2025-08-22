import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type ProductGroup = Database['public']['Tables']['product_groups']['Row']
type ProductGroupInsert = Database['public']['Tables']['product_groups']['Insert']
type ProductGroupUpdate = Database['public']['Tables']['product_groups']['Update']
type ProductGroupItem = Database['public']['Tables']['product_group_items']['Row']
type GroupingRule = Database['public']['Tables']['grouping_rules']['Row']
type GroupingRuleInsert = Database['public']['Tables']['grouping_rules']['Insert']
type ProductSimilarity = Database['public']['Tables']['product_similarity']['Row']

interface ProductGroupWithItems extends ProductGroup {
  product_group_items: (ProductGroupItem & {
    products: {
      id: string
      name: string
      price: number
      image_url: string | null
    }
  })[]
  _count?: {
    products: number
  }
}

interface GroupingStats {
  totalGroups: number
  activeGroups: number
  totalProducts: number
  ungroupedProducts: number
  averageGroupSize: number
}

export function useProductGroups() {
  const [groups, setGroups] = useState<ProductGroupWithItems[]>([])
  const [rules, setRules] = useState<GroupingRule[]>([])
  const [similarities, setSimilarities] = useState<ProductSimilarity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar grupos de produtos
  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .select(`
          *,
          product_group_items(
            *,
            products(
              id,
              name,
              price,
              image_url
            )
          )
        `)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Adicionar contagem de produtos
      const groupsWithCount = data?.map(group => ({
        ...group,
        _count: {
          products: group.product_group_items?.length || 0
        }
      })) || []

      setGroups(groupsWithCount)
    } catch (err) {
      console.error('Erro ao buscar grupos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  // Buscar regras de agrupamento
  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('grouping_rules')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      setRules(data || [])
    } catch (err) {
      console.error('Erro ao buscar regras:', err)
    }
  }

  // Buscar similaridades de produtos
  const fetchSimilarities = async (productId?: string) => {
    try {
      let query = supabase
        .from('product_similarity')
        .select('*')
        .order('similarity_score', { ascending: false })

      if (productId) {
        query = query.or(`product_a_id.eq.${productId},product_b_id.eq.${productId}`)
      }

      const { data, error } = await query
      if (error) throw error
      setSimilarities(data || [])
    } catch (err) {
      console.error('Erro ao buscar similaridades:', err)
    }
  }

  // Criar grupo
  const createGroup = async (groupData: ProductGroupInsert) => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .insert(groupData)
        .select()
        .single()

      if (error) throw error

      await fetchGroups()
      return data
    } catch (err) {
      console.error('Erro ao criar grupo:', err)
      throw err
    }
  }

  // Atualizar grupo
  const updateGroup = async (id: string, updates: ProductGroupUpdate) => {
    try {
      const { data, error } = await supabase
        .from('product_groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchGroups()
      return data
    } catch (err) {
      console.error('Erro ao atualizar grupo:', err)
      throw err
    }
  }

  // Excluir grupo
  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_groups')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchGroups()
    } catch (err) {
      console.error('Erro ao excluir grupo:', err)
      throw err
    }
  }

  // Adicionar produto ao grupo
  const addProductToGroup = async (productId: string, groupId: string, position?: number, isFeatured?: boolean) => {
    try {
      const { error } = await supabase
        .from('product_group_items')
        .insert({
          product_id: productId,
          group_id: groupId,
          position: position || 0,
          is_featured: isFeatured || false
        })

      if (error) throw error

      await fetchGroups()
    } catch (err) {
      console.error('Erro ao adicionar produto ao grupo:', err)
      throw err
    }
  }

  // Remover produto do grupo
  const removeProductFromGroup = async (productId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('product_group_items')
        .delete()
        .eq('product_id', productId)
        .eq('group_id', groupId)

      if (error) throw error

      await fetchGroups()
    } catch (err) {
      console.error('Erro ao remover produto do grupo:', err)
      throw err
    }
  }

  // Reordenar produtos no grupo
  const reorderProductsInGroup = async (groupId: string, productOrders: { productId: string; position: number }[]) => {
    try {
      const updates = productOrders.map(({ productId, position }) => 
        supabase
          .from('product_group_items')
          .update({ position })
          .eq('product_id', productId)
          .eq('group_id', groupId)
      )

      await Promise.all(updates)
      await fetchGroups()
    } catch (err) {
      console.error('Erro ao reordenar produtos:', err)
      throw err
    }
  }

  // Criar regra de agrupamento
  const createRule = async (ruleData: GroupingRuleInsert) => {
    try {
      const { data, error } = await supabase
        .from('grouping_rules')
        .insert(ruleData)
        .select()
        .single()

      if (error) throw error

      await fetchRules()
      return data
    } catch (err) {
      console.error('Erro ao criar regra:', err)
      throw err
    }
  }

  // Aplicar regras de agrupamento
  const applyGroupingRules = async () => {
    try {
      const { error } = await supabase.rpc('apply_grouping_rules')
      if (error) throw error

      await fetchGroups()
    } catch (err) {
      console.error('Erro ao aplicar regras:', err)
      throw err
    }
  }

  // Calcular similaridade entre produtos
  const calculateSimilarity = async (productAId: string, productBId: string) => {
    try {
      const { data, error } = await supabase.rpc('calculate_product_similarity', {
        product_a_id: productAId,
        product_b_id: productBId
      })

      if (error) throw error
      return data as number
    } catch (err) {
      console.error('Erro ao calcular similaridade:', err)
      throw err
    }
  }

  // Buscar produtos similares
  const getSimilarProducts = async (productId: string, limit: number = 10) => {
    try {
      const { data, error } = await supabase
        .from('product_similarity')
        .select(`
          *,
          product_a:products!product_similarity_product_a_id_fkey(*),
          product_b:products!product_similarity_product_b_id_fkey(*)
        `)
        .or(`product_a_id.eq.${productId},product_b_id.eq.${productId}`)
        .order('similarity_score', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Retornar apenas os produtos que não são o produto de referência
      return data?.map(similarity => {
        const isProductA = similarity.product_a_id === productId
        return {
          ...similarity,
          similar_product: isProductA ? similarity.product_b : similarity.product_a
        }
      }) || []
    } catch (err) {
      console.error('Erro ao buscar produtos similares:', err)
      throw err
    }
  }

  // Buscar estatísticas de agrupamento
  const getGroupingStats = async (): Promise<GroupingStats> => {
    try {
      const [groupsResult, productsResult] = await Promise.all([
        supabase.from('product_groups').select('id, is_active'),
        supabase.from('products').select('id')
      ])

      const totalGroups = groupsResult.data?.length || 0
      const activeGroups = groupsResult.data?.filter(g => g.is_active).length || 0
      const totalProducts = productsResult.data?.length || 0

      // Buscar produtos agrupados
      const { data: groupedProducts } = await supabase
        .from('product_group_items')
        .select('product_id')

      const uniqueGroupedProducts = new Set(groupedProducts?.map(item => item.product_id) || [])
      const ungroupedProducts = totalProducts - uniqueGroupedProducts.size

      const averageGroupSize = activeGroups > 0 ? uniqueGroupedProducts.size / activeGroups : 0

      return {
        totalGroups,
        activeGroups,
        totalProducts,
        ungroupedProducts,
        averageGroupSize: Math.round(averageGroupSize * 100) / 100
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
      return {
        totalGroups: 0,
        activeGroups: 0,
        totalProducts: 0,
        ungroupedProducts: 0,
        averageGroupSize: 0
      }
    }
  }

  // Buscar grupos por tipo
  const getGroupsByType = (type: ProductGroup['group_type']) => {
    return groups.filter(group => group.group_type === type)
  }

  // Buscar produtos não agrupados
  const getUngroupedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('id', 'in', `(
          SELECT DISTINCT product_id 
          FROM product_group_items
        )`)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erro ao buscar produtos não agrupados:', err)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchGroups(),
          fetchRules()
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    groups,
    rules,
    similarities,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addProductToGroup,
    removeProductFromGroup,
    reorderProductsInGroup,
    createRule,
    applyGroupingRules,
    calculateSimilarity,
    getSimilarProducts,
    getGroupingStats,
    getGroupsByType,
    getUngroupedProducts,
    fetchGroups,
    fetchRules,
    fetchSimilarities
  }
}

export type { ProductGroup, ProductGroupWithItems, GroupingRule, ProductSimilarity, GroupingStats }