'use client'

import Head from 'next/head'
import { usePathname } from 'next/navigation'

interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  siteName?: string
  locale?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  price?: {
    amount: number
    currency: string
  }
  availability?: 'in stock' | 'out of stock' | 'preorder'
  brand?: string
  category?: string
  sku?: string
  gtin?: string
  mpn?: string
  condition?: 'new' | 'used' | 'refurbished'
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
}

const DEFAULT_META = {
  siteName: 'Boutique Elegante',
  title: 'Boutique Elegante - Moda Feminina de Qualidade',
  description: 'Descubra as últimas tendências da moda feminina na Boutique Elegante. Roupas, acessórios e calçados de qualidade com entrega rápida e segura.',
  keywords: ['moda feminina', 'roupas', 'acessórios', 'calçados', 'boutique', 'fashion', 'tendências'],
  image: '/images/og-default.jpg',
  locale: 'pt_BR',
  type: 'website' as const
}

export function MetaTags({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  siteName = DEFAULT_META.siteName,
  locale = DEFAULT_META.locale,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  price,
  availability,
  brand,
  category,
  sku,
  gtin,
  mpn,
  condition = 'new',
  noIndex = false,
  noFollow = false,
  canonical
}: MetaTagsProps) {
  const pathname = usePathname()
  
  // Construir URL completa
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutique-elegante.com'
  const fullUrl = url || `${baseUrl}${pathname}`
  
  // Construir título completo
  const fullTitle = title 
    ? `${title} | ${siteName}`
    : DEFAULT_META.title
  
  // Construir descrição
  const metaDescription = description || DEFAULT_META.description
  
  // Construir keywords
  const allKeywords = [...DEFAULT_META.keywords, ...keywords]
  
  // Construir imagem
  const metaImage = image 
    ? (image.startsWith('http') ? image : `${baseUrl}${image}`)
    : `${baseUrl}${DEFAULT_META.image}`
  
  // Robots meta
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(', ')

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      
      {canonical && <link rel="canonical" href={canonical} />}
      {author && <meta name="author" content={author} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:url" content={fullUrl} />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Product specific meta tags */}
      {type === 'product' && (
        <>
          <meta property="product:brand" content={brand || siteName} />
          {category && <meta property="product:category" content={category} />}
          {price && (
            <>
              <meta property="product:price:amount" content={price.amount.toString()} />
              <meta property="product:price:currency" content={price.currency} />
            </>
          )}
          {availability && <meta property="product:availability" content={availability} />}
          {condition && <meta property="product:condition" content={condition} />}
          
          {/* Schema.org Product markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: title,
                description: metaDescription,
                image: metaImage,
                brand: {
                  '@type': 'Brand',
                  name: brand || siteName
                },
                ...(sku && { sku }),
                ...(gtin && { gtin }),
                ...(mpn && { mpn }),
                ...(price && {
                  offers: {
                    '@type': 'Offer',
                    price: price.amount,
                    priceCurrency: price.currency,
                    availability: availability === 'in stock' 
                      ? 'https://schema.org/InStock'
                      : availability === 'out of stock'
                      ? 'https://schema.org/OutOfStock'
                      : 'https://schema.org/PreOrder',
                    itemCondition: condition === 'new'
                      ? 'https://schema.org/NewCondition'
                      : condition === 'used'
                      ? 'https://schema.org/UsedCondition'
                      : 'https://schema.org/RefurbishedCondition',
                    url: fullUrl
                  }
                })
              })
            }}
          />
        </>
      )}
      
      {/* Website Schema.org markup */}
      {type === 'website' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              description: metaDescription,
              url: baseUrl,
              potentialAction: {
                '@type': 'SearchAction',
                target: `${baseUrl}/busca?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
      )}
      
      {/* Organization Schema.org markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: siteName,
            url: baseUrl,
            logo: `${baseUrl}/images/logo.png`,
            sameAs: [
              'https://www.facebook.com/boutiqueelegante',
              'https://www.instagram.com/boutiqueelegante',
              'https://www.twitter.com/boutiqueelegante'
            ],
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+55-11-99999-9999',
              contactType: 'customer service',
              availableLanguage: 'Portuguese'
            }
          })
        }}
      />
      
      {/* Viewport and mobile optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Favicon and app icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Theme color */}
      <meta name="theme-color" content="#ec4899" />
      <meta name="msapplication-TileColor" content="#ec4899" />
    </Head>
  )
}

// Hook para gerar meta tags de produto
export function useProductMeta(product: {
  name: string
  description: string
  images: string[]
  price: number
  sale_price?: number
  sku: string
  category?: string
  brand?: string
  in_stock: boolean
}) {
  const pathname = usePathname()
  
  return {
    title: product.name,
    description: product.description,
    keywords: [product.name, product.category, product.brand, 'moda feminina'].filter(Boolean),
    image: product.images[0],
    type: 'product' as const,
    price: {
      amount: product.sale_price || product.price,
      currency: 'BRL'
    },
    availability: product.in_stock ? 'in stock' as const : 'out of stock' as const,
    brand: product.brand,
    category: product.category,
    sku: product.sku,
    condition: 'new' as const
  }
}

// Hook para gerar meta tags de categoria
export function useCategoryMeta(category: {
  name: string
  description?: string
  image?: string
  productCount?: number
}) {
  return {
    title: `${category.name} - Moda Feminina`,
    description: category.description || `Explore nossa coleção de ${category.name.toLowerCase()}. ${category.productCount ? `${category.productCount} produtos` : 'Diversos produtos'} disponíveis com entrega rápida.`,
    keywords: [category.name, 'moda feminina', 'roupas', 'acessórios'],
    image: category.image,
    type: 'website' as const
  }
}

// Hook para gerar meta tags de busca
export function useSearchMeta(query: string, resultCount?: number) {
  return {
    title: `Busca por "${query}"`,
    description: `Resultados da busca por "${query}". ${resultCount ? `${resultCount} produtos encontrados` : 'Encontre os melhores produtos'} na Boutique Elegante.`,
    keywords: [query, 'busca', 'produtos', 'moda feminina'],
    type: 'website' as const,
    noIndex: true // Não indexar páginas de busca
  }
}