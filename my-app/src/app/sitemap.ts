import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutique-store.com'
  const supabase = createClient()

  // URLs estáticas
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/produtos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/politica-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos-uso`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    // Buscar produtos
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, slug, updated_at, created_at')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })

    const produtoUrls: MetadataRoute.Sitemap = produtos?.map((produto) => ({
      url: `${baseUrl}/produtos/${produto.slug || produto.id}`,
      lastModified: new Date(produto.updated_at || produto.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []

    // Buscar categorias
    const { data: categorias } = await supabase
      .from('categorias')
      .select('id, slug, nome, updated_at, created_at')
      .eq('ativa', true)
      .order('nome')

    const categoriaUrls: MetadataRoute.Sitemap = categorias?.map((categoria) => ({
      url: `${baseUrl}/categorias/${categoria.slug || categoria.id}`,
      lastModified: new Date(categoria.updated_at || categoria.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []

    // Combinar todas as URLs
    return [...staticUrls, ...categoriaUrls, ...produtoUrls]
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error)
    // Retornar apenas URLs estáticas em caso de erro
    return staticUrls
  }
}

// Função para gerar sitemap de produtos separado (para sites grandes)
export async function generateProductSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutique-store.com'
  const supabase = createClient()

  try {
    const { data: produtos } = await supabase
      .from('produtos')
      .select('id, slug, updated_at, created_at, preco')
      .eq('ativo', true)
      .order('updated_at', { ascending: false })
      .limit(50000) // Limite do Google para sitemaps

    return produtos?.map((produto) => ({
      url: `${baseUrl}/produtos/${produto.slug || produto.id}`,
      lastModified: new Date(produto.updated_at || produto.created_at),
      changeFrequency: 'weekly' as const,
      priority: produto.preco > 100 ? 0.8 : 0.7, // Produtos mais caros têm prioridade maior
    })) || []
  } catch (error) {
    console.error('Erro ao gerar sitemap de produtos:', error)
    return []
  }
}

// Função para gerar sitemap de categorias separado
export async function generateCategorySitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutique-store.com'
  const supabase = createClient()

  try {
    const { data: categorias } = await supabase
      .from('categorias')
      .select('id, slug, nome, updated_at, created_at')
      .eq('ativa', true)
      .order('nome')

    return categorias?.map((categoria) => ({
      url: `${baseUrl}/categorias/${categoria.slug || categoria.id}`,
      lastModified: new Date(categoria.updated_at || categoria.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []
  } catch (error) {
    console.error('Erro ao gerar sitemap de categorias:', error)
    return []
  }
}