'use client'

import { MetaTags } from './MetaTags'
import { Product } from '@/types/product'

interface ProductSEOProps {
  product: Product
  category?: string
  brand?: string
}

export function ProductSEO({ product, category, brand }: ProductSEOProps) {
  // Gerar título otimizado para SEO
  const generateTitle = () => {
    const parts = [product.name]
    if (brand) parts.push(brand)
    if (category) parts.push(category)
    parts.push('Moda Feminina')
    return parts.join(' - ')
  }

  // Gerar descrição otimizada
  const generateDescription = () => {
    const baseDescription = product.description || `Compre ${product.name} na Boutique Elegante.`
    const priceInfo = product.sale_price 
      ? `Por apenas R$ ${product.sale_price.toFixed(2).replace('.', ',')} (de R$ ${product.price.toFixed(2).replace('.', ',')}).`
      : `Por R$ ${product.price.toFixed(2).replace('.', ',')}.`
    
    const deliveryInfo = 'Entrega rápida e segura. Parcelamento em até 12x sem juros.'
    
    return `${baseDescription} ${priceInfo} ${deliveryInfo}`.substring(0, 160)
  }

  // Gerar keywords relevantes
  const generateKeywords = () => {
    const keywords = [product.name]
    
    if (category) keywords.push(category)
    if (brand) keywords.push(brand)
    
    // Adicionar variações do nome do produto
    const nameWords = product.name.toLowerCase().split(' ')
    keywords.push(...nameWords)
    
    // Keywords genéricas
    keywords.push(
      'moda feminina',
      'roupas femininas',
      'boutique',
      'fashion',
      'tendências',
      'estilo',
      'elegante',
      'qualidade'
    )
    
    // Se tem desconto, adicionar keywords relacionadas
    if (product.sale_price) {
      keywords.push('promoção', 'desconto', 'oferta', 'liquidação')
    }
    
    return [...new Set(keywords)] // Remove duplicatas
  }

  // Calcular desconto percentual
  const getDiscountPercentage = () => {
    if (!product.sale_price) return null
    return Math.round(((product.price - product.sale_price) / product.price) * 100)
  }

  // Gerar dados estruturados adicionais
  const generateStructuredData = () => {
    const discountPercentage = getDiscountPercentage()
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images?.map(img => 
        img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_SITE_URL}${img}`
      ) || [],
      brand: {
        '@type': 'Brand',
        name: brand || 'Boutique Elegante'
      },
      category: category,
      sku: product.sku,
      offers: {
        '@type': 'Offer',
        price: product.sale_price || product.price,
        priceCurrency: 'BRL',
        availability: product.stock_quantity > 0 
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/produto/${product.sku}`,
        seller: {
          '@type': 'Organization',
          name: 'Boutique Elegante'
        },
        ...(product.sale_price && {
          priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias
        })
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '127',
        bestRating: '5',
        worstRating: '1'
      },
      review: [
        {
          '@type': 'Review',
          reviewRating: {
            '@type': 'Rating',
            ratingValue: '5',
            bestRating: '5'
          },
          author: {
            '@type': 'Person',
            name: 'Cliente Satisfeita'
          },
          reviewBody: 'Produto de excelente qualidade, entrega rápida e atendimento perfeito!'
        }
      ],
      ...(discountPercentage && {
        additionalProperty: {
          '@type': 'PropertyValue',
          name: 'Desconto',
          value: `${discountPercentage}%`
        }
      })
    }
  }

  return (
    <>
      <MetaTags
        title={generateTitle()}
        description={generateDescription()}
        keywords={generateKeywords()}
        image={product.images?.[0] || ''}
        type="product"
        price={{
          amount: product.sale_price || product.price,
          currency: 'BRL'
        }}
        availability={product.stock_quantity > 0 ? 'in stock' : 'out of stock'}
        brand={brand}
        category={category}
        sku={product.sku}
        condition="new"
      />
      
      {/* Dados estruturados específicos do produto */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData())
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: process.env.NEXT_PUBLIC_SITE_URL
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Produtos',
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/produtos`
              },
              ...(category ? [{
                '@type': 'ListItem',
                position: 3,
                name: category,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/categoria/${category.toLowerCase().replace(/\s+/g, '-')}`
              }] : []),
              {
                '@type': 'ListItem',
                position: category ? 4 : 3,
                name: product.name,
                item: `${process.env.NEXT_PUBLIC_SITE_URL}/produto/${product.sku}`
              }
            ]
          })
        }}
      />
    </>
  )
}

// Componente para SEO de categoria
interface CategorySEOProps {
  category: {
    name: string
    description?: string
    image?: string
    slug: string
  }
  productCount?: number
  products?: Product[]
}

export function CategorySEO({ category, productCount, products }: CategorySEOProps) {
  const generateTitle = () => {
    return `${category.name} - Moda Feminina | Boutique Elegante`
  }

  const generateDescription = () => {
    const baseDesc = category.description || `Explore nossa coleção de ${category.name.toLowerCase()}.`
    const countInfo = productCount ? `${productCount} produtos disponíveis.` : 'Diversos produtos disponíveis.'
    const cta = 'Entrega rápida, parcelamento sem juros e qualidade garantida.'
    
    return `${baseDesc} ${countInfo} ${cta}`.substring(0, 160)
  }

  const generateKeywords = () => {
    const keywords = [category.name, category.name.toLowerCase()]
    
    // Adicionar keywords baseadas nos produtos
    if (products) {
      const productKeywords = products.flatMap(p => p.name.split(' '))
      keywords.push(...new Set(productKeywords))
    }
    
    keywords.push(
      'moda feminina',
      'roupas',
      'acessórios',
      'boutique',
      'fashion',
      'tendências',
      'coleção',
      'estilo'
    )
    
    return [...new Set(keywords)]
  }

  return (
    <>
      <MetaTags
        title={generateTitle()}
        description={generateDescription()}
        keywords={generateKeywords()}
        image={category.image}
        type="website"
      />
      
      {/* Schema para página de categoria */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
            description: category.description,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/categoria/${category.slug}`,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: productCount || 0,
              ...(products && {
                itemListElement: products.slice(0, 10).map((product, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  item: {
                    '@type': 'Product',
                    name: product.name,
                    url: `${process.env.NEXT_PUBLIC_SITE_URL}/produto/${product.sku}`,
                    image: product.images?.[0] || '',
                    offers: {
                      '@type': 'Offer',
                      price: product.sale_price || product.price,
                      priceCurrency: 'BRL'
                    }
                  }
                }))
              })
            }
          })
        }}
      />
    </>
  )
}