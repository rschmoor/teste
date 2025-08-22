'use client'

import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Truck, 
  Shield, 
  RotateCcw,
  Plus,
  Minus,
  ZoomIn
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useProductBySku } from '@/hooks/useProduct'
import { useStoreProducts } from '@/hooks/useStoreProducts'
import { useCart } from '@/contexts/CartContext'
import { ProductGallery } from '@/components/store/ProductGallery'
import { ProductInfo } from '@/components/store/product/ProductInfo'
import { ProductTabs } from '@/components/store/product/ProductTabs'
import { RelatedProducts } from '@/components/store/product/RelatedProducts'
import { ProductPageSkeleton } from '@/components/store/product/ProductPageSkeleton'
import ProductCard, { ProductCardSkeleton } from '@/components/store/ProductCard'
import { ProductTrustElements, ProductReviews, ProductGuarantees, QualitySeal } from '@/components/ui/TrustElements'
import { ProductSEO } from '@/components/seo/ProductSEO'
import { ComponentErrorBoundary, ProductErrorFallback } from '@/providers/ErrorBoundaryProvider'
import { toast } from 'sonner'

// Mock data - será substituído pelos dados reais do Supabase
const mockProduct = {
  id: 1,
  sku: 'VEST001',
  name: 'Vestido Floral Elegante',
  description: 'Vestido midi com estampa floral delicada, perfeito para ocasiões especiais. Confeccionado em tecido de alta qualidade com caimento impecável.',
  price: 189.90,
  originalPrice: 249.90,
  images: [
    '/api/placeholder/600/800',
    '/api/placeholder/600/800',
    '/api/placeholder/600/800',
    '/api/placeholder/600/800'
  ],
  rating: 4.8,
  reviews: 127,
  category: 'Vestidos',
  brand: 'Marca Premium',
  colors: [
    { id: 'floral-azul', name: 'Floral Azul', hex: '#4A90E2', image: '/api/placeholder/600/800' },
    { id: 'floral-rosa', name: 'Floral Rosa', hex: '#E24A90', image: '/api/placeholder/600/800' },
    { id: 'floral-verde', name: 'Floral Verde', hex: '#4AE290', image: '/api/placeholder/600/800' }
  ],
  sizes: [
    { size: 'P', available: true, stock: 5 },
    { size: 'M', available: true, stock: 8 },
    { size: 'G', available: true, stock: 3 },
    { size: 'GG', available: false, stock: 0 }
  ],
  features: [
    'Tecido premium importado',
    'Forro interno',
    'Zíper invisível nas costas',
    'Lavagem à mão'
  ],
  measurements: {
    P: { bust: '84-88cm', waist: '64-68cm', hip: '90-94cm' },
    M: { bust: '88-92cm', waist: '68-72cm', hip: '94-98cm' },
    G: { bust: '92-96cm', waist: '72-76cm', hip: '98-102cm' },
    GG: { bust: '96-100cm', waist: '76-80cm', hip: '102-106cm' }
  },
  isNew: true,
  isOnSale: true
}

const relatedProducts = Array.from({ length: 4 }, (_, i) => ({
  id: i + 2,
  name: `Produto Relacionado ${i + 1}`,
  price: 129.90 + (i * 20),
  image: '/api/placeholder/300/400',
  rating: 4.2 + (Math.random() * 0.6)
}))

interface ProductPageProps {
  params: Promise<{
    sku: string
  }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { sku } = use(params)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  
  const { product, loading, error } = useProductBySku(sku)
  const { addItem, openCart } = useCart()
  const { products: relatedProducts, loading: loadingRelated } = useStoreProducts({
    filters: {
      category: product?.category
    },
    limit: 4
  })

  // Show loading skeleton while fetching product data
  if (loading) {
    return <ProductPageSkeleton />
  }

  // Show 404 if product not found
  if (error || !product) {
    notFound()
  }

  // Use real product data or fallback to mock data
  const currentProduct = product || mockProduct
  
  // Helper functions to extract colors and sizes from variants or direct properties
  const getAvailableColors = (product: any) => {
    if (product.colors) return product.colors
    if (product.product_variants) {
      const uniqueColors = Array.from(new Set(product.product_variants.map((v: any) => v.color)))
      return uniqueColors.map(color => ({ id: color, name: color, hex: '#000000' }))
    }
    return []
  }
  
  const getAvailableSizes = (product: any) => {
    if (product.sizes) return product.sizes
    if (product.product_variants) {
      const uniqueSizes = Array.from(new Set(product.product_variants.map((v: any) => v.size)))
      return uniqueSizes.map(size => ({ 
        size, 
        available: product.product_variants.some((v: any) => v.size === size && v.stock_quantity > 0),
        stock: product.product_variants.filter((v: any) => v.size === size).reduce((sum: number, v: any) => sum + v.stock_quantity, 0)
      }))
    }
    return []
  }
  
  const availableColors = getAvailableColors(currentProduct)
  const availableSizes = getAvailableSizes(currentProduct)
  
  // Update selectedColor when product loads
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      setSelectedColor(availableColors[0].id)
    }
  }, [currentProduct, selectedColor])

  const selectedColorData = availableColors.find((color: any) => color.id === selectedColor)
  const selectedSizeData = availableSizes.find((size: any) => size.size === selectedSize)
  const maxQuantity = selectedSizeData?.stock || 0

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => {
      const newQuantity = prev + change
      return Math.max(1, Math.min(maxQuantity, newQuantity))
    })
  }

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Por favor, selecione um tamanho')
      return
    }

    if (!selectedColor) {
      toast.error('Por favor, selecione uma cor')
      return
    }

    if (maxQuantity === 0) {
      toast.error('Produto fora de estoque')
      return
    }

    if (quantity > maxQuantity) {
      toast.error(`Apenas ${maxQuantity} unidades disponíveis`)
      return
    }

    setIsAddingToCart(true)

    try {
      // Adicionar produto ao carrinho usando a assinatura correta
      addItem(currentProduct, selectedSize, selectedColorData?.name || selectedColor, quantity)
      
      // Mostrar toast de sucesso
      toast.success('Produto adicionado ao carrinho!', {
        action: {
          label: 'Ver carrinho',
          onClick: () => openCart()
        }
      })
    } catch (error) {
      toast.error('Erro ao adicionar produto ao carrinho')
      console.error('Erro ao adicionar ao carrinho:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  return (
    <>
      <ProductSEO 
        product={{
          id: currentProduct.id,
          name: currentProduct.name,
          description: currentProduct.description,
          price: currentProduct.price,
          sale_price: currentProduct.sale_price,
          sku: currentProduct.sku,
          brand: currentProduct.brand,
          category: currentProduct.category,
          stock_quantity: currentProduct.stock_quantity || 0,
          is_active: currentProduct.is_active || true,
          is_featured: currentProduct.is_featured || false,
          created_at: currentProduct.created_at || new Date().toISOString(),
          updated_at: currentProduct.updated_at || new Date().toISOString(),
          images: currentProduct.images
        }}
        category={currentProduct.category}
        brand={currentProduct.brand}
      />
      <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/produtos" className="hover:text-gray-900">Produtos</Link>
          <span className="mx-2">/</span>
          <Link href={`/produtos?category=${currentProduct.category?.toLowerCase() || ''}`} className="hover:text-gray-900">
            {currentProduct.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{currentProduct.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Gallery */}
          <ComponentErrorBoundary>
            <ProductGallery 
              images={currentProduct.images?.map((src, index) => ({
                id: index.toString(),
                url: src,
                alt: `${currentProduct.name} - Imagem ${index + 1}`,
                caption: `${currentProduct.name} - Imagem ${index + 1}`
              })) || []}
            />
          </ComponentErrorBoundary>

          {/* Product Info */}
          <ComponentErrorBoundary>
            <ProductInfo
            brand={currentProduct.brand || ''}
            name={currentProduct.name}
            sku={currentProduct.sku}
            rating={currentProduct.average_rating || 0}
            reviewCount={currentProduct.review_count || 0}
            price={currentProduct.price}
            originalPrice={currentProduct.sale_price}
          discount={currentProduct.sale_price ? Math.round((1 - currentProduct.price / currentProduct.sale_price) * 100) : undefined}
            installments={{
              count: 4,
              value: currentProduct.price / 4,
              hasInterest: false
            }}
            colors={availableColors.map((color: any) => ({
              name: color.name,
              value: color.hex,
              image: color.image
            }))}
            sizes={availableSizes.map((size: any) => ({
              name: size.size,
              value: size.size,
              inStock: size.available
            }))}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorChange={setSelectedColor}
            onSizeChange={setSelectedSize}
            quantity={quantity}
            onQuantityChange={(newQuantity) => setQuantity(newQuantity)}
            onAddToCart={handleAddToCart}
            onBuyNow={() => {
              handleAddToCart()
              // Redirect to checkout
            }}
            onToggleFavorite={() => setIsFavorite(!isFavorite)}
            isFavorite={isFavorite}
            inStock={maxQuantity > 0}
            stockQuantity={maxQuantity}
            isLoading={isAddingToCart}
            />
          </ComponentErrorBoundary>
        </div>

        {/* Trust Elements Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductReviews className="mb-8" />
          </div>
          <div className="space-y-6">
            <ProductTrustElements />
            <ProductGuarantees />
            <QualitySeal className="w-full justify-center" />
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <ComponentErrorBoundary>
            <ProductTabs
            description={currentProduct.description}
            features={[
              "Tecido premium importado",
              "Forro interno",
              "Zíper invisível nas costas",
              "Lavagem à mão"
            ]}
            careInstructions={[
              "Lavar à máquina em água fria",
              "Não usar alvejante",
              "Secar à sombra",
              "Passar em temperatura baixa"
            ]}
            materials={["100% Algodão", "Tecido respirável", "Tingimento ecológico"]}
            specifications={[
              { label: "Material", value: "100% Algodão" },
              { label: "Origem", value: "Brasil" },
              { label: "Modelo", value: currentProduct.sku },
              { label: "Categoria", value: currentProduct.category || "Não informado" },
              { label: "Marca", value: currentProduct.brand || "Não informado" }
            ]}
            measurements={[
              { size: 'P', chest: '84-88cm', waist: '64-68cm', hip: '90-94cm' },
              { size: 'M', chest: '88-92cm', waist: '68-72cm', hip: '94-98cm' },
              { size: 'G', chest: '92-96cm', waist: '72-76cm', hip: '98-102cm' },
              { size: 'GG', chest: '96-100cm', waist: '76-80cm', hip: '102-106cm' }
            ]}
            measurementGuide="Medidas em centímetros"
            reviews={[
              {
                id: "1",
                userName: "Maria Silva",
                rating: 5,
                comment: "Produto excelente! Tecido de ótima qualidade e caimento perfeito. Recomendo!",
                date: "15/12/2023",
                verified: true
              },
              {
                id: "2",
                userName: "Ana Costa",
                rating: 4,
                comment: "Gostei muito do produto. Chegou rápido e conforme descrito. Apenas achei um pouco pequeno.",
                date: "10/12/2023",
                verified: true
              },
              {
                id: "3",
                userName: "Carla Santos",
                rating: 5,
                comment: "Superou minhas expectativas! Tecido macio e cor exatamente como na foto.",
                date: "05/12/2023",
                verified: false
              }
            ]}
            averageRating={currentProduct.average_rating || 0}
            totalReviews={currentProduct.review_count || 0}
            ratingDistribution={{
              5: 85,
              4: 30,
              3: 8,
              2: 3,
              1: 1
            }}
            isLoading={false}
            />
          </ComponentErrorBoundary>
        </div>

        {/* Related Products */}
        <ComponentErrorBoundary>
          <RelatedProducts
            products={relatedProducts}
            isLoading={loadingRelated}
            title="Produtos Relacionados"
          />
        </ComponentErrorBoundary>
      </div>
    </div>
    </>
  )
}