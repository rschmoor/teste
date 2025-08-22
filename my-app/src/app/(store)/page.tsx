'use client'

import { HeroSection } from '@/components/store/home/HeroSection'
import { CategoryCards } from '@/components/store/home/CategoryCards'
import { FeaturedProducts } from '@/components/store/home/FeaturedProducts'
import { BrandsSection } from '@/components/store/home/BrandsSection'
import { Newsletter } from '@/components/store/home/Newsletter'
import { MetaTags } from '@/components/seo/MetaTags'
import SupabaseTest from '@/components/test/SupabaseTest'



export default function HomePage() {
  return (
    <>
      <MetaTags
        title="Boutique Elegante - Moda Feminina de Qualidade"
        description="Descubra as últimas tendências da moda feminina na Boutique Elegante. Roupas, acessórios e calçados de qualidade com entrega rápida e segura."
        keywords={['moda feminina', 'roupas', 'acessórios', 'calçados', 'boutique', 'fashion', 'tendências', 'qualidade', 'entrega rápida']}
        type="website"
      />
      <div className="min-h-screen">
        <HeroSection />
        <CategoryCards />
        <FeaturedProducts />
        <BrandsSection />
        <Newsletter />
      </div>
    </>
  )
}