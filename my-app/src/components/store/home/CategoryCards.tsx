'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  href: string
  imageUrl: string
  description: string
}

const categories: Category[] = [
  {
    id: 'feminino',
    name: 'Feminino',
    href: '/produtos?categoria=feminino',
    imageUrl: 'https://picsum.photos/400/500?random=10',
    description: 'Moda feminina com estilo e elegância'
  },
  {
    id: 'masculino',
    name: 'Masculino',
    href: '/produtos?categoria=masculino',
    imageUrl: 'https://picsum.photos/400/500?random=11',
    description: 'Looks masculinos modernos e sofisticados'
  },
  {
    id: 'calcados',
    name: 'Calçados',
    href: '/produtos?categoria=calcados',
    imageUrl: 'https://picsum.photos/400/500?random=12',
    description: 'Conforto e estilo para seus pés'
  },
  {
    id: 'acessorios',
    name: 'Acessórios',
    href: '/produtos?categoria=acessorios',
    imageUrl: 'https://picsum.photos/400/500?random=13',
    description: 'Complete seu look com nossos acessórios'
  }
]

export function CategoryCards() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Nossas Categorias
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Descubra nossa seleção cuidadosa de produtos para todos os estilos e ocasiões
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {/* Background Image */}
              <div className="relative h-64 md:h-80 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${category.imageUrl})` }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2 transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-300">
                  {category.name}
                </h3>
                <p className="text-sm md:text-base opacity-90 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  {category.description}
                </p>
                
                {/* CTA Arrow */}
                <div className="mt-4 flex items-center text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <span>Explorar</span>
                  <svg 
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}